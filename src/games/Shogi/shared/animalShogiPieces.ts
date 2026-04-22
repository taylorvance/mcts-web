export type AnimalShogiTeam = 'S' | 'N';

export interface AnimalShogiPieceSet {
  labels: Record<string, string>;
  emoji: Record<string, string>;
  moveDeltas: Record<string, Array<[number, number]>>;
}

export const getPieceOwner = (piece: string): AnimalShogiTeam => (
  piece === piece.toUpperCase() ? 'S' : 'N'
);

export const getPieceKind = (piece: string) => piece.toUpperCase();

export const teamLabel = (team: AnimalShogiTeam) => (
  team === 'S' ? 'South' : 'North'
);

export const handKey = (team: AnimalShogiTeam) => (team === 'S' ? 's' : 'n');
