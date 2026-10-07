
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileAvatar =
    document.getElementById("profileAvatar");

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const accountStatus =
    document.getElementById("accountStatus");

const ordersContainer =
    document.getElementById("ordersContainer");

const ordersLoading =
    document.getElementById("ordersLoading");

const noOrders =
    document.getElementById("noOrders");

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");

const profileMessage =
    document.getElementById("profileMessage");

const profileOrderModal =
    document.getElementById("profileOrderModal");

const profileOrderDetails =
    document.getElementById("profileOrderDetails");

const closeProfileOrderModal =
    document.getElementById("closeProfileOrderModal");

const closeProfileOrderModalBtn =
    document.getElementById(
        "closeProfileOrderModalBtn"
    );


/* =========================================================
   CURRENT USER
========================================================= */

let currentUser = null;


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    currentUser = user;

    await loadCustomerProfile();

    await loadMyOrders();

});


/* =========================================================
   LOAD CUSTOMER PROFILE
========================================================= */

async function loadCustomerProfile() {

    if (!currentUser) return;

    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const userSnap =
            await getDoc(userRef);


        let name =
  
    currentUser.email?.split("@")[0] ||
    "Customer";

let email =
    currentUser.email ||
    "";

if (userSnap.exists()) {

    const data =
        userSnap.data();

    name =
        data.name ||
        name;

    email =
        data.email ||
        email;
}

        /* ============================================
           SIDEBAR
        ============================================ */

        if (profileName) {

            profileName.textContent =
                name;

        }


        if (profileEmail) {

            profileEmail.textContent =
                email;

        }


        /* ============================================
           ACCOUNT
        ============================================ */

        if (accountName) {

            accountName.textContent =
                name;

        }


        if (accountEmail) {

            accountEmail.textContent =
                email;

        }


        if (accountStatus) {

            accountStatus.textContent =
                "Active";

        }


        /* ============================================
           AVATAR
        ============================================ */

        if (profileAvatar) {

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();

            profileAvatar.textContent =
                firstLetter || "U";

        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showProfileMessage(
            "Unable to load profile information.",
            "error"
        );

    }

}


/* =========================================================
   LOAD MY ORDERS
========================================================= */

async function loadMyOrders() {

    if (!currentUser) return;


    showOrdersLoading();


    try {

        
        const ordersQuery =
            query(
                collection(db, "orders"),
                where(
                    "userId",
                    "==",
                    currentUser.uid
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                ordersQuery
            );


        const orders = [];


        snapshot.forEach((orderDoc) => {

            orders.push({
                id: orderDoc.id,
                ...orderDoc.data()
            });

        });


        hideOrdersLoading();


        if (orders.length === 0) {

            showNoOrders();

            return;

        }


        hideNoOrders();

        renderOrders(orders);


    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );


        hideOrdersLoading();



        if (
            error.code ===
            "failed-precondition"
        ) {

            showProfileMessage(
                "Firebase needs a Firestore index for your orders. Check the browser console for the Firebase index link.",
                "error"
            );

        } else {

            showProfileMessage(
                "Unable to load your orders. Please try again.",
                "error"
            );

        }

    }

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(orders) {

    if (!ordersContainer) return;


    ordersContainer.innerHTML = "";


    orders.forEach((order) => {

        const card =
            createOrderCard(order);

        ordersContainer.appendChild(
            card
        );

    });

}


/* =========================================================
   CREATE ORDER CARD
========================================================= */

function createOrderCard(order) {

    const card =
        document.createElement("div");

    card.className =
        "order-card";


    const orderStatus =
        normalizeStatus(
            order.orderStatus ||
            order.status ||
            "pending"
        );


    const paymentMethod =
        normalizePaymentMethod(
            order.paymentMethod
        );


    const paymentStatus =
        normalizePaymentStatus(
            order.paymentStatus
        );


    const total =
        formatCurrency(
            order.total || 0
        );


    const itemCount =
        calculateItemCount(
            order.items
        );


    const orderDate =
        formatDate(
            order.createdAt
        );


    const qrStatus =
        order.qrStatus ||
        "active";


    const qrText =
        qrStatus === "disabled"
            ? "QR Disabled"
            : "QR Active";


    card.innerHTML = `

        <div class="order-top">

            <div>

                <div class="order-id">
                    Order #${escapeHTML(
                        shortOrderId(order.id)
                    )}
                </div>

                <small style="
                    color:#746c66;
                    font-size:11px;
                ">
                    ${escapeHTML(orderDate)}
                </small>

            </div>

            <span class="
                status-badge
                status-${statusClass(orderStatus)}
            ">
                ${escapeHTML(
                    formatStatus(orderStatus)
                )}
            </span>

        </div>


        <div class="order-details-grid">


            <div class="order-detail-box">

                <label>
                    Items
                </label>

                <strong>
                    ${itemCount}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Total
                </label>

                <strong>
                    ${escapeHTML(total)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Payment
                </label>

                <strong>
                    ${escapeHTML(paymentMethod)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Payment Status
                </label>

                <strong>
                    ${escapeHTML(paymentStatus)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Delivery QR
                </label>

                <strong>
                    ${escapeHTML(qrText)}
                </strong>

            </div>


        </div>


        <div style="
            display:flex;
            justify-content:flex-end;
            margin-top:15px;
        ">

            <button
                type="button"
                class="btn btn-outline btn-sm"
                data-order-id="${escapeHTML(order.id)}">

                View Order

            </button>

        </div>

    `;


    const viewButton =
        card.querySelector(
            "[data-order-id]"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            () => {

                openOrderDetails(order);

            }
        );

    }


    return card;

}


