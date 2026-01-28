import { useReducer, useCallback } from 'react';
import { Game } from '../domain/Game';
import { Card } from '../domain/entities/Card';
import { Position } from '../domain/valueObjects/Position';
import { Combo } from '../domain/services/Combo';

interface GameStateHook {
  game: Game;
  placeCardFromHand: (card: Card, position: Position) => void;
  claimCombo: (combo: Combo) => boolean;
  endTurn: () => void;
  discardFromBoard: (position: Position) => void;
  discardFromHand: (card: Card) => void;
  drawAndPlaceCard: (position: Position) => Card | null;
  resetGame: () => void;
  cancelPlacement: (position: Position) => void;
}

type GameAction =
  | { type: 'PLACE_CARD'; card: Card; position: Position }
  | { type: 'CLAIM_COMBO'; combo: Combo }
  | { type: 'END_TURN' }
  | { type: 'DISCARD_FROM_BOARD'; position: Position }
  | { type: 'DISCARD_FROM_HAND'; card: Card }
  | { type: 'DRAW_AND_PLACE'; position: Position }
  | { type: 'RESET_GAME' }
  | { type: 'CANCEL_PLACEMENT'; position: Position };

interface GameStateWrapper {
  game: Game;
  version: number;
}

function gameReducer(state: GameStateWrapper, action: GameAction): GameStateWrapper {
  const { game } = state;

  switch (action.type) {
    case 'PLACE_CARD': {
      const currentPlayer = game.getCurrentPlayer();

      // カードが手札にあるかチェック（React Strict Modeでの2重実行対策）
      const cardInHand = currentPlayer.hand.getCards().find(c => c.id === action.card.id);
      if (!cardInHand) {
        // 既に配置済みの場合はスキップ
        return state;
      }

      const playedCard = currentPlayer.playCard(action.card);
      game.placeCard(playedCard, action.position);
      return { ...state, version: state.version + 1 };
    }

    case 'CLAIM_COMBO': {
      game.claimCombo(action.combo);
      return { ...state, version: state.version + 1 };
    }

    case 'END_TURN': {
      game.endTurn();
      return { ...state, version: state.version + 1 };
    }

    case 'DISCARD_FROM_BOARD': {
      // 既に空の場合はスキップ（React Strict Modeでの2重実行対策）
      if (game.board.isEmpty(action.position)) {
        return state;
      }
      game.discardFromBoard(action.position);
      return { ...state, version: state.version + 1 };
    }

    case 'DISCARD_FROM_HAND': {
      const currentPlayer = game.getCurrentPlayer();
      // カードが手札にあるかチェック（React Strict Modeでの2重実行対策）
      const cardInHand = currentPlayer.hand.getCards().find(c => c.id === action.card.id);
      if (!cardInHand) {
        // 既に廃棄済みの場合はスキップ
        return state;
      }
      game.discardFromHand(action.card);
      return { ...state, version: state.version + 1 };
    }

    case 'DRAW_AND_PLACE': {
      // 既にカードがある場合はスキップ（React Strict Modeでの2重実行対策）
      if (!game.board.isEmpty(action.position)) {
        return state;
      }
      game.drawAndPlaceCard(action.position);
      return { ...state, version: state.version + 1 };
    }

    case 'RESET_GAME': {
      return { game: Game.createNewGame(), version: 0 };
    }

    case 'CANCEL_PLACEMENT': {
      // ボードが既に空の場合はスキップ（React Strict Modeでの2重実行対策）
      if (game.board.isEmpty(action.position)) {
        return state;
      }

      const card = game.board.removeCard(action.position);
      if (card) {
        const currentPlayer = game.getCurrentPlayer();
        currentPlayer.drawToHand(card);
      }
      return { ...state, version: state.version + 1 };
    }

    default:
      return state;
  }
}

function createInitialState(): GameStateWrapper {
  return {
    game: Game.createNewGame(),
    version: 0,
  };
}

export function useGameState(): GameStateHook {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const placeCardFromHand = useCallback((card: Card, position: Position) => {
    dispatch({ type: 'PLACE_CARD', card, position });
  }, []);

  const claimCombo = useCallback((combo: Combo): boolean => {
    try {
      dispatch({ type: 'CLAIM_COMBO', combo });
      return true;
    } catch (error) {
      console.error('Failed to claim combo:', error);
      return false;
    }
  }, []);

  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
  }, []);

  const discardFromBoard = useCallback((position: Position) => {
    dispatch({ type: 'DISCARD_FROM_BOARD', position });
  }, []);

  const discardFromHand = useCallback((card: Card) => {
    dispatch({ type: 'DISCARD_FROM_HAND', card });
  }, []);

  const drawAndPlaceCard = useCallback((position: Position): Card | null => {
    try {
      dispatch({ type: 'DRAW_AND_PLACE', position });
      // 注: Reducerの後に状態が更新されるため、ここでは正確なカードを返せない
      // 必要に応じて、stateから取得する必要がある
      return null;
    } catch (error) {
      console.error('Failed to draw and place card:', error);
      return null;
    }
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const cancelPlacement = useCallback((position: Position) => {
    dispatch({ type: 'CANCEL_PLACEMENT', position });
  }, []);

  return {
    game: state.game,
    placeCardFromHand,
    claimCombo,
    endTurn,
    discardFromBoard,
    discardFromHand,
    drawAndPlaceCard,
    resetGame,
    cancelPlacement,
  };
}
