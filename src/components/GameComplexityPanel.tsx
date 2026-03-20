import React, { useEffect, useState } from 'react';
import { readJsonStorage, writeJsonStorage } from '../utils/persistence';

interface ComplexityPoint {
  startPly: number;
  endPly: number;
  mean: number;
}

interface GameComplexityProfile {
  gameId: string;
  gameName: string;
  openingBranching: number;
  averageBranching: number;
  averageGameLength: number;
  sampling: {
    truncatedSamples: number;
  };
  complexity: {
    averageCumulativeLogBranching: number;
  };
  runtime: {
    averageGetLegalMovesMs: number;
    averageMakeMoveMs: number;
    averageRandomPlayoutMs: number;
    averageRandomPlayoutLength: number;
    playoutPliesPerSecond: number;
  };
  branchingByBucket: ComplexityPoint[];
}

interface ComplexityDataset {
  games: GameComplexityProfile[];
}

interface GameComplexityPanelProps {
  gameId: string;
}

const COMPLEXITY_PANEL_OPEN_STORAGE_KEY = 'mcts-web:ui:complexity-panel-open:v1';

const formatOneDecimal = (value: number) => value.toFixed(1);
const formatInteger = (value: number) => value.toLocaleString('en-US', {
  maximumFractionDigits: 0,
});
const formatMilliseconds = (value: number) => (
  value >= 1 ? `${value.toFixed(2)} ms` : `${value.toFixed(3)} ms`
);

const BranchingChart = ({ points }: { points: ComplexityPoint[] }) => {
  if(points.length === 0) {
    return <div className="text-xs italic text-gray-500">No branching samples available.</div>;
  }

  const width = 320;
  const height = 96;
  const paddingX = 8;
  const paddingY = 8;
  const yAxisWidth = 28;
  const chartWidth = width - yAxisWidth - (paddingX * 2);
  const chartHeight = height - (paddingY * 2);
  const maxMean = Math.max(...points.map((point) => point.mean), 1);
  const minMean = Math.min(...points.map((point) => point.mean), 0);
  const range = Math.max(maxMean - minMean, 1);
  const midMean = minMean + (range / 2);
  const startPly = points[0].startPly;
  const endPly = points[points.length - 1].endPly;
  const midPly = Math.round((startPly + endPly) / 2);
  const midX = yAxisWidth + paddingX + (chartWidth / 2);

  const coordinates = points.map((point, index) => {
    const x = yAxisWidth + paddingX + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    const normalized = (point.mean - minMean) / range;
    const y = paddingY + chartHeight - (normalized * chartHeight);

    return { x, y, point };
  });

  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
  const areaPath = [
    `M ${coordinates[0].x} ${height - paddingY}`,
    ...coordinates.map(({ x, y }) => `L ${x} ${y}`),
    `L ${coordinates[coordinates.length - 1].x} ${height - paddingY}`,
    'Z',
  ].join(' ');
  const gridLines = [
    { value: maxMean, y: paddingY },
    { value: midMean, y: paddingY + (chartHeight / 2) },
    { value: minMean, y: height - paddingY },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2 pb-2 pt-2">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500">
        <span>Early</span>
        <span>{formatOneDecimal(maxMean)} peak moves</span>
        <span>Late</span>
      </div>
      <div className="overflow-hidden rounded-md bg-slate-50">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
          {gridLines.map(({ value, y }) => (
            <g key={`${value}-${y}`}>
              <line
                x1={yAxisWidth + paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={yAxisWidth - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {formatOneDecimal(value)}
              </text>
            </g>
          ))}
          <line
            x1={yAxisWidth + paddingX}
            x2={width - paddingX}
            y1={height - paddingY}
            y2={height - paddingY}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={midX}
            x2={midX}
            y1={height - paddingY}
            y2={height - paddingY + 4}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <path d={areaPath} fill="#cbd5e1" opacity="0.55" />
          <path d={linePath} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {coordinates.map(({ x, y, point }) => (
            <circle
              key={`${point.startPly}-${point.endPly}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="#0f172a"
            >
              <title>{`Ply ${point.startPly}-${point.endPly}: ${formatOneDecimal(point.mean)} avg legal moves`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-1 grid grid-cols-3 items-center text-[10px] text-gray-500">
        <span>Ply {startPly}</span>
        <span className="text-center">Ply {midPly}</span>
        <span className="text-right">Ply {endPly}</span>
      </div>
    </div>
  );
};

const GameComplexityPanel: React.FC<GameComplexityPanelProps> = ({ gameId }) => {
  const [isOpen, setIsOpen] = useState(() => readJsonStorage<boolean>(COMPLEXITY_PANEL_OPEN_STORAGE_KEY) ?? false);
  const [dataset, setDataset] = useState<ComplexityDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const response = await fetch(`${import.meta.env.BASE_URL}generated/complexity.json`);
        if(!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const nextDataset = await response.json() as ComplexityDataset;
        if(!cancelled) {
          setDataset(nextDataset);
        }
      } catch (nextError) {
        if(!cancelled) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeJsonStorage(COMPLEXITY_PANEL_OPEN_STORAGE_KEY, isOpen);
  }, [isOpen]);

  const profile = dataset?.games.find((entry) => entry.gameId === gameId) ?? null;

  return (
    <details
      className="flex-none rounded-lg border border-gray-200 bg-gray-50"
      data-testid="game-complexity-panel"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer select-none px-4 py-3 text-left text-base font-semibold text-gray-900">
        Game Complexity
      </summary>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4">
        {error && (
          <div className="text-sm text-red-700">
            Complexity data unavailable: {error}
          </div>
        )}

        {!error && !profile && (
          <div className="text-sm text-gray-600">
            Complexity data is not available for this game yet.
          </div>
        )}

        {profile && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Opening branching</div>
                <div className="text-lg font-semibold text-gray-900">{formatOneDecimal(profile.openingBranching)}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Average branching</div>
                <div className="text-lg font-semibold text-gray-900">{formatOneDecimal(profile.averageBranching)}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Average length</div>
                <div className="text-lg font-semibold text-gray-900">{formatOneDecimal(profile.averageGameLength)} plies</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">`getLegalMoves` cost</div>
                <div className="text-lg font-semibold text-gray-900">{formatMilliseconds(profile.runtime.averageGetLegalMovesMs)}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Random playout</div>
                <div className="text-lg font-semibold text-gray-900">{formatMilliseconds(profile.runtime.averageRandomPlayoutMs)}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Playout plies / sec</div>
                <div className="text-lg font-semibold text-gray-900">{formatInteger(profile.runtime.playoutPliesPerSecond)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Branching By Ply Bucket</div>
              <BranchingChart points={profile.branchingByBucket} />
            </div>

            <div className="text-xs leading-relaxed text-gray-600">
              Based on sampled random playouts. Complexity score {formatOneDecimal(profile.complexity.averageCumulativeLogBranching)}.
              {profile.sampling.truncatedSamples > 0 && ` ${profile.sampling.truncatedSamples} sampled games hit the playout cap.`}
            </div>
          </>
        )}
      </div>
    </details>
  );
};

export default GameComplexityPanel;
