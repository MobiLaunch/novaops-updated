// composables/useEmailNotifications.ts
// Sends customer notification emails via EmailJS when tickets, house calls,
// or vendor repairs are created. Uses a SINGLE unified EmailJS template.
// Every send includes ALL 21 template variables to avoid "broken dynamic elements".

import emailjs from '@emailjs/browser'

export const useEmailNotifications = () => {
    const config = useRuntimeConfig()
    const appStore = useAppStore()
    const { addNotification } = useNotifications()

    const serviceId = config.public.emailjsServiceId as string
    const publicKey = config.public.emailjsPublicKey as string
    const templateId = config.public.emailjsTemplateCustomer as string

    const isConfigured = () => {
        const ok = !!(serviceId && publicKey && templateId)
        if (!ok) console.warn('[EmailJS] Missing config —', { serviceId: !!serviceId, publicKey: !!publicKey, templateId: !!templateId })
        return ok
    }

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

    const fmtDate = (d: string | null | undefined): string => {
        if (!d) return 'TBD'
        return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    // Build a full params object with ALL 21 template variables.
    // This prevents the "one or more dynamic elements are broken" error.
    const buildParams = (overrides: Partial<Record<string, string>> = {}): Record<string, string> => ({
        // Recipient
        to_email: '',
        // Shared
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        device_name: '',
        issue_description: '',
        technician_name: appStore.settings.businessName || 'Our Team',
        ticket_number: '',
        ticket_date: '',
        year: String(new Date().getFullYear()),
        // House call
        appointment_date: '',
        arrival_window: '',
        service_description: '',
        // Vendor repair
        dispatch_date: '',
        vendor_name: '',
        estimated_return: '',
        estimated_completion: '',
        // Internal
        event_type: '',
        event_summary: '',
        event_timestamp: new Date().toLocaleString(),
        estimated_value: '',
        internal_notes: '',
        // Apply caller overrides
        ...overrides,
    })

    const send = async (params: Record<string, string>) => {
        if (!isConfigured()) return
        console.log('[EmailJS] ── Sending ──────────────────────────')
        console.log('[EmailJS] to_email:', params.to_email)
        console.log('[EmailJS] event_type:', params.event_type)
        try {
            const result = await emailjs.send(serviceId, templateId, params, publicKey)
            console.log('[EmailJS] ✅ Success:', result.status, result.text)
            addNotification('Email Sent', `Notification sent to ${params.to_email}`, 'success')
        } catch (err: any) {
            console.error('[EmailJS] ❌ Send failed:', err?.text || err?.message || err)
            addNotification('Email Notice', `Email could not be sent: ${err?.text || err?.message || 'Unknown error'}`, 'warning')
        }
    }

    // ── Public API ───────────────────────────────────────────────────────────

    const sendTicketEmail = async (ticket: any) => {
        const email = getCustomerEmail(ticket.customerId)
        if (!email) { console.log('[EmailJS] No email for customer', ticket.customerId); return }

        await send(buildParams({
            to_email: email,
            customer_name: getCustomerName(ticket.customerId),
            customer_phone: getCustomerPhone(ticket.customerId),
            ticket_number: String(ticket.id ?? ''),
            ticket_date: fmtDate(ticket.createdAt ?? ticket.created_at ?? new Date().toISOString()),
            device_name: ticket.device || '',
            issue_description: ticket.issue || '',
            estimated_completion: 'We will contact you with an estimate',
            event_type: 'New Ticket',
            event_summary: `Ticket #${ticket.id} created`,
        }))
    }

    const sendHousecallEmail = async (houseCall: any) => {
        const email = getCustomerEmail(houseCall.customerId)
        if (!email) { console.log('[EmailJS] No email for customer', houseCall.customerId); return }

        await send(buildParams({
            to_email: email,
            customer_name: getCustomerName(houseCall.customerId),
            customer_phone: getCustomerPhone(houseCall.customerId),
            appointment_date: fmtDate(houseCall.date),
            arrival_window: houseCall.time || 'TBD',
            customer_address: houseCall.address || '',
            service_description: houseCall.issue || houseCall.description || '',
            issue_description: houseCall.issue || '',
            event_type: 'House Call',
            event_summary: 'House call scheduled',
        }))
    }

    const sendVendorRepairEmail = async (vendorRepair: any) => {
        const email = getCustomerEmail(vendorRepair.customerId)
        if (!email) { console.log('[EmailJS] No email for customer', vendorRepair.customerId); return }

        await send(buildParams({
            to_email: email,
            customer_name: getCustomerName(vendorRepair.customerId),
            customer_phone: getCustomerPhone(vendorRepair.customerId),
            ticket_number: vendorRepair.ticketRef || vendorRepair.ticket_ref || '',
            dispatch_date: fmtDate(vendorRepair.sentDate ?? vendorRepair.sent_date ?? new Date().toISOString()),
            device_name: vendorRepair.device || '',
            issue_description: vendorRepair.issue || '',
            vendor_name: vendorRepair.vendor || 'Specialist Partner',
            estimated_return: fmtDate(vendorRepair.estReturn ?? vendorRepair.est_return),
            event_type: 'Vendor Repair',
            event_summary: 'Device sent to vendor for repair',
        }))
    }

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
        if (!shopEmail) { console.log('[EmailJS] No shop email configured in settings'); return }

        await send(buildParams({
            to_email: shopEmail,
            event_type: params.eventType,
            event_summary: params.eventSummary,
            customer_name: params.customerName || '',
            customer_phone: params.customerPhone || '',
            device_name: params.deviceName || '',
            issue_description: params.issueDescription || '',
            ticket_number: params.ticketNumber || '',
            technician_name: params.technicianName || appStore.settings.businessName || '',
            estimated_value: params.estimatedValue || '',
            internal_notes: params.internalNotes || '',
        }))
    }

    return {
        isConfigured,
        sendTicketEmail,
        sendHousecallEmail,
        sendVendorRepairEmail,
        sendInternalAlert,
    }
}
