import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// No "destructive"/red variant here on purpose — per brand guidance, a
// flagged/unverified state is a quality signal (gold), never an error color.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        verified: "bg-primary-tint text-primary",
        flagged: "bg-accent-tint text-accent",
        neutral: "bg-line/50 text-muted",
        locked: "bg-line/40 text-muted",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
