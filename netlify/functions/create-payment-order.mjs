// ============================================================
// CRAVINGS - CREATE RAZORPAY PAYMENT ORDER
// Netlify Function
// ============================================================

export default async (request) => {
    // Only POST is allowed
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({
                message: "Method not allowed"
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    try {
        // --------------------------------------------------------
        // CHECK RAZORPAY ENVIRONMENT VARIABLES
        // --------------------------------------------------------

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error("Razorpay environment variables are missing.");

            return new Response(
                JSON.stringify({
                    message: "Razorpay configuration is missing."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // --------------------------------------------------------
        // READ REQUEST
        // --------------------------------------------------------

        const body = await request.json();

        const userId = body?.userId;
        const customer = body?.customer || {};
        const items = Array.isArray(body?.items)
            ? body.items
            : [];

        if (!userId) {
            return new Response(
                JSON.stringify({
                    message: "User is required."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (!items.length) {
            return new Response(
                JSON.stringify({
                    message: "Cart is empty."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // --------------------------------------------------------
        // CALCULATE CART TOTAL
        // --------------------------------------------------------

        let total = 0;

        for (const item of items) {
            const price = Number(item?.price || 0);
            const quantity = Number(item?.quantity || 0);

            if (
                !Number.isFinite(price) ||
                !Number.isFinite(quantity) ||
                price < 0 ||
                quantity <= 0
            ) {
                return new Response(
                    JSON.stringify({
                        message: "Invalid cart item."
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            }

            total += price * quantity;
        }

        // Convert rupees to paise
        const amount = Math.round(total * 100);

        if (amount <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Invalid payment amount."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // --------------------------------------------------------
        // CREATE RAZORPAY ORDER
        // --------------------------------------------------------

        const razorpayResponse = await fetch(
            "https://api.razorpay.com/v1/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",

                    "Authorization":
                        "Basic " +
                        Buffer.from(
                            `${keyId}:${keySecret}`
                        ).toString("base64")
                },

                body: JSON.stringify({
                    amount: amount,
                    currency: "INR",

                    receipt:
                        `cravings_${Date.now()}`,

                    notes: {
                        userId: String(userId),
                        customerName:
                            String(customer.name || ""),
                        customerPhone:
                            String(customer.phone || "")
                    }
                })
            }
        );

        const razorpayData =
            await razorpayResponse.json();

        // --------------------------------------------------------
        // RAZORPAY ERROR
        // --------------------------------------------------------

        if (!razorpayResponse.ok) {
            console.error(
                "Razorpay order creation failed:",
                razorpayData
            );

            return new Response(
                JSON.stringify({
                    message:
                        razorpayData?.error?.description ||
                        "Unable to create Razorpay order."
                }),
                {
                    status: razorpayResponse.status || 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // --------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------

        return new Response(
            JSON.stringify({
                success: true,

                razorpayOrderId:
                    razorpayData.id,

                amount:
                    razorpayData.amount,

                currency:
                    razorpayData.currency,

                keyId:
                    keyId,

                businessName:
                    "Cravings"
            }),
            {
                status: 200,

                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error(
            "Create payment order error:",
            error
        );

        return new Response(
            JSON.stringify({
                message:
                    error?.message ||
                    "Unable to create payment order."
            }),
            {
                status: 500,

                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
