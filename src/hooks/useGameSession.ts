import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { AppGameState, Game } from '../types/Game';
import { getGameSessionStorageKey, readJsonStorage, writeJsonStorage } from '../utils/persistence';
import { useMCTS } from './useMCTS';

export const NULLMOVE = '__INITIAL_STATE__';
const SESSION_STORAGE_VERSION = 2;

interface MCTSSettings {
  explorationBias: number;
  maxIterations: number | null;
  maxRetainedNodes: number | null;
  maxTime: number | null;
}

interface SessionState {
  gameState: AppGameState;
  initialState: AppGameState;
  history: string[];
  historyIdx: number;
  isAutoPlaying: boolean;
  isAutoReplyEnabled: boolean;
  isPendingAIMove: boolean;
  isMoveInProgress: boolean;
}

interface PersistedSessionState {
  version: number;
  initialState: unknown;
  history: string[];
  historyIdx: number;
  isAutoReplyEnabled: boolean;
}

interface LegacyPersistedSessionState {
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
  | { type: 'set_auto_play'; value: boolean }
  | { type: 'toggle_auto_reply' }
  | { type: 'goto_history'; gameState: AppGameState; idx: number };

const createSessionState = (
  initialState: AppGameState,
  isAutoReplyEnabled = true,
): SessionState => ({
  gameState: initialState,
  initialState,
  history: [NULLMOVE],
  historyIdx: 0,
  isAutoPlaying: false,
  isAutoReplyEnabled,
  isPendingAIMove: false,
  isMoveInProgress: false,
});

const getPersistedAutoReplyEnabled = (
  persistedSession: PersistedSessionState | LegacyPersistedSessionState,
) => (
  'isAutoReplyEnabled' in persistedSession
    ? persistedSession.isAutoReplyEnabled
    : persistedSession.doAIMoveAfterPlayer
);

const restoreSessionState = (game: Game): SessionState => {
  const persistedSession = readJsonStorage<
    PersistedSessionState | LegacyPersistedSessionState
  >(getGameSessionStorageKey(game.id));

  if(
    !persistedSession
    || ![1, SESSION_STORAGE_VERSION].includes(persistedSession.version)
    || !Array.isArray(persistedSession.history)
    || persistedSession.history.some((move) => typeof move !== 'string')
    || persistedSession.history[0] !== NULLMOVE
    || !Number.isInteger(persistedSession.historyIdx)
    || persistedSession.historyIdx < 0
    || persistedSession.historyIdx >= persistedSession.history.length
    || typeof getPersistedAutoReplyEnabled(persistedSession) !== 'boolean'
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
      isAutoPlaying: false,
      isAutoReplyEnabled: getPersistedAutoReplyEnabled(persistedSession),
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
    case 'set_auto_play':
      return { ...state, isAutoPlaying: action.value };
    case 'toggle_auto_reply':
      return {
        ...state,
        isAutoReplyEnabled: !state.isAutoReplyEnabled,
      };
    case 'goto_history':
      return {
        ...state,
        gameState: action.gameState,
        historyIdx: action.idx,
        isAutoPlaying: false,
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
      isAutoReplyEnabled: state.isAutoReplyEnabled,
    } satisfies PersistedSessionState);
  }, [game, state.history, state.historyIdx, state.initialState, state.isAutoReplyEnabled]);

  const isTerminal = state.gameState.isTerminal();
  const canPlay = !state.isAutoPlaying && !state.isMoveInProgress && !isTerminal;
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
      currentState.isAutoPlaying
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
        currentState.isAutoReplyEnabled,
      ),
    });
    resetMCTS();
  }, [game, gotoHistoryIdx, invalidatePendingMove, resetMCTS]);

  const handlePlayerMove = useCallback((move: unknown) => {
    const currentState = stateRef.current;
    if(
      currentState.isAutoPlaying
      || moveInProgressRef.current
      || currentState.gameState.isTerminal()
    ) {
      return;
    }

    void performMove(move);
    if(currentState.isAutoReplyEnabled) {
      dispatch({ type: 'set_pending_ai', value: true });
    }
  }, [performMove]);

  const toggleAutoPlay = useCallback(() => {
    const currentState = stateRef.current;
    if(currentState.isAutoPlaying) {
      invalidatePendingMove();
      dispatch({ type: 'set_auto_play', value: false });
      return;
    }

    if(currentState.gameState.isTerminal()) {
      return;
    }

    dispatch({ type: 'set_auto_play', value: true });
  }, [invalidatePendingMove]);

  const toggleAutoReply = useCallback(() => {
    dispatch({ type: 'toggle_auto_reply' });
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
    if(!state.isAutoPlaying) return;
    if(state.isMoveInProgress) return;
    if(isTerminal) {
      dispatch({ type: 'set_auto_play', value: false });
      return;
    }

    void performMove();
  }, [isTerminal, performMove, state.historyIdx, state.isAutoPlaying, state.isMoveInProgress]);

  return {
    gameState: state.gameState,
    history: state.history,
    historyIdx: state.historyIdx,
    isAutoPlaying: state.isAutoPlaying,
    isAutoReplyEnabled: state.isAutoReplyEnabled,
    mcts,
    searchStats,
    isTerminal,
    canPlay,
    canUndo,
    canRedo,
    handlePlayerMove,
    doAIMove,
    toggleAutoPlay,
    toggleAutoReply,
    resetGame,
    gotoHistoryIdx,
    undoMove,
    redoMove,
  };
};
