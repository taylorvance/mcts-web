// src/components/MCTSSettings.tsx
import React from 'react';
import TextInput from './TextInput';

interface MCTSSettingsProps {
  settings: {
    explorationBias: number;
    maxIterations: number;
    maxTime: number;
  };
  setSettings: React.Dispatch<React.SetStateAction<{
    explorationBias: number;
    maxIterations: number;
    maxTime: number;
  }>>;
}

const MCTSSettings: React.FC<MCTSSettingsProps> = ({settings, setSettings}) => {
  const handleChange = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'maxIterations' ? parseInt(e.target.value, 10) : parseFloat(e.target.value);
    setSettings(prev => ({...prev, [key]:value}));
  };

  return (
    <div className="flex flex-col gap-2">
      <TextInput
        label="Exploration Bias"
        type="number"
        value={settings.explorationBias}
        onChange={handleChange('explorationBias')}
        min="0"
        step="0.1"
      />
      <TextInput
        label="Max Iterations"
        type="number"
        value={settings.maxIterations}
        onChange={handleChange('maxIterations')}
        min="0"
      />
      <TextInput
        label="Max Time (s)"
        type="number"
        value={settings.maxTime}
        onChange={handleChange('maxTime')}
        min="0"
        step="0.5"
      />
    </div>
  );
};

export default MCTSSettings;
