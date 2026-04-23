// src/components/MCTSSettings.tsx
import React from 'react';
import TextInput from './TextInput';

interface MCTSSettingsProps {
  settings: {
    explorationBias: number;
    maxIterations: number;
    maxRetainedNodes: number;
    maxTime: number;
  };
  setSettings: React.Dispatch<React.SetStateAction<{
    explorationBias: number;
    maxIterations: number;
    maxRetainedNodes: number;
    maxTime: number;
  }>>;
}

const MCTSSettings: React.FC<MCTSSettingsProps> = ({settings, setSettings}) => {
  const handleChange = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'explorationBias'
      ? parseFloat(e.target.value)
      : parseInt(e.target.value, 10);
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
      <TextInput
        label="Max Retained Nodes"
        type="number"
        value={settings.maxRetainedNodes}
        onChange={handleChange('maxRetainedNodes')}
        min="0"
        step="1"
      />
    </div>
  );
};

export default MCTSSettings;
