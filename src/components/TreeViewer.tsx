// src/components/TreeViewer.tsx
import React, { useState } from 'react';
import { MCTS } from 'multimcts';

interface TreeViewerProps {
  mcts: MCTS | null;
}

interface NodeStats {
  move: string | null;
  state: string;
  visits: number;
  rewards: Record<string, number>;
  children: string[];
}

const NodeViewer: React.FC<{ nodeStats:NodeStats; mcts:MCTS; depth:number }> = ({ nodeStats, mcts, depth }) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [childrenStats, setChildrenStats] = useState<NodeStats[]>([]);

  const handleExpand = () => {
    if (!isExpanded && childrenStats.length === 0) {
      const newChildrenStats = nodeStats.children.map(childMove => 
        mcts.rootNode.getStats(depth + 1)
      );
      setChildrenStats(newChildrenStats);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ml-4">
      <div 
        className="flex items-center cursor-pointer" 
        onClick={handleExpand}
      >
        <span className="mr-2">{isExpanded ? '▼' : '►'}</span>
        <span className="font-mono">
          {nodeStats.move === null ? 'root' : `Move: ${nodeStats.move}`} 
          (Visits: {nodeStats.visits}, Rewards: {JSON.stringify(nodeStats.rewards)})
        </span>
      </div>
      {isExpanded && (
        <div>
          <div className="ml-4 mt-2 mb-2 bg-gray-100 p-2 rounded">
            <pre className="text-xs">{nodeStats.state}</pre>
          </div>
          {childrenStats.map((childStats, index) => (
            <NodeViewer key={index} nodeStats={childStats} mcts={mcts} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeViewer: React.FC<TreeViewerProps> = ({ mcts }) => {
  const rootStats = mcts ? mcts.rootNode.getStats(0) : null;

  return (
    <div className="mt-4">
      {rootStats ? (
        <div className="bg-gray-100 p-2 rounded overflow-auto max-h-96 text-sm">
          <NodeViewer nodeStats={rootStats} mcts={mcts} depth={0} />
        </div>
      ) : (
        <p className="text-gray-500">No tree information available.</p>
      )}
    </div>
  );
};

export default TreeViewer;
