import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '自定义地图 | 方块帝国',
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
