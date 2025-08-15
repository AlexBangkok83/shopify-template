/**
 * Shopify Integration
 * Handles all Shopify Storefront API interactions
 */

class ShopifyIntegration {
    constructor(config = {}) {
        this.shopDomain = config.shopDomain || window.SHOPIFY_DOMAIN;
        this.storefrontToken = config.storefrontToken || window.STOREFRONT_TOKEN;
        this.apiVersion = config.apiVersion || '2024-01';
        this.endpoint = `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`;
        
        this.cart = JSON.parse(localStorage.getItem('shopify-cart')) || {
            id: null,
            lines: [],
            totalQuantity: 0,
            cost: { totalAmount: { amount: '0', currencyCode: 'USD' } },
            checkoutUrl: null
        };
        
        this.init();
    }

    /**
     * Initialize Shopify integration
     */
    init() {
        this.updateCartUI();
        this.bindEvents();
    }

    /**
     * Make GraphQL request to Shopify
     */
    async graphQL(query, variables = {}) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontToken,
                },
                body: JSON.stringify({ query, variables })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                console.error('GraphQL errors:', data.errors);
                throw new Error(data.errors[0].message);
            }

            return data.data;
        } catch (error) {
            console.error('Shopify API error:', error);
            throw error;
        }
    }

    /**
     * Get products
     */
    async getProducts(first = 10) {
        const query = `
            query getProducts($first: Int!) {
                products(first: $first) {
                    edges {
                        node {
                            id
                            title
                            handle
                            description
                            featuredImage {
                                url
                                altText
                            }
                            images(first: 5) {
                                edges {
                                    node {
                                        url
                                        altText
                                    }
                                }
                            }
                            variants(first: 10) {
                                edges {
                                    node {
                                        id
                                        title
                                        availableForSale
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                        compareAtPriceV2 {
                                            amount
                                            currencyCode
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.graphQL(query, { first });
            return data.products.edges.map(edge => edge.node);
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    /**
     * Get product by handle
     */
    async getProduct(handle) {
        const query = `
            query getProduct($handle: String!) {
                product(handle: $handle) {
                    id
                    title
                    handle
                    description
                    descriptionHtml
                    featuredImage {
                        url
                        altText
                    }
                    images(first: 10) {
                        edges {
                            node {
                                url
                                altText
                            }
                        }
                    }
                    variants(first: 10) {
                        edges {
                            node {
                                id
                                title
                                availableForSale
                                priceV2 {
                                    amount
                                    currencyCode
                                }
                                compareAtPriceV2 {
                                    amount
                                    currencyCode
                                }
                                selectedOptions {
                                    name
                                    value
                                }
                            }
                        }
                    }
                    options {
                        id
                        name
                        values
                    }
                    tags
                    vendor
                }
            }
        `;

        try {
            const data = await this.graphQL(query, { handle });
            return data.product;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    /**
     * Create new cart
     */
    async createCart() {
        const query = `
            mutation cartCreate($input: CartInput!) {
                cartCreate(input: $input) {
                    cart {
                        id
                        lines(first: 10) {
                            edges {
                                node {
                                    id
                                    quantity
                                    merchandise {
                                        ... on ProductVariant {
                                            id
                                            title
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                    altText
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        cost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                            subtotalAmount {
                                amount
                                currencyCode
                            }
                        }
                        totalQuantity
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        try {
            const data = await this.graphQL(query, { input: {} });
            
            if (data.cartCreate.userErrors.length > 0) {
                throw new Error(data.cartCreate.userErrors[0].message);
            }

            this.cart = data.cartCreate.cart;
            this.saveCart();
            return this.cart;
        } catch (error) {
            console.error('Error creating cart:', error);
            throw error;
        }
    }

    /**
     * Add item to cart
     */
    async addToCart(variantId, quantity = 1) {
        try {
            // Create cart if it doesn't exist
            if (!this.cart.id) {
                await this.createCart();
            }

            const query = `
                mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
                    cartLinesAdd(cartId: $cartId, lines: $lines) {
                        cart {
                            id
                            lines(first: 50) {
                                edges {
                                    node {
                                        id
                                        quantity
                                        merchandise {
                                            ... on ProductVariant {
                                                id
                                                title
                                                priceV2 {
                                                    amount
                                                    currencyCode
                                                }
                                                product {
                                                    title
                                                    featuredImage {
                                                        url
                                                        altText
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            cost {
                                totalAmount {
                                    amount
                                    currencyCode
                                }
                                subtotalAmount {
                                    amount
                                    currencyCode
                                }
                            }
                            totalQuantity
                            checkoutUrl
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            const variables = {
                cartId: this.cart.id,
                lines: [{
                    merchandiseId: variantId,
                    quantity: quantity
                }]
            };

            const data = await this.graphQL(query, variables);
            
            if (data.cartLinesAdd.userErrors.length > 0) {
                throw new Error(data.cartLinesAdd.userErrors[0].message);
            }

            this.cart = data.cartLinesAdd.cart;
            this.saveCart();
            this.updateCartUI();
            this.showCartNotification('Item added to cart!');
            
            return this.cart;
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showCartNotification('Error adding item to cart', 'error');
            throw error;
        }
    }

    /**
     * Update cart line quantity
     */
    async updateCartLine(lineId, quantity) {
        const query = `
            mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
                cartLinesUpdate(cartId: $cartId, lines: $lines) {
                    cart {
                        id
                        lines(first: 50) {
                            edges {
                                node {
                                    id
                                    quantity
                                    merchandise {
                                        ... on ProductVariant {
                                            id
                                            title
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                    altText
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        cost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        totalQuantity
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        try {
            const data = await this.graphQL(query, {
                cartId: this.cart.id,
                lines: [{ id: lineId, quantity }]
            });
            
            if (data.cartLinesUpdate.userErrors.length > 0) {
                throw new Error(data.cartLinesUpdate.userErrors[0].message);
            }

            this.cart = data.cartLinesUpdate.cart;
            this.saveCart();
            this.updateCartUI();
            
            return this.cart;
        } catch (error) {
            console.error('Error updating cart:', error);
            throw error;
        }
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(lineId) {
        const query = `
            mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
                cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
                    cart {
                        id
                        lines(first: 50) {
                            edges {
                                node {
                                    id
                                    quantity
                                    merchandise {
                                        ... on ProductVariant {
                                            id
                                            title
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                    altText
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        cost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        totalQuantity
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        try {
            const data = await this.graphQL(query, {
                cartId: this.cart.id,
                lineIds: [lineId]
            });
            
            if (data.cartLinesRemove.userErrors.length > 0) {
                throw new Error(data.cartLinesRemove.userErrors[0].message);
            }

            this.cart = data.cartLinesRemove.cart;
            this.saveCart();
            this.updateCartUI();
            
            return this.cart;
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        localStorage.setItem('shopify-cart', JSON.stringify(this.cart));
    }

    /**
     * Update cart UI elements
     */
    updateCartUI() {
        // Update cart count
        const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
        cartCountElements.forEach(el => {
            el.textContent = this.cart.totalQuantity || 0;
            el.style.display = this.cart.totalQuantity > 0 ? 'flex' : 'none';
        });

        // Update cart total
        const cartTotalElements = document.querySelectorAll('#cart-total, .cart-total');
        cartTotalElements.forEach(el => {
            const amount = this.cart.cost?.totalAmount?.amount || '0';
            const currency = this.cart.cost?.totalAmount?.currencyCode || 'USD';
            el.textContent = this.formatCurrency(amount, currency);
        });

        // Update cart items
        this.renderCartItems();
    }

    /**
     * Render cart items in sidebar
     */
    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        if (!this.cart.lines || this.cart.lines.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h4>Your cart is empty</h4>
                    <p>Add some products to get started!</p>
                </div>
            `;
            return;
        }

        const itemsHTML = this.cart.lines.edges.map(edge => {
            const line = edge.node;
            const variant = line.merchandise;
            const product = variant.product;
            
            return `
                <div class="cart-item" data-line-id="${line.id}">
                    <img src="${product.featuredImage?.url || '/assets/images/placeholder.jpg'}" 
                         alt="${product.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${product.title}</h4>
                        <p class="cart-item-variant">${variant.title}</p>
                        <div class="cart-item-controls">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateCartQuantity('${line.id}', ${line.quantity - 1})">-</button>
                                <span class="quantity">${line.quantity}</span>
                                <button class="quantity-btn" onclick="updateCartQuantity('${line.id}', ${line.quantity + 1})">+</button>
                            </div>
                            <button class="remove-item" onclick="removeCartItem('${line.id}')">Remove</button>
                        </div>
                    </div>
                    <div class="cart-item-price">
                        ${this.formatCurrency(variant.priceV2.amount, variant.priceV2.currencyCode)}
                    </div>
                </div>
            `;
        }).join('');

        cartItemsContainer.innerHTML = itemsHTML;
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currencyCode) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode
        }).format(parseFloat(amount));
    }

    /**
     * Show cart notification
     */
    showCartNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: type === 'error' ? '#f44336' : '#4CAF50',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Go to checkout
     */
    checkout() {
        if (this.cart.checkoutUrl) {
            // Track checkout event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                    currency: this.cart.cost.totalAmount.currencyCode,
                    value: parseFloat(this.cart.cost.totalAmount.amount),
                    items: this.cart.lines.edges.map(edge => ({
                        item_id: edge.node.merchandise.id,
                        item_name: edge.node.merchandise.product.title,
                        quantity: edge.node.quantity,
                        price: parseFloat(edge.node.merchandise.priceV2.amount)
                    }))
                });
            }
            
            window.location.href = this.cart.checkoutUrl;
        } else {
            this.showCartNotification('No checkout URL available', 'error');
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Make methods globally available
        window.addToCart = (variantId, quantity) => this.addToCart(variantId, quantity);
        window.updateCartQuantity = (lineId, quantity) => {
            if (quantity <= 0) {
                this.removeFromCart(lineId);
            } else {
                this.updateCartLine(lineId, quantity);
            }
        };
        window.removeCartItem = (lineId) => this.removeFromCart(lineId);
        window.checkout = () => this.checkout();
    }
}

// Initialize Shopify integration
window.shopify = new ShopifyIntegration(window.shopifyConfig || {});