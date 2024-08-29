import React from 'react';

interface SelectProps {
  value: string;
  onChange: (value:string) => void;
  options: {[key:string]: string};
  className?: string;
  centerText?: boolean;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  centerText = false,
}) => {
  const baseClassName = 'text-xl rounded-lg px-4 py-2 border border-gray-400 hover:border-gray-800 focus:outline-none appearance-none';
  const textAlignStyle = centerText ? {textAlignLast:'center'} : {};

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseClassName} ${className}`}
      style={textAlignStyle}
    >
      {Object.keys(options).map((key) => (
        <option key={key} value={key}>
          {options[key]}
        </option>
      ))}
    </select>
  );
};

export default Select;
