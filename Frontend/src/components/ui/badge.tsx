import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-brand-100 text-brand-700',
        sand:     'bg-sand-100 text-sand-700',
        gray:     'bg-gray-100 text-gray-600',
        green:    'bg-emerald-100 text-emerald-700',
        red:      'bg-red-100 text-red-600',
        blue:     'bg-blue-100 text-blue-700',
        outline:  'border border-gray-200 text-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
