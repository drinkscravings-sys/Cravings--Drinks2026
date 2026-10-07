// ============================================================
// CRAVINGS
// ADMIN DASHBOARD
// PRODUCTS + STOCK + OUT OF STOCK + ORDERS + QR SCANNER
// ============================================================

"use strict";

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================

const CLOUDINARY_CLOUD_NAME = "komefmwu";

const CLOUDINARY_UPLOAD_PRESET = "cravings_products";


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentAdmin = null;

let products = [];

let orders = [];

let editingProductId = null;

let existingProductImages = [];

let selectedDeliveryOrder = null;

let html5QrCode = null;

let scannerRunning = false;

let scannedToken = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

const productSearchInput = 
    document.getElementById("productSearchInput"); 
 
const productStockFilter = 
    document.getElementById("productStockFilter");
// ------------------------------------------------------------
// ADMIN AUTH
// ------------------------------------------------------------

const adminAuthScreen =
    document.getElementById("adminAuthScreen");

const adminLoginForm =
    document.getElementById("adminLoginForm");

const adminEmail =
    document.getElementById("adminEmail");

const adminPassword =
    document.getElementById("adminPassword");

const adminLoginMessage =
    document.getElementById("adminLoginMessage");


// ------------------------------------------------------------
// ADMIN INFORMATION
// ------------------------------------------------------------

const adminName =
    document.getElementById("adminName");

const adminToday =
    document.getElementById("adminToday");

const adminUserEmail =
    document.getElementById("adminUserEmail");

const adminLogoutBtn =
    document.getElementById("adminLogoutBtn");


// ------------------------------------------------------------
// STATISTICS
// ------------------------------------------------------------

const totalProducts =
    document.getElementById("totalProducts");

const totalOrders =
    document.getElementById("totalOrders");

const pendingOrders =
    document.getElementById("pendingOrders");

const todaySales =
    document.getElementById("todaySales");


// ------------------------------------------------------------
// TABS
// ------------------------------------------------------------

const adminTabs =
    document.querySelectorAll(".admin-tab");

const ordersPanel =
    document.getElementById("ordersPanel");

const productsPanel =
    document.getElementById("productsPanel");

const scannerPanel =
    document.getElementById("scannerPanel");


// ------------------------------------------------------------
// ORDERS
// ------------------------------------------------------------

const adminOrdersLoading =
    document.getElementById("adminOrdersLoading") ||
    document.getElementById("ordersLoading");

const adminOrdersContainer =
    document.getElementById("adminOrdersContainer") ||
    document.getElementById("ordersContainer");

const adminNoOrders =
    document.getElementById("adminNoOrders") ||
    document.getElementById("noOrders");

const orderStatusFilter =
    document.getElementById("orderStatusFilter");

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");


// ------------------------------------------------------------
// PRODUCTS
// ------------------------------------------------------------

const adminProductsLoading =
    document.getElementById("adminProductsLoading") ||
    document.getElementById("productsLoading");

const adminProductsContainer =
    document.getElementById("adminProductsContainer") ||
    document.getElementById("productsContainer");

const adminNoProducts =
    document.getElementById("adminNoProducts") ||
    document.getElementById("noProducts");


// ------------------------------------------------------------
// PRODUCT MODAL
// ------------------------------------------------------------

const productModal =
    document.getElementById("productModal");

const productModalTitle =
    document.getElementById("productModalTitle");

const productForm =
    document.getElementById("productForm");

const editProductId =
    document.getElementById("editProductId");

const productName =
    document.getElementById("productName");

const productPrice =
    document.getElementById("productPrice");

const productStock =
    document.getElementById("productStock");

const productDescription =
    document.getElementById("productDescription");

const productImages =
    document.getElementById("productImages");

const existingImages =
    document.getElementById("existingImages");

const newImagePreview =
    document.getElementById("newImagePreview");

const productFormMessage =
    document.getElementById("productFormMessage");

const saveProductBtn =
    document.getElementById("saveProductBtn");

const openAddProductBtn =
    document.getElementById("openAddProductBtn") ||
    document.getElementById("addProductBtn");

const closeProductModal =
    document.getElementById("closeProductModal");

const cancelProductBtn =
    document.getElementById("cancelProductBtn");


// ------------------------------------------------------------
// ORDER MODAL
// ------------------------------------------------------------

const orderModal =
    document.getElementById("orderModal");

const closeOrderModal =
    document.getElementById("closeOrderModal");

const orderModalContent =
    document.getElementById("orderModalContent");


// ------------------------------------------------------------
// DELIVERY MODAL
// ------------------------------------------------------------

const deliveryModal =
    document.getElementById("deliveryModal");

const deliveryOrderInfo =
    document.getElementById("deliveryOrderInfo");

const confirmDeliveryBtn =
    document.getElementById("confirmDeliveryBtn");


// ------------------------------------------------------------
// QR SCANNER
// ------------------------------------------------------------

const qrReader =
    document.getElementById("qr-reader");

const startScannerBtn =
    document.getElementById("startScannerBtn");

const stopScannerBtn =
    document.getElementById("stopScannerBtn");

const scannerMessage =
    document.getElementById("scannerMessage");

const scanResult =
    document.getElementById("scanResult");


// ============================================================
// BASIC HELPERS
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatPrice(value) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });

}


