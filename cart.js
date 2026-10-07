// ============================================================
// BADAM MILK SHOP
// CART MANAGEMENT
// ============================================================

"use strict";


// ============================================================
// CART STORAGE KEY
// ============================================================

const CART_KEY = "badamMilkCart";


// ============================================================
// GET CART
// ============================================================

function getCart() {

    try {

        const cart =
            localStorage.getItem(CART_KEY);

        if (!cart) {
            return [];
        }

        const parsed =
            JSON.parse(cart);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        return [];

    }

}


// ============================================================
// SAVE CART
// ============================================================

function saveCart(cart) {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

}


// ============================================================
// UPDATE CART COUNT
// ============================================================

function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cartCount"
        );

    if (!cartCount) {
        return;
    }


    const cart =
        getCart();


    const count =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity || 0);

            },
            0
        );


    cartCount.textContent =
        count;

}


// ============================================================
// CALCULATE TOTAL
// ============================================================

function calculateCartTotal() {

    const cart =
        getCart();


    return cart.reduce(
        function (total, item) {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 0);

            return total +
                (price * quantity);

        },
        0
    );

}


// ============================================================
// UPDATE QUANTITY
// ============================================================

function updateQuantity(
    productId,
    change
) {

    const cart =
        getCart();


    const product =
        cart.find(
            item =>
                item.id === productId
        );


    if (!product) {
        return;
    }


    const currentQuantity =
        Number(product.quantity || 1);


    const stock =
        Number(product.stock || 999999);


    const newQuantity =
        currentQuantity + change;


    // --------------------------------------------------------
    // MINIMUM
    // --------------------------------------------------------

    if (newQuantity < 1) {

        return;

    }


    // --------------------------------------------------------
    // STOCK LIMIT
    // --------------------------------------------------------

    if (newQuantity > stock) {

        showCartMessage(
            `Only ${stock} item(s) available in stock.`
        );

        return;

    }


    product.quantity =
        newQuantity;


    saveCart(cart);


    renderCart();

}


// ============================================================
// REMOVE PRODUCT
// ============================================================

function removeFromCart(
    productId
) {

    let cart =
        getCart();


    cart =
        cart.filter(
            item =>
                item.id !== productId
        );


    saveCart(cart);


    renderCart();

}


// ============================================================
// CLEAR CART
// ============================================================

function clearCart() {

    const cart =
        getCart();


    if (cart.length === 0) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to clear your cart?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        CART_KEY
    );


    renderCart();

}


// ============================================================
// RENDER CART
// ============================================================

function renderCart() {

    const cartContainer =
        document.getElementById(
            "cartItems"
        );


    const cartTotal =
        document.getElementById(
            "cartTotal"
        );


    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    const emptyCart =
        document.getElementById(
            "emptyCart"
        );


    if (!cartContainer) {

        updateCartCount();

        return;

    }


    const cart =
        getCart();


    // --------------------------------------------------------
    // EMPTY CART
    // --------------------------------------------------------

    if (cart.length === 0) {

        cartContainer.innerHTML = "";


        if (emptyCart) {

            emptyCart.classList.remove(
                "hidden"
            );

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                true;

        }


        if (cartTotal) {

            cartTotal.textContent =
                "₹0.00";

        }


        updateCartCount();


        return;

    }


    // --------------------------------------------------------
    // SHOW CART
    // --------------------------------------------------------

    if (emptyCart) {

        emptyCart.classList.add(
            "hidden"
        );

    }


    if (checkoutButton) {

        checkoutButton.disabled =
            false;

    }


    cartContainer.innerHTML = "";


    // --------------------------------------------------------
    // CART ITEMS
    // --------------------------------------------------------

    cart.forEach(
        function (item) {

            const itemElement =
                document.createElement(
                    "div"
                );


            itemElement.className =
                "cart-item";


            const image =
                item.image
                    ? `
                        <img
                            src="${escapeHTML(item.image)}"
                            alt="${escapeHTML(item.name)}"
                        >
                      `
                    : `
                        <div class="cart-placeholder">
                            🥛
                        </div>
                      `;


            const price =
                Number(item.price || 0);


            const quantity =
                Number(item.quantity || 1);


            const itemTotal =
                price * quantity;


            itemElement.innerHTML = `

                <div class="cart-item-image">
                    ${image}
                </div>


                <div class="cart-item-details">

                    <p class="cart-item-category">
                        
                    </p>

                    <h3>
                        ${escapeHTML(item.name)}
                    </h3>

                    <p class="cart-item-price">
                        ₹${price.toFixed(2)}
                    </p>

                </div>


                <div class="cart-item-actions">

                    <div class="quantity-control">

                        <button
                            type="button"
                            class="quantity-btn"
                            data-action="minus"
                            data-id="${escapeHTML(item.id)}"
                        >
                            −
                        </button>


                        <span class="quantity-value">
                            ${quantity}
                        </span>


                        <button
                            type="button"
                            class="quantity-btn"
                            data-action="plus"
                            data-id="${escapeHTML(item.id)}"
                        >
                            +
                        </button>

                    </div>


                    <strong class="cart-item-total">
                        ₹${itemTotal.toFixed(2)}
                    </strong>


                    <!-- REMOVE BUTTON -->

                    <button
                        type="button"
                        class="remove-item"
                        data-id="${escapeHTML(item.id)}"
                    >
                        Remove
                    </button>

                </div>

            `;


            cartContainer.appendChild(
                itemElement
            );

        }
    );


    // --------------------------------------------------------
    // QUANTITY BUTTON EVENTS
    // --------------------------------------------------------

    cartContainer
        .querySelectorAll(
            ".quantity-btn"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.id;


                        const action =
                            button.dataset.action;


                        updateQuantity(
                            id,
                            action === "plus"
                                ? 1
                                : -1
                        );

                    }
                );

            }
        );


    // --------------------------------------------------------
    // REMOVE BUTTON EVENTS
    // --------------------------------------------------------

    cartContainer
        .querySelectorAll(
            ".remove-item"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.id;


                        removeFromCart(
                            id
                        );

                    }
                );

            }
        );


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total =
        calculateCartTotal();


    if (cartTotal) {

        cartTotal.textContent =
            `₹${total.toFixed(2)}`;

    }


    updateCartCount();

}


// ============================================================
// CART MESSAGE
// ============================================================

function showCartMessage(
    message
) {

    const existing =
        document.querySelector(
            ".cart-toast"
        );


    if (existing) {
        existing.remove();
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "cart-toast";


    toast.innerHTML = `

        <span>!</span>

        <div>
            <strong>Cart</strong>

            <small>
                ${escapeHTML(message)}
            </small>
        </div>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        function () {

            toast.classList.add(
                "show"
            );

        },
        10
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        2500
    );

}


// ============================================================
// CHECKOUT
// ============================================================

function goToCheckout() {

    const cart =
        getCart();


    if (cart.length === 0) {

        showCartMessage(
            "Your cart is empty."
        );

        return;

    }


    window.location.href =
        "checkout.html";

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.getCart =
    getCart;


window.saveCart =
    saveCart;


window.updateQuantity =
    updateQuantity;


window.removeFromCart =
    removeFromCart;


window.clearCart =
    clearCart;


window.renderCart =
    renderCart;


window.goToCheckout =
    goToCheckout;


window.calculateCartTotal =
    calculateCartTotal;


window.updateCartCount =
    updateCartCount;


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderCart();

        updateCartCount();

    }
);