import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

// M3 Expressive button variants — rounded-full, spring interactions
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: gradient + spring
        default:
          'bg-primary text-primary-foreground shadow-lg hover:scale-[1.04] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.94] rounded-full',
        // Destructive
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:scale-[1.03] active:scale-[0.95] rounded-full',
        // Outlined tonal — M3 style
        outline:
          'border-2 border-border bg-background hover:bg-muted/60 hover:scale-[1.03] active:scale-[0.95] rounded-full',
        // Secondary/tonal fill
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.96] rounded-full',
        // Ghost — no border, subtle fill on hover
        ghost:
          'hover:bg-muted/60 hover:scale-[1.03] active:scale-[0.95] rounded-[20px]',
        // Link style
        link: 'text-primary underline-offset-4 hover:underline rounded-md',
      },
      size: {
        default: 'h-11 px-6 py-2.5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 rounded-[20px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
