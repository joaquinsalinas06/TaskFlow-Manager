'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';

interface TimePickerProps {
  value: string | null;
  onChange: (val: string | null) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function parseTime(value: string | null) {
  if (!value) {
    return { hours: '00', minutes: '00' };
  }

  const [hours = '00', minutes = '00'] = value.split(':');
  return {
    hours: HOURS.includes(hours) ? hours : '00',
    minutes: MINUTES.includes(minutes) ? minutes : '00',
  };
}

export default function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className = '',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [hours, setHours] = useState(() => parseTime(value).hours);
  const [minutes, setMinutes] = useState(() => parseTime(value).minutes);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const next = parseTime(value);
    setHours(next.hours);
    setMinutes(next.minutes);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || popupRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 260;
      const popupHeight = 210;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popupHeight + 16;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - popupWidth - 8);

      setPopupPos({
        left,
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

  const commitTime = (nextHours: string, nextMinutes: string) => {
    onChange(`${nextHours}:${nextMinutes}`);
  };

  const clearTime = () => {
    onChange(null);
    setHours('00');
    setMinutes('00');
    setIsOpen(false);
  };

  const setNow = () => {
    const now = new Date();
    const nextHours = String(now.getHours()).padStart(2, '0');
    const nextMinutes = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
    setHours(nextHours);
    setMinutes(nextMinutes);
    onChange(`${nextHours}:${nextMinutes}`);
  };

  const displayValue = value ? `${hours}:${minutes}` : placeholder;

  return (
    <>
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.68rem 0.85rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-1)',
            color: value ? 'var(--color-text-dark)' : 'var(--color-text-muted)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, background 0.2s ease',
              textAlign: 'left',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = 'var(--color-primary)';
            event.currentTarget.style.background = 'var(--color-surface-2)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = 'var(--color-border)';
            event.currentTarget.style.background = 'var(--color-surface-1)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <Clock size={16} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayValue}
            </span>
          </span>
          {value ? (
            <span
              onClick={(event) => {
                event.stopPropagation();
                clearTime();
              }}
              aria-label="Clear time"
              role="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '999px',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </span>
          ) : null}
        </button>
      </div>

      {mounted && isOpen &&
        createPortal(
          <div
            ref={popupRef}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${popupPos.top}px`,
              left: `${popupPos.left}px`,
              zIndex: 50,
              width: 'min(320px, calc(100vw - 16px))',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16)',
              backdropFilter: 'blur(10px)',
              padding: '0.9rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                Selecciona la hora
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>24h</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Hora
                </label>
                <div
                  style={{
                    width: '100%',
                    maxHeight: '184px',
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    padding: '0.25rem',
                  }}
                >
                  {HOURS.map((hour) => {
                    const active = hour === hours;

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => {
                          setHours(hour);
                          commitTime(hour, minutes);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '0.6rem',
                          border: 'none',
                          background: active ? 'var(--color-primary)' : 'transparent',
                          color: active ? 'white' : 'var(--color-text-dark)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: active ? 700 : 500,
                          textAlign: 'center',
                          transition: 'background 0.15s ease, color 0.15s ease',
                        }}
                        onMouseEnter={(event) => {
                          if (!active) {
                            event.currentTarget.style.background = 'var(--color-surface-1)';
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!active) {
                            event.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Min
                </label>
                <div
                  style={{
                    width: '100%',
                    maxHeight: '184px',
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    padding: '0.25rem',
                  }}
                >
                  {MINUTES.map((minute) => {
                    const active = minute === minutes;

                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => {
                          setMinutes(minute);
                          commitTime(hours, minute);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '0.6rem',
                          border: 'none',
                          background: active ? 'var(--color-primary)' : 'transparent',
                          color: active ? 'white' : 'var(--color-text-dark)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: active ? 700 : 500,
                          textAlign: 'center',
                          transition: 'background 0.15s ease, color 0.15s ease',
                        }}
                        onMouseEnter={(event) => {
                          if (!active) {
                            event.currentTarget.style.background = 'var(--color-surface-1)';
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!active) {
                            event.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={setNow}
                style={{
                  flex: 1,
                  padding: '0.58rem 0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-dark)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Ahora
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.58rem 0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Listo
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={clearTime}
                  style={{
                    flex: 1,
                    padding: '0.58rem 0.7rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
