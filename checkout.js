// ============================================================
// BADAM MILK SHOP
// CHECKOUT SYSTEM
// COD + ONLINE PAYMENT
// SECURE BACKEND READY
// ============================================================

"use strict";

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ------------------------------------------------------------
// GLOBAL VARIABLES
// ------------------------------------------------------------

let currentUser = null;
let cart = [];


// ------------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------------

const checkoutForm = document.getElementById("checkoutForm");

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerAddress = document.getElementById("customerAddress");
const customerCity = document.getElementById("customerCity");
const customerPincode = document.getElementById("customerPincode");
const customerLandmark = document.getElementById("customerLandmark");

const checkoutItems = document.getElementById("checkoutItems");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutTotal = document.getElementById("checkoutTotal");

const onlinePayment = document.getElementById("onlinePayment");
const codPayment = document.getElementById("codPayment");

const paymentNotice = document.getElementById("paymentNotice");
const checkoutMessage = document.getElementById("checkoutMessage");
const placeOrderButton = document.getElementById("placeOrderButton");


// ------------------------------------------------------------
// CART
// ------------------------------------------------------------

function getCart() {

    try {

        return JSON.parse(
            localStorage.getItem("badamMilkCart")
        ) || [];

    } catch (error) {

        console.error("Cart error:", error);

        return [];
    }
}


// ------------------------------------------------------------
// SAVE CART
// ------------------------------------------------------------

function saveCart(items) {

    localStorage.setItem(
        "badamMilkCart",
        JSON.stringify(items)
    );
}


// ------------------------------------------------------------
// FORMAT PRICE
// ------------------------------------------------------------

function formatPrice(price) {

    return "₹" + Number(price || 0).toLocaleString("en-IN");
}


// ------------------------------------------------------------
// ESCAPE HTML
// ------------------------------------------------------------

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ------------------------------------------------------------
// SHOW MESSAGE
// ------------------------------------------------------------

function showMessage(message, type = "error") {

    if (!checkoutMessage) return;

    checkoutMessage.textContent = message;

    checkoutMessage.className =
        "checkout-message " + type;

    checkoutMessage.style.display = "block";
}


// ------------------------------------------------------------
// HIDE MESSAGE
// ------------------------------------------------------------

function hideMessage() {

    if (!checkoutMessage) return;

    checkoutMessage.textContent = "";

    checkoutMessage.style.display = "none";
}


// ------------------------------------------------------------
// AUTH STATE
// ------------------------------------------------------------

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        currentUser = null;

        window.location.href =
            "login.html?redirect=checkout.html";

        return;
    }

    currentUser = user;

    await loadCustomerDetails();

    cart = getCart();

    if (!cart.length) {

        showMessage(
            "Your cart is empty. Please add a product first.",
            "error"
        );

        if (placeOrderButton) {
            placeOrderButton.disabled = true;
        }

        return;
    }

    renderCheckoutItems();
});


// ------------------------------------------------------------
// LOAD CUSTOMER DETAILS
// ------------------------------------------------------------

async function loadCustomerDetails() {

    if (!currentUser) return;

    try {

        const userRef =
            doc(db, "users", currentUser.uid);

        const userSnap =
            await getDoc(userRef);

        if (userSnap.exists()) {

            const data = userSnap.data();

            if (customerName && data.name) {
                customerName.value = data.name;
            }

        }

    } catch (error) {

        console.error(
            "Unable to load customer details:",
            error
        );
    }
}


// ------------------------------------------------------------
// RENDER CHECKOUT ITEMS
// ------------------------------------------------------------

function renderCheckoutItems() {

    if (!checkoutItems) return;

    if (!cart.length) {

        checkoutItems.innerHTML = `
            <div class="empty-checkout">
                Your cart is empty.
            </div>
        `;

        return;
    }

    let subtotal = 0;

    checkoutItems.innerHTML = cart.map(item => {

        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 1);

        const itemTotal = price * quantity;

        subtotal += itemTotal;

        const image =
            item.image ||
            "images/default-product.jpg";

        return `
            <div class="checkout-product">

                <div class="checkout-product-image">
                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.src='images/default-product.jpg'"
                    >
                </div>

                <div class="checkout-product-info">

                    <h4>
                        ${escapeHTML(item.name)}
                    </h4>

                    <p>
                        ${formatPrice(price)}
                        × ${quantity}
                    </p>

                </div>

                <strong>
                    ${formatPrice(itemTotal)}
                </strong>

            </div>
        `;

    }).join("");

    if (checkoutSubtotal) {

        checkoutSubtotal.textContent =
            formatPrice(subtotal);
    }

    if (checkoutTotal) {

        checkoutTotal.textContent =
            formatPrice(subtotal);
    }
}


