/**
 * Checkout Validation Script
 * This script validates that the checkout functionality is working correctly
 */

function validateCheckout() {
    console.log('🔍 Validating checkout functionality...');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function test(name, condition, message) {
        const passed = Boolean(condition);
        results.tests.push({ name, passed, message });
        if (passed) {
            results.passed++;
            console.log(`✅ ${name}: ${message}`);
        } else {
            results.failed++;
            console.log(`❌ ${name}: ${message}`);
        }
    }

    // Test 1: Check if global checkout function exists
    test(
        'Global checkout function',
        typeof window.checkout === 'function',
        typeof window.checkout === 'function' 
            ? 'Global checkout function exists' 
            : 'Global checkout function is missing'
    );

    // Test 2: Check if app is initialized
    test(
        'App initialization',
        window.app && window.app instanceof MultiStoreApp,
        window.app && window.app instanceof MultiStoreApp
            ? 'MultiStoreApp instance exists'
            : 'App not properly initialized'
    );

    // Test 3: Check if app has checkout method
    test(
        'App checkout method',
        window.app && typeof window.app.checkout === 'function',
        window.app && typeof window.app.checkout === 'function'
            ? 'App checkout method exists'
            : 'App checkout method is missing'
    );

    // Test 4: Check if HTML checkout button exists and has correct onclick
    const checkoutButton = document.querySelector('button[onclick="checkout()"]');
    test(
        'HTML checkout button',
        checkoutButton !== null,
        checkoutButton !== null
            ? 'Checkout button found with correct onclick attribute'
            : 'Checkout button with onclick="checkout()" not found'
    );

    // Test 5: Test global checkout function with mock app
    if (window.app) {
        let checkoutCalled = false;
        const originalCheckout = window.app.checkout;
        window.app.checkout = function() {
            checkoutCalled = true;
            console.log('Mock checkout called');
        };

        try {
            window.checkout();
            test(
                'Global checkout calls app.checkout',
                checkoutCalled,
                checkoutCalled
                    ? 'Global checkout successfully calls app.checkout'
                    : 'Global checkout does not call app.checkout'
            );
        } catch (error) {
            test(
                'Global checkout calls app.checkout',
                false,
                `Error calling global checkout: ${error.message}`
            );
        } finally {
            // Restore original method
            window.app.checkout = originalCheckout;
        }
    }

    // Test 6: Verify configuration
    if (window.app && window.app.shopify) {
        const expectedDomain = 'painswedenstore.myshopify.com';
        test(
            'Shopify configuration',
            window.app.shopify.shopDomain === expectedDomain,
            window.app.shopify.shopDomain === expectedDomain
                ? `Shopify domain correctly set to ${expectedDomain}`
                : `Shopify domain mismatch. Expected: ${expectedDomain}, Got: ${window.app.shopify.shopDomain}`
        );
    }

    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Checkout functionality is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }

    return results;
}

// Auto-run validation when script loads
if (typeof window !== 'undefined') {
    // Wait for DOM and app to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(validateCheckout, 1000);
        });
    } else {
        setTimeout(validateCheckout, 1000);
    }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = validateCheckout;
}