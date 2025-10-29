import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '地图创建器 | 方块帝国',
};

export default function MapCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
