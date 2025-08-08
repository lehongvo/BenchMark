const { ethers } = require('ethers');

// RPC endpoints to compare
const RPC_ENDPOINTS = {
    alchemy: 'https://polygon-mainnet.g.alchemy.com/v2/tl2r5NSPnvFOd0d3Nqaa8b_SHf2UkIIQ',
    dwellir: 'https://api-polygon-mainnet-full.n.dwellir.com/add5e988-e749-493c-9891-ab917c89ed5a'
};

// Test configuration
const TEST_CONFIG = {
    iterations: 10,
    concurrentRequests: 5,
    timeout: 30000 // 30 seconds
};

class RPCBenchmark {
    constructor() {
        this.results = {};
    }

    // Create provider with timeout
    createProvider(url) {
        return new ethers.JsonRpcProvider(url, {
            name: 'polygon',
            chainId: 137
        });
    }

    // Measure execution time
    async measureTime(fn) {
        const start = process.hrtime.bigint();
        try {
            const result = await fn();
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000; // Convert to milliseconds
            return { success: true, duration, result };
        } catch (error) {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000;
            return { success: false, duration, error: error.message };
        }
    }

    // Test basic connectivity
    async testConnectivity(provider) {
        return this.measureTime(async () => {
            return await provider.getNetwork();
        });
    }

    // Test get latest block number
    async testGetBlockNumber(provider) {
        return this.measureTime(async () => {
            return await provider.getBlockNumber();
        });
    }

    // Test get block by number
    async testGetBlock(provider, blockNumber) {
        return this.measureTime(async () => {
            return await provider.getBlock(blockNumber);
        });
    }

    // Test get balance
    async testGetBalance(provider, address) {
        return this.measureTime(async () => {
            return await provider.getBalance(address);
        });
    }

    // Test get transaction count
    async testGetTransactionCount(provider, address) {
        return this.measureTime(async () => {
            return await provider.getTransactionCount(address);
        });
    }

    // Test gas price
    async testGetGasPrice(provider) {
        return this.measureTime(async () => {
            return await provider.getFeeData();
        });
    }

    // Run multiple concurrent requests
    async testConcurrentRequests(provider, testFn, count = 5) {
        const promises = Array(count).fill().map(() => testFn());
        const start = process.hrtime.bigint();
        
        try {
            const results = await Promise.all(promises);
            const end = process.hrtime.bigint();
            const totalDuration = Number(end - start) / 1000000;
            
            const successful = results.filter(r => r.success).length;
            const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            
            return {
                success: true,
                totalDuration,
                avgDuration,
                successRate: successful / count,
                results
            };
        } catch (error) {
            const end = process.hrtime.bigint();
            const totalDuration = Number(end - start) / 1000000;
            return {
                success: false,
                totalDuration,
                error: error.message
            };
        }
    }

