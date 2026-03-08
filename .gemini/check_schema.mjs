import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://pkluxhfcdbdjsyypxvrg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHV4aGZjZGJkanN5eXB4dnJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5NDM3MywiZXhwIjoyMDg2NzcwMzczfQ.FJwxp5spmMblkb_K8EBKaEkyCeYzAlg6k8CL2PbEwKs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: profile } = await supabase.from('profiles').select('id').limit(1);
    const profileId = profile && profile[0] ? profile[0].id : null;

    const out = [];

    out.push('--- Services Table Check ---');
    let { data } = await supabase.from('services').select('*').limit(1);
    if (data && data.length > 0) {
        out.push('Services Columns: ' + Object.keys(data[0]).join(', '));
    } else {
        out.push('Services: No rows');
    }

    if (profileId) {
        const payload = {
            profile_id: profileId,
            name: 'test',
            category: 'Services',
            description: '',
            price: 0,
            estimated_minutes: 0,
            duration: 0,
            active: true
        };
        const { error: insertError } = await supabase.from('services').insert(payload);
        out.push('Service Insert Error: ' + (insertError ? JSON.stringify(insertError) : 'None'));
    }

    out.push('\n--- Square Config Check ---');
    let res2 = await supabase.from('square_config').select('*').limit(1);
    if (res2.error) {
        out.push('Square Config Table Error: ' + res2.error.message);
    }

    fs.writeFileSync('schema_out.txt', out.join('\n'));
}

checkSchema();
