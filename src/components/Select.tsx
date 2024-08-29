import React, { useRef } from 'react';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value:string) => void;
  options: {[key:string]: string};
  className?: string;
  centerText?: boolean;
}

const Select: React.FC<SelectProps> = ({label, value, onChange, options, className='', centerText=false}) => {
  const baseClassName = 'appearance-none text-lg px-2 py-1 rounded-lg border border-gray-400 hover:border-gray-800 focus:outline-none';
  const textAlignStyle:React.CSSProperties = centerText ? {textAlignLast:'center'} : {};
  const selectRef = useRef<HTMLSelectElement>(null);

  return (
    <label
      className="flex flex-col gap-1"
      onClick={() => selectRef.current?.dispatchEvent(new MouseEvent('mousedown'))}
    >
      {label}
      <select
        ref={selectRef}
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
    </label>
  );
};

export default Select;
