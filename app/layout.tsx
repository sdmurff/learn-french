import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learn French - Dictation Practice',
  description: 'Practice French listening comprehension and spelling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
