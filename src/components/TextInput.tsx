// src/components/TextInput.tsx
import React from 'react';

interface TextInputProps {
  label?: string;
  type?: string;
  value: string|number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  min?: string;
  max?: string;
}

const TextInput: React.FC<TextInputProps> = ({label, type='text', value, onChange, step, min, max}) => {
  return (
    <label className="flex flex-col gap-1">
      {label}
      <input
        className="text-lg px-2 py-1 border rounded-lg border-gray-400 hover:border-gray-800"
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
};

export default TextInput;
