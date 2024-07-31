// src/components/TreeViewer.tsx
import React, { useState, useEffect } from 'react';
import { MCTS } from 'multimcts';

interface TreeViewerProps {
  mcts: MCTS | null;
}

const NodeViewer: React.FC<{ node:Object; expanded:boolean; }> = ({ node, expanded }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [children, setChildren] = useState<Object[]>([]);

  useEffect(() => {
    setChildren(Object.values(node.children).sort((a,b) => b.visits-a.visits));
    setIsExpanded(expanded);
  }, [node]);

  const toggleExpand = () => { setIsExpanded(!isExpanded); };

  return (
    <div className="ml-4">
      <div className={`flex items-center ${children.length>0 ? 'cursor-pointer' : 'cursor-default'}`} onClick={toggleExpand}>
        <span className={`mr-2 ${children.length>0 ? 'font-bold' : ''}`}>
          {children.length>0 ? (isExpanded?'-':'+') : '·'}
        </span>
        <span className="mr-2 bg-gray-200">{node.state.toString()}</span>
        <span className="mr-2 bg-gray-200">{node.move}</span>
        <span className="mr-2">n={node.visits}</span>
        <span className="mr-2">{JSON.stringify(node.rewards)}</span>
      </div>
      {isExpanded && children.map((child, index) => (
        <NodeViewer key={index} node={child} expanded={false} />
      ))}
    </div>
  );
};

const TreeViewer: React.FC<TreeViewerProps> = ({ mcts }) => {
  const [rootNode, setRootNode] = useState(mcts?.rootNode);

  useEffect(() => {
    if(mcts) {
      setRootNode(mcts.rootNode);
    }
  }, [mcts]);

  return (
    <div className="bg-gray-100 p-2 rounded overflow-auto text-sm font-mono">
      {rootNode ? (
        <NodeViewer node={rootNode} expanded={true} />
      ) : (
        <p className="text-gray-500">No tree information available.</p>
      )}
    </div>
  );
};

export default TreeViewer;
