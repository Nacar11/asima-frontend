'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'data-[state=open]:duration-300 data-[state=closed]:duration-200',
      'ease-out',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  cn(
    'fixed z-50 flex flex-col gap-0 bg-white shadow-2xl outline-none',
    // Enter: 400ms with iOS-sheet easing curve. Exit: 250ms (exit-faster-than-enter).
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=open]:duration-[400ms] data-[state=closed]:duration-[250ms]',
    'data-[state=open]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:ease-[cubic-bezier(0.32,0.72,0,1)]',
  ),
  {
    variants: {
      side: {
        top: cn(
          'inset-x-0 top-0 border-b border-neutral-200',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ),
        bottom: cn(
          'inset-x-0 bottom-0 border-t border-neutral-200',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ),
        left: cn(
          'inset-y-0 left-0 h-full w-3/4 border-r border-neutral-200 sm:max-w-md',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ),
        right: cn(
          'inset-y-0 right-0 h-full w-3/4 border-l border-neutral-200 sm:max-w-md',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ),
      },
    },
    defaultVariants: { side: 'right' },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className={cn(
          'absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md',
          'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1',
          'disabled:pointer-events-none',
        )}
      >
        <X className="h-4 w-4" aria-hidden />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-1.5 border-b border-neutral-100 px-5 py-4 pr-14',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-row items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/60 px-5 py-3',
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('truncate text-base font-semibold text-neutral-950', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-neutral-500', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-5 py-5', className)} {...props} />
);
SheetBody.displayName = 'SheetBody';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetBody,
};
