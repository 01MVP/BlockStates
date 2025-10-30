import Link from 'next/link';

function Footer() {
  const chinaWebsite: boolean = process.env.NEXT_PUBLIC_SERVER_API.endsWith('cn');

  return (
    <footer className="mt-auto w-full border-t-2 border-border-main bg-white/80 py-6 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-sm text-text-muted">
        <p>
          版权所有 © 2024~{new Date().getFullYear()} Block States 
        </p>
        {chinaWebsite && (
          <Link
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-player-2 underline-offset-4 hover:underline"
          >
            粤ICP备2022122081号-2
          </Link>
        )}
      </div>
    </footer>
  );
}

export default Footer;