function formatDate(timestamp) {

    if (!timestamp) return "-";

    try {

        let date;

        if (timestamp.toDate) {

            date = timestamp.toDate();

        } else {

            date = new Date(timestamp);

        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return "-";

    }

}


function formatDateTime(timestamp) {

    if (!timestamp) return "-";

    try {

        let date;

        if (timestamp.toDate) {

            date = timestamp.toDate();

        } else {

            date = new Date(timestamp);

        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "-";

    }

}


function showFormMessage(
    element,
    message,
    type = "error"
) {

    if (!element) return;

    element.textContent = message;

    element.className =
        "form-message " + type;

    element.style.display = "block";

}


function clearFormMessage(element) {

    if (!element) return;

    element.textContent = "";

    element.style.display = "none";

}


function showScannerMessage(
    message,
    type = "error"
) {

    if (!scannerMessage) return;

    scannerMessage.textContent = message;

    scannerMessage.className =
        "scanner-message " + type;

}


function clearScanResult() {

    if (!scanResult) return;

    scanResult.innerHTML = `
        <div class="scan-empty">
            📷
            <br>
            Scan an order QR code
            to view order details.
        </div>
    `;

}


function getAuthErrorMessage(error) {

    const code = error?.code || "";

    const messages = {

        "auth/invalid-credential":
            "Invalid admin email or password.",

        "auth/invalid-email":
            "Please enter a valid email.",

        "auth/user-disabled":
            "This admin account is disabled.",

        "auth/too-many-requests":
            "Too many attempts. Try again later."

    };

    return (
        messages[code] ||
        "Unable to login. Please try again."
    );

}


// ============================================================
// TODAY
// ============================================================

if (adminToday) {

    adminToday.textContent =
        new Date().toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


// ============================================================
// OUT OF STOCK CHECKBOX
// ============================================================

let productOutOfStock = null;


function createOutOfStockCheckbox() {

    if (!productForm) return;

    productOutOfStock =
        document.getElementById("productOutOfStock");

    if (productOutOfStock) return;


    const wrapper =
        document.createElement("div");

    wrapper.id =
        "outOfStockWrapper";

    wrapper.style.cssText = `
        display:flex;
        align-items:center;
        gap:10px;
        margin:12px 0 18px;
        padding:12px 14px;
        border:1px solid #d9b58a;
        border-radius:12px;
        background:#fff8ed;
    `;


    const checkbox =
        document.createElement("input");

    checkbox.type =
        "checkbox";

    checkbox.id =
        "productOutOfStock";

    checkbox.style.cssText = `
        width:18px;
        height:18px;
        cursor:pointer;
        accent-color:#70452d;
    `;


    const label =
        document.createElement("label");

    label.htmlFor =
        "productOutOfStock";

    label.textContent =
        "Mark as Out of Stock";

    label.style.cssText = `
        font-weight:700;
        color:#4b2c1e;
        cursor:pointer;
    `;


    wrapper.appendChild(
        checkbox
    );

    wrapper.appendChild(
        label
    );


    const stockParent =
        productStock?.closest(
            ".form-group"
        ) ||
        productStock?.parentElement;


    if (stockParent) {

        stockParent.insertAdjacentElement(
            "afterend",
            wrapper
        );

    } else {

        productForm.prepend(
            wrapper
        );

    }


    productOutOfStock =
        checkbox;


    checkbox.addEventListener(
        "change",
        () => {

            if (!productStock) return;

            if (checkbox.checked) {

                productStock.disabled =
                    true;

                productStock.dataset.previousValue =
                    productStock.value;

            } else {

                productStock.disabled =
                    false;

                if (
                    productStock.dataset.previousValue
                ) {

                    productStock.value =
                        productStock.dataset.previousValue;

                }

            }

        }
    );

}


createOutOfStockCheckbox();


// ============================================================
// TAB SYSTEM
// ============================================================

const adminTabPanelMap = {

    ordersTab:
        "ordersPanel",

    productsTab:
        "productsPanel",

    scannerTab:
        "scannerPanel"

};


function showAdminPanel(panelId) {

    [
        ordersPanel,
        productsPanel,
        scannerPanel
    ].forEach(panel => {

        if (panel) {

            panel.classList.remove(
                "active"
            );

            panel.style.display =
                "none";

        }

    });


    const targetPanel =
        document.getElementById(
            panelId
        );

    if (targetPanel) {

        targetPanel.classList.add(
            "active"
        );

        targetPanel.style.display =
            "block";

    }

}


adminTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        async () => {

            const tabId =
                tab.id;

            const targetPanelId =
                adminTabPanelMap[
                    tabId
                ];

            if (!targetPanelId) return;


            adminTabs.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            tab.classList.add(
                "active"
            );


            showAdminPanel(
                targetPanelId
            );


            if (
                tabId ===
                "ordersTab"
            ) {

                await loadOrders();

            }


            if (
                tabId ===
                "productsTab"
            ) {

                await loadProducts();

            }

        }
    );

});


// ============================================================
// DEFAULT PANEL
// ============================================================

showAdminPanel(
    "ordersPanel"
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        console.log("AUTH USER:", user);

        if (!user) {

            console.log("No Firebase user");

            showAdminLogin();

            return;

        }


        try {

            console.log(
                "Logged in UID:",
                user.uid
            );


            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            console.log(
                "User document exists:",
                userSnap.exists()
            );


            if (!userSnap.exists()) {

                console.log(
                    "ADMIN USER DOCUMENT NOT FOUND"
                );

                await signOut(auth);

                showAdminLogin();

                showFormMessage(
                    adminLoginMessage,
                    "Admin account was not found."
                );

                return;

            }


            const userData =
                userSnap.data();


            console.log(
                "USER DATA:",
                userData
            );


            console.log(
                "USER ROLE:",
                userData.role
            );


            if (
                userData.role !==
                "admin"
            ) {

                console.log(
                    "ROLE IS NOT ADMIN"
                );

                await signOut(auth);

                showAdminLogin();

                showFormMessage(
                    adminLoginMessage,
                    "This account does not have admin access."
                );

                return;

            }

// ============================================================
// SHOW / HIDE ADMIN LOGIN
// ============================================================

function showAdminLogin() {

    if (adminAuthScreen) {

        adminAuthScreen.style.display =
            "flex";

    }

    document.body.classList.remove(
        "admin-authenticated"
    );

}


function hideAdminLogin() {

    if (adminAuthScreen) {

        adminAuthScreen.style.display =
            "none";

    }

    document.body.classList.add(
        "admin-authenticated"
    );

}
            // =========================================
            // ADMIN VERIFIED
            // =========================================

            currentAdmin =
                user;


            console.log(
                "ADMIN VERIFIED SUCCESSFULLY"
            );


            // Hide login immediately
            hideAdminLogin();


            if (adminName) {

                adminName.textContent =
                    userData.name ||
                    user.displayName ||
                    "Admin";

            }


            if (adminUserEmail) {

                adminUserEmail.textContent =
                    user.email ||
                    "";

            }


            // =========================================
            // LOAD ADMIN DATA
            // =========================================

            console.log(
                "Loading products..."
            );

            await loadProducts();


            console.log(
                "Products loaded"
            );


            console.log(
                "Loading orders..."
            );

            await loadOrders();


            console.log(
                "Orders loaded"
            );


            updateDashboardStats();


            console.log(
                "ADMIN DASHBOARD READY"
            );


        } catch (error) {

            console.error(
                "ADMIN AUTH / DASHBOARD ERROR:",
                error
            );


            // IMPORTANT:
            // Do not sign out the admin here.
            // Login is already successful.

            hideAdminLogin();


            if (adminLoginMessage) {

                adminLoginMessage.textContent =
                    error.message ||
                    "Admin dashboard loading failed.";

                adminLoginMessage.style.color =
                    "#b42318";

            }

        }

    }
);
// ============================================================
// ADMIN LOGIN
// ============================================================

