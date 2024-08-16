import React from 'react';
import Tooltip from './Tooltip';

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  isInGroup?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  tooltip,
  children,
  className = '',
  isInGroup = false,
  isFirst = false,
  isLast = false,
}) => {
  const baseClassName = 'p-2 bg-gray-200 flex items-center gap-1';
  const disabledClassName = disabled ? 'cursor-not-allowed text-white' : '';
  
  let roundingClass = 'rounded-lg';
  let marginClass = '';

  if(isInGroup) {
    roundingClass = '';
    if(isFirst) roundingClass += ' rounded-l-lg';
    else marginClass = 'ml-0.5';
    if(isLast) roundingClass += ' rounded-r-lg';
  }

  const fullClassName = `${baseClassName} ${roundingClass} ${marginClass} ${className} ${disabledClassName}`.trim();

  const button = (
    <button className={fullClassName} onClick={onClick} disabled={disabled}>{children}</button>
  );

  if(tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
};

export default Button;
