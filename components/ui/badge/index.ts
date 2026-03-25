import { type VariantProps, cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

// M3 Badge — pill shaped, consistent with the app's status/priority chips
export const badgeVariants = cva(
  'inline-flex items-center rounded-full text-xs font-black transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-primary/20 text-primary border-transparent px-3 py-1',
        secondary:
          'bg-secondary text-secondary-foreground border-transparent px-3 py-1',
        destructive:
          'bg-destructive/20 text-destructive border-transparent px-3 py-1',
        outline:
          'text-foreground border border-border px-3 py-1',
        // Priority variants for tickets
        low:
          'bg-slate-500/15 text-slate-500 px-3 py-1',
        normal:
          'bg-blue-500/15 text-blue-500 px-3 py-1',
        high:
          'bg-red-500/15 text-red-500 px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
