import type { TypedGameBoardProps } from '../../types/Game';
import { COLORS, COLS, FillerState, TOTAL_CELLS } from './state';

const FillerBoard = ({ state, onMove }: TypedGameBoardProps<FillerState, number>) => {
  const { player1, player2 } = state.getTerritory();

  return (
    <div className="flex flex-col items-center gap-4 text-xl font-bold font-mono">
      <div className="w-full flex flex-row border-4 border-black">
        <div
          className="text-start ps-2"
          style={{ width: `${(player1 / TOTAL_CELLS) * 100}%`, backgroundColor: COLORS[state.board[0]] }}
        >
          {player1}
        </div>
        <div
          className="text-center bg-white"
          style={{ width: `${((TOTAL_CELLS - player1 - player2) / TOTAL_CELLS) * 100}%` }}
        />
        <div
          className="text-end pe-2"
          style={{ width: `${(player2 / TOTAL_CELLS) * 100}%`, backgroundColor: COLORS[state.board[TOTAL_CELLS - 1]] }}
        >
          {player2}
        </div>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS},minmax(0,1fr))` }}>
        {Array.from(state.board).map((colorIndex, index) => (
          <div
            key={index}
            className={`w-8 h-8 ${[0, TOTAL_CELLS - 1].includes(index) ? 'border-black border-4' : ''}`}
            style={{ backgroundColor: COLORS[colorIndex] }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center">
        Player {state.getCurrentTeam()}
        <div className="flex flex-row gap-2">
          {state.getLegalColorMoves().map((colorIndex) => (
            <button
              key={colorIndex}
              className="w-16 h-16"
              style={{ backgroundColor: COLORS[colorIndex] }}
              onClick={() => onMove(colorIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FillerBoard;