// ------------------------------------------------------------
// PAYMENT METHOD CHANGE
// ------------------------------------------------------------

function updatePaymentNotice() {

    if (!paymentNotice) return;

    if (onlinePayment && onlinePayment.checked) {

        paymentNotice.innerHTML = `
            <div class="payment-info online-info">
                <strong>Secure Online Payment</strong>
                <p>
                    You will be redirected to secure Razorpay
                    checkout to complete your payment.
                </p>
            </div>
        `;

    } else {

        paymentNotice.innerHTML = `
            <div class="payment-info cod-info">
                <strong>Cash on Delivery</strong>
                <p>
                    Pay when your order is delivered.
                </p>
            </div>
        `;
    }
}


// ------------------------------------------------------------
// PAYMENT LISTENERS
// ------------------------------------------------------------

if (onlinePayment) {

    onlinePayment.addEventListener(
        "change",
        updatePaymentNotice
    );
}

if (codPayment) {

    codPayment.addEventListener(
        "change",
        updatePaymentNotice
    );
}

updatePaymentNotice();


// ------------------------------------------------------------
// VALIDATE FORM
// ------------------------------------------------------------

function validateForm() {

    const name =
        customerName?.value.trim();

    const phone =
        customerPhone?.value.trim();

    const address =
        customerAddress?.value.trim();

    const city =
        customerCity?.value.trim();

    const pincode =
        customerPincode?.value.trim();

    if (!name) {

        showMessage(
            "Please enter your name."
        );

        customerName?.focus();

        return false;
    }


    if (!/^[0-9]{10}$/.test(phone)) {

        showMessage(
            "Please enter a valid 10-digit mobile number."
        );

        customerPhone?.focus();

        return false;
    }


    if (!address) {

        showMessage(
            "Please enter your delivery address."
        );

        customerAddress?.focus();

        return false;
    }


    if (!city) {

        showMessage(
            "Please enter your city."
        );

        customerCity?.focus();

        return false;
    }


    if (!/^[0-9]{6}$/.test(pincode)) {

        showMessage(
            "Please enter a valid 6-digit pincode."
        );

        customerPincode?.focus();

        return false;
    }


    if (
        !onlinePayment?.checked &&
        !codPayment?.checked
    ) {

        showMessage(
            "Please select a payment method."
        );

        return false;
    }


    if (!cart.length) {

        showMessage(
            "Your cart is empty."
        );

        return false;
    }


    return true;
}


// ------------------------------------------------------------
// GET CUSTOMER DATA
// ------------------------------------------------------------

function getCustomerData() {

    return {

        name:
            customerName?.value.trim() || "",

        phone:
            customerPhone?.value.trim() || "",

        address:
            customerAddress?.value.trim() || "",

        city:
            customerCity?.value.trim() || "",

        pincode:
            customerPincode?.value.trim() || "",

        landmark:
            customerLandmark?.value.trim() || ""

    };
}


// ------------------------------------------------------------
// DISABLE BUTTON
// ------------------------------------------------------------

function setLoading(isLoading) {

    if (!placeOrderButton) return;

    placeOrderButton.disabled = isLoading;

    if (isLoading) {

        placeOrderButton.dataset.oldText =
            placeOrderButton.textContent;

        placeOrderButton.textContent =
            "Processing...";

    } else {

        placeOrderButton.textContent =
            placeOrderButton.dataset.oldText ||
            "Place Order";
    }
}


// ------------------------------------------------------------
// CREATE COD ORDER
// ------------------------------------------------------------

async function createCODOrder(customerData) {

    const response = await fetch(
        "/api/create-cod-order",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                userId: currentUser.uid,

                customer: customerData,

                items: cart

            })
        }
    );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Unable to place COD order."
        );
    }


    return data;
}


// ------------------------------------------------------------
// LOAD RAZORPAY SCRIPT
// ------------------------------------------------------------

function loadRazorpay() {

    return new Promise(
        (resolve, reject) => {

            if (window.Razorpay) {

                resolve();

                return;
            }


            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve();

            script.onerror = () => {

                reject(
                    new Error(
                        "Unable to load Razorpay."
                    )
                );
            };

            document.body.appendChild(script);
        }
    );
}


