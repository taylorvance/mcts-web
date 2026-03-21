import React from 'react';

interface BrandBadgeProps {
  className?: string;
  label?: string;
}

const BrandBadge: React.FC<BrandBadgeProps> = ({
  className = '',
  label = 'tvprograms.tech',
}) => {
  return (
    <a
      href="https://tvprograms.tech"
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-400 hover:text-gray-900 ${className}`.trim()}
    >
      <img src="https://tvprograms.tech/tv.svg" alt="" className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
};

export default BrandBadge;
