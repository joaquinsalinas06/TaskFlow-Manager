'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface-0)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          border: '2.5px solid var(--color-surface-4)',
          borderTopColor: 'var(--color-primary)',
          display: 'inline-block',
        }} className="animate-spin" />
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <Spinner />;

  return <LoginForm />;
}
