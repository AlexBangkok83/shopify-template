/**
 * Interactive Elements and UI Behaviors
 * Handles all user interactions and dynamic UI updates
 */

class InteractionManager {
    constructor() {
        this.selectedVariant = null;
        this.currentImageIndex = 0;
        this.init();
    }

    /**
     * Initialize all interactions
     */
    init() {
        this.bindGlobalEvents();
        this.initializeProductPage();
        this.initializeCartSidebar();
        this.initializeFAQ();
        this.initializeImageGallery();
        this.initializeFormValidation();
        this.initializeScrollEffects();
    }

    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        // Mobile menu toggle
        window.toggleMobileMenu = () => {
            const mobileNav = document.getElementById('mobile-nav');
            if (mobileNav) {
                mobileNav.classList.toggle('active');
            }
        };

        // Cart sidebar toggle
        window.toggleCart = () => {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.toggle('active');
                cartOverlay.classList.toggle('active');
                document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
            }
        };

        window.closeCart = () => {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    /**
     * Initialize product page interactions
     */
    initializeProductPage() {
        // Variant selection
        window.selectVariant = (variantId) => {
            this.selectedVariant = variantId;
            
            // Update variant cards
            document.querySelectorAll('.variant-card').forEach(card => {
                card.classList.remove('selected');
                if (card.dataset.variant === variantId) {
                    card.classList.add('selected');
                }
            });

            // Update add to cart button
            const addToCartBtn = document.querySelector('.add-to-cart-btn');
            if (addToCartBtn && this.selectedVariant) {
                addToCartBtn.onclick = () => window.addToCart(this.selectedVariant, this.getQuantity());
            }
        };

        // Quantity controls
        window.changeQuantity = (delta) => {
            const quantityInput = document.getElementById('quantity');
            if (quantityInput) {
                const currentValue = parseInt(quantityInput.value) || 1;
                const newValue = Math.max(1, currentValue + delta);
                quantityInput.value = newValue;
                this.updateQuantityDisplay(newValue);
            }
        };

        // Image gallery
        window.changeImage = (imageSrc) => {
            const mainImage = document.getElementById('main-image');
            if (mainImage) {
                mainImage.src = imageSrc;
                
                // Update thumbnail active state
                document.querySelectorAll('.thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                    if (thumb.src === imageSrc) {
                        thumb.classList.add('active');
                    }
                });
            }
        };

        // Image zoom
        const mainImage = document.getElementById('main-image');
        if (mainImage) {
            mainImage.addEventListener('click', () => {
                this.openImageZoom(mainImage.src);
            });
        }

        // Tab navigation
        window.showTab = (tabName) => {
            // Hide all tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab panel
            const targetPanel = document.getElementById(tabName);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Add active class to clicked button
            event.target.classList.add('active');
        };
    }

    /**
     * Initialize cart sidebar
     */
    initializeCartSidebar() {
        // Auto-close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartButton = document.querySelector('.cart-button');
            
            if (cartSidebar && cartSidebar.classList.contains('active')) {
                if (!cartSidebar.contains(e.target) && !cartButton?.contains(e.target)) {
                    window.closeCart();
                }
            }
        });
    }

    /**
     * Initialize FAQ accordion
     */
    initializeFAQ() {
        window.toggleFAQ = (element) => {
            const faqItem = element.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        };
    }

    /**
     * Initialize image gallery
     */
    initializeImageGallery() {
        // Image zoom modal
        window.openImageZoom = (imageSrc) => {
            const modal = document.getElementById('zoom-modal');
            const zoomImage = document.getElementById('zoom-image');
            
            if (modal && zoomImage) {
                zoomImage.src = imageSrc;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };

        window.closeZoom = () => {
            const modal = document.getElementById('zoom-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
    }

    /**
     * Initialize form validation
     */
    initializeFormValidation() {
        // Contact form submission
        window.submitContactForm = async (event) => {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
                
                // Simulate form submission (replace with actual endpoint)
                await this.simulateFormSubmission(data);
                
                // Show success message
                this.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                form.reset();
                
                // Restore button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                console.error('Form submission error:', error);
                this.showNotification('Error sending message. Please try again.', 'error');
                
                // Restore button
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            }
        };

        // Newsletter subscription
        window.subscribeNewsletter = async (event) => {
            event.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            
            try {
                // Simulate subscription (replace with actual endpoint)
                await this.simulateNewsletterSubscription(email);
                this.showNotification('Thank you for subscribing!', 'success');
                document.getElementById('newsletter-email').value = '';
                
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                this.showNotification('Error subscribing. Please try again.', 'error');
            }
        };

        // Review form submission
        window.submitReview = async (event) => {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add rating
            data.rating = this.getSelectedRating();
            
            try {
                await this.simulateReviewSubmission(data);
                this.showNotification('Review submitted successfully!', 'success');
                this.closeReviewModal();
                form.reset();
                this.resetRating();
                
            } catch (error) {
                console.error('Review submission error:', error);
                this.showNotification('Error submitting review. Please try again.', 'error');
            }
        };
    }

    /**
     * Initialize scroll effects
     */
    initializeScrollEffects() {
        // Scroll to top button
        const scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.innerHTML = '↑';
        scrollToTopBtn.className = 'scroll-to-top';
        scrollToTopBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        
        document.body.appendChild(scrollToTopBtn);
        
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollToTopBtn.style.opacity = '1';
                scrollToTopBtn.style.visibility = 'visible';
            } else {
                scrollToTopBtn.style.opacity = '0';
                scrollToTopBtn.style.visibility = 'hidden';
            }
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.card, .trust-item, .review-card, .step-item').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Helper methods
     */
    getQuantity() {
        const quantityInput = document.getElementById('quantity');
        return quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    }

    updateQuantityDisplay(quantity) {
        // Update any quantity displays
        document.querySelectorAll('.quantity-display').forEach(el => {
            el.textContent = quantity;
        });
    }

    getSelectedRating() {
        const selectedStar = document.querySelector('.rating-star-input.active:last-child');
        return selectedStar ? parseInt(selectedStar.dataset.rating) : 0;
    }

    resetRating() {
        document.querySelectorAll('.rating-star-input').forEach(star => {
            star.classList.remove('active');
        });
    }

    closeAllModals() {
        // Close cart
        window.closeCart();
        
        // Close image zoom
        window.closeZoom();
        
        // Close review modal
        this.closeReviewModal();
    }

    closeReviewModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: type === 'error' ? '#f44336' : '#4CAF50',
            zIndex: '10001',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Simulation methods (replace with actual API calls)
     */
    async simulateFormSubmission(data) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production, replace with actual form submission endpoint
        console.log('Form submission:', data);
        
        // Example: Send to contact form API
        // const response = await fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
        // 
        // if (!response.ok) {
        //     throw new Error('Failed to submit form');
        // }
    }

    async simulateNewsletterSubscription(email) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Newsletter subscription:', email);
        
        // Example: Send to newsletter API
        // const response = await fetch('/api/newsletter/subscribe', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
    }

    async simulateReviewSubmission(data) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        console.log('Review submission:', data);
        
        // Example: Send to reviews API
        // const response = await fetch('/api/reviews', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
    }
}

