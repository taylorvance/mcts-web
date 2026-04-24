import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { readJsonStorage, writeJsonStorage } from '../utils/persistence';

interface ComplexityPoint {
  startPly: number;
  endPly: number;
  positions?: number;
  mean: number;
  median?: number;
  p10?: number;
  p25?: number;
  p75?: number;
  p90?: number;
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
const LabelWithTooltip = ({ label, content }: { label: string; content: string }) => (
  <Tooltip content={content}>
    <span className="cursor-help decoration-dotted underline-offset-2 group-hover:no-underline">
      <span className="underline decoration-dotted">{label}</span>
    </span>
  </Tooltip>
);

const getMedian = (point: ComplexityPoint) => point.median ?? point.mean;
const getP25 = (point: ComplexityPoint) => point.p25 ?? getMedian(point);
const getP75 = (point: ComplexityPoint) => point.p75 ?? getMedian(point);
const getP10 = (point: ComplexityPoint) => point.p10 ?? getP25(point);
const getP90 = (point: ComplexityPoint) => point.p90 ?? getP75(point);

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
  const maxValue = Math.max(...points.map((point) => getP90(point)), 1);
  const minValue = Math.min(...points.map((point) => getP10(point)), 0);
  const range = Math.max(maxValue - minValue, 1);
  const midValue = minValue + (range / 2);
  const startPly = points[0].startPly;
  const endPly = points[points.length - 1].endPly;
  const midPly = Math.round((startPly + endPly) / 2);
  const midX = yAxisWidth + paddingX + (chartWidth / 2);
  const toY = (value: number) => {
    const normalized = (value - minValue) / range;
    return paddingY + chartHeight - (normalized * chartHeight);
  };

  const coordinates = points.map((point, index) => {
    const x = yAxisWidth + paddingX + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);

    return {
      point,
      x,
      y: {
        median: toY(getMedian(point)),
        p10: toY(getP10(point)),
        p25: toY(getP25(point)),
        p75: toY(getP75(point)),
        p90: toY(getP90(point)),
      },
    };
  });

  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y.median}`)
    .join(' ');
  const createBandPath = (
    upperKey: 'p75' | 'p90',
    lowerKey: 'p10' | 'p25',
  ) => [
    `M ${coordinates[0].x} ${coordinates[0].y[upperKey]}`,
    ...coordinates.slice(1).map(({ x, y }) => `L ${x} ${y[upperKey]}`),
    ...[...coordinates].reverse().map(({ x, y }) => `L ${x} ${y[lowerKey]}`),
    'Z',
  ].join(' ');
  const outerBandPath = createBandPath('p90', 'p10');
  const innerBandPath = createBandPath('p75', 'p25');
  const gridLines = [
    { value: maxValue, y: paddingY },
    { value: midValue, y: paddingY + (chartHeight / 2) },
    { value: minValue, y: height - paddingY },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2 pb-2 pt-2">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500">
        <span>Early</span>
        <span>Median with spread</span>
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
          <path d={outerBandPath} fill="#cbd5e1" opacity="0.5" />
          <path d={innerBandPath} fill="#94a3b8" opacity="0.65" />
          <path d={linePath} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {coordinates.map(({ x, y, point }) => (
            <circle
              key={`${point.startPly}-${point.endPly}`}
              cx={x}
              cy={y.median}
              r="2.5"
              fill="#0f172a"
            >
              <title>
                {`Ply ${point.startPly}-${point.endPly}: `
                  + `${point.positions ?? 0} samples, `
                  + `p10 ${formatOneDecimal(getP10(point))}, `
                  + `p25 ${formatOneDecimal(getP25(point))}, `
                  + `median ${formatOneDecimal(getMedian(point))}, `
                  + `p75 ${formatOneDecimal(getP75(point))}, `
                  + `p90 ${formatOneDecimal(getP90(point))}`}
              </title>
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
        Profile
      </summary>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4">
        {error && (
          <div className="text-sm text-red-700">
            Profile data unavailable: {error}
          </div>
        )}

        {!error && !profile && (
          <div className="text-sm text-gray-600">
            Profile data is not available for this game yet.
          </div>
        )}

        {profile && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  <LabelWithTooltip
                    label="Opening branching"
                    content="Average legal moves from the sampled starting positions before any move is made."
                  />
                </div>
                <div className="text-lg font-semibold text-gray-900">{formatOneDecimal(profile.openingBranching)}</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  <LabelWithTooltip
                    label="Average branching"
                    content="Average legal moves across all sampled random-playout positions, not live MCTS search."
                  />
                </div>
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
              <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                <div className="font-semibold uppercase tracking-wide">Branching By Ply Bucket</div>
                <div>
                  <Tooltip content="Median line with a darker p25-p75 band and lighter p10-p90 band. Hover points for sample counts.">
                    <span className="cursor-help underline decoration-dotted underline-offset-2">Median line, dark IQR, light p10-p90.</span>
                  </Tooltip>
                </div>
              </div>
              <BranchingChart points={profile.branchingByBucket} />
            </div>

            <div className="text-xs leading-relaxed text-gray-600">
              Based on sampled random playouts.
              {' '}
              <Tooltip content="Cumulative log-branching summary from sampled playouts. It is a tree-shape proxy, not a direct strength measure.">
                <span className="cursor-help underline decoration-dotted underline-offset-2">
                  Tree-width proxy {formatOneDecimal(profile.complexity.averageCumulativeLogBranching)}
                </span>
              </Tooltip>
              .
              {profile.sampling.truncatedSamples > 0 && ` ${profile.sampling.truncatedSamples} sampled games hit the playout cap.`}
              {' '}
              Later buckets often have fewer samples because shorter games terminate before reaching them.
            </div>
          </>
        )}
      </div>
    </details>
  );
};

export default GameComplexityPanel;
