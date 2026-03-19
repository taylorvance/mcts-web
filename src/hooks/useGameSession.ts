import { useCallback, useEffect, useReducer, useRef } from 'react';
import { GameState } from 'multimcts';
import { Game } from '../types/Game';
import { useMCTS } from './useMCTS';

export const NULLMOVE = '__INITIAL_STATE__';

interface MCTSSettings {
  explorationBias: number;
  maxIterations: number | null;
  maxTime: number | null;
}

interface SessionState {
  gameState: GameState;
  initialState: GameState;
  history: string[];
  historyIdx: number;
  isAutoplaying: boolean;
  doAIMoveAfterPlayer: boolean;
  isPendingAIMove: boolean;
  isMoveInProgress: boolean;
}

type SessionAction =
  | { type: 'initialize'; initialState: GameState }
  | { type: 'move_started' }
  | { type: 'move_applied'; gameState: GameState; move: string }
  | { type: 'move_completed' }
  | { type: 'set_pending_ai'; value: boolean }
  | { type: 'set_autoplay'; value: boolean }
  | { type: 'toggle_ai_after_player' }
  | { type: 'goto_history'; gameState: GameState; idx: number };

const createSessionState = (
  initialState: GameState,
  doAIMoveAfterPlayer = true,
): SessionState => ({
  gameState: initialState,
  initialState,
  history: [NULLMOVE],
  historyIdx: 0,
  isAutoplaying: false,
  doAIMoveAfterPlayer,
  isPendingAIMove: false,
  isMoveInProgress: false,
});

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch(action.type) {
    case 'initialize':
      return createSessionState(action.initialState, state.doAIMoveAfterPlayer);
    case 'move_started':
      return { ...state, isMoveInProgress: true };
    case 'move_applied': {
      const nextHistoryIdx = state.historyIdx + 1;
      return {
        ...state,
        gameState: action.gameState,
        history: [...state.history.slice(0, nextHistoryIdx), action.move],
        historyIdx: nextHistoryIdx,
      };
    }
    case 'move_completed':
      return { ...state, isMoveInProgress: false };
    case 'set_pending_ai':
      return { ...state, isPendingAIMove: action.value };
    case 'set_autoplay':
      return { ...state, isAutoplaying: action.value };
    case 'toggle_ai_after_player':
      return {
        ...state,
        doAIMoveAfterPlayer: !state.doAIMoveAfterPlayer,
      };
    case 'goto_history':
      return {
        ...state,
        gameState: action.gameState,
        historyIdx: action.idx,
        isAutoplaying: false,
        isPendingAIMove: false,
      };
    default:
      return state;
  }
};

export const useGameSession = (game: Game, settings: MCTSSettings) => {
  const [state, dispatch] = useReducer(
    sessionReducer,
    game,
    (currentGame) => createSessionState(currentGame.createInitialState()),
  );
  const { mcts, searchStats, runSearch, advanceSearchTree, resetMCTS } = useMCTS(settings);
  const previousGameRef = useRef(game);

  useEffect(() => {
    if(previousGameRef.current === game) return;

    previousGameRef.current = game;
    dispatch({ type: 'initialize', initialState: game.createInitialState() });
    resetMCTS();
  }, [game, resetMCTS]);

  const isTerminal = state.gameState.isTerminal();
  const canPlay = !state.isAutoplaying && !state.isMoveInProgress && !isTerminal;
  const canUndo = state.historyIdx > 0;
  const canRedo = state.historyIdx < state.history.length-1;

  const performMove = useCallback((move: string | null = null) => {
    if(state.isMoveInProgress) return null;

    dispatch({ type: 'move_started' });

    try {
      if(state.gameState.isTerminal()) return null;

      const nextMove = move ?? runSearch(state.gameState);
      const nextState = state.gameState.makeMove(nextMove);
      advanceSearchTree(nextMove, nextState);
      dispatch({ type: 'move_applied', gameState: nextState, move: nextMove });
      return nextMove;
    } finally {
      dispatch({ type: 'move_completed' });
    }
  }, [advanceSearchTree, runSearch, state.gameState, state.isMoveInProgress]);

  const doAIMove = useCallback(() => {
    if(canPlay) performMove();
  }, [canPlay, performMove]);

  const gotoHistoryIdx = useCallback((idx: number) => {
    if(idx < 0 || idx >= state.history.length) return;

    let replayState = state.initialState;
    for(let i=1; i<=idx; i++) {
      replayState = replayState.makeMove(state.history[i]);
    }

    dispatch({ type: 'goto_history', gameState: replayState, idx });
    resetMCTS();
  }, [resetMCTS, state.history, state.initialState]);

  const resetGame = useCallback(() => {
    if(state.historyIdx > 0) {
      gotoHistoryIdx(0);
      return;
    }

    dispatch({ type: 'initialize', initialState: game.createInitialState() });
    resetMCTS();
  }, [game, gotoHistoryIdx, resetMCTS, state.historyIdx]);

  const handlePlayerMove = useCallback((move: string) => {
    if(!canPlay) return;

    performMove(move);
    if(state.doAIMoveAfterPlayer) {
      dispatch({ type: 'set_pending_ai', value: true });
    }
  }, [canPlay, performMove, state.doAIMoveAfterPlayer]);

  const toggleAutoplay = useCallback(() => {
    dispatch({
      type: 'set_autoplay',
      value: !(state.isAutoplaying || isTerminal),
    });
  }, [isTerminal, state.isAutoplaying]);

  const toggleAIMoveAfterPlayer = useCallback(() => {
    dispatch({ type: 'toggle_ai_after_player' });
  }, []);

  const undoMove = useCallback(() => {
    if(canUndo) gotoHistoryIdx(state.historyIdx-1);
  }, [canUndo, gotoHistoryIdx, state.historyIdx]);

  const redoMove = useCallback(() => {
    if(canRedo) gotoHistoryIdx(state.historyIdx+1);
  }, [canRedo, gotoHistoryIdx, state.historyIdx]);

  useEffect(() => {
    if(!state.isPendingAIMove) return;

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'set_pending_ai', value: false });
      doAIMove();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [doAIMove, state.isPendingAIMove]);

  useEffect(() => {
    if(!state.isAutoplaying) return;
    if(isTerminal) {
      dispatch({ type: 'set_autoplay', value: false });
      return;
    }

    performMove();
  }, [isTerminal, performMove, state.isAutoplaying]);

  return {
    gameState: state.gameState,
    history: state.history,
    historyIdx: state.historyIdx,
    isAutoplaying: state.isAutoplaying,
    doAIMoveAfterPlayer: state.doAIMoveAfterPlayer,
    mcts,
    searchStats,
    isTerminal,
    canPlay,
    canUndo,
    canRedo,
    handlePlayerMove,
    doAIMove,
    toggleAutoplay,
    toggleAIMoveAfterPlayer,
    resetGame,
    gotoHistoryIdx,
    undoMove,
    redoMove,
  };
};
