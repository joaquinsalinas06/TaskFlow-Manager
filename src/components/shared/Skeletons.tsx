'use client';

import React from 'react';
import { Target, ListTodo, Settings, ChevronLeft, Globe, Filter, Calendar as CalendarIcon, Mail } from 'lucide-react';

const shimmer = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-sidebar {
  width: 260px;
  background: var(--color-surface-1);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.skeleton-main {
  flex: 1;
  overflow-y: auto;
  background: var(--color-surface-0);
  position: relative;
}

.skeleton-header {
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-1);
}

.skeleton-content {
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 100px;
  border-radius: 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-surface-3);
  overflow: hidden;
  position: relative;
}

.skeleton-settings-grid {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1.5rem;
  align-items: flex-start;
  width: 100%;
}

@media (max-width: 768px) {
  .skeleton-sidebar {
    width: 0;
    border-right: none;
    overflow: hidden;
  }
  
  .skeleton-header {
    padding: 1rem;
  }
  
  .skeleton-content {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-settings-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .skeleton-header-title {
    width: 160px !important;
  }
  
  .skeleton-header-desc {
    width: 200px !important;
  }
}
`;

export function SidebarSkeleton() {
  return (
    <aside className="skeleton-sidebar">
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
    <main className="skeleton-main">
      <style>{shimmer}</style>
      <div className="skeleton-header">
        <div className="skeleton-header-title" style={{ height: '32px', width: '200px', borderRadius: '8px', background: 'var(--color-surface-3)', marginBottom: '0.5rem', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div className="skeleton-header-desc" style={{ height: '16px', width: '300px', borderRadius: '4px', background: 'var(--color-surface-2)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div className="skeleton-content">
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: '1rem', background: 'var(--color-surface-1)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
             <div style={{ height: '24px', width: '120px', borderRadius: '6px', background: 'var(--color-surface-3)', marginBottom: '1rem', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
             </div>
             <div className="skeleton-grid">
                {[1, 2].map(j => (
                  <div key={j} className="skeleton-card">
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
      <style>{shimmer}</style>
      <div className="skeleton-header">
        <div className="skeleton-header-title" style={{ height: '32px', width: '200px', borderRadius: '8px', background: 'var(--color-surface-3)', marginBottom: '0.5rem', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div className="skeleton-header-desc" style={{ height: '16px', width: '250px', borderRadius: '4px', background: 'var(--color-surface-2)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </div>
      <div className="skeleton-settings-grid">
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