    // Run comprehensive benchmark for one RPC
    async benchmarkRPC(name, url) {
        console.log(`\n🔍 Testing ${name} RPC: ${url}`);
        console.log('='.repeat(60));
        
        const provider = this.createProvider(url);
        const results = {
            name,
            url,
            tests: {}
        };

        try {
            // Test 1: Basic connectivity
            console.log('📡 Testing connectivity...');
            const connectivity = await this.testConnectivity(provider);
            results.tests.connectivity = connectivity;
            
            if (!connectivity.success) {
                console.log(`❌ Connectivity failed: ${connectivity.error}`);
                return results;
            }
            
            console.log(`✅ Connected successfully (${connectivity.duration.toFixed(2)}ms)`);
            console.log(`   Network: ${connectivity.result.name}, Chain ID: ${connectivity.result.chainId}`);

            // Test 2: Get block number
            console.log('🔢 Testing getBlockNumber...');
            const blockNumberTest = await this.testGetBlockNumber(provider);
            results.tests.blockNumber = blockNumberTest;
            
            if (blockNumberTest.success) {
                console.log(`✅ Block number: ${blockNumberTest.result} (${blockNumberTest.duration.toFixed(2)}ms)`);
            } else {
                console.log(`❌ getBlockNumber failed: ${blockNumberTest.error}`);
            }

            // Test 3: Get latest block details
            if (blockNumberTest.success) {
                console.log('📦 Testing getBlock...');
                const blockTest = await this.testGetBlock(provider, blockNumberTest.result);
                results.tests.getBlock = blockTest;
                
                if (blockTest.success) {
                    console.log(`✅ Block details retrieved (${blockTest.duration.toFixed(2)}ms)`);
                    console.log(`   Transactions: ${blockTest.result.transactions.length}`);
                } else {
                    console.log(`❌ getBlock failed: ${blockTest.error}`);
                }
            }

            // Test 4: Get balance (using a known address)
            console.log('💰 Testing getBalance...');
            const balanceTest = await this.testGetBalance(provider, '0x0000000000000000000000000000000000000000');
            results.tests.getBalance = balanceTest;
            
            if (balanceTest.success) {
                console.log(`✅ Balance retrieved (${balanceTest.duration.toFixed(2)}ms)`);
            } else {
                console.log(`❌ getBalance failed: ${balanceTest.error}`);
            }

            // Test 5: Get gas price
            console.log('⛽ Testing getFeeData...');
            const gasPriceTest = await this.testGetGasPrice(provider);
            results.tests.gasPrice = gasPriceTest;
            
            if (gasPriceTest.success) {
                console.log(`✅ Fee data retrieved (${gasPriceTest.duration.toFixed(2)}ms)`);
                console.log(`   Gas price: ${ethers.formatUnits(gasPriceTest.result.gasPrice, 'gwei')} gwei`);
            } else {
                console.log(`❌ getFeeData failed: ${gasPriceTest.error}`);
            }

            // Test 6: Concurrent requests
            console.log(`🚀 Testing concurrent requests (${TEST_CONFIG.concurrentRequests} parallel)...`);
            const concurrentTest = await this.testConcurrentRequests(
                provider,
                () => this.testGetBlockNumber(provider),
                TEST_CONFIG.concurrentRequests
            );
            results.tests.concurrent = concurrentTest;
            
            if (concurrentTest.success) {
                console.log(`✅ Concurrent test completed (${concurrentTest.totalDuration.toFixed(2)}ms total)`);
                console.log(`   Success rate: ${(concurrentTest.successRate * 100).toFixed(1)}%`);
                console.log(`   Average response time: ${concurrentTest.avgDuration.toFixed(2)}ms`);
            } else {
                console.log(`❌ Concurrent test failed: ${concurrentTest.error}`);
            }

            // Test 7: Stress test with multiple iterations
            console.log(`🔄 Running stress test (${TEST_CONFIG.iterations} iterations)...`);
            const stressResults = [];
            
            for (let i = 0; i < TEST_CONFIG.iterations; i++) {
                const result = await this.testGetBlockNumber(provider);
                stressResults.push(result);
                process.stdout.write(`${i + 1}/${TEST_CONFIG.iterations} `);
            }
            
            console.log('');
            const successfulStress = stressResults.filter(r => r.success);
            const avgStressTime = successfulStress.reduce((sum, r) => sum + r.duration, 0) / successfulStress.length;
            const stressSuccessRate = successfulStress.length / stressResults.length;
            
            results.tests.stress = {
                iterations: TEST_CONFIG.iterations,
                successRate: stressSuccessRate,
                avgDuration: avgStressTime,
                results: stressResults
            };
            
            console.log(`✅ Stress test completed`);
            console.log(`   Success rate: ${(stressSuccessRate * 100).toFixed(1)}%`);
            console.log(`   Average response time: ${avgStressTime.toFixed(2)}ms`);

        } catch (error) {
            console.log(`❌ Benchmark failed: ${error.message}`);
            results.error = error.message;
        }

        return results;
    }

