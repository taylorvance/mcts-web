import React, { useRef } from 'react';
import { FaAngleDown } from "react-icons/fa6";

interface SelectProps {
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value:string) => void;
  options: {[key:string]: string};
  className?: string;
  centerText?: boolean;
}

const Select: React.FC<SelectProps> = ({label, ariaLabel, value, onChange, options, className='', centerText=false}) => {
  const baseClassName = 'appearance-none text-lg pl-3 pr-8 py-1 rounded-lg border border-gray-400 group-hover:border-gray-800 focus:outline-none';
  const textAlignStyle:React.CSSProperties = (centerText ? {textAlignLast:'center'} : {});
  const selectRef = useRef<HTMLSelectElement>(null);

  return (
    <label
      className="flex flex-col gap-1"
      onClick={() => selectRef.current?.dispatchEvent(new MouseEvent('mousedown'))}
    >
      {label}
      <div className="relative group">
        <select
          ref={selectRef}
          aria-label={ariaLabel ?? label}
          value={value}
          onChange={(e) => {
            selectRef.current?.blur();
            onChange(e.target.value);
          }}
          className={`${baseClassName} ${className}`}
          style={textAlignStyle}
        >
          {Object.keys(options).map((key) => (
            <option key={key} value={key}>
              {options[key]}
            </option>
          ))}
        </select>
        <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400 group-hover:text-gray-800">
          <FaAngleDown />
        </span>
      </div>
    </label>
  );
};

export default Select;
