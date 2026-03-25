# Complete Card Component Package

## What's Included

This folder contains ALL the card component files you need:

```
card-components/
├── Card.vue
├── CardHeader.vue
├── CardTitle.vue
├── CardDescription.vue
├── CardContent.vue
├── CardFooter.vue
└── index.ts
```

## Installation

### Step 1: Copy All Files

Copy ALL files from this `card-components/` folder to your project:

**Destination:** `components/ui/card/`

Your project structure should look like:
```
your-project/
└── components/
    └── ui/
        └── card/
            ├── Card.vue
            ├── CardHeader.vue
            ├── CardTitle.vue
            ├── CardDescription.vue
            ├── CardContent.vue
            ├── CardFooter.vue
            └── index.ts
```

### Step 2: Verify lib/utils Exists

Make sure you have `lib/utils.ts` in your project. It should contain:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

If you don't have this file, the components won't work. Create it at `lib/utils.ts`.

### Step 3: Restart Dev Server

```bash
rm -rf .nuxt
npm run dev
```

## Verification

Your login page and other pages should now work without the CardDescription error!

## Next Steps

After fixing this:
1. Replace `stores/app.ts` to fix the Supabase error
2. Create `.env` file with Supabase credentials
3. Install additional shadcn components as needed

## Troubleshooting

**Still getting import errors?**
- Check ALL 7 files are in `components/ui/card/`
- Check `lib/utils.ts` exists
- Restart: `rm -rf .nuxt && npm run dev`

**Missing cn function error?**
- You need to create `lib/utils.ts` (see Step 2 above)
- Make sure clsx and tailwind-merge are installed:
  ```bash
  npm install clsx tailwind-merge
  ```
