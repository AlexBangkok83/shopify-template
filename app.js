class MultiStoreApp {
    constructor() {
        this.shopify = null;
        this.cart = {
            id: null,
            items: [],
            total: 0
        };
        this.currentBrand = null;
        this.products = [];
        this.isCheckingOut = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadConfiguration();
            this.setupEventListeners();
            await this.loadProducts();
            this.loadCartFromStorage();
        } catch (error) {
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    async loadConfiguration() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error('Configuration file not found');
            }
            
            const config = await response.json();
            this.currentBrand = config.defaultBrand || Object.keys(config.brands)[0];
            
            const brandConfig = config.brands[this.currentBrand];
            if (!brandConfig) {
                throw new Error(`Brand configuration not found: ${this.currentBrand}`);
            }

            this.shopify = new ShopifyStorefront({
                shopDomain: brandConfig.shopDomain,
                storefrontAccessToken: brandConfig.storefrontAccessToken,
                apiVersion: brandConfig.apiVersion
            });

            document.getElementById('brand-logo').textContent = brandConfig.name;
            document.title = brandConfig.name;

        } catch (error) {
            console.warn('Using default configuration:', error.message);
            this.setupDefaultConfig();
        }
    }

    setupDefaultConfig() {
        const defaultConfig = {
            shopDomain: 'painswedenstore.myshopify.com',
            storefrontAccessToken: '6302d10a27c4fce855c48d96b39ec7f0',
            apiVersion: '2024-01'
        };

        this.shopify = new ShopifyStorefront(defaultConfig);
        
        document.getElementById('brand-logo').textContent = 'Pain Sweden Store';
        document.title = 'Pain Sweden Store';
        
        console.warn('Using fallback configuration - config.json not loaded properly');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const productId = e.target.dataset.productId;
                const variantId = e.target.dataset.variantId;
                this.addToCart(productId, variantId);
            }

            if (e.target.classList.contains('quantity-btn')) {
                const action = e.target.dataset.action;
                const lineId = e.target.dataset.lineId;
                this.updateQuantity(lineId, action);
            }

            if (e.target.classList.contains('remove-item')) {
                const lineId = e.target.dataset.lineId;
                this.removeFromCart(lineId);
            }
        });
        
        // Add keyboard navigation for checkout
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'checkout-btn' && !e.target.disabled) {
                this.checkout();
            }
        });
    }

    async loadProducts() {
        try {
            this.showLoading(true);
            const data = await this.shopify.getProducts(20);
            
            this.products = data.products.edges.map(edge => edge.node);
            this.renderProducts();
            this.showLoading(false);
            
        } catch (error) {
            this.showError('Failed to load products: ' + error.message);
            this.showLoading(false);
        }
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        
        if (this.products.length === 0) {
            container.innerHTML = '<p>No products found.</p>';
            return;
        }

        container.innerHTML = this.products.map(product => {
            const variant = product.variants.edges[0]?.node;
            const image = product.featuredImage?.url || '/placeholder.jpg';
            const price = variant ? parseFloat(variant.priceV2.amount) : 0;
            const available = variant ? this.shopify.isVariantAvailable(variant) : false;

            return `
                <div class="product-card">
                    <img src="${image}" alt="${product.title}" class="product-image" loading="lazy">
                    <div class="product-info">
                        <h3 class="product-title">${product.title}</h3>
                        <div class="product-price">$${price.toFixed(2)}</div>
                        <button 
                            class="add-to-cart" 
                            data-product-id="${product.id}"
                            data-variant-id="${variant?.id || ''}"
                            ${!available ? 'disabled' : ''}
                        >
                            ${available ? 'Add to Cart' : 'Sold Out'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async addToCart(productId, variantId) {
        if (!variantId) {
            this.showError('Product variant not found');
            return;
        }

        try {
            let result;
            
            if (this.cart.id) {
                result = await this.shopify.addToCart(this.cart.id, variantId, 1);
            } else {
                result = await this.shopify.createCart(variantId, 1);
            }

            if (result.cartCreate) {
                this.cart.id = result.cartCreate.cart.id;
                this.updateCartFromResponse(result.cartCreate.cart);
            } else if (result.cartLinesAdd) {
                this.updateCartFromResponse(result.cartLinesAdd.cart);
            }

            this.saveCartToStorage();
            this.renderCart();
            this.updateCartCount();
            
            // Show brief success feedback
            this.showSuccess('Item added to cart!');

        } catch (error) {
            this.showError('Failed to add item to cart: ' + error.message);
        }
    }

    async updateQuantity(lineId, action) {
        const lineIndex = this.cart.items.findIndex(item => item.id === lineId);
        if (lineIndex === -1) return;

        const currentQuantity = this.cart.items[lineIndex].quantity;
        let newQuantity = currentQuantity;

        if (action === 'increase') {
            newQuantity = currentQuantity + 1;
        } else if (action === 'decrease') {
            newQuantity = Math.max(0, currentQuantity - 1);
        }

        if (newQuantity === 0) {
            await this.removeFromCart(lineId);
            return;
        }

        try {
            const result = await this.shopify.updateCartLine(this.cart.id, lineId, newQuantity);
            this.updateCartFromResponse(result.cartLinesUpdate.cart);
            this.saveCartToStorage();
            this.renderCart();
            this.updateCartCount();

        } catch (error) {
            this.showError('Failed to update cart: ' + error.message);
        }
    }

    async removeFromCart(lineId) {
        try {
            const result = await this.shopify.removeFromCart(this.cart.id, [lineId]);
            this.updateCartFromResponse(result.cartLinesRemove.cart);
            this.saveCartToStorage();
            this.renderCart();
            this.updateCartCount();

        } catch (error) {
            this.showError('Failed to remove item from cart: ' + error.message);
        }
    }

    updateCartFromResponse(cartData) {
        this.cart.items = cartData.lines.edges.map(edge => {
            const merchandise = edge.node.merchandise;
            return {
                id: edge.node.id,
                quantity: edge.node.quantity,
                variant: {
                    ...merchandise,
                    // Ensure inventory fields are preserved
                    availableForSale: merchandise.availableForSale,
                    quantityAvailable: merchandise.quantityAvailable,
                    currentlyNotInStock: merchandise.currentlyNotInStock,
                    inventoryManagement: merchandise.inventoryManagement,
                    inventoryPolicy: merchandise.inventoryPolicy
                },
                price: parseFloat(merchandise.priceV2.amount)
            };
        });

        this.cart.total = cartData.estimatedCost ? 
            parseFloat(cartData.estimatedCost.totalAmount.amount) : 0;
        
        this.cart.checkoutUrl = cartData.checkoutUrl;
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        
        if (this.cart.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart-message">
                    <h4>Your cart is empty</h4>
                    <p>Add some items to get started!</p>
                </div>
            `;
            document.getElementById('cart-total').textContent = 'Total: $0.00';
            this.updateCheckoutButton();
            return;
        }

        cartItems.innerHTML = this.cart.items.map(item => `
            <div class="cart-item">
                <img src="${item.variant.product.featuredImage?.url || '/placeholder.jpg'}" 
                     alt="${item.variant.product.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.variant.product.title}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-action="decrease" data-line-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-line-id="${item.id}">+</button>
                        <button class="remove-item" data-line-id="${item.id}">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('cart-total').textContent = `Total: $${this.cart.total.toFixed(2)}`;
        this.updateCheckoutButton();
    }

    updateCartCount() {
        const count = this.cart.items.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    }

    saveCartToStorage() {
        localStorage.setItem('shopify-cart', JSON.stringify({
            id: this.cart.id,
            items: this.cart.items,
            total: this.cart.total,
            checkoutUrl: this.cart.checkoutUrl
        }));
    }

    loadCartFromStorage() {
        const saved = localStorage.getItem('shopify-cart');
        if (saved) {
            try {
                const cartData = JSON.parse(saved);
                this.cart = cartData;
                this.renderCart();
                this.updateCartCount();
            } catch (error) {
                console.warn('Failed to load cart from storage:', error);
                // Clear corrupted cart data
                localStorage.removeItem('shopify-cart');
            }
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('products-container');
        
        loading.style.display = show ? 'block' : 'none';
        container.style.display = show ? 'none' : 'grid';
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
        
        // Add click to dismiss
        errorDiv.onclick = () => {
            errorDiv.style.display = 'none';
        };
    }

    async validateCartWithRefresh() {
        // Refresh cart data from Shopify to get latest inventory info
        if (this.cart.id) {
            try {
                const cartData = await this.shopify.getCart(this.cart.id);
                if (cartData.cart) {
                    this.updateCartFromResponse(cartData.cart);
                    this.saveCartToStorage();
                }
            } catch (error) {
                console.warn('Failed to refresh cart data:', error);
                // Continue with cached data
            }
        }
        
        return this.validateCart();
    }
    
    validateCart() {
        const validationMessages = [];
        
        if (this.cart.items.length === 0) {
            validationMessages.push('Your cart is empty. Add some items to proceed.');
        }
        
        // Check for invalid items - only consider items truly unavailable
        const invalidItems = this.cart.items.filter(item => {
            if (!item.variant) return true;
            return !this.shopify.isVariantAvailable(item.variant);
        });
        
        if (invalidItems.length > 0) {
            const itemNames = invalidItems.map(item => item.variant?.product?.title || 'Unknown item');
            validationMessages.push(`These items are no longer available: ${itemNames.join(', ')}`);
        }
        
        // Check for minimum order requirements (if any)
        if (this.cart.total < 0.01) {
            validationMessages.push('Cart total must be greater than $0.00');
        }
        
        return validationMessages;
    }
    
    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        const validationMessagesDiv = document.getElementById('cart-validation-messages');
        
        // Use cached validation for immediate UI update
        const validationMessages = this.validateCart();
        
        // Clear previous validation messages
        validationMessagesDiv.innerHTML = '';
        
        if (validationMessages.length > 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.setAttribute('aria-disabled', 'true');
            checkoutBtn.setAttribute('aria-describedby', 'cart-validation-messages');
            checkoutBtn.querySelector('.checkout-btn-text').textContent = 'Cannot Checkout';
            
            // Show validation messages
            validationMessagesDiv.innerHTML = validationMessages.map((msg, index) => 
                `<div class="cart-validation-message" id="validation-msg-${index}">${msg}</div>`
            ).join('');
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.setAttribute('aria-disabled', 'false');
            checkoutBtn.removeAttribute('aria-describedby');
            checkoutBtn.querySelector('.checkout-btn-text').textContent = 'Proceed to Checkout';
        }
    }
    
    setCheckoutLoading(loading) {
        const checkoutBtn = document.getElementById('checkout-btn');
        const spinner = checkoutBtn.querySelector('.spinner');
        const text = checkoutBtn.querySelector('.checkout-btn-text');
        
        if (loading) {
            checkoutBtn.classList.add('loading');
            checkoutBtn.disabled = true;
            checkoutBtn.setAttribute('aria-disabled', 'true');
            checkoutBtn.setAttribute('aria-busy', 'true');
            spinner.style.display = 'block';
            text.textContent = 'Redirecting...';
        } else {
            checkoutBtn.classList.remove('loading');
            checkoutBtn.setAttribute('aria-busy', 'false');
            spinner.style.display = 'none';
            this.updateCheckoutButton(); // Reset to proper state
        }
    }
    
    showSuccess(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.className = 'success';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.className = 'error'; // Reset to error class
        }, 3000);
    }
    
    async checkout() {
        if (this.isCheckingOut) {
            return; // Prevent multiple checkout attempts
        }
        
        // Check for checkout URL first
        if (!this.cart.checkoutUrl) {
            this.showError('Checkout URL is not available. Please refresh your cart and try again.');
            return;
        }
        
        const validationMessages = await this.validateCartWithRefresh();
        if (validationMessages.length > 0) {
            this.showError(validationMessages.join(' '));
            return;
        }
        
        try {
            this.isCheckingOut = true;
            this.setCheckoutLoading(true);
            
            // Add a small delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Validate cart one more time before redirect
            if (this.cart.items.length === 0) {
                throw new Error('Cart became empty during checkout');
            }
            
            // Show success message briefly before redirect
            this.showSuccess('Redirecting to secure checkout...');
            
            // Save cart state before redirect
            this.saveCartToStorage();
            
            // Small delay to show success message
            setTimeout(() => {
                window.location.href = this.cart.checkoutUrl;
            }, 800);
            
        } catch (error) {
            this.isCheckingOut = false;
            this.setCheckoutLoading(false);
            this.showError('Checkout failed: ' + error.message);
        }
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.add('open');
    overlay.classList.add('show');
}

function closeCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

function checkout() {
    if (window.app) {
        window.app.checkout();
    } else {
        console.error('App not initialized');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MultiStoreApp();
});