export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Simulate API delay for Acima's REST service
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock success rate: 90%
    if (Math.random() > 0.90) {
        throw createError({
            statusCode: 402,
            statusMessage: "Acima Leasing credit application was denied.",
        })
    }

    // Generate a mock Acima Application ID
    const leaseId = `acima-lease-${Math.floor(Math.random() * 9000000)}`
    return {
        status: 'APPROVED',
        leaseId: leaseId,
        redirectUrl: `https://acima.com/checkout/apply/${leaseId}`,
        amount: body.amountCents,
        message: "Acima lease agreement created successfully."
    }
})
