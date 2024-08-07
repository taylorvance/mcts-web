// src/types/tictactoe.d.ts
import { GameState } from 'multimcts';

declare module 'multimcts/tictactoe' {
  export default class TicTacToeState extends GameState {
    board: (boolean | null)[];
    team: boolean;
  }
}
