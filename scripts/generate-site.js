#!/usr/bin/env node

/**
 * Site Generator Script
 * Generates complete websites from templates with variable replacement
 */

const fs = require('fs').promises;
const path = require('path');

class SiteGenerator {
    constructor(config = {}) {
        this.config = config;
        this.templateDir = path.join(__dirname, '../templates');
        this.outputDir = config.outputDir || path.join(__dirname, '../build');
        this.variables = {};
    }

    /**
     * Generate complete site
     */
    async generateSite(configPath) {
        try {
            console.log('🚀 Starting site generation...');
            
            // Load configuration
            await this.loadConfiguration(configPath);
            
            // Create output directory
            await this.ensureOutputDirectory();
            
            // Copy assets
            await this.copyAssets();
            
            // Generate pages
            await this.generatePages();
            
            // Generate configuration files
            await this.generateConfigFiles();
            
            console.log('✅ Site generation completed!');
            console.log(`📁 Generated site available at: ${this.outputDir}`);
            
        } catch (error) {
            console.error('❌ Site generation failed:', error);
            process.exit(1);
        }
    }

    /**
     * Load and merge all configuration files
     */
    async loadConfiguration(configPath) {
        console.log('📋 Loading configuration...');
        
        try {
            // Load main config
            const mainConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
            
            // Load template config
            const templateConfig = JSON.parse(
                await fs.readFile(path.join(this.templateDir, 'template-config.json'), 'utf8')
            );
            
            // Load theme config
            const themeConfig = JSON.parse(
                await fs.readFile(
                    path.join(__dirname, '../config/themes', `${mainConfig.theme || 'feminine'}.json`), 
                    'utf8'
                )
            );
            
            // Load market config
            const marketConfig = JSON.parse(
                await fs.readFile(
                    path.join(__dirname, '../config/markets', `${mainConfig.market || 'default'}.json`), 
                    'utf8'
                )
            );
            
            // Load product config
            const productConfig = JSON.parse(
                await fs.readFile(
                    path.join(__dirname, '../config/products', `${mainConfig.product || 'default-product'}.json`), 
                    'utf8'
                )
            );

            // Merge all configurations
            this.variables = {
                ...templateConfig.variables.site,
                ...templateConfig.variables.content,
                ...templateConfig.variables.theme,
                ...themeConfig.variables,
                ...marketConfig,
                ...productConfig,
                ...mainConfig.variables
            };

            // Set dynamic variables
            this.variables.CURRENT_DATE = new Date().toLocaleDateString();
            this.variables.CURRENT_YEAR = new Date().getFullYear();

            // Store component settings
            this.componentSettings = templateConfig.components;
            this.pageSettings = templateConfig.pages;

            console.log('✅ Configuration loaded successfully');
            
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDirectory() {
        try {
            await fs.access(this.outputDir);
            console.log('📁 Output directory exists');
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log('📁 Created output directory');
        }
    }

    /**
     * Copy static assets
     */
    async copyAssets() {
        console.log('📄 Copying assets...');
        
        const assetsDir = path.join(__dirname, '../assets');
        const outputAssetsDir = path.join(this.outputDir, 'assets');
        
        await this.copyDirectory(assetsDir, outputAssetsDir);
        
        // Process CSS files to replace variables
        await this.processCSSFiles(outputAssetsDir);
        
        console.log('✅ Assets copied successfully');
    }

    /**
     * Process CSS files to replace variables
     */
    async processCSSFiles(assetsDir) {
        const cssDir = path.join(assetsDir, 'css');
        
        try {
            const cssFiles = await fs.readdir(cssDir);
            
            for (const file of cssFiles) {
                if (file.endsWith('.css')) {
                    const filePath = path.join(cssDir, file);
                    let content = await fs.readFile(filePath, 'utf8');
                    
                    // Replace CSS variables
                    content = this.replaceVariables(content);
                    
                    await fs.writeFile(filePath, content, 'utf8');
                }
            }
        } catch (error) {
            console.warn('Warning: Could not process CSS files:', error.message);
        }
    }

    /**
     * Generate all pages
     */
    async generatePages() {
        console.log('📝 Generating pages...');
        
        const pagesDir = path.join(this.templateDir, 'pages');
        const pageFiles = await fs.readdir(pagesDir);
        
        for (const pageFile of pageFiles) {
            if (pageFile.endsWith('.html')) {
                const pageName = path.basename(pageFile, '.html');
                
                // Check if page is enabled
                if (this.pageSettings[pageName] !== false) {
                    await this.generatePage(pageName, pageFile);
                }
            }
        }
        
        console.log('✅ Pages generated successfully');
    }

    /**
     * Generate individual page
     */
    async generatePage(pageName, pageFile) {
        console.log(`  📄 Generating ${pageName} page...`);
        
        try {
            const pagePath = path.join(this.templateDir, 'pages', pageFile);
            let content = await fs.readFile(pagePath, 'utf8');
            
            // Load and process components
            content = await this.processComponents(content);
            
            // Replace variables
            content = this.replaceVariables(content);
            
            // Determine output filename
            const outputFile = pageName === 'home' ? 'index.html' : `${pageName}.html`;
            const outputPath = path.join(this.outputDir, outputFile);
            
            await fs.writeFile(outputPath, content, 'utf8');
            
        } catch (error) {
            console.error(`❌ Failed to generate ${pageName} page:`, error.message);
        }
    }

    /**
     * Process component includes
     */
    async processComponents(content) {
        const componentRegex = /\{\{>\s*([^}]+)\}\}/g;
        const matches = [...content.matchAll(componentRegex)];
        
        for (const match of matches) {
            const componentName = match[1].trim();
            
            // Check if component is enabled
            if (this.componentSettings[componentName] !== false) {
                try {
                    const componentPath = path.join(this.templateDir, 'components', `${componentName}.html`);
                    let componentContent = await fs.readFile(componentPath, 'utf8');
                    
                    // Recursively process nested components
                    componentContent = await this.processComponents(componentContent);
                    
                    content = content.replace(match[0], componentContent);
                } catch (error) {
                    console.warn(`Warning: Component ${componentName} not found`);
                    content = content.replace(match[0], `<!-- Component ${componentName} not found -->`);
                }
            } else {
                // Component is disabled, remove it
                content = content.replace(match[0], '');
            }
        }
        
        return content;
    }

    /**
     * Replace template variables
     */
    replaceVariables(content) {
        // Replace simple variables
        content = content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const value = this.getVariableValue(variable.trim());
            return value !== undefined ? value : match;
        });

