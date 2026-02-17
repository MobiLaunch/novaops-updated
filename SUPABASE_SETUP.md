 client-side code
2. **Always use Row Level Security (RLS)** - Enabled on all tables
3. **Use environment variables** - Never commit `.env` to git
4. **Validate user input** - Both client and server side
5. **Regular backups** - Use Supabase's automatic backups
6. **Monitor usage** - Check Supabase dashboard for unusual activity

## Performance Optimization

### Add Indexes for Common Queries
```sql
-- If you frequently search tickets by device
create index tickets_device_idx on tickets using gin(device gin_trgm_ops);

-- If you frequently filter by date range
create index tickets_created_at_range_idx on tickets(created_at);

-- For customer email lookups
create index customers_email_idx on customers(email);
```

### Enable Realtime (Optional)
```sql
-- Enable realtime for tickets table
alter publication supabase_realtime add table tickets;
```

Then in your code:
```typescript
const { supabase } = useSupabase()

// Subscribe to ticket changes
supabase
  .channel('tickets')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tickets' },
    (payload) => {
      console.log('Change received!', payload)
      // Update your local state
    }
  )
  .subscribe()
```

## Migration from LocalStorage

If you have existing data in localStorage that you want to migrate:

1. Export your data using the "Export All Data" button in Settings
2. Create a migration script to transform and import into Supabase
3. Example migration script:

```typescript
// migration.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function migrate() {
  // Read exported JSON
  const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'))
  
  // Migrate customers
  for (const customer of data.customers) {
    await supabase.from('customers').insert({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      // ... other fields
    })
  }
  
  // Migrate tickets, inventory, etc.
  // ...
}

migrate()
```

## Supabase Dashboard Features

### Useful Dashboard Sections

1. **Table Editor** - View and edit data directly
2. **SQL Editor** - Run custom queries
3. **Database** → **Roles** - Manage database users
4. **Auth** → **Users** - View signed up users
5. **Logs** - Debug issues and monitor activity
6. **API Docs** - Auto-generated API documentation

### Monitoring

- Set up email alerts for errors
- Monitor database size and performance
- Check API usage to stay within quotas

## Backup & Recovery

### Automatic Backups (Pro Plan)
- Daily backups retained for 7 days
- Point-in-time recovery

### Manual Backup (Free Tier)
```bash
# Export all data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

## Cost Considerations

### Free Tier Includes:
- 500MB database space
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

### Upgrade Triggers:
- Need more than 500MB database
- Require automatic backups
- Need more bandwidth
- Want priority support

## Production Deployment

### Environment Variables
Set these in your hosting platform:
```
SUPABASE_URL=your_production_url
SUPABASE_ANON_KEY=your_production_key
```

### Security Checklist
- [ ] RLS enabled on all tables
- [ ] Service role key never exposed
- [ ] Email verification enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

## Next Steps

After completing this setup:

1. ✅ Test all CRUD operations
2. ✅ Set up authentication properly
3. ✅ Configure email templates
4. ✅ Add more indexes as needed
5. ✅ Set up monitoring
6. ✅ Create production database
7. ✅ Deploy your application

---

**Need Help?** Check the Supabase documentation or NovaOps README for more information.
