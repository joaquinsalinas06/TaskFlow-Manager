'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  color?: string; // Optional indicator color
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Select an option', label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    <div className="custom-select-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
      {label && <label className="label" style={{ marginBottom: 0 }}>{label}</label>}
      
      {/* Trigger */}
      <div
        className="input"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          paddingRight: '0.75rem',
          userSelect: 'none',
          border: isOpen ? '1px solid var(--color-primary)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.15)' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedOption.color, flexShrink: 0 }} />
              )}
              <span style={{ color: 'var(--color-text-base)' }}>{selectedOption.label}</span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-faint)' }}>{placeholder}</span>
          )}
        </div>
        <svg 
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            zIndex: 60,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.15s ease-out forwards',
            padding: '0.3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.1rem',
          }}
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: value === opt.value ? 'var(--color-surface-2)' : 'transparent',
                  color: value === opt.value ? 'var(--color-text-base)' : 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = 'var(--color-surface-2)';
                    e.currentTarget.style.color = 'var(--color-text-base)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }
                }}
              >
                {opt.color && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                )}
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-faint)', textAlign: 'center' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
