import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '游戏房间 | 方块战国',
};

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
