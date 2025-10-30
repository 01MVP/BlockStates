import { useMemo, useState } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import HowToPlay from './HowToPlay';

import Link from 'next/link';
import clsx from 'classnames';

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
};

const navItems = [
  { href: '/', label: '首页' },
  { href: 'https://docs.block-states.com/', label: '文档', external: true },
  { href: 'https://github.com/01MVP/BlockStates', label: 'GitHub', external: true },
  {
    href: 'https://github.com/01MVP/BlockStates#开发机器人',
    label: '开发机器人',
    external: true,
  },
  {
    href: 'https://github.com/01MVP/BlockStates/issues',
    label: '反馈',
    external: true,
  },
  {
    href: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=VAwNA8NiYUMsPHrBxLso-t09saGZCT14&authKey=fFpto%2Ff%2FhNUpcxZhSVZt6msLOZrMhW3e14mypEBlO3Ih7PdqOmXq%2FQ0OlV3D%2BuyO&noverify=0&group_code=374889821',
    label: 'QQ群',
    external: true,
  },
] as const satisfies readonly NavItem[];

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  const handleLangChange = (lang: string) => {
    const currentPath = pathname.replace(/^\/(en|zh)/, '');
    router.push(`/${lang}${currentPath}`);
  };

  const desktopNav = useMemo(
    () =>
      navItems.map((item) => {
        const isActive =
          item.href !== '/' ? pathname.startsWith(item.href) : pathname === '/';
        const linkClass = clsx(
          'inline-flex items-center gap-2 rounded-md border-2 px-4 py-2 text-sm transition-all',
          isActive
            ? 'border-text-primary bg-text-primary text-white shadow-md'
            : 'border-transparent text-text-secondary hover:border-text-primary hover:bg-bg-main',
        );

        const isExternal = 'external' in item && item.external;
        const linkProps = isExternal
          ? { target: '_blank', rel: 'noreferrer noopener' }
          : {};

        return (
          <Link key={item.href} href={item.href} {...linkProps} className={linkClass}>
            {item.label}
          </Link>
        );
      }),
    [pathname],
  );

  return (
    <header className="sticky top-0 z-sticky border-b-2 border-border-main bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-border-main bg-white text-text-primary hover:bg-bg-main md:hidden"
            aria-label="切换导航"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className="sr-only">打开菜单</span>
            <span className="flex h-3 w-6 flex-col justify-between">
              <span className="block h-[2px] w-6 bg-text-primary" />
              <span className="block h-[2px] w-6 bg-text-primary" />
              <span className="block h-[2px] w-6 bg-text-primary" />
            </span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/img/logo.svg"
              width={32}
              height={32}
              alt="Block States"
              priority
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">{desktopNav}</nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            onClick={() => setShowHowTo(true)}
          >
            游戏教程
          </button>
          <select
            defaultValue="zh"
            onChange={(event) => handleLangChange(event.target.value)}
            className="rounded-md border-2 border-border-main bg-white px-3 py-2 text-sm text-text-primary shadow-sm transition hover:border-text-primary focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/15"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t-2 border-border-main bg-white/95 px-4 py-4 backdrop-blur md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isExternal = 'external' in item && item.external;
              const linkProps = isExternal
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {};
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  {...linkProps}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md border-2 border-border-main bg-bg-light px-3 py-2 text-sm text-text-primary shadow-sm transition hover:bg-bg-main"
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowHowTo(true);
                setMobileOpen(false);
              }}
            >
              游戏教程
            </button>
            <select
              defaultValue="zh"
              onChange={(event) => handleLangChange(event.target.value)}
              className="rounded-md border-2 border-border-main bg-white px-3 py-2 text-sm text-text-primary shadow-sm transition hover:border-text-primary focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/15"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      )}

      <HowToPlay show={showHowTo} toggleShow={() => setShowHowTo(false)} />
    </header>
  );
}
export default Navbar;
