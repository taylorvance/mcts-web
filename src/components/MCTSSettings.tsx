// src/components/MCTSSettings.tsx
import React from 'react';
import TextInput from './TextInput';

interface MCTSSettingsProps {
  settings: {
    explorationBias: number;
    maxIterations: number | null;
    maxRetainedNodes: number | null;
    maxTime: number | null;
  };
  setSettings: React.Dispatch<
    React.SetStateAction<{
      explorationBias: number;
      maxIterations: number | null;
      maxRetainedNodes: number | null;
      maxTime: number | null;
    }>
  >;
}

const MCTSSettings: React.FC<MCTSSettingsProps> = ({
  settings,
  setSettings,
}) => {
  const handleChange =
    (key: keyof typeof settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const value = rawValue === ''
        ? null
        : (
          key === 'explorationBias'
            ? parseFloat(rawValue)
            : parseInt(rawValue, 10)
        );

      if (key === 'explorationBias') {
        setSettings((prev) => ({
          ...prev,
          explorationBias: value ?? prev.explorationBias,
        }));
        return;
      }

      setSettings((prev) => ({ ...prev, [key]: value }));
    };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-600">
        Leave Max Iterations, Max Time, or Max Retained Nodes blank to unset
        them. Search requires Max Iterations or Max Time.
      </p>
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
        value={settings.maxIterations ?? ''}
        onChange={handleChange('maxIterations')}
        min="1"
      />
      <TextInput
        label="Max Time (ms)"
        type="number"
        value={settings.maxTime ?? ''}
        onChange={handleChange('maxTime')}
        min="1"
        step="10"
      />
      <TextInput
        label="Max Retained Nodes"
        type="number"
        value={settings.maxRetainedNodes ?? ''}
        onChange={handleChange('maxRetainedNodes')}
        min="1"
        step="1"
      />
    </div>
  );
};

export default MCTSSettings;
