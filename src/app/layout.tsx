import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BranchWatch — Understand every branch. At a glance.',
  description: 'Track GitHub branch activity, commits, and comparisons in one clean, minimal workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
        {children}
      </body>
    </html>
  );
}
