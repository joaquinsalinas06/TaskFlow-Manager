import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import './globals.css';

export const metadata: Metadata = {
  title: "TaskFlow Manager",
  description: "A flexible task manager with dynamic priorities and groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body className="h-full antialiased" style={{ background: 'var(--color-surface-0)', color: 'var(--color-text-base)' }}>
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
