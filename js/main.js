document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        
        // Check local storage for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            htmlElement.setAttribute('data-theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else if (savedTheme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                // Switch to light
                htmlElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                // Switch to dark
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // --- Mobile Menu Toggle ---
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

    // --- Sticky Header ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Scroll Animations ---
    const animatedElements = document.querySelectorAll('.flavor-card, .merch-card, .feature-item, .about-image, .about-text');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // --- Shopping Cart Logic ---
    let cart = [];
    const cartIcon = document.querySelector('.cart-icon');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');

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
            const title = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.merch-price').innerText;
            const price = parseFloat(priceText.replace('$', ''));
            const image = card.querySelector('.merch-image').src;

            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, title, price, image, quantity: 1 });
            }

            updateCartCount();
            
            // Add a little animation to the button
            const originalText = btn.innerText;
            btn.innerText = 'Added!';
            btn.style.backgroundColor = 'var(--secondary-blue)';
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = '';
            }, 1000);
        });
    });

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.innerText = totalItems;
        
        // Pulse animation
        cartCount.style.transform = 'scale(1.5)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 200);
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
            cartTotalElement.innerText = '$0.00';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-index="${index}">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn plus" data-index="${index}">+</button>
                            <button class="remove-item" data-index="${index}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        });

        cartTotalElement.innerText = `$${total.toFixed(2)}`;

        // Attach event listeners to new buttons
        attachCartListeners();
    }

    function attachCartListeners() {
        const minusBtns = document.querySelectorAll('.qty-btn.minus');
        const plusBtns = document.querySelectorAll('.qty-btn.plus');
        const removeBtns = document.querySelectorAll('.remove-item');

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
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
                const index = e.target.dataset.index;
                cart[index].quantity += 1;
                updateCartCount();
                renderCart();
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
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
                alert('Thank you for your order! This is a demo site, so no payment is processed.');
                cart = [];
                updateCartCount();
                toggleCart();
            } else {
                alert('Your cart is empty!');
            }
        });
    }
});
