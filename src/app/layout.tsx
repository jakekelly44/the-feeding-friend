import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Feeding Friend',
  description: 'Professional nutrition planning for the pets you love.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
