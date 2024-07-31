// src/components/MCTSSettings.tsx
import React from 'react';

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

const MCTSSettings: React.FC<MCTSSettingsProps> = ({ settings, setSettings }) => {
  return (
    <div className="mb-4">
      <div className="space-y-2">
        <div>
          <label htmlFor="explorationBias" className="block">Exploration Bias:</label>
          <input
            id="explorationBias"
            type="number"
            value={settings.explorationBias}
            onChange={(e) => setSettings({ ...settings, explorationBias: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded"
            step="0.1"
          />
        </div>
        <div>
          <label htmlFor="maxIterations" className="block">Max Iterations:</label>
          <input
            id="maxIterations"
            type="number"
            value={settings.maxIterations}
            onChange={(e) => setSettings({ ...settings, maxIterations: parseInt(e.target.value, 10) })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="maxTime" className="block">Max Time (s):</label>
          <input
            id="maxTime"
            type="number"
            value={settings.maxTime}
            onChange={(e) => setSettings({ ...settings, maxTime: parseInt(e.target.value, 10) })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default MCTSSettings;
