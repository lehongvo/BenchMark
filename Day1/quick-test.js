const { ethers } = require('ethers');

// Quick test script for comparing RPC endpoints
const RPC_ENDPOINTS = {
    alchemy: 'https://polygon-mainnet.g.alchemy.com/v2/tl2r5NSPnvFOd0d3Nqaa8b_SHf2UkIIQ',
    dwellir: 'https://api-polygon-mainnet-full.n.dwellir.com/add5e988-e749-493c-9891-ab917c89ed5a'
};

async function quickTest() {
    console.log('🚀 Quick RPC Comparison Test\n');
    
    for (const [name, url] of Object.entries(RPC_ENDPOINTS)) {
        console.log(`Testing ${name.toUpperCase()}:`);
        console.log(`URL: ${url}`);
        
        try {
            const provider = new ethers.JsonRpcProvider(url);
            
            // Test 1: Get block number
            const start1 = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const time1 = Date.now() - start1;
            
            // Test 2: Get network info
            const start2 = Date.now();
            const network = await provider.getNetwork();
            const time2 = Date.now() - start2;
            
            // Test 3: Get latest block
            const start3 = Date.now();
            const block = await provider.getBlock('latest');
            const time3 = Date.now() - start3;
            
            console.log(`✅ Block Number: ${blockNumber} (${time1}ms)`);
            console.log(`✅ Network: ${network.name}, Chain ID: ${network.chainId} (${time2}ms)`);
            console.log(`✅ Latest Block: ${block.transactions.length} transactions (${time3}ms)`);
            console.log(`📊 Average Response Time: ${((time1 + time2 + time3) / 3).toFixed(2)}ms`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('-'.repeat(50));
    }
}

quickTest().catch(console.error);

