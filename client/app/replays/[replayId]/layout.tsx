import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '游戏回放 | 方块帝国',
};

export default function ReplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
