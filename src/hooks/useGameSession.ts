import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { AppGameState, Game } from '../types/Game';
import { getGameSessionStorageKey, readJsonStorage, writeJsonStorage } from '../utils/persistence';
import { useMCTS } from './useMCTS';

export const NULLMOVE = '__INITIAL_STATE__';
const SESSION_STORAGE_VERSION = 1;

interface MCTSSettings {
  explorationBias: number;
  maxIterations: number | null;
  maxTime: number | null;
}

interface SessionState {
  gameState: AppGameState;
  initialState: AppGameState;
  history: string[];
  historyIdx: number;
  isAutoplaying: boolean;
  doAIMoveAfterPlayer: boolean;
  isPendingAIMove: boolean;
  isMoveInProgress: boolean;
}

interface PersistedSessionState {
  version: number;
  initialState: unknown;
  history: string[];
  historyIdx: number;
  doAIMoveAfterPlayer: boolean;
}

type SessionAction =
  | { type: 'initialize'; sessionState: SessionState }
  | { type: 'move_started' }
  | { type: 'move_applied'; gameState: AppGameState; move: string }
  | { type: 'move_completed' }
  | { type: 'set_pending_ai'; value: boolean }
  | { type: 'set_autoplay'; value: boolean }
  | { type: 'toggle_ai_after_player' }
  | { type: 'goto_history'; gameState: AppGameState; idx: number };

