import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DateTime } from 'luxon';

interface DatePickerProps {
  value: string | null; // "YYYY-MM-DD"
  onChange: (val: string | null) => void;
  placeholder?: string;
  className?: string;
  weekStartsOn?: 1 | 7;
}

export default function DatePicker({ value, onChange, placeholder = "Select date", className = "", weekStartsOn = 1 }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Current month being viewed in the calendar
  const [viewDate, setViewDate] = useState<DateTime>(
    value ? DateTime.fromISO(value) : DateTime.local()
  );

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || popupRef.current?.contains(target)) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 330;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popupHeight + 16;

      setPopupPos({
        left: rect.left,
        top: openUpwards ? Math.max(8, rect.top - popupHeight - 8) : rect.bottom + 8,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(viewDate.minus({ months: 1 }));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(viewDate.plus({ months: 1 }));
  };

  const handleSelectDate = (date: DateTime) => {
    onChange(date.toISODate());
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Generate calendar grid
  const startOfMonth = viewDate.startOf('month');
  const endOfMonth = viewDate.endOf('month');
  const daysInMonth = viewDate.daysInMonth;
  const startingDayOfWeek = startOfMonth.weekday; // 1 = Monday, 7 = Sunday
  
  // Create padded array for empty cells before start of month based on settings
  const emptyDays = (startingDayOfWeek - weekStartsOn + 7) % 7;
  const blanks = Array.from({ length: emptyDays }).map((_, i) => i);
  const days = Array.from({ length: daysInMonth! }).map((_, i) => i + 1);

  // Reorder days based on weekStartsOn preference
  const weekDaysHeader = weekStartsOn === 1 
    ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const displayDate = value ? DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED) : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        ref={triggerRef}
        className={`input flex items-center justify-between cursor-pointer ${className}`}
        onClick={toggleOpen}
        style={{ paddingRight: '0.4rem', gap: '0.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: value ? 'var(--color-text-base)' : 'var(--color-text-faint)' }}>
          <CalendarIcon size={16} />
          <span style={{ fontSize: '0.9rem' }}>{value ? displayDate : placeholder}</span>
        </div>
        {value && (
          <button 
            type="button"
            onClick={clearDate}
            className="btn-ghost"
            style={{ 
              padding: '0.25rem', 
              color: 'var(--color-text-faint)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
             <X size={12} strokeWidth={3} />
          </button>
        )}
      </div>

      {isOpen && mounted && createPortal(
        <div ref={popupRef} style={{
          position: 'fixed',
          top: popupPos.top,
          left: popupPos.left,
          zIndex: 12000,
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          width: '280px',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button type="button" onClick={prevMonth} className="btn-ghost" style={{ padding: '0.4rem' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-base)' }}>
              {viewDate.toFormat('MMMM yyyy')}
            </span>
            <button type="button" onClick={nextMonth} className="btn-ghost" style={{ padding: '0.4rem' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {weekDaysHeader.map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-faint)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {days.map(day => {
              const currentIterationDate = viewDate.set({ day });
              const isSelected = value === currentIterationDate.toISODate();
              const isToday = currentIterationDate.hasSame(DateTime.local(), 'day');

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(currentIterationDate)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 500,
                    borderRadius: '50%',
                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? '#fff' : (isToday ? 'var(--color-primary-light)' : 'var(--color-text-base)'),
                    border: isToday && !isSelected ? '1px solid var(--color-primary)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
