'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/providers/I18nProvider';

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  title?: string;
  size?: number;
}

export default function ColorPicker({ color, onChange, title = 'Change color', size = 12 }: ColorPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
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
      const popoverHeight = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popoverHeight + 16;

      setPopoverPos({
        left: rect.left,
        top: openUpwards ? Math.max(8, rect.top - popoverHeight - 8) : rect.bottom + 8,
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="color-picker-wrapper" ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        title={title}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: color,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          boxShadow: '0 0 0 1.5px rgba(255,255,255,0.1)',
          flexShrink: 0,
          display: 'block',
          transition: 'transform 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />

      {/* Popover */}
      {isOpen && mounted && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 12000,
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem',
            width: '180px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.15s ease-out forwards',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-base)', marginBottom: '0.5rem' }}>
            {t('theme_colors')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginBottom: '0.6rem' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleSelect(c)}
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '50%',
                  background: c,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: color === c ? `0 0 0 2px var(--color-surface-1), 0 0 0 4px ${c}` : '0 0 0 1px rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
          
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{t('custom')}</span>
            <div style={{ position: 'relative', width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
              <input
                type="color"
                value={color || '#ffffff'}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  position: 'absolute', inset: -10, width: '40px', height: '40px', opacity: 0, cursor: 'crosshair',
                }}
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {color.toUpperCase()}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
