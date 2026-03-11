'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = 'ToastViewport'

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: 'default' | 'success' | 'error' }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'flex items-start gap-3 rounded-xl p-4 shadow-card border text-sm',
      'data-[state=open]:animate-fade-up data-[state=closed]:opacity-0',
      variant === 'success' && 'bg-brand-50 border-brand-200 text-brand-800',
      variant === 'error'   && 'bg-red-50 border-red-200 text-red-800',
      variant === 'default' && 'bg-white border-gray-200 text-gray-800',
      className
    )}
    {...props}
  />
))
Toast.displayName = 'Toast'

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('font-semibold', className)} {...props} />
))

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-xs opacity-80 mt-0.5', className)} {...props} />
))

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity', className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))

// Simple imperative toast hook
type ToastData = { title: string; description?: string; variant?: 'default' | 'success' | 'error' }
type ToastListener = (toast: ToastData) => void

const listeners: ToastListener[] = []

export function toast(data: ToastData) {
  listeners.forEach((l) => l(data))
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<(ToastData & { id: string })[]>([])

  React.useEffect(() => {
    const handler: ToastListener = (data) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...data, id }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }
    listeners.push(handler)
    return () => { listeners.splice(listeners.indexOf(handler), 1) }
  }, [])

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} open>
          <div>
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
