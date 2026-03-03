import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Profit logic: Minimum $110 profit.
// If part is under $20, profit = $125
// If part is $20-$50, profit = $120
// If part is $50-$100, profit = $115
// If part is >$100, profit = $110
function calculatePrice(partCost) {
    let profit = 110
    if (partCost < 20) profit = 125
    else if (partCost <= 50) profit = 120
    else if (partCost <= 100) profit = 115
    return partCost + profit
}

const services = [
    // iPhones - Screens
    { id: Date.now() + 1, name: 'iPhone 11 Screen Repair', description: 'Screen replacement with high quality aftermarket part. (Part ~$25)', price: calculatePrice(25), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 2, name: 'iPhone 12 Screen Repair', description: 'Screen replacement. (Part ~$40)', price: calculatePrice(40), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 3, name: 'iPhone 13 Screen Repair', description: 'Screen replacement. (Part ~$45)', price: calculatePrice(45), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 4, name: 'iPhone 14 Screen Repair', description: 'Screen replacement. (Part ~$55)', price: calculatePrice(55), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 5, name: 'iPhone 15 Screen Repair', description: 'Screen replacement. (Part ~$90)', price: calculatePrice(90), duration: 60, active: true, category: 'Smartphone Repair' },

    // iPhones - Batteries
    { id: Date.now() + 6, name: 'iPhone Battery Replacement (Older Models)', description: 'iPhone Xs, 11, 12, etc. (Part ~$15)', price: calculatePrice(15), duration: 45, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 7, name: 'iPhone Battery Replacement (Newer Models)', description: 'iPhone 13, 14, 15 etc. (Part ~$25)', price: calculatePrice(25), duration: 45, active: true, category: 'Smartphone Repair' },

    // iPads
    { id: Date.now() + 8, name: 'iPad Base Model Glass Repair', description: 'iPad 7/8/9th Gen digitizer replacement. (Part ~$15)', price: calculatePrice(15), duration: 90, active: true, category: 'Tablet Repair' },
    { id: Date.now() + 9, name: 'iPad Air/Pro Screen Repair', description: 'Laminated display replacement. (Part ~$100)', price: calculatePrice(100), duration: 90, active: true, category: 'Tablet Repair' },

    // Samsung
    { id: Date.now() + 10, name: 'Samsung Galaxy S22 Screen Repair', description: 'OEM Service Pack Screen. (Part ~$120)', price: calculatePrice(120), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 11, name: 'Samsung Galaxy S23 Screen Repair', description: 'OEM Service Pack Screen. (Part ~$140)', price: calculatePrice(140), duration: 60, active: true, category: 'Smartphone Repair' },
    { id: Date.now() + 12, name: 'Samsung Galaxy S24 Screen Repair', description: 'OEM Service Pack Screen. (Part ~$180)', price: calculatePrice(180), duration: 60, active: true, category: 'Smartphone Repair' },

    // Consoles
    { id: Date.now() + 13, name: 'PS5/Xbox Series X HDMI Port Repair', description: 'Microsoldering new HDMI port. (Part ~$5)', price: calculatePrice(5), duration: 120, active: true, category: 'Console Repair' },
    { id: Date.now() + 14, name: 'Nintendo Switch USB-C Port Repair', description: 'Microsoldering new charge port. (Part ~$5)', price: calculatePrice(5), duration: 90, active: true, category: 'Console Repair' },

    // Diagnostics & General
    { id: Date.now() + 15, name: 'Liquid Damage Cleaning / Diagnostics', description: 'Ultrasonic cleaning and logic board assessment.', price: 110, duration: 120, active: true, category: 'Diagnostics' },
    { id: Date.now() + 16, name: 'Data Recovery (Level 1)', description: 'Software-based data recovery from working board.', price: 150, duration: 120, active: true, category: 'Data Recovery' }
]

async function run() {
    const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('*')

    if (fetchErr) {
        console.error("Error fetching profiles:", fetchErr)
        return
    }

    for (const p of profiles) {
        const existingServices = Array.isArray(p.services) ? p.services : []
        // Overwrite only if they have nothing, or just merge carefully to avoid duplicates
        // Here we'll map existing names to prevent dupes:
        const existingNames = new Set(existingServices.map(s => s.name.toLowerCase()))

        const newServicesToAdd = services.filter(s => !existingNames.has(s.name.toLowerCase()))

        if (newServicesToAdd.length === 0) {
            console.log(`Profile ${p.id} already has these services. Skipping.`)
            continue
        }

        const combinedServices = [...existingServices, ...newServicesToAdd]

        const { error: updErr } = await supabase
            .from('profiles')
            .update({ services: combinedServices })
            .eq('id', p.id)

        if (updErr) {
            console.error(`Error updating profile ${p.id}:`, updErr)
        } else {
            console.log(`Updated profile ${p.id} with ${newServicesToAdd.length} new services.`)
        }
    }

    console.log("Done inserting catalog.")
}

run()