// Review modal interactions
document.addEventListener('DOMContentLoaded', () => {
    // Rating stars interaction
    document.querySelectorAll('.rating-star-input').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            
            // Remove active class from all stars
            document.querySelectorAll('.rating-star-input').forEach(s => {
                s.classList.remove('active');
            });
            
            // Add active class to clicked star and all previous stars
            for (let i = 1; i <= rating; i++) {
                const targetStar = document.querySelector(`.rating-star-input[data-rating="${i}"]`);
                if (targetStar) {
                    targetStar.classList.add('active');
                }
            }
        });
        
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            
            // Add hover effect
            for (let i = 1; i <= 5; i++) {
                const targetStar = document.querySelector(`.rating-star-input[data-rating="${i}"]`);
                if (targetStar) {
                    if (i <= rating) {
                        targetStar.style.color = '#FFD700';
                        targetStar.style.fill = '#FFD700';
                    } else {
                        targetStar.style.color = '#ddd';
                        targetStar.style.fill = 'none';
                    }
                }
            }
        });
    });

    // Open review modal
    window.openReviewModal = () => {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Initialize interactions
    window.interactionManager = new InteractionManager();
});

// Animation CSS for scroll effects
const animationCSS = `
    .card, .trust-item, .review-card, .step-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;

// Add animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationCSS;
document.head.appendChild(styleSheet);