// ------------------------------------------------------------
// CREATE ONLINE PAYMENT
// ------------------------------------------------------------

async function createOnlinePayment(
    customerData
) {

    await loadRazorpay();


    // --------------------------------------------------------
    // ASK BACKEND TO CREATE RAZORPAY ORDER
    // --------------------------------------------------------

    const response = await fetch(
        "/api/create-payment-order",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                userId: currentUser.uid,

                customer: customerData,

                items: cart

            })
        }
    );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Unable to start online payment."
        );
    }


    // --------------------------------------------------------
    // RAZORPAY CHECKOUT
    // --------------------------------------------------------

    return new Promise(
        (resolve, reject) => {

            const options = {

                key: data.keyId,

                amount: data.amount,

                currency:
                    data.currency || "INR",

                name:
                    data.businessName ||
                    "Badam Milk",

                description:
                    "Badam Milk Order",

                order_id:
                    data.razorpayOrderId,

                prefill: {

                    name:
                        customerData.name,

                    contact:
                        customerData.phone,

                    email:
                        currentUser.email || ""

                },

                theme: {

                    color: "#b58b45"

                },


                handler:
                    async function (paymentResponse) {

                        try {

                            const verifyResponse =
                                await fetch(
                                    "/api/verify-payment",
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify({

                                                userId:
                                                    currentUser.uid,

                                                customer:
                                                    customerData,

                                                items:
                                                    cart,

                                                razorpayOrderId:
                                                    paymentResponse
                                                        .razorpay_order_id,

                                                razorpayPaymentId:
                                                    paymentResponse
                                                        .razorpay_payment_id,

                                                razorpaySignature:
                                                    paymentResponse
                                                        .razorpay_signature

                                            })
                                    }
                                );


                            const verifyData =
                                await verifyResponse.json();


                            if (!verifyResponse.ok) {

                                throw new Error(
                                    verifyData.message ||
                                    "Payment verification failed."
                                );
                            }


                            resolve(
                                verifyData
                            );

                        } catch (error) {

                            reject(error);
                        }
                    },


                modal: {

                    ondismiss:
                        function () {

                            reject(
                                new Error(
                                    "Payment was cancelled."
                                )
                            );
                        }
                }

            };


            const razorpay =
                new window.Razorpay(options);


            razorpay.on(
                "payment.failed",
                function (response) {

                    reject(
                        new Error(
                            response.error?.description ||
                            "Payment failed."
                        )
                    );
                }
            );


            razorpay.open();
        }
    );
}


// ------------------------------------------------------------
// SUCCESS
// ------------------------------------------------------------

function handleOrderSuccess(data) {

    // Clear cart only after backend confirms order.
    saveCart([]);

    localStorage.removeItem(
        "badamMilkCart"
    );


    const orderId =
        data.orderId || "";


    // Small success message
    showMessage(
        "Order placed successfully!",
        "success"
    );


    setTimeout(() => {

        if (orderId) {

            window.location.href =
                `profile.html?orderId=${encodeURIComponent(orderId)}`;

        } else {

            window.location.href =
                "profile.html";
        }

    }, 1000);
}


// ------------------------------------------------------------
// SUBMIT CHECKOUT
// ------------------------------------------------------------

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage();


            if (!currentUser) {

                window.location.href =
                    "login.html?redirect=checkout.html";

                return;
            }


            if (!validateForm()) {

                return;
            }


            const customerData =
                getCustomerData();


            setLoading(true);


            try {

                let result;


                // ------------------------------------------------
                // COD
                // ------------------------------------------------

                if (
                    codPayment &&
                    codPayment.checked
                ) {

                    result =
                        await createCODOrder(
                            customerData
                        );

                }


                // ------------------------------------------------
                // ONLINE PAYMENT
                // ------------------------------------------------

                else if (
                    onlinePayment &&
                    onlinePayment.checked
                ) {

                    result =
                        await createOnlinePayment(
                            customerData
                        );

                }


                else {

                    throw new Error(
                        "Please select a payment method."
                    );
                }


                handleOrderSuccess(result);


            } catch (error) {

                console.error(
                    "Checkout error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to place your order. Please try again."
                );

            } finally {

                setLoading(false);
            }

        }
    );
}


// ------------------------------------------------------------
// GLOBAL FUNCTIONS
// ------------------------------------------------------------

window.getCheckoutCart = getCart;

window.updateCheckoutPayment =
    updatePaymentNotice;


// ============================================================
// END OF CHECKOUT.JS
// ============================================================