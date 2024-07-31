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
  children: NodeStats[] | string | null;
}

const NodeViewer: React.FC<{ nodeStats:NodeStats; mcts:MCTS; expanded:boolean; path:string[]; }> = ({ nodeStats, mcts, expanded, path }) => {
  let node = mcts.rootNode;
  while(path.length > 0) {
    node = node.children[path.shift()!];
  }
  const children = [];
  for(const move in node.children) {
    children.push(node.children[move].getStats(0));
  }
  children.sort((a,b) => b.visits-a.visits);

  const [isExpanded, setIsExpanded] = useState(expanded);
  const [childrenStats, setChildrenStats] = useState<NodeStats[]>(children);

  const handleExpand = async () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ml-4">
      <div className="flex items-center cursor-pointer" onClick={handleExpand}>
        <span className="mr-2">{isExpanded ? '▼' : '►'}</span>
        <span className="">{nodeStats.state}</span>
        <span className="font-mono">
          (Visits: {nodeStats.visits}, Rewards: {JSON.stringify(nodeStats.rewards)})
        </span>
      </div>
      {isExpanded && (
        <div>
          {childrenStats.map((childStats, index) => (
            <NodeViewer key={index} nodeStats={childStats} mcts={mcts} expanded={false} path={[...path, childStats.move!]} />
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
          <NodeViewer nodeStats={rootStats} mcts={mcts} expanded={true} path={[]} />
        </div>
      ) : (
        <p className="text-gray-500">No tree information available.</p>
      )}
    </div>
  );
};

export default TreeViewer;
