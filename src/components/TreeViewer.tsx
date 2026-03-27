// src/components/TreeViewer.tsx
import React, { useState } from 'react';
import { formatGameStateDebugLabel } from '../utils/gameStateDebug';

interface TreeNodeView {
  averageValue: number;
  children: ReadonlyMap<unknown, TreeNodeView>;
  move: unknown | null;
  parent: TreeNodeView | null;
  state: {
    getStateKey(): string;
    toString(): string;
  };
  team: unknown;
  utilitySums: ReadonlyMap<unknown, number>;
  visits: number;
}

interface SearchTreeLike {
  root: TreeNodeView | null;
}

interface TreeViewerProps {
  mcts: SearchTreeLike | null;
}

const TreeViewer: React.FC<TreeViewerProps> = ({ mcts }) => {
  const rootNode = mcts?.root ?? null;

  return (
    <div className="bg-gray-100 p-2 rounded-lg overflow-auto text-sm font-mono">
      {rootNode ? (
        <NodeViewer
          key={rootNode.state.getStateKey()}
          node={rootNode}
          expanded={true}
        />
      ) : (
        <em className="text-gray-500">No tree information available.</em>
      )}
    </div>
  );
};

const formatUtilitySums = (node: TreeNodeView) => {
  const entries = Array.from(node.utilitySums.entries());
  if(entries.length === 0) {
    return '{}';
  }

  return `{${entries.map(([team, value]) => `${String(team)}:${value.toFixed(3)}`).join(', ')}}`;
};

const NodeViewer: React.FC<{ node:TreeNodeView; expanded:boolean; }> = ({ node, expanded }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const children = Array
    .from(node.children.values())
    .sort((a, b) => b.visits - a.visits) as TreeNodeView[];

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
        <span className="mr-2 bg-gray-200">{node.move === null ? 'root' : String(node.move)}</span>
        <span className="mr-2">n={node.visits}</span>
        <span className="mr-2">avg={node.averageValue.toFixed(3)}</span>
        <span className="mr-2">team={String(node.team)}</span>
        <span className="mr-2">{formatUtilitySums(node)}</span>
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
