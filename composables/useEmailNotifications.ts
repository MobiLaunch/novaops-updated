// composables/useEmailNotifications.ts
// Sends customer notification emails via EmailJS when tickets, house calls,
// or vendor repairs are created. Failures are logged but never block the
// primary CRUD action.

import emailjs from '@emailjs/browser'

export const useEmailNotifications = () => {
    const config = useRuntimeConfig()
    const appStore = useAppStore()
    const { addNotification } = useNotifications()

    const serviceId = config.public.emailjsServiceId as string
    const publicKey = config.public.emailjsPublicKey as string

    const templateIds = {
        ticket: config.public.emailjsTicketTemplateId as string,
        housecall: config.public.emailjsHousecallTemplateId as string,
        vendorRepair: config.public.emailjsVendorRepairTemplateId as string,
        internal: config.public.emailjsInternalTemplateId as string,
    }

    const isConfigured = () => !!(serviceId && publicKey)

    // ── Helpers ──────────────────────────────────────────────────────────────

    const getCustomerName = (customerId: any): string => {
        const c = (appStore.customers ?? []).find((c: any) => c.id === customerId)
        return (c as any)?.name || 'Valued Customer'
    }

    const getCustomerEmail = (customerId: any): string => {
        const c = (appStore.customers ?? []).find((c: any) => c.id === customerId)
        return (c as any)?.email || ''
    }

    const getCustomerPhone = (customerId: any): string => {
        const c = (appStore.customers ?? []).find((c: any) => c.id === customerId)
        return (c as any)?.phone || ''
    }

    const formatDate = (d: string | null): string => {
        if (!d) return 'TBD'
        return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    const send = async (templateId: string, params: Record<string, string>) => {
        if (!isConfigured()) {
            console.warn('[EmailJS] Not configured — skipping email send')
            return
        }
        try {
            await emailjs.send(serviceId, templateId, params, publicKey)
        } catch (err: any) {
            console.error('[EmailJS] Send failed:', err)
            addNotification('Email Notice', 'Customer email notification could not be sent', 'warning')
        }
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Send a "New Ticket" email to the customer.
     */
    const sendTicketEmail = async (ticket: any) => {
        const email = getCustomerEmail(ticket.customerId)
        if (!email) return

        await send(templateIds.ticket, {
            to_email: email,
            customer_name: getCustomerName(ticket.customerId),
            ticket_number: String(ticket.id ?? ''),
            ticket_date: formatDate(ticket.createdAt ?? ticket.created_at ?? new Date().toISOString()),
            device_name: ticket.device || '',
            issue_description: ticket.issue || '',
            technician_name: appStore.settings.businessName || 'Our Team',
            estimated_completion: 'We will contact you with an estimate',
            year: String(new Date().getFullYear()),
        })
    }

    /**
     * Send a "House Call Confirmed" email to the customer.
     */
    const sendHousecallEmail = async (houseCall: any) => {
        const email = getCustomerEmail(houseCall.customerId)
        if (!email) return

        await send(templateIds.housecall, {
            to_email: email,
            customer_name: getCustomerName(houseCall.customerId),
            appointment_date: formatDate(houseCall.date),
            arrival_window: houseCall.time || 'TBD',
            customer_address: houseCall.address || '',
            device_name: '',
            service_description: houseCall.issue || houseCall.description || '',
            technician_name: appStore.settings.businessName || 'Our Team',
            year: String(new Date().getFullYear()),
        })
    }

    /**
     * Send a "Vendor Repair Update" email to the customer.
     */
    const sendVendorRepairEmail = async (vendorRepair: any) => {
        const email = getCustomerEmail(vendorRepair.customerId)
        if (!email) return

        await send(templateIds.vendorRepair, {
            to_email: email,
            customer_name: getCustomerName(vendorRepair.customerId),
            ticket_number: vendorRepair.ticketRef || vendorRepair.ticket_ref || '',
            dispatch_date: formatDate(vendorRepair.sentDate ?? vendorRepair.sent_date ?? new Date().toISOString()),
            device_name: vendorRepair.device || '',
            issue_description: vendorRepair.issue || '',
            vendor_name: vendorRepair.vendor || 'Specialist Partner',
            estimated_return: formatDate(vendorRepair.estReturn ?? vendorRepair.est_return),
            year: String(new Date().getFullYear()),
        })
    }

    /**
     * Send an internal alert email to the shop.
     */
    const sendInternalAlert = async (params: {
        eventType: string
        eventSummary: string
        customerName?: string
        customerPhone?: string
        deviceName?: string
        issueDescription?: string
        ticketNumber?: string
        technicianName?: string
        estimatedValue?: string
        internalNotes?: string
    }) => {
        const shopEmail = appStore.settings.email
        if (!shopEmail) return

        await send(templateIds.internal, {
            to_email: shopEmail,
            event_type: params.eventType,
            event_summary: params.eventSummary,
            event_timestamp: new Date().toLocaleString(),
            customer_name: params.customerName || '',
            customer_phone: params.customerPhone || '',
            device_name: params.deviceName || '',
            issue_description: params.issueDescription || '',
            ticket_number: params.ticketNumber || '',
            technician_name: params.technicianName || appStore.settings.businessName || '',
            estimated_value: params.estimatedValue || '',
            internal_notes: params.internalNotes || '',
        })
    }

    return {
        isConfigured,
        sendTicketEmail,
        sendHousecallEmail,
        sendVendorRepairEmail,
        sendInternalAlert,
    }
}
