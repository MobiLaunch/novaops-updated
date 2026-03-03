export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Simulate API delay for Afterpay's REST service
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock success rate: 95%
    if (Math.random() > 0.95) {
        throw createError({
            statusCode: 402,
            statusMessage: "Afterpay declined the transaction.",
        })
    }

    // Generate a mock Afterpay Checkout Token & URL
    const token = `afterpay-checkout-${Date.now()}`
    return {
        status: 'APPROVED',
        token: token,
        redirectUrl: `https://portal.afterpay.com/checkout/?token=${token}`,
        amount: body.amountCents,
        message: "Afterpay checkout session created successfully."
    }
})