/* =========================================================
   OPEN ORDER DETAILS
========================================================= */

function openOrderDetails(order) {

    if (
        !profileOrderModal ||
        !profileOrderDetails
    ) {
        return;
    }


    const status =
        normalizeStatus(
            order.orderStatus ||
            order.status ||
            "pending"
        );


    const paymentMethod =
        normalizePaymentMethod(
            order.paymentMethod
        );


    const paymentStatus =
        normalizePaymentStatus(
            order.paymentStatus
        );


    const qrStatus =
        order.qrStatus ||
        "active";


    const total =
        formatCurrency(
            order.total || 0
        );


    const orderDate =
        formatDate(
            order.createdAt
        );


    const customerName =
        order.customerName ||
        currentUser?.displayName ||
        "Customer";


    const phone =
        order.customerPhone ||
        order.phone ||
        "Not available";


    const address =
        buildAddress(order);


    profileOrderDetails.innerHTML = `

        <div class="order-details-grid">


            <div class="order-detail-box">

                <label>
                    Order ID
                </label>

                <strong>
                    ${escapeHTML(order.id)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Date
                </label>

                <strong>
                    ${escapeHTML(orderDate)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Customer
                </label>

                <strong>
                    ${escapeHTML(customerName)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Phone
                </label>

                <strong>
                    ${escapeHTML(phone)}
                </strong>

            </div>


            <div class="order-detail-box full">

                <label>
                    Delivery Address
                </label>

                <strong>
                    ${escapeHTML(address)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Order Status
                </label>

                <strong>
                    ${escapeHTML(
                        formatStatus(status)
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Payment Method
                </label>

                <strong>
                    ${escapeHTML(paymentMethod)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    Payment Status
                </label>

                <strong>
                    ${escapeHTML(paymentStatus)}
                </strong>

            </div>


            <div class="order-detail-box">

                <label>
                    QR Status
                </label>

                <strong>
                    ${escapeHTML(
                        qrStatus === "disabled"
                            ? "Disabled - Delivered"
                            : "Active"
                    )}
                </strong>

            </div>


            <div class="order-detail-box full">

                <label>
                    Ordered Items
                </label>

                <div class="order-items-list">

                    ${renderOrderItems(
                        order.items
                    )}

                </div>

            </div>


            <div class="order-detail-box full">

                <label>
                    Total Amount
                </label>

                <strong style="
                    font-size:20px;
                    color:#b88a44;
                ">
                    ${escapeHTML(total)}
                </strong>

            </div>


        </div>

    `;


    profileOrderModal.classList.add(
        "show"
    );

    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   RENDER ORDER ITEMS
========================================================= */

function renderOrderItems(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return `
            <div style="
                color:#746c66;
                font-size:12px;
            ">
                No item details available.
            </div>
        `;

    }


    return items.map((item) => {

        const name =
            item.name ||
            "Product";


        const quantity =
            Number(
                item.quantity || 1
            );


        const price =
            Number(
                item.price || 0
            );


        const subtotal =
            price * quantity;


        return `

            <div class="order-item-row">

                <span>
                    ${escapeHTML(name)}
                    × ${quantity}
                </span>

                <strong>
                    ${escapeHTML(
                        formatCurrency(subtotal)
                    )}
                </strong>

            </div>

        `;

    }).join("");

}


/* =========================================================
   BUILD ADDRESS
========================================================= */

function buildAddress(order) {

    if (
        order.customerAddress
    ) {

        const parts = [

            order.customerAddress,

            order.customerCity,

            order.customerPincode,

            order.customerLandmark

        ].filter(Boolean);


        return parts.join(", ");

    }


    if (order.address) {

        return order.address;

    }


    return "Address not available";

}


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

