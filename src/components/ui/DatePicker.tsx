import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Calendar } from './Calendar';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export const DatePicker = ({ date, onDateChange, label, error, placeholder = 'Select date', className }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full space-y-1.5" ref={ref}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white transition-all hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            !date && 'text-gray-400',
            error && 'border-red-500 focus:ring-red-500/20',
            className
          )}
        >
          {date ? format(date, 'PPP') : placeholder}
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute z-50 mt-2 rounded-xl border bg-white p-0 shadow-2xl"
            >
              <Calendar
                selected={date}
                onSelect={(d) => {
                  onDateChange?.(d);
                  setIsOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
