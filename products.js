// ============================================================
// BADAM MILK SHOP
// PRODUCTS
// FIRESTORE → WEBSITE
// ============================================================

"use strict";

import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// PRODUCT GRID
// ============================================================

const productsGrid =
    document.getElementById("productsGrid");


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    if (!productsGrid) return;

    try {

        productsGrid.innerHTML = `
            <div class="loading-products">
                <div class="loader"></div>
                <p>Loading products...</p>
            </div>
        `;


        const productsRef =
            collection(db, "products");


        const productsQuery =
            query(
                productsRef,
                orderBy("createdAt", "desc")
            );


        const snapshot =
            await getDocs(productsQuery);


        if (snapshot.empty) {

            showNoProducts();

            return;
        }


        productsGrid.innerHTML = "";


        snapshot.forEach(
            function (productDoc) {

                const product =
                    productDoc.data();

                const productId =
                    productDoc.id;

                renderProduct(
                    productId,
                    product
                );

            }
        );


    } catch (error) {

        console.error(
            "Products loading error:",
            error
        );


        /*
         * If there are no products yet,
         * Firestore may not have created
         * the collection.
         */

        productsGrid.innerHTML = `
            <div class="empty-products">
                <div class="empty-icon">🥛</div>

                <h3>Products Coming Soon</h3>

                <p>
                    Our fresh Badam Milk products
                    will be available here soon.
                </p>
            </div>
        `;

    }

}


function renderProduct(productId, product) {

    const name =
        product.name ||
        "Product";

    const description =
        product.description ||
        "Fresh and delicious.";

    const price =
        Number(product.price || 0);

    const stock =
        Number(product.stock || 0);

    const images =
        Array.isArray(product.images)
            ? product.images
            : [];

    const image =
        images.length > 0
            ? images[0]
            : "";

    // IMAGE
    let imageHTML = "";

    if (image) {

        imageHTML = `
            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                class="product-main-image"
                loading="lazy"
            >
        `;

    } else {

        imageHTML = `
            <div class="product-placeholder">
                <span>🥛</span>
            </div>
        `;
    }

    // STOCK
    let stockHTML = "";

    if (stock <= 0) {

        stockHTML = `
            <span class="stock-badge out-of-stock">
                OUT OF STOCK
            </span>
        `;

    } else if (stock <= 5) {

        stockHTML = `
            <span class="stock-badge low-stock">
                ONLY ${stock} LEFT
            </span>
        `;

    } else {

        stockHTML = `
            <span class="stock-badge in-stock">
                IN STOCK
            </span>
        `;
    }

    // PRODUCT CARD
    const card =
        document.createElement("article");

    card.className =
        "product-card";

    card.dataset.productId =
        productId;

    card.innerHTML = `
        <div class="product-image">

            ${imageHTML}

            ${stockHTML}

        </div>

        <div class="product-info">

            <p class="product-category">
                PRODUCTS
            </p>

            <h3 class="product-name">
                ${escapeHTML(name)}
            </h3>

            <p class="product-description">
                ${escapeHTML(description)}
            </p>

            <div class="product-bottom">

                <div class="product-price">
                    <span>₹</span>
                    ${price.toFixed(2)}
                </div>

                <button
                    type="button"
                    class="add-cart-btn"
                    data-product-id="${productId}"
                    ${stock <= 0 ? "disabled" : ""}
                >
                    ${
                        stock > 0
                            ? "ADD TO CART"
                            : "OUT OF STOCK"
                    }
                </button>

            </div>

        </div>
    `;

    productsGrid.appendChild(card);

    // ADD TO CART
    const addButton =
        card.querySelector(".add-cart-btn");

    if (addButton && stock > 0) {

        addButton.addEventListener(
            "click",
            function () {

                addProductToCart(
                    productId,
                    product
                );

            }
        );
    }
}
// ============================================================
// ADD PRODUCT TO CART
// ============================================================

function addProductToCart(
    productId,
    product
) {

    const stock =
        Number(product.stock || 0);


    if (stock <= 0) {

        alert(
            "This product is currently out of stock."
        );

        return;
    }


    let cart =
        getCart();


    const existingProduct =
        cart.find(
            item =>
                item.id === productId
        );


    if (existingProduct) {

        if (
            existingProduct.quantity >= stock
        ) {

            alert(
                "You cannot add more than the available stock."
            );

            return;
        }


        existingProduct.quantity += 1;

    } else {

        cart.push({

            id: productId,

            name:
                product.name ||
                "Badam Milk",

            price:
                Number(product.price || 0),

            image:
                Array.isArray(product.images) &&
                product.images.length > 0
                    ? product.images[0]
                    : "",

            quantity: 1,

            stock: stock

        });

    }


    saveCart(cart);


    updateCartCount();


    showAddedMessage(
        product.name ||
        "Product"
    );

}


// ============================================================
// GET CART
// ============================================================

function getCart() {

    try {

        const savedCart =
            localStorage.getItem(
                "CravingsCart"
            );


        if (!savedCart) {

            return [];

        }


        const cart =
            JSON.parse(savedCart);


        return Array.isArray(cart)
            ? cart
            : [];


    } catch (error) {

        console.error(
            "Cart read error:",
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
        "CravingsCart",
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


    if (!cartCount) return;


    const cart =
        getCart();


    const totalQuantity =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity || 0);

            },
            0
        );


    cartCount.textContent =
        totalQuantity;

}


// ============================================================
// PRODUCT ADDED MESSAGE
// ============================================================

function showAddedMessage(
    productName
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "cart-toast";


    message.innerHTML = `
        <span>✓</span>
        <div>
            <strong>Added to cart</strong>
            <small>
                ${escapeHTML(productName)}
            </small>
        </div>
    `;


    document.body.appendChild(
        message
    );


    setTimeout(
        function () {

            message.classList.add(
                "show"
            );

        },
        10
    );


    setTimeout(
        function () {

            message.classList.remove(
                "show"
            );


            setTimeout(
                function () {

                    message.remove();

                },
                300
            );

        },
        2200
    );

}


// ============================================================
// NO PRODUCTS
// ============================================================

function showNoProducts() {

    productsGrid.innerHTML = `

        <div class="empty-products">

            <div class="empty-icon">
                🥛
            </div>

            <h3>
                Products Coming Soon
            </h3>

            <p>
                Fresh  products
                will be available here soon.
            </p>

        </div>

    `;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}


// ============================================================
// INITIAL LOAD
// ============================================================

loadProducts();

updateCartCount();


// ============================================================
// GLOBAL CART HELPERS
// ============================================================

window.getCravingsCart =
    getCart;

window.updateCravingsCartCount =
    updateCartCount;