# Multi-Brand Shopify Storefront Template

A flexible HTML template system for connecting to multiple Shopify stores using the Storefront API. Perfect for managing multiple brands or international markets from a single codebase.

## Features

- 🏪 **Multi-Brand Support** - Manage multiple Shopify stores from one template
- 🛒 **Shopping Cart** - Full cart functionality with persistent storage
- 📱 **Responsive Design** - Mobile-first responsive layout
- 🌍 **Multi-Market Ready** - Support for different currencies and locales
- ⚡ **Fast Loading** - Optimized for performance
- 🎨 **Customizable Themes** - Brand-specific styling support

## Quick Start

### 1. Get Shopify Storefront Access Token

For each Shopify store you want to connect:

1. Go to your Shopify Admin Panel
2. Navigate to **Apps > Manage private apps**
3. Create a new private app or use an existing one
4. Enable **Storefront API access**
5. Set the following permissions:
   - **Products**: Read access
   - **Product listings**: Read access  
   - **Customer details**: Read access (if using customer features)
6. Copy the **Storefront access token**

### 2. Configure Your Stores

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `config.json` with your store details:
   ```json
   {
     "defaultBrand": "brand1",
     "brands": {
       "brand1": {
         "name": "Your Store Name",
         "shopDomain": "your-store.myshopify.com",
         "storefrontAccessToken": "your-storefront-access-token",
         "apiVersion": "2024-01"
       }
     }
   }
   ```

### 3. Run the Template

Since this is a client-side application, you can:

**Option 1: Simple HTTP Server**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

**Option 2: Live Server (VS Code)**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

**Option 3: Deploy to Netlify/Vercel**
- Just drag and drop the folder to deploy instantly

### 4. Test the Integration

1. Open your browser to `http://localhost:8000`
2. You should see products loading from your Shopify store
3. Test adding items to cart and checkout functionality

## Configuration Options

### Brand Configuration

Each brand in `config.json` supports:

```json
{
  "name": "Brand Display Name",
  "shopDomain": "store.myshopify.com",
  "storefrontAccessToken": "token",
  "apiVersion": "2024-01",
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#28a745",
    "fontFamily": "Arial, sans-serif"
  },
  "market": "us",
  "currency": "USD",
  "locale": "en-US"
}
```

### Feature Flags

Enable/disable features in `config.json`:

```json
{
  "features": {
    "cartPersistence": true,
    "wishlist": false,
    "productReviews": true,
    "socialLogin": false,
    "giftCards": true
  }
}
```

## File Structure

```
shopify-template/
├── index.html          # Main HTML template
├── app.js              # Application logic
├── shopify-api.js      # Shopify Storefront API wrapper
├── config.json         # Multi-brand configuration
├── .env.example        # Environment variables template
├── brands/             # Brand-specific assets
├── markets/            # Market-specific configurations
├── shared/             # Shared components and utilities
└── templates/          # Additional page templates
```

## API Integration

The template uses Shopify's Storefront API v2024-01 with GraphQL. Key operations:

- **Products**: Fetch product listings with variants and images
- **Cart**: Create, update, and manage shopping carts
- **Checkout**: Redirect to Shopify checkout for payment processing

### Available Methods

```javascript
// Initialize API
const shopify = new ShopifyStorefront(config);

// Get products
const products = await shopify.getProducts(20);

// Create cart
const cart = await shopify.createCart(variantId, quantity);

// Add to cart
const updatedCart = await shopify.addToCart(cartId, variantId, quantity);

// Update quantity
const updatedCart = await shopify.updateCartLine(cartId, lineId, newQuantity);
```

## Customization

### Styling

1. Modify the CSS in `index.html` for basic styling changes
2. Create brand-specific stylesheets in `/brands/[brand-name]/styles/`
3. Override theme colors in the brand configuration

### Adding New Features

1. Extend the `MultiStoreApp` class in `app.js`
2. Add new GraphQL queries to `shopify-api.js`
3. Update the HTML template as needed

### Multi-Language Support

1. Add locale-specific content in `/markets/[country]/`
2. Update the configuration with appropriate locale settings
3. Implement translation logic in `app.js`

## Troubleshooting

### Common Issues

**Products not loading:**
- Check your Storefront access token
- Verify the shop domain is correct
- Ensure Storefront API is enabled for your app

**CORS errors:**
- Use a local server instead of opening HTML directly
- Check that your domain is whitelisted in Shopify settings

**Cart not working:**
- Verify product variants exist and are available
- Check browser console for API errors
- Ensure cart persistence is enabled in localStorage

### Development Tips

1. Use browser dev tools to monitor API requests
2. Check the Network tab for failed requests
3. Console errors will show GraphQL query issues
4. Test with a simple product first

## Security Notes

- Never expose your Admin API keys
- Only use Storefront API tokens in client-side code
- Storefront tokens have limited, read-only permissions
- Always validate data on the server side for production use

## License

MIT License - Feel free to use this template for your projects!

## Support

For issues related to:
- **Shopify API**: Check [Shopify's documentation](https://shopify.dev/api/storefront)
- **Template bugs**: Create an issue in this repository
- **Customization help**: Review the code comments and examples