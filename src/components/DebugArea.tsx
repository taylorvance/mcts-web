// src/components/DebugArea.tsx
import React from 'react';

interface DebugAreaProps {
  debugInfo: any;
}

const DebugArea: React.FC<DebugAreaProps> = ({ debugInfo }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
      {debugInfo ? (
        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60 text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      ) : (
        <p className="text-gray-500">No debug information available.</p>
      )}
    </div>
  );
};

export default DebugArea;