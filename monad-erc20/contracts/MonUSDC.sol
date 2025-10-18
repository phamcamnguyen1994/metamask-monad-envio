// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonUSDC is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(uint8 decs) ERC20("Monad USDC Test", "mUSDC") Ownable(msg.sender) {
        _decimals = decs; // 6
        _mint(msg.sender, 1_000_000 * 10 ** decs); // 1,000,000 mUSDC
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

