import clsx from 'classnames';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = sizeMap[size] ?? sizeMap.md;

  return (
    <span
      className={clsx(
        'inline-flex rounded-full border-border-main border-t-text-primary animate-spin',
        sizeClass,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">加载中</span>
    </span>
  );
}
