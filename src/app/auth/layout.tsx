export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 10%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(79,70,229,0.08) 0%, transparent 55%), var(--color-surface-0)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* decorative blobs */}
      <div
        style={{
          position: 'absolute', top: '-4rem', right: '-4rem',
          width: '28rem', height: '28rem',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-6rem', left: '-6rem',
          width: '36rem', height: '36rem',
          background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
