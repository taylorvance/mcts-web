import type { AnimalShogiPieceSet, AnimalShogiTeam } from './animalShogiPieces';

const MOVE_MARKER_POSITIONS = {
  '-1,-1': { position: 'left-0 top-0', rotation: 'rotate(-45deg)' },
  '-1,0': {
    position: 'left-1/2 top-[-3%] -translate-x-1/2',
    rotation: 'rotate(0deg)',
  }, // top
  '-1,1': { position: 'right-0 top-0', rotation: 'rotate(45deg)' },
  '0,-1': {
    position: 'left-[-5%] top-1/2 -translate-y-1/2',
    rotation: 'rotate(-90deg)',
  }, // left
  '0,1': {
    position: 'right-[-5%] top-1/2 -translate-y-1/2',
    rotation: 'rotate(90deg)',
  }, // right
  '1,-1': { position: 'bottom-0 left-0', rotation: 'rotate(-135deg)' },
  '1,0': {
    position: 'bottom-[-3%] left-1/2 -translate-x-1/2',
    rotation: 'rotate(180deg)',
  }, // bottom
  '1,1': { position: 'bottom-0 right-0', rotation: 'rotate(135deg)' },
} as const;

const MoveMarker = ({
  rowDelta,
  colDelta,
}: {
  rowDelta: number;
  colDelta: number;
}) => {
  const marker =
    MOVE_MARKER_POSITIONS[
      `${rowDelta},${colDelta}` as keyof typeof MOVE_MARKER_POSITIONS
    ];

  return (
    <span
      className={`absolute ${marker.position} flex items-center justify-center`}
      aria-hidden="true"
    >
      <span
        className="block h-0 w-0 border-x-[0.26rem] border-b-[0.44rem] border-x-transparent border-b-current opacity-95 drop-shadow-[0_0_1px_rgba(255,255,255,0.22)] sm:border-x-[0.3rem] sm:border-b-[0.5rem]"
        style={{ transform: marker.rotation }}
      />
    </span>
  );
};

interface AnimalShogiPieceBadgeProps {
  piece: string;
  owner: AnimalShogiTeam;
  pieceSet: AnimalShogiPieceSet;
}

const AnimalShogiPieceBadge = ({
  piece,
  owner,
  pieceSet,
}: AnimalShogiPieceBadgeProps) => {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 ${
        owner === 'S'
          ? 'border-[#b45309] bg-[#fff1c2] text-[#7c2d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]'
          : 'border-[#2563eb] bg-[#dbeafe] text-[#0f2f6b] shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]'
      }`}
      aria-label={pieceSet.labels[piece]}
      title={pieceSet.labels[piece]}
    >
      <div
        className={`relative h-full w-full ${owner === 'N' ? 'rotate-180' : ''}`}
      >
        <div className="absolute inset-x-[7%] inset-y-[6%]">
          {pieceSet.moveDeltas[piece].map(([rowDelta, colDelta]) => (
            <MoveMarker
              key={`${rowDelta},${colDelta}`}
              rowDelta={rowDelta}
              colDelta={colDelta}
            />
          ))}
        </div>
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="relative text-[2rem] leading-none"
            aria-hidden="true"
          >
            {pieceSet.emoji[piece]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnimalShogiPieceBadge;
