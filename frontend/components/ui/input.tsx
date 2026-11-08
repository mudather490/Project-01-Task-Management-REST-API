import * as React from "react";
import { clsx } from "clsx";

const field =
  "w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-faint " +
  "transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={clsx(field, "h-9", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(field, "py-2 leading-relaxed resize-none", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
