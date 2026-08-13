import type { Metadata } from 'next';
import './globals.css';
import { SyncProvider } from '@/components/SyncProvider';

export const metadata: Metadata = {
  title: 'Dopamine Quest',
  description: 'ADHD 사용자를 위한 RPG 스타일 게이미피케이션 할 일 관리 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-zinc-950">
        <SyncProvider>{children}</SyncProvider>
      </body>
    </html>
  );
}
