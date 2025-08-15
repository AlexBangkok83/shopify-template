# Multi-Brand E-commerce Template System

A comprehensive, scalable template system for creating high-converting e-commerce websites with Shopify integration. Perfect for rapid deployment of product-focused stores across multiple brands and markets.

## 🚀 Features

### ✨ **Complete Template System**
- **12 Static Pages**: Home, Product, Policies (Terms, Privacy, Delivery, Refund), Contact, Track Order, About, FAQ, Reviews
- **Modular Components**: Header, Footer, Trust Signals, Reviews, Cart Sidebar
- **Variable Replacement**: Comprehensive templating system with 100+ configurable variables
- **Theme Support**: Pre-built themes (Feminine/elegant styling included)
- **Multi-Market Ready**: Support for different currencies, languages, and markets

### 🛍️ **E-commerce Features**
- **Shopify Integration**: Full Storefront API integration for products and checkout
- **Shopping Cart**: Persistent cart with localStorage and Shopify sync
- **Product Variants**: Support for multiple product packages and pricing
- **Trust Signals**: Money-back guarantees, security badges, customer testimonials
- **Conversion Optimization**: Urgency banners, countdown timers, social proof

### 🎨 **Design & UX**
- **Feminine Theme**: Elegant pink/purple gradients with modern styling
- **Mobile-First**: Fully responsive design optimized for all devices
- **CSS Framework**: Custom framework with variables and utility classes
- **Smooth Animations**: Scroll effects, hover animations, loading states
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

### 🔧 **Developer Experience**
- **One-Command Generation**: Generate complete sites from configuration files
- **Vercel-Optimized**: Ready for instant deployment with optimized builds
- **GitHub Integration**: Easy version control and collaboration
- **Environment Variables**: Secure configuration management
- **Component System**: Reusable, modular components for easy customization

## 📁 Project Structure

```
shopify-template/
├── templates/                 # Template files
│   ├── pages/                # Page templates (home, product, etc.)
│   ├── components/           # Reusable components (header, footer, etc.)
│   ├── layouts/              # Layout templates
│   └── template-config.json  # Template configuration
├── assets/                   # Static assets
│   ├── css/                  # Stylesheets and framework
│   ├── js/                   # JavaScript modules
│   └── images/               # Images and media
├── config/                   # Configuration files
│   ├── themes/               # Theme configurations
│   ├── markets/              # Market-specific settings
│   └── products/             # Product configurations
├── scripts/                  # Build and generation scripts
├── build/                    # Generated site output
└── example-site-config.json  # Example configuration
```

## 🚀 Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/your-username/multi-brand-ecommerce-template.git
cd multi-brand-ecommerce-template
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Configure Your Site**
Copy and customize the example configuration:
```bash
cp example-site-config.json my-site-config.json
```

Edit `my-site-config.json` with your:
- Site name, domain, and branding
- Product information and pricing
- Shopify store credentials
- Theme and styling preferences
- Market-specific settings

### 4. **Generate Your Site**
```bash
npm run generate my-site-config.json
```

### 5. **Preview Locally**
```bash
npm run dev
```

### 6. **Deploy to Vercel**
```bash
npm run deploy
```

## 📋 Configuration Guide

### **Site Variables**
```json
{
  "SITE_NAME": "Your Brand Name",
  "DOMAIN": "https://yourdomain.com",
  "CURRENCY": "USD",
  "LANGUAGE": "en",
  "COUNTRY": "US"
}
```

### **Product Configuration**
```json
{
  "PRODUCT_NAME": "Amazing Product",
  "PRODUCT_DESCRIPTION": "Detailed product description...",
  "PRODUCT_PRICE": "49.99",
  "PRODUCT_ORIGINAL_PRICE": "89.99",
  "PRODUCT_FEATURES": ["Feature 1", "Feature 2", "Feature 3"],
  "PRODUCT_VARIANTS": [
    {
      "id": "variant-1",
      "name": "Single Pack",
      "price": "49.99",
      "popular": true
    }
  ]
}
```

### **Shopify Integration**
```json
{
  "SHOPIFY_DOMAIN": "your-store.myshopify.com",
  "STOREFRONT_TOKEN": "your-storefront-access-token",
  "SHOPIFY_PRODUCT_ID": "gid://shopify/Product/123456789"
}
```

