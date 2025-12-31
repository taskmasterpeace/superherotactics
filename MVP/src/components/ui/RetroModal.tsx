import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';
import { RetroButton } from './RetroButton';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const modalVariants = cva(
  'relative border-2 border-black rounded-xl bg-card text-card-foreground overflow-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-sm w-full',
        md: 'max-w-md w-full',
        lg: 'max-w-lg w-full',
        xl: 'max-w-xl w-full',
        '2xl': 'max-w-2xl w-full',
        full: 'max-w-[90vw] w-full max-h-[90vh]',
      },
      shadow: {
        default: 'shadow-retro-lg',
        none: 'shadow-none',
      },
    },
    defaultVariants: {
      size: 'md',
      shadow: 'default',
    },
  }
);

interface RetroModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

const RetroModal: React.FC<RetroModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  shadow,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  footer,
}) => {
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(modalVariants({ size, shadow, className }), 'pointer-events-auto')}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-description' : undefined}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b-2 border-black">
                  <div>
                    {title && (
                      <h2
                        id="modal-title"
                        className="text-xl font-bold text-primary"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id="modal-description"
                        className="mt-1 text-sm text-muted-foreground"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <RetroButton
                      variant="ghost"
                      size="icon"
                      shadow="none"
                      onClick={onClose}
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </RetroButton>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 p-4 border-t-2 border-black bg-surface/50">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

RetroModal.displayName = 'RetroModal';

// Confirm Dialog - preconfigured modal for confirmations
interface RetroConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

const RetroConfirmDialog: React.FC<RetroConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) => {
  const buttonVariant = variant === 'destructive' ? 'destructive' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <RetroModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <RetroButton variant="outline" onClick={onClose}>
            {cancelText}
          </RetroButton>
          <RetroButton
            variant={buttonVariant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </RetroButton>
        </>
      }
    >
      <p className="text-foreground">{message}</p>
    </RetroModal>
  );
};

RetroConfirmDialog.displayName = 'RetroConfirmDialog';

// Alert Dialog - for important messages
interface RetroAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
}

const alertIcons = {
  info: (
    <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const RetroAlertDialog: React.FC<RetroAlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
}) => {
  return (
    <RetroModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <RetroButton variant="primary" onClick={onClose}>
          {buttonText}
        </RetroButton>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-surface border-2 border-black">
          {alertIcons[variant]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
      </div>
    </RetroModal>
  );
};

RetroAlertDialog.displayName = 'RetroAlertDialog';

export { RetroModal, RetroConfirmDialog, RetroAlertDialog, modalVariants };
