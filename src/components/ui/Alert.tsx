import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-50 text-gray-900 border-gray-200',
      success: 'bg-green-50 text-green-900 border-green-200',
      warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
      danger: 'bg-red-50 text-red-900 border-red-200',
      info: 'bg-blue-50 text-blue-900 border-blue-200',
    };

    const icons = {
      default: <Info className="h-5 w-5" />,
      success: <CheckCircle className="h-5 w-5" />,
      warning: <AlertCircle className="h-5 w-5" />,
      danger: <XCircle className="h-5 w-5" />,
      info: <Info className="h-5 w-5" />,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-xl border p-4 flex items-start space-x-3',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="shrink-0 mt-0.5">{icons[variant]}</div>
        <div className="flex-1 text-sm leading-relaxed">{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-bold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
);

AlertDescription.displayName = 'AlertDescription';
