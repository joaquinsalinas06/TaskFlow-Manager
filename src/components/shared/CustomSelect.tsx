'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
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

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < menuHeight + 16;

      setMenuPos({
        left: rect.left,
        width: rect.width,
        top: openUpwards ? Math.max(8, rect.top - menuHeight - 6) : rect.bottom + 6,
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

  return (
    <div className="custom-select-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
      {label && <label className="label" style={{ marginBottom: 0 }}>{label}</label>}
      
      {/* Trigger */}
      <div
        ref={triggerRef}
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
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            zIndex: 12000,
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
        </div>,
        document.body
      )}
    </div>
  );
}
