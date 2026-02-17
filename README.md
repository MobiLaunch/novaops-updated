# NovaOps - Improved Version

This is an enhanced version of NovaOps Repair Shop Management System with Supabase integration, improved profile management, colorful UI, and an enhanced ticketing workflow.

## ✨ What's New

### 1. **Supabase Integration Ready**
- Added `@supabase/supabase-js` dependency
- Created `useSupabase` composable for easy database operations
- Updated types with profile_id fields for multi-tenancy
- Environment configuration for Supabase credentials

### 2. **Profile Management**
- **Profile Setup Screen**: First-time users see a welcoming profile setup screen
- Users must complete their business profile before accessing the app
- Profile includes: Business Name, Email, Phone, Address, Currency
- Smooth onboarding experience with gradient design

### 3. **Enhanced Ticket Creation Flow**
- **Step-by-step wizard** with 4 stages:
  1. **Device Type Grid**: Select from iPhone, Android, iPad, Laptop, Watch, Gaming
  2. **Device Model Grid**: Choose from popular models or enter custom
  3. **Issue Grid**: Select common issues (Cracked Screen, Battery, Water Damage, etc.)
  4. **Details & Signature**: Enter additional info and collect customer signature
- Visual, intuitive interface with icons and color-coded selections

### 4. **Colorful, Modern UI**
- **Gradient accents**: Violet-to-blue gradients throughout
- **Status indicators**: Color-coded badges (Blue=Open, Yellow=In Progress, Green=Completed)
- **Statistics cards** with gradient backgrounds
- **Hover effects** with colored shadows
- Border accents using brand colors
- Much more visually appealing than the plain original

### 5. **Bug Fixes & Layout Improvements**
- Improved responsive layouts
- Better spacing and padding
- Fixed middleware routing for profile setup
- Enhanced form validation
- Consistent color scheme across components

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure Supabase (Optional - for production)**
   
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

   If you don't configure Supabase, the app will work with localStorage (demo mode).

3. **Run Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## 📝 First-Time Usage

1. **Login**: Use any email/password to login (demo mode)
2. **Profile Setup**: You'll be redirected to complete your business profile
3. **Dashboard**: After profile setup, you'll land on the dashboard
4. **Create Tickets**: Try the new ticket creation flow with grid selections!

## 🗄️ Supabase Database Schema (For Production)

If you want to use Supabase instead of localStorage, create these tables:

### profiles
```sql
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  business_name text not null,
  phone text,
  address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### customers
```sql
create table customers (
  id bigserial primary key,
  profile_id uuid references profiles(id),
  name text not null,
  phone text not null,
  email text not null,
  drivers_license text,
  address text,
  tags jsonb default '[]',
  notes text,
  created_at timestamp with time zone default now()
);
```

### tickets
```sql
create table tickets (
  id bigserial primary key,
  profile_id uuid references profiles(id),
  customer_id bigint references customers(id),
  device text not null,
  device_model text,
  device_description text,
  issue text not null,
  status text not null,
  tracking text,
  price decimal(10,2) default 0,
  serial_number text,
  warranty_days integer default 0,
  warranty_start date,
  photos jsonb default '[]',
  signature text,
  notes jsonb default '[]',
  parts jsonb default '[]',
  payments jsonb default '[]',
  time_log jsonb default '[]',
  priority text default 'normal',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### inventory
```sql
create table inventory (
  id bigserial primary key,
  profile_id uuid references profiles(id),
  name text not null,
  sku text not null,
  category text,
  stock integer default 0,
  low integer default 0,
  cost decimal(10,2) default 0,
  price decimal(10,2) default 0
);
```

## 🎨 Color Scheme

The app uses a consistent, vibrant color palette:
- **Primary**: Violet (#8B5CF6) to Blue gradient
- **Success**: Emerald (#10B981)
- **Warning**: Yellow (#EAB308)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

## 📦 Key Files & Structure

```
novaops-improved/
├── components/
│   ├── NewTicketDialog.vue      # New grid-based ticket creation
│   ├── SignaturePad.vue
│   └── ui/                      # shadcn/ui components
├── composables/
│   ├── useSupabase.ts          # Supabase client
│   ├── useAppStore.ts          # App state management
│   └── useNotifications.ts
├── middleware/
│   └── auth.ts                 # Auth + profile check
├── pages/
│   ├── profile-setup.vue       # First-time profile setup
│   ├── tickets.vue            # Enhanced tickets page
│   ├── login.vue
│   └── dashboard.vue
├── types/
│   └── index.ts               # TypeScript types
├── nuxt.config.ts             # Supabase config
└── package.json               # Dependencies
```

## 🔧 Customization

### Changing Colors
Edit `tailwind.config.js` to customize the color palette:
```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#8B5CF6',
        // Add your custom colors
      }
    }
  }
}
```

### Adding Device Types
Edit `components/NewTicketDialog.vue`:
```vue
const deviceTypes = [
  { name: 'Your Device', icon: YourIcon },
  // Add more device types
]
```

### Customizing Issues
Edit the `issues` array in `NewTicketDialog.vue`

## 🐛 Known Issues & Future Improvements

- [ ] Add image upload for device photos
- [ ] Implement full Supabase CRUD operations
- [ ] Add real-time updates with Supabase subscriptions
- [ ] Email integration for customer notifications
- [ ] SMS notifications
- [ ] Advanced reporting and analytics
- [ ] Multi-user support with roles/permissions

## 📄 License

This is a demo/educational project.

## 🤝 Support

For issues or questions, please check the code comments or create an issue.