### **Theme Customization**
```json
{
  "theme": "feminine",
  "PRIMARY_COLOR": "#FF69B4",
  "SECONDARY_COLOR": "#FFB6C1",
  "FONT_FAMILY": "Poppins, Arial, sans-serif"
}
```

## 🎨 Available Themes

### **Feminine Theme** (Default)
- **Colors**: Pink gradients (#FF69B4, #FFB6C1, #FF1493)
- **Typography**: Playfair Display headings, Poppins body text
- **Style**: Elegant, soft, conversion-focused
- **Perfect for**: Beauty, wellness, fashion, lifestyle products

### **Custom Themes**
Create your own theme by:
1. Adding a new theme file in `config/themes/`
2. Defining color palette, typography, and spacing
3. Setting theme name in your site configuration

## 🛍️ E-commerce Features

### **Shopping Cart**
- Persistent cart storage with localStorage
- Real-time updates and quantity management
- Shopify Storefront API integration
- Secure checkout redirect to Shopify

### **Product Display**
- High-resolution image galleries with zoom
- Multiple product variants and pricing tiers
- Customer reviews and ratings
- Trust signals and guarantees

### **Conversion Optimization**
- Urgency indicators ("Only X left!")
- Countdown timers for limited offers
- Social proof (customer count, reviews)
- Money-back guarantee badges

## 📱 Mobile Optimization

- **Mobile-First Design**: Optimized for touch interfaces
- **Responsive Grid**: Adapts to all screen sizes
- **Touch-Friendly**: Large buttons and easy navigation
- **Fast Loading**: Optimized images and minimal code
- **App-Like Experience**: Smooth animations and interactions

## 🔧 Customization Guide

### **Adding New Components**
1. Create component file in `templates/components/`
2. Use template variables and Handlebars syntax
3. Include component in pages with `{{> component-name}}`

### **Custom Pages**
1. Create page template in `templates/pages/`
2. Configure page in `template-config.json`
3. Add routing in `vercel.json` if needed

### **Styling Customization**
1. Modify CSS variables in theme configuration
2. Add custom styles in `assets/css/`
3. Use the existing CSS framework classes

### **JavaScript Functionality**
1. Extend existing classes in `assets/js/`
2. Add new interaction methods
3. Integrate with Shopify APIs

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run deploy
```

### **Netlify**
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`

### **Traditional Hosting**
```bash
# Generate static files
npm run build

# Upload build/ directory to your hosting provider
```

## 🔒 Security Features

- **SSL/HTTPS**: Enforced secure connections
- **Content Security Policy**: XSS protection
- **Secure Headers**: X-Frame-Options, X-Content-Type-Options
- **Input Validation**: Form data sanitization
- **API Security**: Storefront tokens only (read-only access)

## 📊 Analytics Integration

### **Google Analytics 4**
```json
{
  "GA_ID": "G-XXXXXXXXXX"
}
```

### **Facebook Pixel**
```json
{
  "FB_PIXEL_ID": "123456789012345"
}
```

### **TikTok Pixel**
```json
{
  "TIKTOK_PIXEL_ID": "C4ABC123DEF456GHI789JKL012MNO345"
}
```

## 🛠️ Advanced Usage

### **Multi-Brand Setup**
1. Create separate configuration files for each brand
2. Generate sites to different output directories
3. Deploy each brand to separate domains/subdomains

### **A/B Testing**
1. Create multiple theme variants
2. Use different configurations for test groups
3. Deploy to different staging URLs

### **International Markets**
1. Configure market-specific settings in `config/markets/`
2. Set currency, language, and shipping options
3. Generate localized versions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🎯 Perfect For

- **Beauty & Cosmetics**: Skincare, makeup, wellness products
- **Fashion & Accessories**: Clothing, jewelry, lifestyle items  
- **Health & Fitness**: Supplements, equipment, programs
- **Home & Garden**: Decor, tools, improvement products
- **Digital Products**: Courses, ebooks, software
- **Subscription Boxes**: Curated products and experiences

---

**Ready to create your high-converting e-commerce site?** 
Start with `npm run generate:example` and customize from there! 🚀