if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearFormMessage(
                adminLoginMessage
            );

            const email =
                adminEmail?.value.trim();

            const password =
                adminPassword?.value;

            if (!email || !password) {

                showFormMessage(
                    adminLoginMessage,
                    "Please enter email and password."
                );

                return;
            }

            const submitButton =
                adminLoginForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "Logging in...";
            }

            try {

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    credential.user;

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );

                const userSnap =
                    await getDoc(userRef);

                if (!userSnap.exists()) {

                    await signOut(auth);

                    showAdminLogin();

                    showFormMessage(
                        adminLoginMessage,
                        "Admin account was not found."
                    );

                    return;
                }

                const userData =
                    userSnap.data();

                if (
                    userData.role !==
                    "admin"
                ) {

                    await signOut(auth);

                    showAdminLogin();

                    showFormMessage(
                        adminLoginMessage,
                        "This account does not have admin access."
                    );

                    return;
                }

                currentAdmin = user;

                hideAdminLogin();

                if (adminName) {

                    adminName.textContent =
                        userData.name ||
                        user.displayName ||
                        "Admin";
                }

                if (adminUserEmail) {

                    adminUserEmail.textContent =
                        user.email || "";
                }

                await loadProducts();

                await loadOrders();

                updateDashboardStats();

            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );

                showFormMessage(
                    adminLoginMessage,
                    getAuthErrorMessage(error)
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Login";
                }
            }
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

