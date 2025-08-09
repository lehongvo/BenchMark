// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleWithdraw {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can withdraw");
        _;
    }
    
    /**
     * @dev Withdraw tokens from contract
     * @param tokenAddress Address of the ERC20 token
     * @param amount Amount to withdraw
     * @param to Address to send tokens to
     */
    function withdrawToken(
        address tokenAddress,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        bool success = token.transfer(to, amount);
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get token balance of any address
     * @param tokenAddress Address of the ERC20 token
     * @param fromAddress Address to check balance of
     * @return Token balance
     */
    function getBalance(
        address tokenAddress,
        address fromAddress
    ) external view returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(fromAddress != address(0), "Invalid address");
        
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(fromAddress);
    }
}