    // Compare results and generate report
    generateReport(results) {
        console.log('\n📊 BENCHMARK COMPARISON REPORT');
        console.log('='.repeat(80));
        
        const rpcs = Object.keys(results);
        
        // Connectivity comparison
        console.log('\n🔗 CONNECTIVITY:');
        rpcs.forEach(rpc => {
            const conn = results[rpc].tests.connectivity;
            if (conn && conn.success) {
                console.log(`  ${rpc.padEnd(10)}: ✅ ${conn.duration.toFixed(2)}ms`);
            } else {
                console.log(`  ${rpc.padEnd(10)}: ❌ Failed`);
            }
        });

        // Response time comparison
        console.log('\n⚡ RESPONSE TIMES (getBlockNumber):');
        rpcs.forEach(rpc => {
            const test = results[rpc].tests.blockNumber;
            if (test && test.success) {
                console.log(`  ${rpc.padEnd(10)}: ${test.duration.toFixed(2)}ms`);
            } else {
                console.log(`  ${rpc.padEnd(10)}: Failed`);
            }
        });

        // Concurrent performance
        console.log('\n🚀 CONCURRENT PERFORMANCE:');
        rpcs.forEach(rpc => {
            const test = results[rpc].tests.concurrent;
            if (test && test.success) {
                console.log(`  ${rpc.padEnd(10)}: ${test.avgDuration.toFixed(2)}ms avg, ${(test.successRate * 100).toFixed(1)}% success`);
            } else {
                console.log(`  ${rpc.padEnd(10)}: Failed`);
            }
        });

        // Stress test results
        console.log('\n💪 STRESS TEST RESULTS:');
        rpcs.forEach(rpc => {
            const test = results[rpc].tests.stress;
            if (test) {
                console.log(`  ${rpc.padEnd(10)}: ${test.avgDuration.toFixed(2)}ms avg, ${(test.successRate * 100).toFixed(1)}% success`);
            } else {
                console.log(`  ${rpc.padEnd(10)}: No data`);
            }
        });

        // Overall recommendation
        console.log('\n🏆 RECOMMENDATION:');
        
        const validRpcs = rpcs.filter(rpc => 
            results[rpc].tests.connectivity && 
            results[rpc].tests.connectivity.success
        );

        if (validRpcs.length === 0) {
            console.log('  ❌ No RPC endpoints are working properly');
            return;
        }

        // Calculate overall scores
        const scores = {};
        validRpcs.forEach(rpc => {
            let score = 0;
            let factors = 0;

            // Connectivity speed (weight: 1)
            if (results[rpc].tests.connectivity?.success) {
                score += (1000 / results[rpc].tests.connectivity.duration);
                factors += 1;
            }

            // Block number speed (weight: 2)
            if (results[rpc].tests.blockNumber?.success) {
                score += 2 * (1000 / results[rpc].tests.blockNumber.duration);
                factors += 2;
            }

            // Concurrent performance (weight: 2)
            if (results[rpc].tests.concurrent?.success) {
                score += 2 * (1000 / results[rpc].tests.concurrent.avgDuration) * results[rpc].tests.concurrent.successRate;
                factors += 2;
            }

            // Stress test reliability (weight: 3)
            if (results[rpc].tests.stress) {
                score += 3 * (1000 / results[rpc].tests.stress.avgDuration) * results[rpc].tests.stress.successRate;
                factors += 3;
            }

            scores[rpc] = factors > 0 ? score / factors : 0;
        });

        const sortedRpcs = validRpcs.sort((a, b) => scores[b] - scores[a]);
        
        sortedRpcs.forEach((rpc, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            console.log(`  ${medal} ${rpc.toUpperCase()}: Score ${scores[rpc].toFixed(2)}`);
        });

        console.log(`\n💡 Best RPC: ${sortedRpcs[0].toUpperCase()}`);
        
        return sortedRpcs[0];
    }

    // Main benchmark function
    async run() {
        console.log('🚀 Starting Polygon RPC Benchmark');
        console.log(`⚙️  Configuration: ${TEST_CONFIG.iterations} iterations, ${TEST_CONFIG.concurrentRequests} concurrent requests`);
        
        const results = {};
        
        // Test each RPC endpoint
        for (const [name, url] of Object.entries(RPC_ENDPOINTS)) {
            results[name] = await this.benchmarkRPC(name, url);
            
            // Add delay between tests to avoid rate limiting
            if (Object.keys(results).length < Object.keys(RPC_ENDPOINTS).length) {
                console.log('\n⏳ Waiting 2 seconds before next test...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Generate comparison report
        this.generateReport(results);
        
        return results;
    }
}

// Run the benchmark
async function main() {
    const benchmark = new RPCBenchmark();
    
    try {
        const results = await benchmark.run();
        
        // Save results to file
        const fs = require('fs');
        // Convert BigInt to string for JSON serialization
        const jsonResults = JSON.stringify(results, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2);
        fs.writeFileSync('benchmark-results.json', jsonResults);
        console.log('\n💾 Results saved to benchmark-results.json');
        
    } catch (error) {
        console.error('❌ Benchmark failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = { RPCBenchmark, RPC_ENDPOINTS, TEST_CONFIG };
