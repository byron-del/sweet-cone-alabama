document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // COOKIE CONSENT — must run before localStorage
    // ============================================
    const cookieConsent = document.getElementById('cookie-consent');
    const cookieAcceptBtn = document.getElementById('cookie-accept');
    const cookieDeclineBtn = document.getElementById('cookie-decline');
    let cookiesAllowed = false;

    // Check if user has already made a choice
    try {
        const consent = localStorage.getItem('cookie-consent');
        if (consent === 'accepted') {
            cookiesAllowed = true;
        } else if (consent === 'declined') {
            cookiesAllowed = false;
        } else if (cookieConsent) {
            // No choice yet — show banner
            cookieConsent.style.display = 'flex';
        }
    } catch (e) {
        // localStorage not available — proceed without it
    }

    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', () => {
            cookiesAllowed = true;
            try { localStorage.setItem('cookie-consent', 'accepted'); } catch (e) {}
            if (cookieConsent) cookieConsent.style.display = 'none';
        });
    }

    if (cookieDeclineBtn) {
        cookieDeclineBtn.addEventListener('click', () => {
            cookiesAllowed = false;
            try {
                localStorage.setItem('cookie-consent', 'declined');
                localStorage.removeItem('theme'); // Remove stored preference
            } catch (e) {}
            if (cookieConsent) cookieConsent.style.display = 'none';
        });
    }

    // ============================================
    // THEME TOGGLE (respects cookie consent)
    // ============================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');

        // Check local storage for saved theme preference (only if cookies allowed)
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                htmlElement.setAttribute('data-theme', 'light');
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else if (savedTheme === 'dark') {
                htmlElement.setAttribute('data-theme', 'dark');
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        } catch (e) {
            // localStorage unavailable
        }

        function toggleTheme(e) {
            if (e) e.preventDefault();
            const currentTheme = htmlElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                htmlElement.setAttribute('data-theme', 'light');
                if (cookiesAllowed) {
                    try { localStorage.setItem('theme', 'light'); } catch (e) {}
                }
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                if (cookiesAllowed) {
                    try { localStorage.setItem('theme', 'dark'); } catch (e) {}
                }
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        }

        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // ============================================
    // STICKY HEADER
    // ============================================
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    const animatedElements = document.querySelectorAll('.flavor-card, .merch-card, .feature-item, .about-image, .about-text');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // ============================================
    // SHOPPING CART (XSS-safe DOM rendering)
    // ============================================
    let cart = [];
    const cartIcon = document.querySelector('.cart-icon');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');

    // --- Helper: Sanitize and create text safely ---
    function createTextEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        el.textContent = text; // textContent is XSS-safe
        return el;
    }

    // Toggle Cart Drawer
    function toggleCart() {
        cartDrawer.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        renderCart();
    }

    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // Add to Cart
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.merch-card');
            const id = card.dataset.id;
            const title = card.querySelector('h3').textContent; // textContent, not innerText/innerHTML
            const priceText = card.querySelector('.merch-price').textContent;
            const price = parseFloat(priceText.replace('$', ''));
            const image = card.querySelector('.merch-image').src;

            // Validate price is a real number to prevent NaN injection
            if (isNaN(price) || price < 0) return;

            // Validate image URL — only allow same-origin images
            try {
                const imgUrl = new URL(image);
                if (imgUrl.origin !== window.location.origin) return;
            } catch (e) {
                return; // Invalid URL
            }

            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, title, price, image, quantity: 1 });
            }

            updateCartCount();

            // Add a little animation to the button
            const originalText = btn.textContent;
            btn.textContent = 'Added!';
            btn.style.backgroundColor = 'var(--secondary-blue)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 1000);
        });
    });

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Pulse animation
        cartCount.style.transform = 'scale(1.5)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 200);
    }

    // --- SECURE renderCart: uses DOM APIs instead of innerHTML ---
    function renderCart() {
        // Clear cart safely
        while (cartItemsContainer.firstChild) {
            cartItemsContainer.removeChild(cartItemsContainer.firstChild);
        }

        if (cart.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-cart-msg';
            emptyMsg.textContent = 'Your cart is empty.';
            cartItemsContainer.appendChild(emptyMsg);
            cartTotalElement.textContent = '$0.00';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            // Build cart item using safe DOM APIs
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            // Image — set .src, never innerHTML
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title;
            img.className = 'cart-item-img';
            cartItem.appendChild(img);

            // Info container
            const info = document.createElement('div');
            info.className = 'cart-item-info';

            info.appendChild(createTextEl('div', 'cart-item-title', item.title));
            info.appendChild(createTextEl('div', 'cart-item-price', '$' + item.price.toFixed(2)));

            // Controls
            const controls = document.createElement('div');
            controls.className = 'cart-item-controls';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'qty-btn minus';
            minusBtn.dataset.index = index;
            minusBtn.textContent = '-';
            controls.appendChild(minusBtn);

            const qtySpan = document.createElement('span');
            qtySpan.textContent = item.quantity;
            controls.appendChild(qtySpan);

            const plusBtn = document.createElement('button');
            plusBtn.className = 'qty-btn plus';
            plusBtn.dataset.index = index;
            plusBtn.textContent = '+';
            controls.appendChild(plusBtn);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-item';
            removeBtn.dataset.index = index;
            removeBtn.textContent = 'Remove';
            controls.appendChild(removeBtn);

            info.appendChild(controls);
            cartItem.appendChild(info);
            cartItemsContainer.appendChild(cartItem);
        });

        cartTotalElement.textContent = '$' + total.toFixed(2);

        // Attach event listeners to new buttons
        attachCartListeners();
    }

    function attachCartListeners() {
        const minusBtns = document.querySelectorAll('.qty-btn.minus');
        const plusBtns = document.querySelectorAll('.qty-btn.plus');
        const removeBtns = document.querySelectorAll('.remove-item');

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                updateCartCount();
                renderCart();
            });
        });

        plusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                cart[index].quantity += 1;
                updateCartCount();
                renderCart();
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (isNaN(index) || index < 0 || index >= cart.length) return;
                cart.splice(index, 1);
                updateCartCount();
                renderCart();
            });
        });
    }

    // Checkout Button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('Thank you for your interest! Checkout is not yet available on this demo site.');
                cart = [];
                updateCartCount();
                toggleCart();
            } else {
                alert('Your cart is empty!');
            }
        });
    }

    // ============================================
    // NEWSLETTER FORM (moved from inline handler)
    // ============================================
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const email = emailInput ? emailInput.value.trim() : '';

            // Basic client-side validation (server-side validation required when backend exists)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // TODO: Replace with actual API call to newsletter service (e.g., Mailchimp, SendGrid)
            // For now, show honest message to user
            alert('Thanks for your interest! Newsletter signup will be available soon.');
            emailInput.value = '';
        });
    }
});
