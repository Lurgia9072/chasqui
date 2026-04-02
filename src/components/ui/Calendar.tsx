import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export const Calendar = ({ selected, onSelect, className }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {format(currentMonth, 'MMMM yyyy')}
      </h2>
      <div className="flex space-x-1">
        <button
          onClick={prevMonth}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={nextMonth}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        days.push(
          <div
            key={day.toString()}
            onClick={() => onSelect?.(currentDay)}
            className={cn(
              'relative h-9 w-9 cursor-pointer rounded-md flex items-center justify-center text-sm transition-all hover:bg-gray-100',
              !isSameMonth(day, monthStart) && 'text-gray-300',
              selected && isSameDay(day, selected) && 'bg-blue-600 text-white hover:bg-blue-700',
              isToday(day) && !isSameDay(day, selected || new Date(0)) && 'text-blue-600 font-bold'
            )}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className={cn('w-[280px] p-3 bg-white rounded-xl border shadow-sm', className)}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
