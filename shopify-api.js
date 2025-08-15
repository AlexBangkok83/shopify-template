class ShopifyStorefront {
    constructor(config) {
        this.shopDomain = config.shopDomain;
        this.storefrontAccessToken = config.storefrontAccessToken;
        this.apiVersion = config.apiVersion || '2024-01';
        this.endpoint = `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`;
    }

    async query(query, variables = {}) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken,
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(`GraphQL error: ${data.errors.map(e => e.message).join(', ')}`);
            }

            return data.data;
        } catch (error) {
            console.error('Shopify API Error:', error);
            throw error;
        }
    }

    async getProducts(first = 20, after = null) {
        const query = `
            query getProducts($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            title
                            description
                            handle
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
                        cursor
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                    }
                }
            }
        `;

        return await this.query(query, { first, after });
    }

    async getProduct(handle) {
        const query = `
            query getProduct($handle: String!) {
                productByHandle(handle: $handle) {
                    id
                    title
                    description
                    handle
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
                                quantityAvailable
                                currentlyNotInStock
                                inventoryManagement
                                inventoryPolicy
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
        `;

        return await this.query(query, { handle });
    }

    async createCart(variantId, quantity = 1) {
        const query = `
            mutation cartCreate($input: CartInput!) {
                cartCreate(input: $input) {
                    cart {
                        id
                        createdAt
                        updatedAt
                        lines(first: 10) {
                            edges {
                                node {
                                    id
                                    quantity
                                    merchandise {
                                        ... on ProductVariant {
                                            id
                                            title
                                            availableForSale
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        estimatedCost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                            subtotalAmount {
                                amount
                                currencyCode
                            }
                            totalTaxAmount {
                                amount
                                currencyCode
                            }
                            totalDutyAmount {
                                amount
                                currencyCode
                            }
                        }
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const input = {
            lines: [{
                quantity,
                merchandiseId: variantId
            }]
        };

        return await this.query(query, { input });
    }

    async addToCart(cartId, variantId, quantity = 1) {
        const query = `
            mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
                cartLinesAdd(cartId: $cartId, lines: $lines) {
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
                                            availableForSale
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        estimatedCost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const lines = [{
            quantity,
            merchandiseId: variantId
        }];

        return await this.query(query, { cartId, lines });
    }

    async updateCartLine(cartId, lineId, quantity) {
        const query = `
            mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
                cartLinesUpdate(cartId: $cartId, lines: $lines) {
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
                                            availableForSale
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        estimatedCost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const lines = [{
            id: lineId,
            quantity
        }];

        return await this.query(query, { cartId, lines });
    }

    async removeFromCart(cartId, lineIds) {
        const query = `
            mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
                cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
                                            availableForSale
                                            priceV2 {
                                                amount
                                                currencyCode
                                            }
                                            product {
                                                title
                                                featuredImage {
                                                    url
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        estimatedCost {
                            totalAmount {
                                amount
                                currencyCode
                            }
                        }
                        checkoutUrl
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        return await this.query(query, { cartId, lineIds });
    }

    async getCart(cartId) {
        const query = `
            query getCart($cartId: ID!) {
                cart(id: $cartId) {
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
                                        availableForSale
                                        quantityAvailable
                                        currentlyNotInStock
                                        inventoryManagement
                                        inventoryPolicy
                                        priceV2 {
                                            amount
                                            currencyCode
                                        }
                                        product {
                                            title
                                            featuredImage {
                                                url
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    estimatedCost {
                        totalAmount {
                            amount
                            currencyCode
                        }
                    }
                    checkoutUrl
                }
            }
        `;

        return await this.query(query, { cartId });
    }

    // Helper method to determine if a variant is available for purchase
    isVariantAvailable(variant) {
        if (!variant) return false;
        
        // For Storefront API, we have limited inventory information
        // Since your store doesn't track inventory, we'll be more permissive
        
        // If availableForSale is explicitly false, respect that
        if (variant.availableForSale === false) {
            return false;
        }
        
        // If availableForSale is true or undefined/null, allow purchase
        // This handles products without inventory tracking gracefully
        return true;
    }
}