if (adminLogoutBtn) {

    adminLogoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await stopQRScanner();

                await signOut(auth);

                currentAdmin = null;

                window.location.href =
                    "admin.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


window.adminLogout =
    async function () {

        try {

            await stopQRScanner();

            await signOut(auth);

            currentAdmin = null;

            window.location.href =
                "admin.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }
    };


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    if (!currentAdmin) return;

    try {

        if (adminProductsLoading) {

            adminProductsLoading.style.display =
                "flex";
        }

        const productsRef =
            collection(
                db,
                "products"
            );

        let snapshot;

        try {

            const productsQuery =
                query(
                    productsRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );

            snapshot =
                await getDocs(
                    productsQuery
                );

        } catch {

            snapshot =
                await getDocs(
                    productsRef
                );
        }

        products =
            snapshot.docs.map(
                productDoc => ({

                    id: productDoc.id,

                    ...productDoc.data()

                })
            );

        renderProducts();

        updateDashboardStats();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        if (adminProductsContainer) {

            adminProductsContainer.innerHTML = `
                <div class="admin-error">
                    Unable to load products.
                    Please check Firebase.
                </div>
            `;
        }

    } finally {

        if (adminProductsLoading) {

            adminProductsLoading.style.display =
                "none";
        }
    }
}


// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {

    if (!adminProductsContainer) return;


    // ========================================================
    // SEARCH + STOCK FILTER
    // ========================================================

    const searchText =
        productSearchInput?.value
            ?.trim()
            .toLowerCase() || "";

    const stockFilter =
        productStockFilter?.value ||
        "all";


    let filteredProducts =
        [...products];


    // PRODUCT SEARCH
    if (searchText) {

        filteredProducts =
            filteredProducts.filter(
                product =>

                    String(
                        product.name || ""
                    )
                    .toLowerCase()
                    .includes(searchText)

            );

    }


    // STOCK FILTER
    if (stockFilter !== "all") {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    const stock =
                        Number(
                            product.stock || 0
                        );

                    const outOfStock =
                        product.outOfStock === true ||
                        stock <= 0;


                    if (
                        stockFilter ===
                        "out-of-stock"
                    ) {

                        return outOfStock;

                    }


                    if (
                        stockFilter ===
                        "low-stock"
                    ) {

                        return (
                            !outOfStock &&
                            stock <= 5
                        );

                    }


                    if (
                        stockFilter ===
                        "in-stock"
                    ) {

                        return (
                            !outOfStock &&
                            stock > 5
                        );

                    }


                    return true;

                }
            );

    }


    // ========================================================
    // NO MATCHING PRODUCTS
    // ========================================================

    if (!filteredProducts.length) {

        adminProductsContainer.innerHTML = `

            <div
                style="
                    padding:45px;
                    text-align:center;
                    color:#806956;
                "
            >

                🔎

                <h3>
                    No products found
                </h3>

                <p>
                    Try another product name or stock filter.
                </p>

            </div>

        `;


        if (adminNoProducts) {

            adminNoProducts.style.display =
                "none";

        }

        return;

    }


    if (adminNoProducts) {

        adminNoProducts.style.display =
            "none";

    }


    // ========================================================
    // RENDER PRODUCTS
    // ========================================================

    adminProductsContainer.innerHTML =
        filteredProducts.map(
            product => {

                const stock =
                    Number(
                        product.stock || 0
                    );


                const outOfStock =
                    product.outOfStock === true ||
                    stock <= 0;


                const lowStock =
                    !outOfStock &&
                    stock <= 5;


                const images =
                    Array.isArray(
                        product.images
                    )
                        ? product.images
                        : [];


                const image =
                    images.length
                        ? images[0]
                        : "";


                return `

                    <div
                        class="admin-product-card"
                        data-product-id="${escapeHTML(
                            product.id
                        )}"
                    >

                        <div class="admin-product-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHTML(
                                                image
                                            )}"
                                            alt="${escapeHTML(
                                                product.name ||
                                                "Product"
                                            )}"
                                        >
                                      `
                                    : `
                                        <div class="no-product-image">
                                            🥛
                                        </div>
                                      `
                            }

                        </div>


                        <div class="admin-product-info">

                            <h3>
                                ${escapeHTML(
                                    product.name ||
                                    "Unnamed Product"
                                )}
                            </h3>


                            <p class="admin-product-description">

                                ${escapeHTML(
                                    product.description ||
                                    "No description"
                                )}

                            </p>


                            <div class="admin-product-meta">

                                <span class="product-price">

                                    ${formatPrice(
                                        product.price
                                    )}

                                </span>


                                <span
                                    class="
                                        product-stock
                                        ${
                                            outOfStock
                                                ? "out"
                                                : ""
                                        }
                                    "
                                >

                                    ${
                                        outOfStock
                                            ? "OUT OF STOCK"

                                            : lowStock
                                                ? `⚠️ LOW STOCK: ${stock}`

                                                : `Stock: ${stock}`
                                    }

                                </span>

                            </div>


                            <div class="admin-product-actions">

                                <button
                                    type="button"
                                    class="admin-edit-product"
                                    data-id="${escapeHTML(
                                        product.id
                                    )}"
                                >

                                    ✏️ Edit

                                </button>


                                <button
                                    type="button"
                                    class="admin-delete-product"
                                    data-id="${escapeHTML(
                                        product.id
                                    )}"
                                >

                                    🗑️ Delete

                                </button>

                            </div>

                        </div>

                    </div>

                `;
            }
        ).join("");


    // ========================================================
    // EDIT BUTTON
    // ========================================================

    adminProductsContainer
        .querySelectorAll(
            ".admin-edit-product"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditProduct(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // ========================================================
    // DELETE BUTTON
    // ========================================================

    adminProductsContainer
        .querySelectorAll(
            ".admin-delete-product"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProduct(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}
// ============================================================
// OPEN ADD PRODUCT MODAL
// ============================================================

function openAddProduct() {

    editingProductId = null;

    existingProductImages = [];

    if (editProductId) {
        editProductId.value = "";
    }

    if (productModalTitle) {
        productModalTitle.textContent =
            "Add New Product";
    }

    if (productForm) {
        productForm.reset();
    }

    if (productStock) {
        productStock.value = 0;
        productStock.disabled = false;
    }

    if (productDescription) {
        productDescription.value = "";
    }

    if (existingImages) {
        existingImages.innerHTML = "";
    }

    if (newImagePreview) {
        newImagePreview.innerHTML = "";
    }

    if (productFormMessage) {
        productFormMessage.textContent = "";
        productFormMessage.style.display = "none";
    }

    createOutOfStockCheckbox();

    if (productOutOfStock) {
        productOutOfStock.checked = false;
    }

    if (productModal) {

        productModal.classList.add("active");

        productModal.style.display = "flex";
    }
}


// ============================================================
// ADD PRODUCT BUTTON CLICK
// ============================================================

if (openAddProductBtn) {

    openAddProductBtn.addEventListener(
        "click",
        openAddProduct
    );

}
// ============================================================
// OPEN EDIT PRODUCT
// ============================================================

function openEditProduct(
    productId
) {

    const product =
        products.find(
            item =>
                item.id ===
                productId
        );

    if (!product) return;


    editingProductId =
        productId;


    existingProductImages =
        Array.isArray(
            product.images
        )
            ? [...product.images]
            : [];


    if (editProductId) {

        editProductId.value =
            productId;

    }


    if (productModalTitle) {

        productModalTitle.textContent =
            "Edit Product";

    }


    if (productName) {

        productName.value =
            product.name || "";

    }


    if (productPrice) {

        productPrice.value =
            product.price ?? "";

    }


    if (productStock) {

        productStock.value =
            product.stock ?? 0;

        productStock.disabled =
            false;

    }


    if (productDescription) {

        productDescription.value =
            product.description || "";

    }


    if (productOutOfStock) {

        productOutOfStock.checked =
            product.outOfStock === true;

        productStock.disabled =
            productOutOfStock.checked;

    }


    renderExistingImages();


    if (newImagePreview) {

        newImagePreview.innerHTML =
            "";

    }


    clearFormMessage(
        productFormMessage
    );


    if (productModal) {

        productModal.classList.add(
            "active"
        );

        productModal.style.display =
            "flex";
    }
}


// ============================================================
// RENDER EXISTING IMAGES
// ============================================================

function renderExistingImages() {

    if (!existingImages) return;


    if (!existingProductImages.length) {

        existingImages.innerHTML =
            "";

        return;
    }


    existingImages.innerHTML =
        existingProductImages.map(
            (image, index) => `

                <div
                    class="existing-image-item"
                    data-index="${index}"
                >

                    <img
                        src="${escapeHTML(
                            image
                        )}"
                        alt="Product image"
                    >


                    <button
                        type="button"
                        class="remove-existing-image"
                        data-index="${index}"
                    >
                        ×
                    </button>

                </div>

            `
        ).join("");


    existingImages
        .querySelectorAll(
            ".remove-existing-image"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        existingProductImages.splice(
                            index,
                            1
                        );

                        renderExistingImages();

                    }
                );

            }
        );
}


// ============================================================
// CLOSE PRODUCT MODAL
// ============================================================

function closeProductModalWindow() {

    if (productModal) {

        productModal.classList.remove(
            "active"
        );

        productModal.style.display =
            "none";
    }

    editingProductId = null;

    existingProductImages = [];
}


if (closeProductModal) {

    closeProductModal.addEventListener(
        "click",
        closeProductModalWindow
    );

}


if (cancelProductBtn) {

    cancelProductBtn.addEventListener(
        "click",
        closeProductModalWindow
    );

}


if (productModal) {

    productModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                productModal
            ) {

                closeProductModalWindow();

            }

        }
    );

}


// ============================================================
// IMAGE PREVIEW
// ============================================================

if (productImages) {

    productImages.addEventListener(
        "change",
        () => {

            if (!newImagePreview)
                return;


            newImagePreview.innerHTML =
                "";


            const files =
                Array.from(
                    productImages.files || []
                );


            files.forEach(
                file => {

                    const reader =
                        new FileReader();


                    reader.onload =
                        event => {

                            const wrapper =
                                document.createElement(
                                    "div"
                                );


                            wrapper.className =
                                "new-image-preview-item";


                            wrapper.innerHTML = `
                                <img
                                    src="${event.target.result}"
                                    alt="New product image"
                                >
                            `;


                            newImagePreview.appendChild(
                                wrapper
                            );

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );

        }
    );

}


// ============================================================
// CLOUDINARY IMAGE UPLOAD
// ============================================================

async function uploadImageToCloudinary(
    file
) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    const response =
        await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "Cloudinary image upload failed."
        );

    }


    const data =
        await response.json();


    if (!data.secure_url) {

        throw new Error(
            "Cloudinary did not return an image URL."
        );

    }


    return data.secure_url;
}
// ============================================================
// SAVE / UPDATE PRODUCT
// ============================================================

if (productForm) {

    productForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearFormMessage(
                productFormMessage
            );

            createOutOfStockCheckbox();

            const name =
                productName?.value.trim();

            const price =
                Number(
                    productPrice?.value
                );

            const stock =
                productOutOfStock?.checked
                    ? 0
                    : Number(
                        productStock?.value
                    );

            const description =
                productDescription?.value.trim();

            const outOfStock =
                productOutOfStock?.checked === true;


            // --------------------------------------------------
            // VALIDATION
            // --------------------------------------------------

            if (!name) {

                showFormMessage(
                    productFormMessage,
                    "Enter product name."
                );

                return;
            }


            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                showFormMessage(
                    productFormMessage,
                    "Enter a valid price."
                );

                return;
            }


            if (
                Number.isNaN(stock) ||
                stock < 0
            ) {

                showFormMessage(
                    productFormMessage,
                    "Enter a valid stock quantity."
                );

                return;
            }


            if (!description) {

                showFormMessage(
                    productFormMessage,
                    "Enter product description."
                );

                return;
            }


            try {

                if (saveProductBtn) {

                    saveProductBtn.disabled =
                        true;

                    saveProductBtn.textContent =
                        "Saving...";
                }


                // ------------------------------------------------
                // UPLOAD NEW IMAGES
                // ------------------------------------------------

                const files =
                    Array.from(
                        productImages?.files || []
                    );

                const uploadedImages = [];


                for (
                    const file of files
                ) {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        continue;
                    }


                    if (
                        file.size >
                        10 * 1024 * 1024
                    ) {

                        throw new Error(
                            `${file.name} is larger than 10 MB.`
                        );
                    }


                    showFormMessage(
                        productFormMessage,
                        `Uploading ${file.name}...`,
                        "success"
                    );


                    const imageUrl =
                        await uploadImageToCloudinary(
                            file
                        );


                    uploadedImages.push(
                        imageUrl
                    );
                }


                const finalImages = [
                    ...existingProductImages,
                    ...uploadedImages
                ];


                // ------------------------------------------------
                // UPDATE EXISTING PRODUCT
                // ------------------------------------------------

                if (editingProductId) {

                    const productRef =
                        doc(
                            db,
                            "products",
                            editingProductId
                        );


                    await updateDoc(
                        productRef,
                        {

                            name,

                            price,

                            stock,

                            outOfStock,

                            description,

                            images:
                                finalImages,

                            updatedAt:
                                serverTimestamp()

                        }
                    );


                    showFormMessage(
                        productFormMessage,
                        "Product updated successfully.",
                        "success"
                    );

                }


                // ------------------------------------------------
                // ADD NEW PRODUCT
                // ------------------------------------------------

                else {

                    await addDoc(
                        collection(
                            db,
                            "products"
                        ),
                        {

                            name,

                            price,

                            stock,

                            outOfStock,

                            description,

                            images:
                                finalImages,

                            createdAt:
                                serverTimestamp(),

                            updatedAt:
                                serverTimestamp(),

                            createdBy:
                                currentAdmin?.uid || ""

                        }
                    );


                    showFormMessage(
                        productFormMessage,
                        "Product added successfully.",
                        "success"
                    );
                }


                // ------------------------------------------------
                // REFRESH PRODUCTS
                // ------------------------------------------------

                await loadProducts();

                updateDashboardStats();


                setTimeout(
                    () => {

                        closeProductModalWindow();

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Save product error:",
                    error
                );


                showFormMessage(
                    productFormMessage,
                    error.message ||
                    "Unable to save product."
                );


            } finally {

                if (saveProductBtn) {

                    saveProductBtn.disabled =
                        false;

                    saveProductBtn.textContent =
                        "Save Product";
                }
            }

        }
    );
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(
    productId
) {

    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) return;


    const confirmed =
        window.confirm(
            `Delete "${product.name}"? This action cannot be undone.`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "products",
                productId
            )
        );


        await loadProducts();

        updateDashboardStats();


        alert(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        alert(
            "Unable to delete product."
        );
    }
}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {

    if (!currentAdmin) return;


    try {

        if (adminOrdersLoading) {

            adminOrdersLoading.style.display =
                "flex";
        }


        const ordersRef =
            collection(
                db,
                "orders"
            );


        let snapshot;


        try {

            const ordersQuery =
                query(
                    ordersRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );


            snapshot =
                await getDocs(
                    ordersQuery
                );


        } catch {

            snapshot =
                await getDocs(
                    ordersRef
                );
        }


        orders = [];


        snapshot.forEach(
            orderDoc => {

                orders.push({

                    id:
                        orderDoc.id,

                    ...orderDoc.data()

                });

            }
        );


        renderOrders();

        updateDashboardStats();


    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );


        if (adminOrdersContainer) {

            adminOrdersContainer.innerHTML = `
                <div class="admin-error">
                    Unable to load orders.
                </div>
            `;
        }


    } finally {

        if (adminOrdersLoading) {

            adminOrdersLoading.style.display =
                "none";
        }
    }
}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders() {

    if (!adminOrdersContainer) return;


    const selectedStatus =
        orderStatusFilter?.value ||
        "all";


    let filteredOrders =
        [...orders];


    if (
        selectedStatus !==
        "all"
    ) {

        filteredOrders =
            filteredOrders.filter(
                order =>
                    order.orderStatus ===
                    selectedStatus
            );
    }


    if (!filteredOrders.length) {

        adminOrdersContainer.innerHTML =
            "";


        if (adminNoOrders) {

            adminNoOrders.style.display =
                "block";
        }

        return;
    }


    if (adminNoOrders) {

        adminNoOrders.style.display =
            "none";
    }


    adminOrdersContainer.innerHTML =
        filteredOrders.map(
            order => {

                const orderNumber =
                    order.orderNumber ||
                    order.id
                        .substring(
                            0,
                            8
                        )
                        .toUpperCase();


                const status =
                    order.orderStatus ||
                    "placed";


                const customerName =
                    order.customer?.name ||
                    order.customerName ||
                    order.name ||
                    "Customer";


                const customerPhone =
                    order.customer?.phone ||
                    order.customerPhone ||
                    order.phone ||
                    "-";


                const total =
                    Number(
                        order.total ||
                        order.totalAmount ||
                        0
                    );


                return `
                    <div
                        class="admin-order-card"
                        data-order-id="${escapeHTML(
                            order.id
                        )}"
                    >

                        <div class="admin-order-top">

                            <div>

                                <span class="order-label">
                                    Order
                                </span>

                                <h3>
                                    #${escapeHTML(
                                        orderNumber
                                    )}
                                </h3>

                            </div>


                            <span
                                class="order-status ${escapeHTML(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    formatOrderStatus(
                                        status
                                    )
                                )}
                            </span>

                        </div>


                        <div class="admin-order-info">

                            <div>

                                <span>
                                    Customer
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        customerName
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        customerPhone
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Total
                                </span>

                                <strong>
                                    ${formatPrice(
                                        total
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Date
                                </span>

                                <strong>
                                    ${formatDateTime(
                                        order.createdAt
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="admin-order-actions">

                            <button
                                type="button"
                                class="view-order-btn"
                                data-id="${escapeHTML(
                                    order.id
                                )}"
                            >
                                👁️ View Order
                            </button>


                            ${
                                status !==
                                "delivered"
                                    ? `
                                        <button
                                            type="button"
                                            class="deliver-order-btn"
                                            data-id="${escapeHTML(
                                                order.id
                                            )}"
                                        >
                                            📦 Delivery
                                        </button>
                                      `
                                    : `
                                        <span class="delivered-label">
                                            ✓ Delivered
                                        </span>
                                      `
                            }

                        </div>

                    </div>
                `;
            }
        ).join("");


    // ----------------------------------------------------------
    // VIEW ORDER
    // ----------------------------------------------------------

    adminOrdersContainer
        .querySelectorAll(
            ".view-order-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // ----------------------------------------------------------
    // DELIVERY
    // ----------------------------------------------------------

    adminOrdersContainer
        .querySelectorAll(
            ".deliver-order-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const order =
                            orders.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );

                        if (order) {

                            openDeliveryConfirmation(
                                order
                            );
                        }

                    }
                );

            }
        );
}


// ============================================================
// ORDER DETAILS MODAL
// ============================================================

function openOrderDetails(
    orderId
) {

    const order =
        orders.find(
            item =>
                item.id === orderId
        );


    if (!order) return;


    if (!orderModalContent) return;


    const orderNumber =
        order.orderNumber ||
        order.id
            .substring(
                0,
                8
            )
            .toUpperCase();


    const customer =
        order.customer ||
        {};


    const customerName =
        customer.name ||
        order.customerName ||
        order.name ||
        "Customer";


    const customerPhone =
        customer.phone ||
        order.customerPhone ||
        order.phone ||
        "-";


    const customerEmail =
        customer.email ||
        order.customerEmail ||
        order.email ||
        "-";


    const address =
        customer.address ||
        order.address ||
        order.deliveryAddress ||
        "-";


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    orderModalContent.innerHTML = `

        <div class="order-details">

            <div class="order-detail-header">

                <div>

                    <span>
                        Order
                    </span>

                    <h2>
                        #${escapeHTML(
                            orderNumber
                        )}
                    </h2>

                </div>


                <span class="order-status ${escapeHTML(
                    order.orderStatus ||
                    "placed"
                )}">
                    ${escapeHTML(
                        formatOrderStatus(
                            order.orderStatus ||
                            "placed"
                        )
                    )}
                </span>

            </div>


            <div class="order-customer-details">

                <h3>
                    Customer Details
                </h3>


                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(
                        customerName
                    )}
                </p>


                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(
                        customerPhone
                    )}
                </p>


                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(
                        customerEmail
                    )}
                </p>


                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(
                        address
                    )}
                </p>

            </div>


            <div class="order-items-section">

                <h3>
                    Ordered Products
                </h3>


                ${
                    items.length
                        ? items.map(
                            item => {

                                const itemName =
                                    item.name ||
                                    item.productName ||
                                    "Product";

                                const quantity =
                                    Number(
                                        item.quantity ||
                                        1
                                    );

                                const itemPrice =
                                    Number(
                                        item.price ||
                                        item.unitPrice ||
                                        0
                                    );

                                return `
                                    <div class="order-item-row">

                                        <div>

                                            <strong>
                                                ${escapeHTML(
                                                    itemName
                                                )}
                                            </strong>

                                            <span>
                                                Qty: ${quantity}
                                            </span>

                                        </div>


                                        <strong>
                                            ${formatPrice(
                                                itemPrice *
                                                quantity
                                            )}
                                        </strong>

                                    </div>
                                `;
                            }
                        ).join("")
                        : `
                            <p>
                                No product details available.
                            </p>
                          `
                }

            </div>


            <div class="order-total-section">

                <span>
                    Total Amount
                </span>

                <strong>
                    ${formatPrice(
                        order.total ||
                        order.totalAmount ||
                        0
                    )}
                </strong>

            </div>


            <div class="order-payment-section">

                <span>
                    Payment
                </span>

                <strong>
                    ${escapeHTML(
                        order.paymentMethod ||
                        order.paymentStatus ||
                        "Not specified"
                    )}
                </strong>

            </div>


            <div class="order-date-section">

                <span>
                    Ordered On
                </span>

                <strong>
                    ${formatDateTime(
                        order.createdAt
                    )}
                </strong>

            </div>

        </div>

    `;


    if (orderModal) {

        orderModal.style.display =
            "flex";
    }
}


// ============================================================
// CLOSE ORDER MODAL
// ============================================================

function closeOrderModalWindow() {

    if (orderModal) {

        orderModal.style.display =
            "none";
    }
}


if (closeOrderModal) {

    closeOrderModal.addEventListener(
        "click",
        closeOrderModalWindow
    );
}


// ============================================================
// ORDER FILTER
// ============================================================

if (orderStatusFilter) {

    orderStatusFilter.addEventListener(
        "change",
        () => {

            renderOrders();

        }
    );
}


// ============================================================
// REFRESH ORDERS
// ============================================================

if (refreshOrdersBtn) {

    refreshOrdersBtn.addEventListener(
        "click",
        async () => {

            await loadOrders();

        }
    );
}
// ============================================================
// DELIVERY CONFIRMATION
// ============================================================

function openDeliveryConfirmation(order) {

    selectedDeliveryOrder = order;

    if (!deliveryOrderInfo) {
        return;
    }

    const orderNumber =
        order.orderNumber ||
        order.id.substring(0, 8).toUpperCase();

    deliveryOrderInfo.innerHTML = `

        <div>
            <span>Order</span>

            <strong>
                #${escapeHTML(orderNumber)}
            </strong>
        </div>

        <div>
            <span>Customer</span>

            <strong>
                ${escapeHTML(
                    order.customer?.name ||
                    order.customerName ||
                    "-"
                )}
            </strong>
        </div>

        <div>
            <span>Total</span>

            <strong>
                ${formatPrice(
                    order.total ||
                    order.totalAmount ||
                    0
                )}
            </strong>
        </div>

    `;

    if (deliveryModal) {
        deliveryModal.style.display = "flex";
    }
}


// ============================================================
// CLOSE DELIVERY MODAL
// ============================================================

function closeDeliveryModalWindow() {

    if (deliveryModal) {
        deliveryModal.style.display = "none";
    }

    selectedDeliveryOrder = null;
}

// ============================================================
// CLOSE DELIVERY MODAL
// ============================================================

if (
    closeDeliveryModal &&
    typeof closeDeliveryModal.addEventListener === "function"
) {

    closeDeliveryModal.addEventListener(
        "click",
        closeDeliveryModalWindow
    );

}

// ============================================================
// CANCEL DELIVERY
// ============================================================

const cancelDeliveryBtn =
    document.getElementById(
        "cancelDeliveryBtn"
    ) ||
    document.getElementById(
        "cancelDeliveryModal"
    );

if (cancelDeliveryBtn) {

    cancelDeliveryBtn.addEventListener(
        "click",
        closeDeliveryModalWindow
    );

}


// ============================================================
// CONFIRM DELIVERY
// ============================================================

if (confirmDeliveryBtn) {

    confirmDeliveryBtn.addEventListener(
        "click",
        async () => {

            if (!selectedDeliveryOrder) {
                return;
            }

            const order =
                selectedDeliveryOrder;

            try {

                confirmDeliveryBtn.disabled =
                    true;

                confirmDeliveryBtn.textContent =
                    "Confirming...";


                const orderRef =
                    doc(
                        db,
                        "orders",
                        order.id
                    );


                await updateDoc(
                    orderRef,
                    {

                        orderStatus:
                            "delivered",

                        qrStatus:
                            "disabled",

                        deliveredAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                closeDeliveryModalWindow();

                scannedToken = null;


                if (scanResult) {

                    scanResult.innerHTML = `

                        <div class="scan-delivered">

                            <div class="scan-delivered-icon">
                                ✓
                            </div>

                            <span>
                                DELIVERY COMPLETED
                            </span>

                            <h3>
                                Order Delivered
                            </h3>

                            <p>
                                The QR code has been
                                permanently disabled.
                            </p>

                            <strong>
                                #${escapeHTML(
                                    order.orderNumber ||
                                    order.id
                                        .substring(0, 8)
                                        .toUpperCase()
                                )}
                            </strong>

                        </div>

                    `;
                }


                await loadOrders();

                updateDashboardStats();


            } catch (error) {

                console.error(
                    "Delivery confirmation error:",
                    error
                );

                alert(
                    "Unable to confirm delivery."
                );


            } finally {

                confirmDeliveryBtn.disabled =
                    false;

                confirmDeliveryBtn.textContent =
                    "Confirm Delivery";

            }

        }
    );

}


// ============================================================
// FORMAT ORDER STATUS
// ============================================================

function formatOrderStatus(status) {

    const map = {

        placed:
            "Order Placed",

        pending:
            "Pending",

        confirmed:
            "Confirmed",

        preparing:
            "Preparing",

        ready:
            "Ready for Delivery",

        out_for_delivery:
            "Out for Delivery",

        delivered:
            "Delivered",

        cancelled:
            "Cancelled"

    };


    return (
        map[status] ||
        String(status || "")
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            )
    );

}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateDashboardStats() {

    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    if (totalOrders) {

        totalOrders.textContent =
            orders.length;

    }


    const pendingCount =
        orders.filter(order => {

            const status =
                order.orderStatus ||
                "placed";

            return (
                status !== "delivered" &&
                status !== "cancelled"
            );

        }).length;


    if (pendingOrders) {

        pendingOrders.textContent =
            pendingCount;

    }


    let sales = 0;

    const today =
        new Date();

    orders.forEach(order => {

        const timestamp =
            order.createdAt;

        if (!timestamp) {
            return;
        }


        let orderDate;

        try {

            orderDate =
                timestamp.toDate
                    ? timestamp.toDate()
                    : new Date(timestamp);

        } catch {

            return;

        }


        if (
            orderDate.getDate() ===
            today.getDate() &&

            orderDate.getMonth() ===
            today.getMonth() &&

            orderDate.getFullYear() ===
            today.getFullYear()
        ) {

            const status =
                order.orderStatus ||
                "placed";


            if (status !== "cancelled") {

                sales += Number(
                    order.total ||
                    order.totalAmount ||
                    0
                );

            }

        }

    });


    if (todaySales) {

        todaySales.textContent =
            formatPrice(sales);

    }

}


// ============================================================
// QR SCANNER
// ============================================================

if (startScannerBtn) {

    startScannerBtn.addEventListener(
        "click",
        async () => {

            scannedToken = null;

            clearScanResult();

            await startQRScanner();

        }
    );

}


if (stopScannerBtn) {

    stopScannerBtn.addEventListener(
        "click",
        async () => {

            await stopQRScanner();

        }
    );

}


// ============================================================
// START QR SCANNER
// ============================================================

async function startQRScanner() {

    if (scannerRunning) {
        return;
    }


    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        showScannerMessage(
            "QR scanner library could not be loaded."
        );

        return;
    }


    try {

        clearScanResult();


        html5QrCode =
            new Html5Qrcode(
                "qr-reader"
            );


        const config = {

            fps: 10,

            qrbox: {
                width: 250,
                height: 250
            }

        };


        await html5QrCode.start(

            {
                facingMode:
                    "environment"
            },

            config,

            async decodedText => {

                await handleQRScan(
                    decodedText
                );

            },

            () => {

                // Normal scanner frame errors.

            }

        );


        scannerRunning = true;


        showScannerMessage(
            "Scanner is active. Scan the customer's QR code.",
            "success"
        );


    } catch (error) {

        console.error(
            "Scanner error:",
            error
        );


        showScannerMessage(
            "Unable to start camera. Please allow camera permission."
        );

    }

}


// ============================================================
// STOP QR SCANNER
// ============================================================

async function stopQRScanner() {

    if (
        !html5QrCode ||
        !scannerRunning
    ) {

        return;

    }


    try {

        await html5QrCode.stop();

        await html5QrCode.clear();

    } catch (error) {

        console.error(
            "Stop scanner error:",
            error
        );

    }


    html5QrCode = null;

    scannerRunning = false;


    showScannerMessage(
        "Scanner stopped."
    );

}


// ============================================================
// HANDLE QR SCAN
// ============================================================

async function handleQRScan(decodedText) {

    if (!decodedText) {
        return;
    }


    if (
        scannedToken ===
        decodedText
    ) {

        return;

    }


    scannedToken =
        decodedText;


    showScannerMessage(
        "QR detected. Verifying order...",
        "success"
    );


    await stopQRScanner();


    try {

        await verifyScannedQR(
            decodedText
        );

    } catch (error) {

        console.error(
            "QR verification error:",
            error
        );


        showScannerMessage(
            error.message ||
            "Unable to verify QR code."
        );


        scannedToken = null;

    }

}


// ============================================================
// VERIFY QR
// ============================================================

async function verifyScannedQR(qrToken) {

    const ordersRef =
        collection(
            db,
            "orders"
        );


    const snapshot =
        await getDocs(
            ordersRef
        );


    let matchedOrder = null;


    snapshot.forEach(
        orderDoc => {

            const order =
                orderDoc.data();


            if (
                order.qrToken ===
                qrToken
            ) {

                matchedOrder = {

                    id:
                        orderDoc.id,

                    ...order

                };

            }

        }
    );


    if (!matchedOrder) {

        renderScanError(
            "Invalid QR Code",
            "This QR code does not belong to a valid Cravings order."
        );

        return;

    }


    if (
        matchedOrder.qrStatus ===
            "used" ||

        matchedOrder.qrStatus ===
            "disabled" ||

        matchedOrder.orderStatus ===
            "delivered"
    ) {

        renderScanError(
            "QR Already Used",
            "This order has already been delivered or the QR code is disabled."
        );

        return;

    }


    renderScanSuccess(
        matchedOrder
    );

}
// ============================================================
// SCAN SUCCESS
// ============================================================

function renderScanSuccess(order) {

    if (!scanResult) return;


    const orderNumber =
        order.orderNumber ||
        order.id
            .substring(0, 8)
            .toUpperCase();


    scanResult.innerHTML = `

        <div class="scan-success">

            <div class="scan-success-icon">
                ✓
            </div>


            <span class="scan-valid-label">
                VALID ORDER
            </span>


            <h3>
                #${escapeHTML(orderNumber)}
            </h3>


            <div class="scan-customer">

                <strong>

                    ${escapeHTML(
                        order.customer?.name ||
                        order.customerName ||
                        "Customer"
                    )}

                </strong>


                <span>

                    📞

                    ${escapeHTML(
                        order.customer?.phone ||
                        order.customerPhone ||
                        "-"
                    )}

                </span>

            </div>


            <div class="scan-order-total">

                <span>
                    Order Total
                </span>


                <strong>

                    ${formatPrice(
                        order.total ||
                        order.totalAmount ||
                        0
                    )}

                </strong>

            </div>


            <div class="scan-order-status">

                <span>
                    Status
                </span>


                <strong>

                    ${formatOrderStatus(
                        order.orderStatus ||
                        "placed"
                    )}

                </strong>

            </div>


            <button
                type="button"
                class="primary-btn scan-deliver-btn"
                id="scanDeliverBtn">

                ✓ Confirm Delivery

            </button>


            <button
                type="button"
                class="secondary-btn scan-view-btn"
                id="scanViewOrderBtn">

                View Full Order

            </button>

        </div>

    `;


    const deliverButton =
        document.getElementById(
            "scanDeliverBtn"
        );


    if (deliverButton) {

        deliverButton.addEventListener(
            "click",
            () => {

                openDeliveryConfirmation(
                    order
                );

            }
        );

    }


    const viewButton =
        document.getElementById(
            "scanViewOrderBtn"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            () => {

                openOrderDetails(
                    order.id
                );

            }
        );

    }

}


// ============================================================
// SCAN ERROR
// ============================================================

function renderScanError(
    title,
    message
) {

    if (!scanResult) return;


    scanResult.innerHTML = `

        <div class="scan-error">

            <div class="scan-error-icon">
                !
            </div>


            <span>
                INVALID
            </span>


            <h3>
                ${escapeHTML(title)}
            </h3>


            <p>
                ${escapeHTML(message)}
            </p>


            <button
                type="button"
                class="secondary-btn"
                id="scanAgainBtn">

                Scan Again

            </button>

        </div>

    `;


    const scanAgain =
        document.getElementById(
            "scanAgainBtn"
        );


    if (scanAgain) {

        scanAgain.addEventListener(
            "click",
            () => {

                scannedToken = null;

                clearScanResult();

                startQRScanner();

            }
        );

    }

}

// ============================================================
// CLOSE MODALS OUTSIDE CLICK
// ============================================================

const allModals = [

    productModal,

    orderModal,

    deliveryModal

];


allModals.forEach(
    modal => {

        if (!modal) return;


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.style.display =
                        "none";

                }

            }
        );

    }
);


// ============================================================
// ESC KEY
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        allModals.forEach(
            modal => {

                if (modal) {

                    modal.style.display =
                        "none";

                }

            }
        );

    }
);


// ============================================================
// INITIAL DASHBOARD
// ============================================================

updateDashboardStats();


// ============================================================
// END ADMIN.JS
// ============================================================