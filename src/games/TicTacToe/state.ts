import { GameState } from 'multimcts';
import BaseTicTacToeState, {
  TicTacToeCell,
  TicTacToeMove,
  TicTacToeTeam,
} from 'multimcts/tictactoe';

const parseMove = (move: string) => {
  const parsedMove = Number.parseInt(move, 10);
  if(!Number.isInteger(parsedMove)) {
    throw new Error(`Invalid TicTacToe move: ${move}`);
  }

  return parsedMove;
};

class TicTacToeState extends GameState<string, TicTacToeTeam, TicTacToeState> {
  private readonly baseState: BaseTicTacToeState;

  constructor(
    board?: readonly TicTacToeCell[],
    team?: TicTacToeTeam,
    baseState?: BaseTicTacToeState,
  ) {
    super();
    this.baseState = baseState ?? new BaseTicTacToeState(board, team);
  }

  get board() {
    return this.baseState.board;
  }

  get team() {
    return this.baseState.team;
  }

  getCurrentTeam() {
    return this.baseState.getCurrentTeam();
  }

  getLegalMoves() {
    return this.baseState.getLegalMoves().map((move) => move.toString());
  }

  override suggestRollout(random: () => number) {
    const suggestion = this.baseState.suggestRollout(random);
    if(!suggestion) {
      return null;
    }

    return {
      move: suggestion.move.toString(),
      nextState: new TicTacToeState(undefined, undefined, suggestion.nextState),
    };
  }

  override sampleLegalMove(random: () => number) {
    return this.baseState.sampleLegalMove(random).toString();
  }

  makeMove(move: string) {
    return new TicTacToeState(
      undefined,
      undefined,
      this.baseState.makeMove(parseMove(move) as TicTacToeMove),
    );
  }

  isTerminal() {
    return this.baseState.isTerminal();
  }

  getReward(terminalTeam: TicTacToeTeam) {
    return this.baseState.getReward(terminalTeam);
  }

  getWinner() {
    return this.baseState.getWinner();
  }

  override getStateKey() {
    return this.baseState.getStateKey();
  }

  override toString() {
    return this.baseState.toString();
  }
}

export default TicTacToeState;
