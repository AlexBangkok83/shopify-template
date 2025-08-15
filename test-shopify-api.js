#!/usr/bin/env node

/**
 * Shopify Storefront API Test Suite
 * Tests authentication, permissions, and API connectivity
 */

const https = require('https');
const { performance } = require('perf_hooks');

class ShopifyAPITester {
    constructor(config) {
        this.shopDomain = config.shopDomain;
        this.storefrontAccessToken = config.storefrontAccessToken;
        this.apiVersion = config.apiVersion || '2024-01';
        this.endpoint = `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`;
        this.testResults = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(formatted);
        
        this.testResults.push({
            timestamp,
            type,
            message
        });
    }

    async makeRequest(query, variables = {}, testName = 'Unknown Test') {
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                query,
                variables
            });

            const options = {
                hostname: this.shopDomain,
                port: 443,
                path: `/api/${this.apiVersion}/graphql.json`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken,
                    'Accept': 'application/json',
                    'User-Agent': 'Shopify-API-Tester/1.0'
                },
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);

                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = {
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage,
                            headers: res.headers,
                            responseTime,
                            testName,
                            rawData: data
                        };

                        if (data) {
                            try {
                                result.data = JSON.parse(data);
                            } catch (parseError) {
                                result.parseError = parseError.message;
                                result.data = data;
                            }
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                
                reject({
                    error: error.message,
                    code: error.code,
                    responseTime,
                    testName
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject({
                    error: 'Request timeout',
                    code: 'TIMEOUT',
                    responseTime: 10000,
                    testName
                });
            });

            req.write(postData);
            req.end();
        });
    }

    async testBasicConnectivity() {
        this.log('Testing basic connectivity to Shopify domain...', 'info');
        
        try {
            const testQuery = `
                query {
                    shop {
                        name
                        url
                        currencyCode
                    }
                }
            `;

            const result = await this.makeRequest(testQuery, {}, 'Basic Connectivity');
            
            this.log(`Response Status: ${result.statusCode} ${result.statusMessage}`, 'info');
            this.log(`Response Time: ${result.responseTime}ms`, 'info');
            
            if (result.statusCode === 200) {
                this.log('✅ Basic connectivity: SUCCESS', 'success');
                
                if (result.data && result.data.data && result.data.data.shop) {
                    const shop = result.data.data.shop;
                    this.log(`Shop Name: ${shop.name}`, 'info');
                    this.log(`Shop URL: ${shop.url}`, 'info');
                    this.log(`Currency: ${shop.currencyCode}`, 'info');
                }
            } else {
                this.log('❌ Basic connectivity: FAILED', 'error');
                this.log(`Error Details: ${JSON.stringify(result.data, null, 2)}`, 'error');
            }
            
            return result;
        } catch (error) {
            this.log('❌ Basic connectivity: FAILED', 'error');
            this.log(`Error: ${error.error || error.message}`, 'error');
            return error;
        }
    }

    async testAuthentication() {
        this.log('Testing Storefront Access Token authentication...', 'info');
        
        try {
            const testQuery = `
                query {
                    shop {
                        name
                        primaryDomain {
                            url
                        }
                    }
                }
            `;

            const result = await this.makeRequest(testQuery, {}, 'Authentication Test');
            
            if (result.statusCode === 401) {
                this.log('❌ Authentication: FAILED - 401 Unauthorized', 'error');
                this.log('Possible causes:', 'error');
                this.log('  - Invalid Storefront Access Token', 'error');
                this.log('  - Token has been revoked or expired', 'error');
                this.log('  - Token is for a different shop domain', 'error');
                this.log('  - Storefront API is not enabled for this shop', 'error');
                
                if (result.data) {
                    this.log(`Response: ${JSON.stringify(result.data, null, 2)}`, 'error');
                }
            } else if (result.statusCode === 403) {
                this.log('❌ Authentication: FAILED - 403 Forbidden', 'error');
                this.log('Possible causes:', 'error');
                this.log('  - Token lacks required permissions', 'error');
                this.log('  - Storefront API access is restricted', 'error');
            } else if (result.statusCode === 200) {
                this.log('✅ Authentication: SUCCESS', 'success');
                
                if (result.data && result.data.errors) {
                    this.log('⚠️  GraphQL errors found:', 'warning');
                    result.data.errors.forEach(error => {
                        this.log(`  - ${error.message}`, 'warning');
                    });
                }
            } else {
                this.log(`❌ Authentication: UNEXPECTED STATUS ${result.statusCode}`, 'error');
            }
            
            return result;
        } catch (error) {
            this.log('❌ Authentication test failed with network error', 'error');
            this.log(`Error: ${error.error || error.message}`, 'error');
            return error;
        }
    }

    async testProductsQuery() {
        this.log('Testing products query permissions...', 'info');
        
        try {
            const testQuery = `
                query testProducts($first: Int!) {
                    products(first: $first) {
                        edges {
                            node {
                                id
                                title
                                handle
                                availableForSale
                                variants(first: 1) {
                                    edges {
                                        node {
                                            id
                                            availableForSale
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            `;

            const result = await this.makeRequest(testQuery, { first: 5 }, 'Products Query Test');
            
            if (result.statusCode === 200) {
                this.log('✅ Products query: SUCCESS', 'success');
                
                if (result.data && result.data.data && result.data.data.products) {
                    const productCount = result.data.data.products.edges.length;
                    this.log(`Found ${productCount} products`, 'info');
                    
                    if (productCount > 0) {
                        const firstProduct = result.data.data.products.edges[0].node;
                        this.log(`First product: ${firstProduct.title}`, 'info');
                    }
                } else if (result.data && result.data.errors) {
                    this.log('❌ Products query: GraphQL ERRORS', 'error');
                    result.data.errors.forEach(error => {
                        this.log(`  - ${error.message}`, 'error');
                    });
                }
            } else {
                this.log(`❌ Products query: FAILED (${result.statusCode})`, 'error');
            }
            
            return result;
        } catch (error) {
            this.log('❌ Products query test failed', 'error');
            this.log(`Error: ${error.error || error.message}`, 'error');
            return error;
        }
    }

    async testInvalidToken() {
        this.log('Testing with invalid token to confirm error handling...', 'info');
        
        const originalToken = this.storefrontAccessToken;
        this.storefrontAccessToken = 'invalid-token-12345';
        
        try {
            const testQuery = `
                query {
                    shop {
                        name
                    }
                }
            `;

            const result = await this.makeRequest(testQuery, {}, 'Invalid Token Test');
            
            if (result.statusCode === 401) {
                this.log('✅ Invalid token properly rejected with 401', 'success');
            } else {
                this.log(`⚠️  Unexpected response for invalid token: ${result.statusCode}`, 'warning');
            }
            
            return result;
        } catch (error) {
            this.log('Invalid token test completed', 'info');
            return error;
        } finally {
            // Restore original token
            this.storefrontAccessToken = originalToken;
        }
    }

    async testAPIVersionCompatibility() {
        this.log('Testing API version compatibility...', 'info');
        
        const testVersions = ['2024-01', '2023-10', '2023-07'];
        
        for (const version of testVersions) {
            try {
                this.log(`Testing API version: ${version}`, 'info');
                
                const postData = JSON.stringify({
                    query: 'query { shop { name } }'
                });

                const options = {
                    hostname: this.shopDomain,
                    port: 443,
                    path: `/api/${version}/graphql.json`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                    },
                    timeout: 5000
                };

                const result = await new Promise((resolve, reject) => {
                    const req = https.request(options, (res) => {
                        resolve({ statusCode: res.statusCode, version });
                    });
                    
                    req.on('error', (error) => {
                        resolve({ error: error.message, version });
                    });
                    
                    req.on('timeout', () => {
                        req.destroy();
                        resolve({ error: 'timeout', version });
                    });
                    
                    req.write(postData);
                    req.end();
                });

                if (result.statusCode === 200) {
                    this.log(`✅ API version ${version}: Working`, 'success');
                } else if (result.statusCode === 401) {
                    this.log(`❌ API version ${version}: Authentication failed`, 'error');
                } else {
                    this.log(`⚠️  API version ${version}: Status ${result.statusCode}`, 'warning');
                }
                
            } catch (error) {
                this.log(`❌ API version ${version}: Error - ${error.message}`, 'error');
            }
        }
    }

    async runAllTests() {
        this.log('Starting Shopify Storefront API Test Suite', 'info');
        this.log(`Shop Domain: ${this.shopDomain}`, 'info');
        this.log(`API Version: ${this.apiVersion}`, 'info');
        this.log(`Token (masked): ${this.storefrontAccessToken.substring(0, 8)}...`, 'info');
        this.log('=' * 60, 'info');

        const tests = [
            { name: 'Basic Connectivity', fn: () => this.testBasicConnectivity() },
            { name: 'Authentication', fn: () => this.testAuthentication() },
            { name: 'Products Query', fn: () => this.testProductsQuery() },
            { name: 'Invalid Token', fn: () => this.testInvalidToken() },
            { name: 'API Version Compatibility', fn: () => this.testAPIVersionCompatibility() }
        ];

        const results = {};

        for (const test of tests) {
            this.log(`\n--- ${test.name} ---`, 'info');
            try {
                results[test.name] = await test.fn();
            } catch (error) {
                this.log(`Test ${test.name} threw an exception: ${error.message}`, 'error');
                results[test.name] = { error: error.message };
            }
        }

        this.log('\n' + '=' * 60, 'info');
        this.log('TEST SUMMARY', 'info');
        this.log('=' * 60, 'info');

        return results;
    }

    generateReport(results) {
        this.log('\n📊 DIAGNOSTIC REPORT', 'info');
        this.log('=' * 60, 'info');

        // Check for common issues
        const authResult = results['Authentication'];
        
        if (authResult && authResult.statusCode === 401) {
            this.log('\n🚨 CRITICAL ISSUE: 401 Unauthorized', 'error');
            this.log('\nTo fix this issue, follow these steps:', 'info');
            this.log('\n1. Log into your Shopify Admin Panel:', 'info');
            this.log(`   https://${this.shopDomain}/admin`, 'info');
            this.log('\n2. Navigate to: Apps > Develop apps', 'info');
            this.log('\n3. Create a new app or edit existing app', 'info');
            this.log('\n4. Configure Storefront API access:', 'info');
            this.log('   - Click "Configure Storefront API scopes"', 'info');
            this.log('   - Enable these scopes:', 'info');
            this.log('     ✓ unauthenticated_read_product_listings', 'info');
            this.log('     ✓ unauthenticated_read_product_inventory', 'info');
            this.log('     ✓ unauthenticated_read_product_tags', 'info');
            this.log('     ✓ unauthenticated_read_selling_plans', 'info');
            this.log('     ✓ unauthenticated_write_checkouts', 'info');
            this.log('     ✓ unauthenticated_read_checkouts', 'info');
            this.log('\n5. Save the configuration', 'info');
            this.log('\n6. Generate a new Storefront Access Token', 'info');
            this.log('\n7. Update your config.json with the new token', 'info');
            
        } else if (authResult && authResult.statusCode === 200) {
            this.log('\n✅ Authentication is working correctly!', 'success');
            
            const productsResult = results['Products Query'];
            if (productsResult && productsResult.statusCode === 200) {
                this.log('✅ Products API is accessible', 'success');
                
                if (productsResult.data && productsResult.data.data && productsResult.data.data.products) {
                    const productCount = productsResult.data.data.products.edges.length;
                    if (productCount === 0) {
                        this.log('\n⚠️  No products found in your store', 'warning');
                        this.log('Make sure you have published products in your Shopify store', 'info');
                    }
                }
            }
        }

        this.log('\n📋 CONFIGURATION CHECKLIST', 'info');
        this.log('=' * 40, 'info');
        this.log('□ Storefront API is enabled in Shopify Admin', 'info');
        this.log('□ Required scopes are configured', 'info');
        this.log('□ Access token is valid and not expired', 'info');
        this.log('□ Shop domain is correct', 'info');
        this.log('□ Products are published and available', 'info');

        return this.testResults;
    }
}

// Configuration from your store
const config = {
    shopDomain: 'painswedenstore.myshopify.com',
    storefrontAccessToken: '6302d10a27c4fce855c48d96b39ec7f0',
    apiVersion: '2024-01'
};

// Run the tests
async function main() {
    const tester = new ShopifyAPITester(config);
    
    try {
        const results = await tester.runAllTests();
        tester.generateReport(results);
    } catch (error) {
        console.error('Test suite failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ShopifyAPITester;