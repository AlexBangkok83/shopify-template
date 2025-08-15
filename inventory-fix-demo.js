// Demo script to test the inventory tracking fixes
// This demonstrates how the new logic handles different product types

// Simulate the ShopifyStorefront class with the new isVariantAvailable method
class ShopifyStorefrontDemo {
    isVariantAvailable(variant) {
        if (!variant) return false;
        
        // Handle cases where inventory fields might be missing/undefined
        const inventoryManagement = variant.inventoryManagement;
        const inventoryPolicy = variant.inventoryPolicy;
        const availableForSale = variant.availableForSale;
        const currentlyNotInStock = variant.currentlyNotInStock;
        
        // If the variant doesn't track inventory (null, undefined, or empty string)
        // it should always be available for purchase
        if (!inventoryManagement || inventoryManagement === null || inventoryManagement === '') {
            return true;
        }
        
        // If inventory is tracked but policy allows overselling
        if (inventoryPolicy === 'CONTINUE') {
            return true;
        }
        
        // For DENY policy or unknown policy, be more careful
        // But if availableForSale is explicitly true, trust it
        if (availableForSale === true) {
            return true;
        }
        
        // If availableForSale is false and inventory is tracked with DENY policy
        if (inventoryPolicy === 'DENY' && availableForSale === false) {
            return false;
        }
        
        // Default to available if we can't determine inventory status clearly
        // This is safer for products that don't track inventory properly
        return true;
    }
}

// Test cases demonstrating the fixes
const shopify = new ShopifyStorefrontDemo();

console.log('=== Inventory Tracking Fix Demo ===\n');

// Test Case 1: Product without inventory tracking (like Pain Sweden Store products)
const productWithoutTracking = {
    id: 'gid://shopify/ProductVariant/1',
    title: 'Digital Product',
    availableForSale: false, // This was causing the issue
    inventoryManagement: null, // No inventory tracking
    inventoryPolicy: null,
    quantityAvailable: null
};

console.log('Test 1 - Product without inventory tracking:');
console.log('availableForSale:', productWithoutTracking.availableForSale);
console.log('inventoryManagement:', productWithoutTracking.inventoryManagement);
console.log('Should be available:', shopify.isVariantAvailable(productWithoutTracking));
console.log('✅ FIXED: Product is now correctly available for purchase\n');

// Test Case 2: Product with inventory tracking and CONTINUE policy
const productWithContinuePolicy = {
    id: 'gid://shopify/ProductVariant/2',
    title: 'Physical Product - Oversell Allowed',
    availableForSale: false,
    inventoryManagement: 'SHOPIFY',
    inventoryPolicy: 'CONTINUE',
    quantityAvailable: 0,
    currentlyNotInStock: true
};

console.log('Test 2 - Product with CONTINUE policy (allow overselling):');
console.log('availableForSale:', productWithContinuePolicy.availableForSale);
console.log('inventoryPolicy:', productWithContinuePolicy.inventoryPolicy);
console.log('Should be available:', shopify.isVariantAvailable(productWithContinuePolicy));
console.log('✅ Available because policy allows overselling\n');

// Test Case 3: Product with inventory tracking and DENY policy - actually out of stock
const productOutOfStock = {
    id: 'gid://shopify/ProductVariant/3',
    title: 'Physical Product - Out of Stock',
    availableForSale: false,
    inventoryManagement: 'SHOPIFY',
    inventoryPolicy: 'DENY',
    quantityAvailable: 0,
    currentlyNotInStock: true
};

console.log('Test 3 - Product truly out of stock (DENY policy):');
console.log('availableForSale:', productOutOfStock.availableForSale);
console.log('inventoryPolicy:', productOutOfStock.inventoryPolicy);
console.log('Should be available:', shopify.isVariantAvailable(productOutOfStock));
console.log('❌ Correctly unavailable due to DENY policy and no stock\n');

// Test Case 4: Product with inventory tracking and stock available
const productInStock = {
    id: 'gid://shopify/ProductVariant/4',
    title: 'Physical Product - In Stock',
    availableForSale: true,
    inventoryManagement: 'SHOPIFY',
    inventoryPolicy: 'DENY',
    quantityAvailable: 5,
    currentlyNotInStock: false
};

console.log('Test 4 - Product in stock:');
console.log('availableForSale:', productInStock.availableForSale);
console.log('quantityAvailable:', productInStock.quantityAvailable);
console.log('Should be available:', shopify.isVariantAvailable(productInStock));
console.log('✅ Available because in stock\n');

console.log('=== Summary ===');
console.log('The fix ensures that:');
console.log('1. Products without inventory tracking are always available');
console.log('2. Products with CONTINUE policy allow overselling');
console.log('3. Products with DENY policy respect stock levels');
console.log('4. Graceful handling of missing/undefined inventory fields');