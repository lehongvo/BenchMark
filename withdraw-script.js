const { ethers } = require('ethers');

// Configuration
const PRIVATE_KEY = '0x4E447D8C831406E28128321FCDA0bAd603CA125d'; // Your private key
const CONTRACT_ADDRESS = '0xE6aa28bf4E80e9d44c360e1Edb891336546c4bAb'; // Contract address with tokens
const JPYC_TOKEN_ADDRESS = '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c'; // JPYC token on Polygon
const YOUR_WALLET = '0x4E447D8C831406E28128321FCDA0bAd603CA125d'; // Your wallet to receive tokens
const RPC_URL = 'https://polygon-rpc.com'; // Polygon RPC

// ERC20 ABI (minimal)
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)'
];

async function withdrawTokens() {
    try {
        console.log('🚀 Starting token withdrawal...');
        
        // Connect to Polygon network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log(`📍 Wallet address: ${wallet.address}`);
        console.log(`📍 Contract address: ${CONTRACT_ADDRESS}`);
        
        // Connect to JPYC token contract
        const tokenContract = new ethers.Contract(JPYC_TOKEN_ADDRESS, ERC20_ABI, wallet);
        
        // Get token info
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        console.log(`💰 Token: ${symbol}, Decimals: ${decimals}`);
        
        // Check balance of contract address
        const balance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
        const balanceFormatted = ethers.formatUnits(balance, decimals);
        
        console.log(`💳 Balance in contract: ${balanceFormatted} ${symbol}`);
        
        if (balance === 0n) {
            console.log('❌ No tokens to withdraw');
            return;
        }
        
        // Check if we can control the contract address
        if (wallet.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
            console.log('⚠️  Warning: Wallet address differs from contract address');
            console.log(`   Wallet: ${wallet.address}`);
            console.log(`   Contract: ${CONTRACT_ADDRESS}`);
            console.log('   This will only work if the contract address is an EOA controlled by your private key');
        }
        
        // Get gas price
        const gasPrice = await provider.getFeeData();
        console.log(`⛽ Gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
        
        // Prepare transaction
        console.log('📝 Preparing transfer transaction...');
        
        // If contract address is same as wallet, we can transfer directly
        if (wallet.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
            const tx = await tokenContract.transfer(YOUR_WALLET, balance);
            console.log(`📤 Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            console.log(`🎉 Successfully transferred ${balanceFormatted} ${symbol} to ${YOUR_WALLET}`);
        } else {
            console.log('❌ Cannot transfer: Contract address is not controlled by your private key');
            console.log('💡 Solutions:');
            console.log('   1. Deploy a proper smart contract with withdraw function');
            console.log('   2. Use the correct private key that controls the contract address');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log('💡 You need MATIC for gas fees');
        } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            console.log('💡 Transaction may fail - check token balance and permissions');
        }
    }
}

// Helper function to check balances
async function checkBalances() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tokenContract = new ethers.Contract(JPYC_TOKEN_ADDRESS, ERC20_ABI, provider);
        
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        
        // Check contract balance
        const contractBalance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
        const contractBalanceFormatted = ethers.formatUnits(contractBalance, decimals);
        
        // Check wallet balance
        const walletBalance = await tokenContract.balanceOf(YOUR_WALLET);
        const walletBalanceFormatted = ethers.formatUnits(walletBalance, decimals);
        
        console.log('\n📊 BALANCE SUMMARY:');
        console.log(`   Contract (${CONTRACT_ADDRESS}): ${contractBalanceFormatted} ${symbol}`);
        console.log(`   Wallet (${YOUR_WALLET}): ${walletBalanceFormatted} ${symbol}`);
        
        // Check MATIC balance
        const maticBalance = await provider.getBalance(YOUR_WALLET);
        const maticFormatted = ethers.formatEther(maticBalance);
        console.log(`   MATIC balance: ${maticFormatted} MATIC`);
        
    } catch (error) {
        console.error('❌ Error checking balances:', error.message);
    }
}

// Main execution
async function main() {
    console.log('🔍 Checking current balances...');
    await checkBalances();
    
    console.log('\n🚀 Attempting withdrawal...');
    await withdrawTokens();
    
    console.log('\n🔍 Checking balances after withdrawal...');
    await checkBalances();
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { withdrawTokens, checkBalances };
