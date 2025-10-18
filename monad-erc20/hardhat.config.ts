import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    monad: {
      url: process.env.MONAD_RPC_URL!,     // bạn đã xác nhận ở bước #1
      accounts: [process.env.DEPLOY_PK!],  // PK test để deploy token
      chainId: Number(process.env.MONAD_CHAIN_ID || 10143),
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
export default config;
