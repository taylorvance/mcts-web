import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative group">
      <div className="hidden text-sm px-2 py-1 rounded-lg backdrop-blur group-hover:block w-max absolute left-1/2 transform -translate-x-1/2 -translate-y-full">
        {content}
      </div>
      {children}
    </div>
  );
};

export default Tooltip;
