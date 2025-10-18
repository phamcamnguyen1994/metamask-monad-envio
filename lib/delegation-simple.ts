import { USDC_TEST } from "./chain";
import { normalizeDelegation } from "./delegationEnv";
import { getDelegateSmartAccount, getBundlerClient, getPaymasterClient } from "./aa";
import { encodeFunctionData, decodeErrorResult } from "viem";
import { DelegationManager as DelegationManagerAbi } from "@metamask/delegation-abis";
import { ExecutionMode, createExecution, contracts } from "@metamask/delegation-toolkit";

const USDC_DECIMALS = BigInt(1_000_000);
// Normal gas limits for production
const STATIC_PRE_VERIFICATION_GAS = BigInt(150_000);
const STATIC_VERIFICATION_GAS_LIMIT = BigInt(1_000_000);
const STATIC_CALL_GAS_LIMIT = BigInt(700_000);
const USER_OPERATION_REVERT_REASON_TOPIC =
  "0x1c4fada7374c0a9ee8841fc38afe82932dc0f8e69012e927f061a8bae611a201";

export async function redeemDelegationSimple(
  delegation: any,
  amount: number,
  usdc: string | undefined = USDC_TEST
) {
  try {
    const normalizedDelegation = normalizeDelegation(delegation);
    const usdcAddress = (typeof usdc === "string" ? usdc : USDC_TEST) as `0x${string}`;

    const { delegateSA, bundlerClient, environment, publicClient } = await getDelegateSmartAccount();

    if (!environment?.DelegationManager) {
      throw new Error("DelegationManager address missing from environment.");
    }

    if (!bundlerClient?.sendUserOperation) {
      throw new Error("Bundler client is unavailable – cannot submit UserOperation.");
    }

    if (!normalizedDelegation.signature) {
      throw new Error("Delegation signature is required for redemption.");
    }

    if (delegateSA.address.toLowerCase() !== normalizedDelegation.delegate.toLowerCase()) {
      throw new Error(
        `Connected delegate ${delegateSA.address} does not match delegation delegate ${normalizedDelegation.delegate}.`
      );
    }

    const amountWei = BigInt(Math.floor(amount * Number(USDC_DECIMALS)));

    const transferData = encodeFunctionData({
      abi: [
        {
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "transfer",
      args: [normalizedDelegation.delegate, amountWei],
    });

    const execution = createExecution({
      target: usdcAddress,
      value: BigInt(0),
      callData: transferData,
    });

    const executions = [[execution]];

    const permissionContext = [
      {
        ...normalizedDelegation,
        signature: normalizedDelegation.signature as `0x${string}`,
      },
    ];

    const redeemCalldata = contracts.DelegationManager.encode.redeemDelegations({
      delegations: [permissionContext],
      modes: [ExecutionMode.SingleDefault],
      executions,
    });

    const calls = [
      {
        to: environment.DelegationManager as `0x${string}`,
        data: redeemCalldata,
        value: BigInt(0),
      },
    ] as const;

    // ⚡ Pimlico bundler with dynamic gas estimation + 30% buffer
    console.log("⛽ Preparing UserOperation with Pimlico...");

    const networkGasPrice = await publicClient.getGasPrice();
    console.log("📊 Network gas price:", networkGasPrice.toString(), `(${Number(networkGasPrice) / 1e9} Gwei)`);
    
    // Check Smart Account balance for prefund
    const saBalance = await publicClient.getBalance({ address: delegateSA.address });
    console.log("💰 Smart Account MON balance:", saBalance.toString(), `(${Number(saBalance) / 1e18} MON)`);
    
    if (saBalance === BigInt(0)) {
      throw new Error(
        `Smart Account ${delegateSA.address} has ZERO MON balance!\n\n` +
        `The Smart Account needs MON tokens to pay for gas.\n` +
        `Please send some MON to the Smart Account address first.`
      );
    }
    
    // Use network gas price with buffer
    const maxPriorityFeePerGas = networkGasPrice;
    const maxFeePerGas = networkGasPrice * BigInt(2);
    
    console.log("💰 Gas prices for UserOperation:");
    console.log("  - maxFeePerGas:", maxFeePerGas.toString(), `(${Number(maxFeePerGas) / 1e9} Gwei)`);
    console.log("  - maxPriorityFeePerGas:", maxPriorityFeePerGas.toString(), `(${Number(maxPriorityFeePerGas) / 1e9} Gwei)`);

    let nonce: bigint;
    try {
      nonce = await delegateSA.getNonce();
    } catch (nonceError) {
      console.warn("Unable to fetch smart account nonce via getNonce, using 0:", nonceError);
      nonce = BigInt(0); // Fallback to 0 for new accounts
    }

    const bumpGasValue = (value: bigint) => (value * BigInt(12)) / BigInt(10) + BigInt(1);
    const isNonceError = (error: any) => {
      const message = (error?.message || "").toLowerCase();
      const causeMessage = (error?.cause?.message || "").toLowerCase();
      return (
        message.includes("invalid smart account nonce") ||
        message.includes("invalid account nonce") ||
        causeMessage.includes("invalid smart account nonce") ||
        causeMessage.includes("invalid account nonce") ||
        error?.name === "InvalidAccountNonceError"
      );
    };

    // 🎯 Dynamic gas estimation with 30% buffer
    // Use bundler WITHOUT paymaster for accurate gas estimation
    console.log("📊 Estimating UserOperation gas (without paymaster)...");
    const estimationBundler = getBundlerClient(false); // No paymaster for estimation
    
    let estimatedUserOp: any = undefined;
    try {
      estimatedUserOp = await estimationBundler.prepareUserOperation({
        account: delegateSA,
        calls,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
      });
      console.log("✅ Gas estimation complete (without paymaster)");
    } catch (estimateError: any) {
      console.warn("⚠️  Gas estimation failed, using fallback values:", estimateError.message);
    }

    // Apply 30% buffer to estimated gas limits
    const callGasLimit = estimatedUserOp?.callGasLimit 
      ? estimatedUserOp.callGasLimit + (estimatedUserOp.callGasLimit * BigInt(30) / BigInt(100))
      : BigInt(600_000); // Fallback increased for complex delegation operations

    const verificationGasLimit = estimatedUserOp?.verificationGasLimit
      ? estimatedUserOp.verificationGasLimit + (estimatedUserOp.verificationGasLimit * BigInt(30) / BigInt(100))
      : BigInt(1_500_000); // Fallback increased for Hybrid implementation verification

    const preVerificationGas = estimatedUserOp?.preVerificationGas
      ? estimatedUserOp.preVerificationGas + (estimatedUserOp.preVerificationGas * BigInt(30) / BigInt(100))
      : BigInt(1_500_000); // Fallback increased: required 1,129,432 minimum (set 1.5M for safety)

    console.log("⛽ Gas limits (with 30% buffer):");
    console.log("  - callGasLimit:", callGasLimit.toString());
    console.log("  - verificationGasLimit:", verificationGasLimit.toString());
    console.log("  - preVerificationGas:", preVerificationGas.toString());
    console.log("💰 User will pay gas from Smart Account balance (54.45 MON available)");

    const sendWithReplacement = async (
      attempt: number,
      feePerGas: bigint,
      priorityFee: bigint
    ): Promise<`0x${string}`> => {
      try {
        console.log(
          `Sending UserOperation (attempt ${attempt + 1})`
        );
        
        // Use bundler WITHOUT paymaster - user pays gas from Smart Account
        const nativeBundler = getBundlerClient(false);
        
        return await nativeBundler.sendUserOperation({
          account: delegateSA,
          calls,
          maxFeePerGas: feePerGas,
          maxPriorityFeePerGas: priorityFee,
          callGasLimit,
          verificationGasLimit,
          preVerificationGas,
          nonce,
        });
      } catch (sendError: any) {
        if (attempt < 2 && isNonceError(sendError)) {
          const bumpedPriority = (priorityFee * BigInt(12)) / BigInt(10);
          const bumpedFee = (feePerGas * BigInt(12)) / BigInt(10);
          console.warn(
            `UserOperation failed due to pending nonce (attempt ${attempt + 1}). Retrying with bumped gas...`
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
          return sendWithReplacement(attempt + 1, bumpedFee, bumpedPriority);
        }
        throw sendError;
      }
    };

    const userOpHash = await sendWithReplacement(0, maxFeePerGas, maxPriorityFeePerGas);
    console.log("✅ UserOperation submitted:", userOpHash);
    console.log("🔍 Check transaction: https://testnet-explorer.monad.xyz/tx/" + userOpHash);
    console.log("⏳ Waiting for Pimlico bundler to process UserOp...");
    console.log("   (Usually takes 10-30 seconds)");

    const pollBundlerReceipt = async (hash: `0x${string}`) => {
      const start = Date.now();
      const timeoutMs = 120_000; // 2 minutes max
      const interval = 5_000; // Check every 5 seconds
      let lastLog = 0;
      let consecutiveFailures = 0;

      while (Date.now() - start < timeoutMs) {
        try {
          const receipt = await bundlerClient.request({
            method: "eth_getUserOperationReceipt",
            params: [hash],
          } as any);

          if (receipt) {
            console.log(
              `✅ Bundler receipt fetched after ${Math.floor(
                (Date.now() - start) / 1000
              )} seconds.`
            );
            return receipt as any;
          }
          
          consecutiveFailures = 0; // Reset on successful request
          
        } catch (pollError: any) {
          consecutiveFailures++;
          console.warn(`⚠️ Bundler poll attempt failed (${consecutiveFailures}):`, pollError?.message || pollError);
          
          // If bundler is consistently failing, stop early
          if (consecutiveFailures >= 5) {
            console.error("❌ Bundler not responding after 5 attempts. Stopping poll.");
            return undefined;
          }
        }

        const now = Date.now();
        if (now - lastLog >= 15_000) {
          console.log(
            `⏳ Still waiting for bundler... ${Math.floor(
              (now - start) / 1000
            )}s elapsed. UserOp may be queued.`
          );
          lastLog = now;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      console.warn("⚠️ Bundler polling timed out after 2 minutes");
      return undefined;
    };

    const topicToAddress = (topic?: string) =>
      topic ? (`0x${topic.slice(-40)}` as `0x${string}`) : undefined;

    const recoverFromEntryPointLogs = async (hash: `0x${string}`) => {
      try {
        if (!environment.EntryPoint) {
          return undefined;
        }
        const entryPoint = environment.EntryPoint as `0x${string}`;
        const latestBlock = await publicClient.getBlockNumber();
        const lookback = BigInt(1000); // Reduced from 5000 - Monad RPC limit
        const fromBlock = latestBlock > lookback ? latestBlock - lookback : BigInt(0);
        const USER_OPERATION_EVENT_TOPIC =
          "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f";

        console.log(`🔍 Scanning EntryPoint logs from block ${fromBlock} to ${latestBlock} (${lookback} blocks)...`);
        
        // Use raw RPC to filter by userOpHash in topics
        const rawLogs = await publicClient.request({
          method: "eth_getLogs",
          params: [
            {
              address: entryPoint,
              topics: [
                USER_OPERATION_EVENT_TOPIC,
                hash, // Filter by userOpHash in topic[1]
              ],
              fromBlock: `0x${fromBlock.toString(16)}`,
              toBlock: `0x${latestBlock.toString(16)}`,
            },
          ],
        } as any);

        const logs = rawLogs as any[];
        
        if (!logs || logs.length === 0) {
          console.warn("⚠️ No UserOperationEvent found in recent blocks. Transaction may not be on-chain yet.");
          return undefined;
        }
        
        console.log(`✅ Found ${logs.length} matching log(s) in EntryPoint`);


        const userOpLog = logs[logs.length - 1];
        const data = userOpLog.data.replace(/^0x/, "");
        if (data.length < 256) {
          return undefined;
        }

        const readWord = (offset: number) => BigInt(`0x${data.slice(offset, offset + 64)}`);

        const nonceFromLog = readWord(0);
        const successFromLog = readWord(64) === BigInt(1);
        const actualGasCostFromLog = readWord(128);
        const actualGasPriceFromLog = readWord(192);

        const transactionHash = userOpLog.transactionHash as `0x${string}`;
        const txReceipt = await publicClient.getTransactionReceipt({ hash: transactionHash });

        console.warn(
          "Recovered UserOperation receipt from EntryPoint logs due to bundler timeout.",
          {
            transactionHash,
            blockNumber: txReceipt.blockNumber?.toString(),
            successFromLog,
          }
        );

        return {
          userOpHash: hash,
          entryPoint,
          sender: topicToAddress(userOpLog.topics?.[2]) ?? delegateSA.address,
          nonce: nonceFromLog,
          success: successFromLog,
          paymaster: topicToAddress(userOpLog.topics?.[3]) ?? "",
          actualGasCost: actualGasCostFromLog,
          actualGasUsed: txReceipt.gasUsed,
          reason: successFromLog ? undefined : "EntryPoint event reported success=false",
          logs: [userOpLog],
          receipt: txReceipt,
          gasPrice: actualGasPriceFromLog,
        } as any;
      } catch (recoverError) {
        console.warn("Failed to recover UserOperation receipt from EntryPoint logs:", recoverError);
        return undefined;
      }
    };

    let userOpReceipt: any;

    try {
      userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 90_000, // 90 seconds initial timeout
      });
    } catch (waitError: any) {
      const message = waitError?.message?.toLowerCase() ?? "";
      const isTimeout =
        waitError?.name === "WaitForUserOperationReceiptTimeoutError" ||
        message.includes("timed out") ||
        message.includes("timeout");

      if (!isTimeout) {
        throw waitError;
      }

      console.warn(
        "⚠️ Bundler SDK timeout after 90s. Trying manual polling..."
      );
      userOpReceipt = await pollBundlerReceipt(userOpHash);

      if (!userOpReceipt) {
        console.warn("⚠️ Bundler returned no receipt. Checking on-chain EntryPoint logs...");
        userOpReceipt = await recoverFromEntryPointLogs(userOpHash);
      }
    }

    if (!userOpReceipt) {
      throw new Error(
        `UserOperation not confirmed after 3+ minutes.\n\n` +
        `Possible causes:\n` +
        `1. Bundler rejected/dropped the UserOp (check gas/nonce)\n` +
        `2. Bundler is experiencing delays on Monad testnet\n` +
        `3. Network congestion\n\n` +
        `✅ Actions:\n` +
        `- Check explorer: https://testnet-explorer.monad.xyz/tx/${userOpHash}\n` +
        `- Wait 2-3 minutes and refresh dashboard\n` +
        `- If not on explorer, try creating a new delegation with higher gas buffer\n` +
        `- Or use direct transfer mode temporarily`
      );
    }

    console.log("✅ UserOperation confirmed!");
    console.log("📊 Receipt details:");
    console.log("  - Success:", userOpReceipt.success, "(type:", typeof userOpReceipt.success, ")");
    console.log("  - Reason:", userOpReceipt.reason);
    console.log("  - Transaction Hash:", userOpReceipt.receipt?.transactionHash);
    console.log("  - Block Number:", userOpReceipt.receipt?.blockNumber?.toString());
    console.log("  - Logs:", userOpReceipt.receipt?.logs?.length, "log entries");
    // Don't stringify receipt - it contains BigInt values that can't be serialized

    const successFlag = userOpReceipt.success;
    const receiptStatus = userOpReceipt.receipt?.status;

    const successFromFlag =
      typeof successFlag === "boolean"
        ? successFlag
        : typeof successFlag === "string"
        ? successFlag.toLowerCase() === "true"
        : undefined;

    const successFromReceipt =
      typeof receiptStatus === "string"
        ? ["0x1", "0x01", "1"].includes(receiptStatus.toLowerCase())
        : typeof receiptStatus === "number"
        ? receiptStatus === 1
        : typeof receiptStatus === "bigint"
        ? receiptStatus === BigInt(1)
        : undefined;

    if (successFromFlag === false && successFromReceipt === true) {
      console.warn(
        "Bundler reported success=false but on-chain receipt.status=0x1. Treating as success."
      );
    }

    const isSuccess = successFromFlag === true || successFromReceipt === true;

    if (!isSuccess) {
      const revertData = userOpReceipt.reason as `0x${string}` | undefined;
      let decodedReason: string | undefined;

      if (revertData && revertData.startsWith("0x")) {
        try {
          const decoded = decodeErrorResult({
            abi: DelegationManagerAbi.abi,
            data: revertData,
          });
          const args =
            decoded.args && decoded.args.length
              ? `(${decoded.args.map((arg) => String(arg)).join(", ")})`
              : "";
          decodedReason = `${decoded.errorName}${args}`;
        } catch (decodeErr) {
          console.warn("Unable to decode revert reason:", decodeErr);
        }
      }

      const fallbackReason = userOpReceipt.reason ?? "unknown reason";
      const reasonText = decodedReason ?? fallbackReason;

      throw new Error(`UserOperation reverted: ${reasonText}`);
    }

    const txReceipt = userOpReceipt.receipt;
    const gasUsed =
      (txReceipt?.gasUsed ? txReceipt.gasUsed.toString() : undefined) ??
      (userOpReceipt.actualGasUsed ? userOpReceipt.actualGasUsed.toString() : "0");

    // Convert all BigInt values to strings for serialization
    const blockNumber = txReceipt?.blockNumber 
      ? (typeof txReceipt.blockNumber === 'bigint' 
          ? txReceipt.blockNumber.toString() 
          : String(txReceipt.blockNumber))
      : "";

    console.log(`\n🎉 SUCCESS! Withdrawal of ${amount} mUSDC completed!`);
    console.log(`📝 Transaction: ${txReceipt?.transactionHash}`);
    console.log(`📦 Block: ${blockNumber}`);
    console.log(`⛽ Gas used: ${gasUsed}`);

    const result = {
      delegator: normalizedDelegation.delegator,
      delegate: normalizedDelegation.delegate,
      requestedAmount: amount,
      actualWithdrawn: amount,
      userOpHash,
      transactionHash: txReceipt?.transactionHash ?? "",
      blockNumber,
      gasUsed,
      status: "SUCCESS",
      message: `✅ Successfully withdrawn ${amount} mUSDC! Transaction confirmed on block ${blockNumber}`,
      timestamp: new Date().toISOString(),
      gasless: true,
    };

    // Save to localStorage for dashboard display
    if (typeof window !== "undefined") {
      try {
        const redemptionHistory = JSON.parse(localStorage.getItem("redemptionHistory") || "[]");
        redemptionHistory.unshift({
          id: txReceipt?.transactionHash ?? userOpHash,
          delegator: normalizedDelegation.delegator,
          delegate: normalizedDelegation.delegate,
          amount: amount,
          txHash: txReceipt?.transactionHash ?? "",
          timestamp: new Date().toISOString(),
          blockNumber: blockNumber,
          gasless: true,
        });
        // Keep only last 50 redemptions
        localStorage.setItem("redemptionHistory", JSON.stringify(redemptionHistory.slice(0, 50)));
      } catch (storageError) {
        console.warn("Failed to save redemption to localStorage:", storageError);
      }
    }

    return result;
  } catch (error: any) {
    console.error("SDK redemption failed:", error?.message || error);
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
    });

    const message = error?.message?.toLowerCase() ?? "";
    let errorMessage = "SDK redemption failed!\n\n";

    // Check for delegation limit exceeded
    if (message.includes("transfer-amount-exceeded") || message.includes("erc20periodtransferencer")) {
      errorMessage = "❌ Delegation Limit Exceeded!\n\n";
      errorMessage += "The delegation has reached its transfer limit for this period.\n\n";
      errorMessage += "Solutions:\n";
      errorMessage += "1. Create a new delegation with higher allowance\n";
      errorMessage += "2. Wait for the period to reset\n";
      errorMessage += "3. Withdraw a smaller amount";
    } else if (message.includes("erc1271")) {
      errorMessage +=
        "Possible invalid delegation signature. Recreate the delegation and ensure you sign with the original delegator wallet.";
    } else if (message.includes("maxfeepergas") || message.includes("maxpriorityfeepergas")) {
      errorMessage +=
        "Bundler rejected gas parameters. Verify the Pimlico endpoint or try again later.";
    } else if (message.includes("prefund") || message.includes("aa21")) {
      errorMessage = "❌ Insufficient MON Balance!\n\n";
      errorMessage += "Smart Account needs MON tokens to pay for gas.\n\n";
      errorMessage += "Please send MON to your Smart Account address.";
    } else if (message.includes("invalid smart account nonce")) {
      errorMessage += "Pending UserOperation with the same nonce. Wait for inclusion or try again shortly.";
    } else {
      errorMessage += "Check console logs for details and verify that the delegation remains valid.";
    }

    if (!message.includes("transfer-amount-exceeded") && !message.includes("prefund")) {
      errorMessage += `\n\nSDK Error: ${error?.message || "Unknown error"}`;
    }
    throw new Error(errorMessage);
  }
}


