import type { Metadata } from 'next';
import Script from 'next/script';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: '方块帝国 (Block Empire)',
  description: '方块帝国 - 一款基于 Next.js Socket.IO 构建的实时多人策略游戏',
  keywords: '方块帝国, Block Empire, 多人游戏, 策略游戏',
  icons: {
    icon: '/img/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <Script
          id="baidu-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?94feacca3c0d1e2d9158a7bfcfacfa5a";
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
