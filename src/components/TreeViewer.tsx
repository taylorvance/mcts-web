// src/components/TreeViewer.tsx
import React, { useEffect, useState } from 'react';
import { MCTS, Node } from 'multimcts';
import { formatGameStateDebugLabel } from '../utils/gameStateDebug';

interface TreeViewerProps {
  mcts: MCTS | null;
}

const TreeViewer: React.FC<TreeViewerProps> = ({ mcts }) => {
  const rootNode = mcts?.rootNode ?? null;

  return (
    <div className="bg-gray-100 p-2 rounded-lg overflow-auto text-sm font-mono">
      {rootNode ? (
        <NodeViewer node={rootNode} expanded={true} />
      ) : (
        <em className="text-gray-500">No tree information available.</em>
      )}
    </div>
  );
};

const NodeViewer: React.FC<{ node:Node; expanded:boolean; }> = ({ node, expanded }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [children, setChildren] = useState<Node[]>([]);

  useEffect(() => {
    setChildren(Object.values(node.children).sort((a,b) => b.visits-a.visits));
    setIsExpanded(expanded);
  }, [expanded, node]);

  const toggleExpand = () => { setIsExpanded(!isExpanded); };
  const stateDebug = formatGameStateDebugLabel(node.state);
  const rawStateDebug = node.state.toString();

  return (
    <>
      <div className={`flex items-center ${children.length>0 ? 'cursor-pointer' : 'cursor-default'}`} onClick={toggleExpand}>
        <span className={`mr-2 ${children.length>0 ? 'font-bold' : ''}`}>
          {children.length>0 ? (isExpanded?'-':'+') : '·'}
        </span>
        <span className="mr-2 bg-gray-200 overflow-auto" title={rawStateDebug}>{stateDebug}</span>
        <span className="mr-2 bg-gray-200">{node.move ?? 'root'}</span>
        <span className="mr-2">n={node.visits}</span>
        <span className="mr-2">{JSON.stringify(node.rewards)}</span>
      </div>
      {isExpanded && (
        <div className="ml-4">
          {children.map((child, index) => (
            <NodeViewer key={index} node={child} expanded={false} />
          ))}
        </div>
      )}
    </>
  );
};

export default TreeViewer;
