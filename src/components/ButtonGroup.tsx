import React from 'react';
import Tooltip from './Tooltip';

interface ButtonGroupProps {
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ tooltip, children, className='' }) => {
  const baseClassName = 'flex items-center';
  const fullClassName = `${baseClassName} ${className}`.trim();

  const buttonGroup = (
    <div className={fullClassName}>
      {React.Children.map(children, (child, index) => {
        if(React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isInGroup: true,
            isFirst: index === 0,
            isLast: index === React.Children.count(children) - 1,
          });
        }
        return child;
      })}
    </div>
  );

  if(tooltip) {
    return <Tooltip content={tooltip}>{buttonGroup}</Tooltip>;
  }

  return buttonGroup;
}

export default ButtonGroup;
