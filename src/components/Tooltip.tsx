import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
}) => {
  const tooltipPositionClass = placement === 'bottom'
    ? 'top-full mt-1 -translate-x-1/2'
    : 'bottom-full mb-1 -translate-x-1/2';

  return (
    <div className="relative group">
      <div className={`pointer-events-none absolute left-1/2 z-20 hidden w-max rounded-lg bg-white/90 px-2 py-1 text-sm text-gray-900 shadow-md backdrop-blur-sm group-hover:block ${tooltipPositionClass}`}>
        {content}
      </div>
      {children}
    </div>
  );
};

export default Tooltip;