function closeOrderModal() {

    if (!profileOrderModal) return;

    profileOrderModal.classList.remove(
        "show"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


closeProfileOrderModal?.addEventListener(
    "click",
    closeOrderModal
);


closeProfileOrderModalBtn?.addEventListener(
    "click",
    closeOrderModal
);


profileOrderModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            profileOrderModal
        ) {

            closeOrderModal();

        }

    }
);


/* =========================================================
   REFRESH ORDERS
========================================================= */

refreshOrdersBtn?.addEventListener(
    "click",
    async () => {

        await loadMyOrders();

    }
);


/* =========================================================
   LOGOUT
========================================================= */

window.logoutUser = async function () {

    try {

        await signOut(auth);

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showProfileMessage(
            "Unable to logout. Please try again.",
            "error"
        );

    }

};


/* =========================================================
   LOADING
========================================================= */

function showOrdersLoading() {

    ordersLoading?.classList.remove(
        "hidden"
    );

    noOrders?.classList.add(
        "hidden"
    );

    if (ordersContainer) {

        ordersContainer.innerHTML = "";

    }

}


function hideOrdersLoading() {

    ordersLoading?.classList.add(
        "hidden"
    );

}


function showNoOrders() {

    noOrders?.classList.remove(
        "hidden"
    );

}


function hideNoOrders() {

    noOrders?.classList.add(
        "hidden"
    );

}


/* =========================================================
   PROFILE MESSAGE
========================================================= */

function showProfileMessage(
    message,
    type = "error"
) {

    if (!profileMessage) return;


    profileMessage.textContent =
        message;


    profileMessage.className =
        `message show ${type}`;


    setTimeout(() => {

        profileMessage.classList.remove(
            "show"
        );

    }, 5000);

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(status) {

    return String(status || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

}


function statusClass(status) {

    const allowed = [

        "pending",
        "confirmed",
        "preparing",
        "out-for-delivery",
        "delivered",
        "cancelled"

    ];


    if (
        allowed.includes(status)
    ) {

        return status;

    }


    return "pending";

}


function formatStatus(status) {

    return String(status || "pending")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );

}


/* =========================================================
   PAYMENT HELPERS
========================================================= */

function normalizePaymentMethod(
    method
) {

    const value =
        String(
            method || "unknown"
        ).toLowerCase();


    if (
        value === "cod" ||
        value === "cash_on_delivery" ||
        value === "cash on delivery"
    ) {

        return "Cash on Delivery";

    }


    if (
        value === "online" ||
        value === "online_payment"
    ) {

        return "Online Payment";

    }


    return "Not available";

}


function normalizePaymentStatus(
    status
) {

    const value =
        String(
            status || "pending"
        ).toLowerCase();


    if (
        value === "paid" ||
        value === "captured"
    ) {

        return "Paid";

    }


    if (
        value === "failed"
    ) {

        return "Failed";

    }


    return "Pending";

}


/* =========================================================
   ITEM COUNT
========================================================= */

function calculateItemCount(items) {

    if (
        !Array.isArray(items)
    ) {

        return 0;

    }


    return items.reduce(
        (total, item) => {

            return total +
                Number(
                    item.quantity || 0
                );

        },
        0
    );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {

        return "Date not available";

    }


    try {

        let date;


        if (
            timestamp.toDate &&
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        } else if (
            timestamp.seconds
        ) {

            date =
                new Date(
                    timestamp.seconds * 1000
                );

        } else {

            date =
                new Date(timestamp);

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Date not available";

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

    } catch (error) {

        return "Date not available";

    }

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount) {

    const value =
        Number(amount || 0);


    return value.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   SHORT ORDER ID
========================================================= */

function shortOrderId(id) {

    const value =
        String(id || "");


    if (
        value.length <= 12
    ) {

        return value;

    }


    return value.substring(
        0,
        12
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   GLOBAL HELPERS
========================================================= */

window.loadMyOrders =
    loadMyOrders;

window.loadCustomerProfile =
    loadCustomerProfile;

window.showProfileTab =
    window.showProfileTab ||
    function(tab) {

        const profilePanel =
            document.getElementById(
                "profilePanel"
            );

        const ordersPanel =
            document.getElementById(
                "ordersPanel"
            );

        const profileBtn =
            document.getElementById(
                "profileTabBtn"
            );

        const ordersBtn =
            document.getElementById(
                "ordersTabBtn"
            );


        if (tab === "orders") {

            profilePanel?.classList.add(
                "hidden"
            );

            ordersPanel?.classList.remove(
                "hidden"
            );

            profileBtn?.classList.remove(
                "active"
            );

            ordersBtn?.classList.add(
                "active"
            );

        } else {

            ordersPanel?.classList.add(
                "hidden"
            );

            profilePanel?.classList.remove(
                "hidden"
            );

            ordersBtn?.classList.remove(
                "active"
            );

            profileBtn?.classList.add(
                "active"
            );

        }

    };