/**
 * Multi-Brand E-commerce Template Engine
 * Handles variable replacement and dynamic content rendering
 */

class TemplateEngine {
    constructor(config = {}) {
        this.config = config;
        this.variables = {};
        this.components = {};
        this.loadConfiguration();
    }

    /**
     * Load configuration from various sources
     */
    async loadConfiguration() {
        try {
            // Load main template config
            const templateConfig = await this.fetchJSON('/templates/template-config.json');
            
            // Load theme config
            const themeConfig = await this.fetchJSON(`/config/themes/${this.config.theme || 'feminine'}.json`);
            
            // Load market config
            const marketConfig = await this.fetchJSON(`/config/markets/${this.config.market || 'default'}.json`);
            
            // Load product config
            const productConfig = await this.fetchJSON(`/config/products/${this.config.product || 'default-product'}.json`);

            // Merge all configurations
            this.variables = {
                ...templateConfig.variables.site,
                ...templateConfig.variables.content,
                ...themeConfig.variables,
                ...marketConfig,
                ...productConfig,
                ...this.config.overrides
            };

            // Set current date
            this.variables.CURRENT_DATE = new Date().toLocaleDateString();
            this.variables.CURRENT_YEAR = new Date().getFullYear();

            // Initialize components
            this.initializeComponents();
            
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    /**
     * Fetch JSON configuration files
     */
    async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Could not load ${url}:`, error);
            return {};
        }
    }

    /**
     * Replace variables in content
     */
    replaceVariables(content) {
        if (!content) return '';
        
        // Replace template variables
        let result = content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const value = this.getVariableValue(variable.trim());
            return value !== undefined ? value : match;
        });

        // Handle Handlebars-style conditionals and loops
        result = this.processHandlebars(result);

        return result;
    }

    /**
     * Get variable value with nested property support
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
     * Process basic Handlebars-style syntax
     */
    processHandlebars(content) {
        // Handle {{#if}} blocks
        content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
            const value = this.getVariableValue(condition.trim());
            return value ? this.replaceVariables(block) : '';
        });

        // Handle {{#each}} blocks
        content = content.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, block) => {
            const array = this.getVariableValue(arrayPath.trim());
            if (!Array.isArray(array)) return '';
            
            return array.map(item => {
                let itemBlock = block;
                // Replace {{this}} with current item
                itemBlock = itemBlock.replace(/\{\{this\}\}/g, item);
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
     * Load and render component
     */
    async loadComponent(name) {
        if (this.components[name]) {
            return this.components[name];
        }

        try {
            const response = await fetch(`/templates/components/${name}.html`);
            if (!response.ok) {
                throw new Error(`Component ${name} not found`);
            }
            
            const content = await response.text();
            this.components[name] = content;
            return content;
        } catch (error) {
            console.warn(`Could not load component ${name}:`, error);
            return `<!-- Component ${name} not found -->`;
        }
    }

    /**
     * Render component with variables
     */
    async renderComponent(name, localVariables = {}) {
        const content = await this.loadComponent(name);
        
        // Temporarily merge local variables
        const originalVariables = { ...this.variables };
        this.variables = { ...this.variables, ...localVariables };
        
        const rendered = this.replaceVariables(content);
        
        // Restore original variables
        this.variables = originalVariables;
        
        return rendered;
    }

    /**
     * Initialize dynamic components on page load
     */
    initializeComponents() {
        // Auto-replace components in existing HTML
        document.addEventListener('DOMContentLoaded', () => {
            this.processComponentTags();
            this.setupEventListeners();
        });
    }

    /**
     * Process {{> component}} tags in HTML
     */
    async processComponentTags() {
        const componentRegex = /\{\{>\s*([^}]+)\}\}/g;
        const elements = document.querySelectorAll('*');
        
        for (const element of elements) {
            if (element.innerHTML && componentRegex.test(element.innerHTML)) {
                let html = element.innerHTML;
                const matches = [...html.matchAll(componentRegex)];
                
                for (const match of matches) {
                    const componentName = match[1].trim();
                    const componentHTML = await this.renderComponent(componentName);
                    html = html.replace(match[0], componentHTML);
                }
                
                element.innerHTML = this.replaceVariables(html);
            }
        }
    }

    /**
     * Set up event listeners for dynamic content
     */
    setupEventListeners() {
        // Currency formatter
        this.formatCurrencyElements();
        
        // Date formatter
        this.formatDateElements();
        
        // Auto-update dynamic content
        this.updateDynamicContent();
    }

    /**
     * Format currency elements
     */
    formatCurrencyElements() {
        const currencyElements = document.querySelectorAll('[data-currency]');
        const currency = this.variables.CURRENCY || 'USD';
        const locale = this.variables.LOCALE || 'en-US';
        
        currencyElements.forEach(element => {
            const amount = parseFloat(element.dataset.currency);
            if (!isNaN(amount)) {
                element.textContent = new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: currency
                }).format(amount);
            }
        });
    }

    /**
     * Format date elements
     */
    formatDateElements() {
        const dateElements = document.querySelectorAll('[data-date]');
        const locale = this.variables.LOCALE || 'en-US';
        
        dateElements.forEach(element => {
            const date = new Date(element.dataset.date);
            if (!isNaN(date.getTime())) {
                element.textContent = date.toLocaleDateString(locale);
            }
        });
    }

    /**
     * Update dynamic content like countdown timers
     */
    updateDynamicContent() {
        // Update countdown timers
        const countdownElements = document.querySelectorAll('.countdown-timer');
        if (countdownElements.length > 0) {
            this.startCountdownTimers();
        }

        // Update stock levels
        this.updateStockLevels();
    }

    /**
     * Start countdown timers
     */
    startCountdownTimers() {
        const updateCountdown = () => {
            const countdownElements = document.querySelectorAll('.countdown-timer');
            
            countdownElements.forEach(element => {
                const endDate = new Date(element.dataset.endDate || this.variables.COUNTDOWN_END);
                const now = new Date();
                const timeDiff = endDate - now;

                if (timeDiff > 0) {
                    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

                    this.updateCountdownDisplay(days, hours, minutes, seconds);
                } else {
                    this.updateCountdownDisplay(0, 0, 0, 0);
                }
            });
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    /**
     * Update countdown display
     */
    updateCountdownDisplay(days, hours, minutes, seconds) {
        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const secondsEl = document.getElementById('countdown-seconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    /**
     * Update stock levels
     */
    updateStockLevels() {
        if (this.variables.URGENCY_ENABLED) {
            const stockElements = document.querySelectorAll('[data-stock]');
            stockElements.forEach(element => {
                const count = this.variables.URGENCY_COUNT || 7;
                element.textContent = element.textContent.replace('{{count}}', count);
            });
        }
    }

    /**
     * Get theme variables for CSS
     */
    getThemeCSS() {
        const themeVars = {
            '--primary-color': this.variables.primaryColor,
            '--secondary-color': this.variables.secondaryColor,
            '--accent-color': this.variables.accentColor,
            '--text-color': this.variables.textColor,
            '--background-color': this.variables.backgroundColor,
            '--light-background': this.variables.lightBackground,
            '--border-color': this.variables.borderColor,
            '--font-family': this.variables.fontFamily,
            '--heading-font': this.variables.headingFont,
            '--gradient-primary': this.variables.gradientPrimary,
            '--gradient-secondary': this.variables.gradientSecondary
        };

        return Object.entries(themeVars)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
    }

    /**
     * Apply theme to document
     */
    applyTheme() {
        const root = document.documentElement;
        const themeCSS = this.getThemeCSS();
        
        if (themeCSS) {
            root.style.cssText += themeCSS;
        }
    }

    /**
     * Generate page from template
     */
    async generatePage(templateName, variables = {}) {
        try {
            const response = await fetch(`/templates/pages/${templateName}.html`);
            if (!response.ok) {
                throw new Error(`Template ${templateName} not found`);
            }
            
            const template = await response.text();
            
            // Temporarily merge variables
            const originalVariables = { ...this.variables };
            this.variables = { ...this.variables, ...variables };
            
            // Process the template
            let processed = await this.processTemplate(template);
            
            // Restore variables
            this.variables = originalVariables;
            
            return processed;
            
        } catch (error) {
            console.error('Error generating page:', error);
            return `<div class="error">Template ${templateName} could not be loaded</div>`;
        }
    }

    /**
     * Process template with components and variables
     */
    async processTemplate(template) {
        // First, load all components
        const componentMatches = [...template.matchAll(/\{\{>\s*([^}]+)\}\}/g)];
        
        for (const match of componentMatches) {
            const componentName = match[1].trim();
            const componentHTML = await this.renderComponent(componentName);
            template = template.replace(match[0], componentHTML);
        }
        
        // Then replace all variables
        return this.replaceVariables(template);
    }
}

// Initialize template engine
window.templateEngine = new TemplateEngine(window.siteConfig || {});

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    window.templateEngine.applyTheme();
});