const createSessionState = (
  initialState: AppGameState,
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

const restoreSessionState = (game: Game): SessionState => {
  const persistedSession = readJsonStorage<PersistedSessionState>(getGameSessionStorageKey(game.id));

  if(
    !persistedSession
    || persistedSession.version !== SESSION_STORAGE_VERSION
    || !Array.isArray(persistedSession.history)
    || persistedSession.history.some((move) => typeof move !== 'string')
    || persistedSession.history[0] !== NULLMOVE
    || !Number.isInteger(persistedSession.historyIdx)
    || persistedSession.historyIdx < 0
    || persistedSession.historyIdx >= persistedSession.history.length
    || typeof persistedSession.doAIMoveAfterPlayer !== 'boolean'
  ) {
    return createSessionState(game.createInitialState());
  }

  try {
    const initialState = game.deserializeState(persistedSession.initialState);
    let replayState = initialState;
    let currentState = initialState;

    for(let i = 1; i < persistedSession.history.length; i++) {
      const serializedMove = persistedSession.history[i];
      const move = game.deserializeMove(serializedMove, replayState);
      replayState = game.applyMove(replayState, move);
      if(i === persistedSession.historyIdx) {
        currentState = replayState;
      }
    }

    return {
      gameState: currentState,
      initialState,
      history: [...persistedSession.history],
      historyIdx: persistedSession.historyIdx,
      isAutoplaying: false,
      doAIMoveAfterPlayer: persistedSession.doAIMoveAfterPlayer,
      isPendingAIMove: false,
      isMoveInProgress: false,
    };
  } catch {
    return createSessionState(game.createInitialState());
  }
};

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch(action.type) {
    case 'initialize':
      return action.sessionState;
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
    (currentGame) => restoreSessionState(currentGame),
  );
  const {
    mcts,
    searchStats,
    runSearch,
    advanceSearchTree,
    resetMCTS,
    cancelSearch,
  } = useMCTS(game, settings);
  const previousGameRef = useRef(game);
  const stateRef = useRef(state);
  const moveInProgressRef = useRef(false);
  const moveEpochRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const invalidatePendingMove = useCallback(() => {
    moveEpochRef.current += 1;
    cancelSearch();
  }, [cancelSearch]);

  useEffect(() => {
    if(previousGameRef.current === game) return;

    previousGameRef.current = game;
    invalidatePendingMove();
    dispatch({ type: 'initialize', sessionState: restoreSessionState(game) });
    resetMCTS();
  }, [game, invalidatePendingMove, resetMCTS]);

  useEffect(() => {
    writeJsonStorage(getGameSessionStorageKey(game.id), {
      version: SESSION_STORAGE_VERSION,
      initialState: game.serializeState(state.initialState),
      history: state.history,
      historyIdx: state.historyIdx,
      doAIMoveAfterPlayer: state.doAIMoveAfterPlayer,
    } satisfies PersistedSessionState);
  }, [game, state.doAIMoveAfterPlayer, state.history, state.historyIdx, state.initialState]);

  const isTerminal = state.gameState.isTerminal();
  const canPlay = !state.isAutoplaying && !state.isMoveInProgress && !isTerminal;
  const canUndo = state.historyIdx > 0;
  const canRedo = state.historyIdx < state.history.length-1;

  const performMove = useCallback(async (move: unknown | null = null) => {
    if(moveInProgressRef.current) return null;

    const sessionSnapshot = stateRef.current;
    if(sessionSnapshot.gameState.isTerminal()) return null;

    moveInProgressRef.current = true;
    dispatch({ type: 'move_started' });

    try {
      const moveEpoch = moveEpochRef.current;
      const nextMove = move ?? await runSearch(sessionSnapshot.gameState);
      if(nextMove === null) return null;

      if(
        moveEpochRef.current !== moveEpoch
        || stateRef.current.gameState !== sessionSnapshot.gameState
      ) {
        return null;
      }

      const serializedMove = game.serializeMove(nextMove, sessionSnapshot.gameState);
      const nextState = game.applyMove(sessionSnapshot.gameState, nextMove);
      advanceSearchTree(nextMove, nextState);
      dispatch({ type: 'move_applied', gameState: nextState, move: serializedMove });
      return nextMove;
    } finally {
      moveInProgressRef.current = false;
      dispatch({ type: 'move_completed' });
    }
  }, [advanceSearchTree, game, runSearch]);

  const doAIMove = useCallback(() => {
    const currentState = stateRef.current;
    if(
      currentState.isAutoplaying
      || moveInProgressRef.current
      || currentState.gameState.isTerminal()
    ) {
      return;
    }

    void performMove();
  }, [performMove]);

  const gotoHistoryIdx = useCallback((idx: number) => {
    const currentState = stateRef.current;
    if(idx < 0 || idx >= currentState.history.length) return;

    invalidatePendingMove();

    let replayState = currentState.initialState;
    for(let i=1; i<=idx; i++) {
      replayState = game.applyMove(
        replayState,
        game.deserializeMove(currentState.history[i], replayState),
      );
    }

    dispatch({ type: 'goto_history', gameState: replayState, idx });
    resetMCTS();
  }, [game, invalidatePendingMove, resetMCTS]);

  const resetGame = useCallback(() => {
    const currentState = stateRef.current;

    if(currentState.historyIdx > 0) {
      gotoHistoryIdx(0);
      return;
    }

    invalidatePendingMove();
    dispatch({
      type: 'initialize',
      sessionState: createSessionState(
        game.createInitialState(),
        currentState.doAIMoveAfterPlayer,
      ),
    });
    resetMCTS();
  }, [game, gotoHistoryIdx, invalidatePendingMove, resetMCTS]);

  const handlePlayerMove = useCallback((move: unknown) => {
    const currentState = stateRef.current;
    if(
      currentState.isAutoplaying
      || moveInProgressRef.current
      || currentState.gameState.isTerminal()
    ) {
      return;
    }

    void performMove(move);
    if(currentState.doAIMoveAfterPlayer) {
      dispatch({ type: 'set_pending_ai', value: true });
    }
  }, [performMove]);

  const toggleAutoplay = useCallback(() => {
    const currentState = stateRef.current;
    if(currentState.isAutoplaying) {
      invalidatePendingMove();
      dispatch({ type: 'set_autoplay', value: false });
      return;
    }

    if(currentState.gameState.isTerminal()) {
      return;
    }

    dispatch({ type: 'set_autoplay', value: true });
  }, [invalidatePendingMove]);

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
    if(state.isMoveInProgress) return;
    if(isTerminal) {
      dispatch({ type: 'set_autoplay', value: false });
      return;
    }

    void performMove();
  }, [isTerminal, performMove, state.isAutoplaying, state.isMoveInProgress]);

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
