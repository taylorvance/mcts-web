// src/components/TextInput.tsx
import React from 'react';

interface TextInputProps {
  id: string;
  label?: string;
  type?: string;
  value: string|number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  min?: string;
  max?: string;
}

const TextInput: React.FC<TextInputProps> = ({ id, label, type='text', value, onChange, step, min, max }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block">{label}</label>}
      <input
        className="w-full p-2 border rounded-lg border-gray-400 hover:border-gray-800 "
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default TextInput;
