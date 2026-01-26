import { useReducer, useCallback } from 'react';
import { Card } from '../domain/entities/Card';
import { Position } from '../domain/valueObjects/Position';
import { Combo } from '../domain/services/Combo';

interface UIState {
  // 選択中のカード（手札から選択）
  selectedCard: Card | null;
  // ハイライト表示するセルの位置
  highlightedPositions: Position[];
  // 役申告モード
  comboClaim: {
    isActive: boolean;
    detectedCombos: Combo[];
  };
  // エラーメッセージ
  errorMessage: string | null;
  // アニメーション状態
  animation: {
    type: 'card-placed' | 'combo-claimed' | 'card-removed' | null;
    positions: Position[];
  };
}

interface UIStateHook extends UIState {
  selectCard: (card: Card | null) => void;
  highlightPositions: (positions: Position[]) => void;
  clearHighlight: () => void;
  activateComboClaimMode: (combos: Combo[]) => void;
  deactivateComboClaimMode: () => void;
  showError: (message: string) => void;
  clearError: () => void;
  triggerAnimation: (type: 'card-placed' | 'combo-claimed' | 'card-removed', positions: Position[]) => void;
  clearAnimation: () => void;
  resetUIState: () => void;
}

type UIAction =
  | { type: 'SELECT_CARD'; card: Card | null }
  | { type: 'HIGHLIGHT_POSITIONS'; positions: Position[] }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'ACTIVATE_COMBO_CLAIM_MODE'; combos: Combo[] }
  | { type: 'DEACTIVATE_COMBO_CLAIM_MODE' }
  | { type: 'SHOW_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'TRIGGER_ANIMATION'; animationType: 'card-placed' | 'combo-claimed' | 'card-removed'; positions: Position[] }
  | { type: 'CLEAR_ANIMATION' }
  | { type: 'RESET_UI_STATE' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SELECT_CARD':
      return {
        ...state,
        selectedCard: action.card,
      };

    case 'HIGHLIGHT_POSITIONS':
      return {
        ...state,
        highlightedPositions: action.positions,
      };

    case 'CLEAR_HIGHLIGHT':
      return {
        ...state,
        highlightedPositions: [],
      };

    case 'ACTIVATE_COMBO_CLAIM_MODE':
      return {
        ...state,
        comboClaim: {
          isActive: true,
          detectedCombos: action.combos,
        },
      };

    case 'DEACTIVATE_COMBO_CLAIM_MODE':
      return {
        ...state,
        comboClaim: {
          isActive: false,
          detectedCombos: [],
        },
      };

    case 'SHOW_ERROR':
      return {
        ...state,
        errorMessage: action.message,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        errorMessage: null,
      };

    case 'TRIGGER_ANIMATION':
      return {
        ...state,
        animation: {
          type: action.animationType,
          positions: action.positions,
        },
      };

    case 'CLEAR_ANIMATION':
      return {
        ...state,
        animation: {
          type: null,
          positions: [],
        },
      };

    case 'RESET_UI_STATE':
      return createInitialState();

    default:
      return state;
  }
}

function createInitialState(): UIState {
  return {
    selectedCard: null,
    highlightedPositions: [],
    comboClaim: {
      isActive: false,
      detectedCombos: [],
    },
    errorMessage: null,
    animation: {
      type: null,
      positions: [],
    },
  };
}

export function useUIState(): UIStateHook {
  const [state, dispatch] = useReducer(uiReducer, undefined, createInitialState);

  const selectCard = useCallback((card: Card | null) => {
    dispatch({ type: 'SELECT_CARD', card });
  }, []);

  const highlightPositions = useCallback((positions: Position[]) => {
    dispatch({ type: 'HIGHLIGHT_POSITIONS', positions });
  }, []);

  const clearHighlight = useCallback(() => {
    dispatch({ type: 'CLEAR_HIGHLIGHT' });
  }, []);

  const activateComboClaimMode = useCallback((combos: Combo[]) => {
    dispatch({ type: 'ACTIVATE_COMBO_CLAIM_MODE', combos });
  }, []);

  const deactivateComboClaimMode = useCallback(() => {
    dispatch({ type: 'DEACTIVATE_COMBO_CLAIM_MODE' });
  }, []);

  const showError = useCallback((message: string) => {
    dispatch({ type: 'SHOW_ERROR', message });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const triggerAnimation = useCallback((
    type: 'card-placed' | 'combo-claimed' | 'card-removed',
    positions: Position[]
  ) => {
    dispatch({ type: 'TRIGGER_ANIMATION', animationType: type, positions });
  }, []);

  const clearAnimation = useCallback(() => {
    dispatch({ type: 'CLEAR_ANIMATION' });
  }, []);

  const resetUIState = useCallback(() => {
    dispatch({ type: 'RESET_UI_STATE' });
  }, []);

  return {
    selectedCard: state.selectedCard,
    highlightedPositions: state.highlightedPositions,
    comboClaim: state.comboClaim,
    errorMessage: state.errorMessage,
    animation: state.animation,
    selectCard,
    highlightPositions,
    clearHighlight,
    activateComboClaimMode,
    deactivateComboClaimMode,
    showError,
    clearError,
    triggerAnimation,
    clearAnimation,
    resetUIState,
  };
}
