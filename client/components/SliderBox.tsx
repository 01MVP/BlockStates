import clsx from 'classnames';
import { ChangeEvent } from 'react';

interface SliderMark {
  value: number;
  label: string;
}

interface SliderBoxProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  valueLabelDisplay?: 'auto' | 'on' | 'off';
  marks?: SliderMark[];
  icon?: React.ReactNode;
  handleChange: (event: Event, value: number) => void;
  disabled?: boolean;
}

export default function SliderBox({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  valueLabelDisplay = 'on',
  marks,
  icon,
  handleChange,
  disabled = false,
}: SliderBoxProps) {
  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const numericValue = Number(event.target.value);
    handleChange(event.nativeEvent, numericValue);
  };

  return (
    <div
      className={clsx(
        'flex w-full items-center gap-3 py-2',
        disabled && 'opacity-60',
      )}
    >
      {icon && <div className="text-text-muted">{icon}</div>}
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-medium text-text-primary">{label}</span>
          {valueLabelDisplay !== 'off' && (
            <span className="text-text-secondary">{value}</span>
          )}
        </div>
        <input
          type="range"
          name={label}
          id={label}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-border-subtle accent-text-primary"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleRangeChange}
          disabled={disabled}
        />
        {marks && marks.length > 0 && (
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            {marks.map((mark) => (
              <span key={mark.value} className="min-w-[18px] text-center">
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
