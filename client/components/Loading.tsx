import Spinner from '@/components/ui/Spinner';

interface LoadingProps {
  open: boolean;
  title?: string;
}

const Loading: React.FC<LoadingProps> = ({ open, title }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card flex w-full max-w-sm flex-col items-center gap-4 text-center shadow-xl">
        {title && (
          <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        )}
        <Spinner size="lg" />
      </div>
    </div>
  );
};

export default Loading;
