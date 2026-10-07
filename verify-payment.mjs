// ============================================================
// CRAVINGS - VERIFY RAZORPAY PAYMENT
// Netlify Function
// ============================================================

import crypto from "node:crypto";

import {
    initializeApp,
    cert,
    getApps
} from "firebase-admin/app";

import {
    getFirestore,
    FieldValue
} from "firebase-admin/firestore";


// ------------------------------------------------------------
// FIREBASE ADMIN
// ------------------------------------------------------------

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env.FIREBASE_PRIVATE_KEY
                    ?.replace(/\\n/g, "\n")
        })
    });
}

const db = getFirestore();


// ------------------------------------------------------------
// RESPONSE HELPER
// ------------------------------------------------------------

function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );
}


// ------------------------------------------------------------
// MAIN FUNCTION
// ------------------------------------------------------------

export default async (request) => {

    // --------------------------------------------------------
    // ONLY POST
    // --------------------------------------------------------

    if (request.method !== "POST") {
        return jsonResponse(
            {
                message:
                    "Method not allowed."
            },
            405
        );
    }


    try {

        // ----------------------------------------------------
        // CHECK RAZORPAY KEYS
        // ----------------------------------------------------

        const keyId =
            process.env.RAZORPAY_KEY_ID;

        const keySecret =
            process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {

            return jsonResponse(
                {
                    message:
                        "Razorpay configuration is missing."
                },
                500
            );
        }


        // ----------------------------------------------------
        // READ REQUEST
        // ----------------------------------------------------

        const body =
            await request.json();

        const userId =
            body?.userId;

        const customer =
            body?.customer || {};

        const items =
            Array.isArray(body?.items)
                ? body.items
                : [];

        const razorpayOrderId =
            body?.razorpayOrderId;

        const razorpayPaymentId =
            body?.razorpayPaymentId;

        const razorpaySignature =
            body?.razorpaySignature;


        // ----------------------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------------------

        if (!userId) {

            return jsonResponse(
                {
                    message:
                        "User ID is required."
                },
                400
            );
        }

        if (!razorpayOrderId) {

            return jsonResponse(
                {
                    message:
                        "Razorpay order ID is missing."
                },
                400
            );
        }

        if (!razorpayPaymentId) {

            return jsonResponse(
                {
                    message:
                        "Razorpay payment ID is missing."
                },
                400
            );
        }

        if (!razorpaySignature) {

            return jsonResponse(
                {
                    message:
                        "Razorpay signature is missing."
                },
                400
            );
        }

        if (!items.length) {

            return jsonResponse(
                {
                    message:
                        "Order items are missing."
                },
                400
            );
        }


        // ----------------------------------------------------
        // VERIFY RAZORPAY SIGNATURE
        // ----------------------------------------------------

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    keySecret
                )
                .update(
                    `${razorpayOrderId}|${razorpayPaymentId}`
                )
                .digest("hex");


        // Make sure both signatures have
        // the same length before timingSafeEqual

        const generatedBuffer =
            Buffer.from(
                generatedSignature,
                "utf8"
            );

        const receivedBuffer =
            Buffer.from(
                razorpaySignature,
                "utf8"
            );


        if (
            generatedBuffer.length !==
            receivedBuffer.length
        ) {

            console.error(
                "Invalid Razorpay signature."
            );

            return jsonResponse(
                {
                    message:
                        "Payment signature verification failed."
                },
                400
            );
        }


        const signatureMatches =
            crypto.timingSafeEqual(
                generatedBuffer,
                receivedBuffer
            );


        if (!signatureMatches) {

            console.error(
                "Invalid Razorpay signature."
            );

            return jsonResponse(
                {
                    message:
                        "Payment signature verification failed."
                },
                400
            );
        }


        // ----------------------------------------------------
        // FETCH PAYMENT FROM RAZORPAY
        // ----------------------------------------------------

        const paymentResponse =
            await fetch(
                `https://api.razorpay.com/v1/payments/${encodeURIComponent(
                    razorpayPaymentId
                )}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Basic " +
                            Buffer.from(
                                `${keyId}:${keySecret}`
                            ).toString("base64")
                    }
                }
            );


        const paymentData =
            await paymentResponse.json();


        // ----------------------------------------------------
        // RAZORPAY PAYMENT LOOKUP ERROR
        // ----------------------------------------------------

        if (!paymentResponse.ok) {

            console.error(
                "Razorpay payment lookup failed:",
                paymentData
            );

            return jsonResponse(
                {
                    message:
                        "Unable to verify payment status with Razorpay."
                },
                502
            );
        }


        // ----------------------------------------------------
        // VERIFY ORDER ID
        // ----------------------------------------------------

        if (
            paymentData.order_id !==
            razorpayOrderId
        ) {

            return jsonResponse(
                {
                    message:
                        "Payment does not belong to this order."
                },
                400
            );
        }


        // ----------------------------------------------------
        // PAYMENT STATUS
        // ----------------------------------------------------

        if (
            paymentData.status !==
            "captured"
        ) {

            return jsonResponse(
                {
                    message:
                        `Payment status is ${paymentData.status}.`
                },
                400
            );
        }


        // ----------------------------------------------------
        // CHECK DUPLICATE PAYMENT
        // ----------------------------------------------------

        const existingSnapshot =
            await db
                .collection("orders")
                .where(
                    "razorpayPaymentId",
                    "==",
                    razorpayPaymentId
                )
                .limit(1)
                .get();


        if (!existingSnapshot.empty) {

            const existingOrder =
                existingSnapshot.docs[0];

            return jsonResponse(
                {
                    verified: true,

                    orderId:
                        existingOrder.id,

                    alreadyProcessed: true
                }
            );
        }


        // ----------------------------------------------------
        // CALCULATE TOTAL
        // ----------------------------------------------------

        let total = 0;


        for (const item of items) {

            const price =
                Number(
                    item?.price || 0
                );

            const quantity =
                Number(
                    item?.quantity || 0
                );


            if (
                !Number.isFinite(price) ||
                !Number.isFinite(quantity) ||
                price < 0 ||
                quantity <= 0
            ) {

                return jsonResponse(
                    {
                        message:
                            "Invalid order item."
                    },
                    400
                );
            }


            total +=
                price * quantity;
        }


        const expectedAmount =
            Math.round(
                total * 100
            );


        // ----------------------------------------------------
        // VERIFY PAYMENT AMOUNT
        // ----------------------------------------------------

        if (
            Number(
                paymentData.amount
            ) !== expectedAmount
        ) {

            console.error(
                "Amount mismatch:",
                {
                    razorpayAmount:
                        paymentData.amount,

                    expectedAmount:
                        expectedAmount
                }
            );

            return jsonResponse(
                {
                    message:
                        "Payment amount does not match the order amount."
                },
                400
            );
        }


        // ----------------------------------------------------
        // CREATE FIRESTORE ORDER
        // ----------------------------------------------------

        const orderRef =
            db
                .collection("orders")
                .doc();


        const orderData = {

            userId,

            customerName:
                customer.name || "",

            customerEmail:
                customer.email || "",

            customerPhone:
                customer.phone || "",

            customerAddress:
                customer.address || "",

            customerCity:
                customer.city || "",

            customerPincode:
                customer.pincode || "",

            customerLandmark:
                customer.landmark || "",

            items,

            total,

            paymentMethod:
                "online",

            paymentStatus:
                "paid",

            orderStatus:
                "pending",

            razorpayOrderId,

            razorpayPaymentId,

            razorpaySignature,

            razorpayPaymentStatus:
                paymentData.status,

            qrStatus:
                "active",

            createdAt:
                FieldValue.serverTimestamp(),

            updatedAt:
                FieldValue.serverTimestamp()
        };


        await orderRef.set(
            orderData
        );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        return jsonResponse(
            {
                verified: true,

                orderId:
                    orderRef.id
            },
            200
        );


    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );


        return jsonResponse(
            {
                message:
                    error?.message ||
                    "Payment verification failed."
            },
            500
        );
    }
};