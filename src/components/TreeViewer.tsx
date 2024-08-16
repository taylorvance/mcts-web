// src/components/TreeViewer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { MCTS, Node } from 'multimcts';

interface TreeViewerProps {
  mcts: MCTS | null;
}

const TreeViewer: React.FC<TreeViewerProps> = ({ mcts }) => {
  const [rootNode, setRootNode] = useState(mcts?.rootNode);

  /*
  const scores = useCallback(() => {
    if(!rootNode) return [];

    const rewards = Object.entries(rootNode.rewards).map(([team,reward]) => {
      return {team, reward, avg:reward/rootNode.visits};
    }).sort((a,b) => b.reward-a.reward);

    return rewards;
  }, [rootNode]);
   */

  useEffect(() => {
    setRootNode(mcts?.rootNode);
  }, [mcts]);

  return (
    <div className="flex flex-col">
      {false && rootNode && (
        <div className="flex flex-row gap-2">
          {scores().map(({team,reward,avg}) => (
            <div key={team} className="flex flex-col items-center">
              <div>{team}</div>
              <div>{Math.round(reward)}</div>
              <div>{avg.toFixed(3)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-gray-100 p-2 rounded-lg overflow-auto text-sm font-mono">
        {rootNode ? (
          <NodeViewer node={rootNode} expanded={true} />
        ) : (
          <em className="text-gray-500">No tree information available.</em>
        )}
      </div>
    </div>
  );
};

const NodeViewer: React.FC<{ node:Node; expanded:boolean; }> = ({ node, expanded }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [children, setChildren] = useState<Node[]>([]);

  useEffect(() => {
    setChildren(Object.values(node.children).sort((a,b) => b.visits-a.visits));
    setIsExpanded(expanded);
  }, [node]);

  const toggleExpand = () => { setIsExpanded(!isExpanded); };

  return (
    <>
      <div className={`flex items-center ${children.length>0 ? 'cursor-pointer' : 'cursor-default'}`} onClick={toggleExpand}>
        <span className={`mr-2 ${children.length>0 ? 'font-bold' : ''}`}>
          {children.length>0 ? (isExpanded?'-':'+') : '·'}
        </span>
        <span className="mr-2 bg-gray-200">{node.state.toString()}</span>
        <span className="mr-2 bg-gray-200">{node.move}</span>
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