        // Process Handlebars-style conditionals
        content = this.processConditionals(content);
        
        // Process Handlebars-style loops
        content = this.processLoops(content);
        
        return content;
    }

    /**
     * Get variable value with dot notation support
     */
    getVariableValue(path) {
        const keys = path.split('.');
        let value = this.variables;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    /**
     * Process conditional blocks
     */
    processConditionals(content) {
        // Handle {{#if}} blocks
        content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
            const value = this.getVariableValue(condition.trim());
            return value ? this.replaceVariables(block) : '';
        });

        return content;
    }

    /**
     * Process loop blocks
     */
    processLoops(content) {
        // Handle {{#each}} blocks
        content = content.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, block) => {
            const array = this.getVariableValue(arrayPath.trim());
            if (!Array.isArray(array)) return '';
            
            return array.map(item => {
                let itemBlock = block;
                // Replace {{this}} with current item
                itemBlock = itemBlock.replace(/\{\{this\}\}/g, JSON.stringify(item));
                // Replace {{this.property}} with item properties
                itemBlock = itemBlock.replace(/\{\{this\.([^}]+)\}\}/g, (m, prop) => {
                    return item[prop] || '';
                });
                return this.replaceVariables(itemBlock);
            }).join('');
        });

        return content;
    }

    /**
     * Generate configuration files
     */
    async generateConfigFiles() {
        console.log('⚙️  Generating configuration files...');
        
        // Generate JavaScript config file
        const jsConfig = `
// Site Configuration
window.siteConfig = ${JSON.stringify({
            theme: this.config.theme || 'feminine',
            market: this.config.market || 'default',
            product: this.config.product || 'default-product'
        }, null, 2)};

// Shopify Configuration
window.shopifyConfig = ${JSON.stringify({
            shopDomain: this.variables.SHOPIFY_DOMAIN,
            storefrontToken: this.variables.STOREFRONT_TOKEN,
            apiVersion: this.variables.SHOPIFY_API_VERSION || '2024-01'
        }, null, 2)};

// Analytics Configuration
${this.variables.GA_ID ? `window.GA_ID = '${this.variables.GA_ID}';` : ''}
${this.variables.FB_PIXEL_ID ? `window.FB_PIXEL_ID = '${this.variables.FB_PIXEL_ID}';` : ''}
${this.variables.TIKTOK_PIXEL_ID ? `window.TIKTOK_PIXEL_ID = '${this.variables.TIKTOK_PIXEL_ID}';` : ''}
        `.trim();
        
        await fs.writeFile(path.join(this.outputDir, 'config.js'), jsConfig, 'utf8');
        
        // Generate .env file for deployment
        const envConfig = `
# Generated Environment Configuration
SITE_NAME="${this.variables.SITE_NAME || ''}"
DOMAIN="${this.variables.DOMAIN || ''}"
SHOPIFY_DOMAIN="${this.variables.SHOPIFY_DOMAIN || ''}"
STOREFRONT_TOKEN="${this.variables.STOREFRONT_TOKEN || ''}"
GA_ID="${this.variables.GA_ID || ''}"
FB_PIXEL_ID="${this.variables.FB_PIXEL_ID || ''}"
        `.trim();
        
        await fs.writeFile(path.join(this.outputDir, '.env'), envConfig, 'utf8');
        
        console.log('✅ Configuration files generated');
    }

    /**
     * Copy directory recursively
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }
}

// CLI usage
if (require.main === module) {
    const configPath = process.argv[2];
    
    if (!configPath) {
        console.error('❌ Usage: node generate-site.js <config.json>');
        console.error('Example: node generate-site.js ./my-site-config.json');
        process.exit(1);
    }

    const outputDir = process.argv[3] || path.join(__dirname, '../build');
    
    const generator = new SiteGenerator({ outputDir });
    generator.generateSite(configPath);
}

module.exports = SiteGenerator;