import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChasquiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white';
}

export const ChasquiLogo = ({ className, size = 'md', showText = true, variant = 'default' }: ChasquiLogoProps) => {
  const sizeClasses = {
    sm: { box: 'h-8 w-8', icon: 'h-5 w-5', text: 'text-lg' },
    md: { box: 'h-10 w-10', icon: 'h-6 w-6', text: 'text-2xl' },
    lg: { box: 'h-14 w-14', icon: 'h-8 w-8', text: 'text-4xl' },
    xl: { box: 'h-20 w-20', icon: 'h-12 w-12', text: 'text-6xl' },
  };

  const variants = {
    default: {
      box: 'bg-slate-900 text-white',
      text: 'text-slate-900'
    },
    white: {
      box: 'bg-white text-slate-900',
      text: 'text-white'
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "rounded-xl flex items-center justify-center rotate-3 shadow-lg",
        sizeClasses[size].box,
        variants[variant].box,
        variant === 'default' ? 'shadow-slate-200/50' : 'shadow-black/20'
      )}>
        <Zap className={cn("fill-current", sizeClasses[size].icon)} />
      </div>
      {showText && (
        <span className={cn(
          "font-black tracking-tighter",
          sizeClasses[size].text,
          variants[variant].text
        )}>
          chasqui
        </span>
      )}
    </div>
  );
};
