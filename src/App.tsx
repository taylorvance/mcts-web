// src/App.tsx

import React, { useState, useCallback } from 'react';
import Select from './components/Select';
import GameSessionView from './components/GameSessionView';
// Games
import { Game } from './types/Game';
import TicTacToe from './games/TicTacToe';
import UltimateTicTacToe from './games/UltimateTicTacToe';
import Onitama from './games/Onitama';
import Filler from './games/Filler';

const games: Record<string, Game> = {
  Filler: Filler,
  Onitama: Onitama,
  TicTacToe: TicTacToe,
  UltimateTicTacToe: UltimateTicTacToe,
};
const defaultGame = 'TicTacToe';

const App: React.FC = () => {
  const [mctsSettings, setMctsSettings] = useState({explorationBias:1.414, maxIterations:1000, maxTime:1});
  const [selectedGame, setSelectedGame] = useState<string>(defaultGame);
  const currentGame = games[selectedGame];

  const changeGame = useCallback((game:string) => {
    setSelectedGame(game);
  }, []);

  return (
    <div className="container mx-auto flex flex-wrap gap-4 pt-4">
      <GameSessionView
        key={selectedGame}
        game={currentGame}
        selector={(
          <Select
            value={selectedGame}
            onChange={changeGame}
            options={Object.fromEntries(Object.entries(games).map(([key,value]) => [key,value.name]))}
            className="text-xl px-4 py-2"
            centerText={true}
          />
        )}
        mctsSettings={mctsSettings}
        setMctsSettings={setMctsSettings}
      />
    </div>
  );
};

export default App;
