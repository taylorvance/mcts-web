// src/components/EvalBar.tsx
import React from 'react';
import { Node } from 'multimcts';

interface EvalBarProps {
  node: Node | null;
}

const EvalBar: React.FC<EvalBarProps> = ({ node }) => {
  if (!node) return null;

  const rewards = Object.entries(node.rewards).sort(([,v1], [,v2]) => v2-v1);
  const totalRewards = rewards.reduce((acc, [,v]) => acc+v, 0);

  return (
    <div className="relative w-full bg-gray-100 text-white font-bold rounded overflow-hidden">
      <div className="flex h-5 items-center">
        {rewards.map(([team, reward], i) => {
          const percentage = (reward / totalRewards) * 100;
          const color = "bg-blue-500";
          const opacity = (rewards.length-i) / rewards.length;
          return <div key={team} className={`${color}`} style={{width:`${percentage}%`, opacity}}>{team}</div>;
        })}
      </div>
    </div>
  );
};

export default EvalBar;
