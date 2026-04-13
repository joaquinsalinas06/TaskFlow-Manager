'use client';

import React from 'react';
import { Target, ListTodo, Settings, ChevronLeft, Globe, Filter, Calendar as CalendarIcon, Mail } from 'lucide-react';

const shimmer = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;

export function SidebarSkeleton() {
  return (
    <aside style={{ width: '260px', background: 'var(--color-surface-1)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
      <style>{shimmer}</style>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '12px', background: 'var(--color-surface-3)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ height: '16px', width: '120px', borderRadius: '4px', background: 'var(--color-surface-3)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[1, 2].map(i => (
          <div key={i}>
            <div style={{ height: '14px', width: '80px', borderRadius: '4px', background: 'var(--color-surface-2)', marginBottom: '1rem', marginLeft: '0.5rem', overflow: 'hidden', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
            </div>
            {[1, 2, 3].map(j => (
              <div key={j} style={{ height: '36px', borderRadius: '8px', background: 'var(--color-surface-2)', marginBottom: '0.5rem', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

export function MainContentSkeleton() {
  return (
    <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-surface-0)', position: 'relative' }}>
      <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}>
        <div style={{ height: '32px', width: '200px', borderRadius: '8px', background: 'var(--color-surface-3)', marginBottom: '0.5rem', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ height: '16px', width: '300px', borderRadius: '4px', background: 'var(--color-surface-2)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: '1rem', background: 'var(--color-surface-1)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
             <div style={{ height: '24px', width: '120px', borderRadius: '6px', background: 'var(--color-surface-3)', marginBottom: '1rem', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {[1, 2].map(j => (
                  <div key={j} style={{ height: '100px', borderRadius: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export function SettingsSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}>
        <div style={{ height: '32px', width: '200px', borderRadius: '8px', background: 'var(--color-surface-3)', marginBottom: '0.5rem', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ height: '16px', width: '250px', borderRadius: '4px', background: 'var(--color-surface-2)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '2rem', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2, 3].map(i => (
             <div key={i} style={{ height: '180px', borderRadius: '1rem', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
             </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2].map(i => (
             <div key={i} style={{ height: '220px', borderRadius: '1rem', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
