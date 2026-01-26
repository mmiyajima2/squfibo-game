import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameState } from './Game';
import { Card } from './entities/Card';
import { CardValue } from './valueObjects/CardValue';
import { CardColor } from './valueObjects/CardColor';
import { Position } from './valueObjects/Position';
import { Combo, ComboType } from './services/Combo';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    game = Game.createNewGame();
  });

  describe('createNewGame', () => {
    it('should initialize game with correct state', () => {
      expect(game.board).toBeDefined();
      expect(game.deck).toBeDefined();
      expect(game.players.length).toBe(2);
      expect(game.getTotalStars()).toBe(34);
      expect(game.getGameState()).toBe(GameState.PLAYING);
    });

    it('should deal 13 cards to each player', () => {
      expect(game.players[0].hand.getCardCount()).toBe(13);
      expect(game.players[1].hand.getCardCount()).toBe(13);
    });

    it('should have 38 cards remaining in deck after dealing', () => {
      expect(game.deck.getCardCount()).toBe(38);
    });

    it('should start with player 1', () => {
      const currentPlayer = game.getCurrentPlayer();
      expect(currentPlayer.id).toBe('player1');
    });
  });

  describe('getCurrentPlayer and getOpponent', () => {
    it('should return current player', () => {
      const player = game.getCurrentPlayer();
      expect(player).toBe(game.players[0]);
    });

    it('should return opponent', () => {
      const opponent = game.getOpponent();
      expect(opponent).toBe(game.players[1]);
    });

    it('should switch after endTurn', () => {
      const firstPlayer = game.getCurrentPlayer();
      game.endTurn();
      const secondPlayer = game.getCurrentPlayer();

      expect(firstPlayer).not.toBe(secondPlayer);
    });
  });

  describe('placeCard', () => {
    it('should place card on board', () => {
      const currentPlayer = game.getCurrentPlayer();
      const card = currentPlayer.hand.getCards()[0];
      const position = Position.of(0, 0);

      currentPlayer.playCard(card);
      game.placeCard(card, position);

      expect(game.board.getCard(position)).toBe(card);
    });

    it('should throw error when placing on occupied position', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card2 = new Card(CardValue.of(4), CardColor.BLUE);
      const position = Position.of(1, 1);

      game.placeCard(card1, position);

      expect(() => game.placeCard(card2, position)).toThrow('Position is not empty');
    });

    it('should throw error when game is finished', () => {
      const card = new Card(CardValue.of(1), CardColor.RED);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(() => game.placeCard(card, Position.of(0, 0))).toThrow('Game is already finished');
    });
  });

  describe('discardFromBoard', () => {
    it('should discard card from board', () => {
      const card = new Card(CardValue.of(1), CardColor.RED);
      const position = Position.of(1, 1);

      game.placeCard(card, position);
      game.discardFromBoard(position);

      expect(game.board.isEmpty(position)).toBe(true);
      expect(game.getDiscardPileCount()).toBe(1);
    });

    it('should handle discarding from empty position', () => {
      const position = Position.of(0, 0);
      game.discardFromBoard(position);

      expect(game.board.isEmpty(position)).toBe(true);
    });
  });

  describe('claimCombo', () => {
    it('should remove cards from board when claiming combo', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const pos1 = Position.of(0, 0);
      const pos2 = Position.of(0, 1);

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);

      const combo = new Combo(ComboType.TWO_CARDS_1_4, [card1, card4], [pos1, pos2]);
      game.claimCombo(combo);

      expect(game.board.isEmpty(pos1)).toBe(true);
      expect(game.board.isEmpty(pos2)).toBe(true);
    });

    it('should draw cards equal to combo card count', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialHandCount = currentPlayer.hand.getCardCount();
      const initialDeckCount = game.deck.getCardCount();

      const card1 = new Card(CardValue.of(1), CardColor.BLUE);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const pos1 = Position.of(1, 1);
      const pos2 = Position.of(1, 2);

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);

      const combo = new Combo(ComboType.TWO_CARDS_1_4, [card1, card4], [pos1, pos2]);
      game.claimCombo(combo);

      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 2);
      expect(game.deck.getCardCount()).toBe(initialDeckCount - 2);
    });

    it('should award stars equal to combo card count', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;

      const card1 = new Card(CardValue.of(4), CardColor.RED);
      const card9 = new Card(CardValue.of(9), CardColor.RED);
      const pos1 = Position.of(0, 0);
      const pos2 = Position.of(2, 2);

      game.placeCard(card1, pos1);
      game.placeCard(card9, pos2);

      const combo = new Combo(ComboType.TWO_CARDS_4_9, [card1, card9], [pos1, pos2]);
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 2);
      expect(game.getTotalStars()).toBe(32);
    });

    it('should handle combo when deck is empty', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialHandCount = currentPlayer.hand.getCardCount();

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const pos1 = Position.of(0, 0);
      const pos2 = Position.of(1, 1);

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);

      const combo = new Combo(ComboType.TWO_CARDS_1_4, [card1, card4], [pos1, pos2]);
      const result = game.claimCombo(combo);

      expect(result).toBe(true);
      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount);
    });

    it('should handle combo when not enough stars available', () => {
      const currentPlayer = game.getCurrentPlayer();

      for (let i = 0; i < 16; i++) {
        const c1 = new Card(CardValue.of(1), CardColor.RED);
        const c4 = new Card(CardValue.of(4), CardColor.RED);
        game.placeCard(c1, Position.of(0, 0));
        game.placeCard(c4, Position.of(0, 1));
        const combo = new Combo(
          ComboType.TWO_CARDS_1_4,
          [c1, c4],
          [Position.of(0, 0), Position.of(0, 1)]
        );
        game.claimCombo(combo);
      }

      expect(game.getTotalStars()).toBe(2);

      const card1 = new Card(CardValue.of(1), CardColor.BLUE);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const card16 = new Card(CardValue.of(16), CardColor.BLUE);
      const pos1 = Position.of(1, 0);
      const pos2 = Position.of(1, 1);
      const pos3 = Position.of(1, 2);

      game.placeCard(card1, pos1);
      game.placeCard(card4, pos2);
      game.placeCard(card16, pos3);

      const combo = new Combo(
        ComboType.THREE_CARDS,
        [card1, card4, card16],
        [pos1, pos2, pos3]
      );

      const initialStars = currentPlayer.stars;
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 2);
      expect(game.getTotalStars()).toBe(0);
    });

    it('should return false when claiming combo in finished game', () => {
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const combo = new Combo(
        ComboType.TWO_CARDS_1_4,
        [card1, card4],
        [Position.of(0, 0), Position.of(0, 1)]
      );

      const result = game.claimCombo(combo);
      expect(result).toBe(false);
    });
  });

  describe('endTurn', () => {
    it('should switch to next player', () => {
      const player1 = game.getCurrentPlayer();
      game.endTurn();
      const player2 = game.getCurrentPlayer();

      expect(player1).not.toBe(player2);
      expect(player2.id).toBe('player2');
    });

    it('should finish game when deck is empty', () => {
      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }

      expect(game.isGameOver()).toBe(false);
      game.endTurn();
      expect(game.isGameOver()).toBe(true);
    });

    it('should finish game when all stars are claimed', () => {
      for (let i = 0; i < 17; i++) {
        const c1 = new Card(CardValue.of(1), CardColor.RED);
        const c4 = new Card(CardValue.of(4), CardColor.RED);
        game.placeCard(c1, Position.of(0, 0));
        game.placeCard(c4, Position.of(0, 1));
        const combo = new Combo(
          ComboType.TWO_CARDS_1_4,
          [c1, c4],
          [Position.of(0, 0), Position.of(0, 1)]
        );
        game.claimCombo(combo);
      }

      expect(game.getTotalStars()).toBe(0);
      game.endTurn();
      expect(game.isGameOver()).toBe(true);
    });
  });

  describe('isGameOver and getWinner', () => {
    it('should not be over at start', () => {
      expect(game.isGameOver()).toBe(false);
      expect(game.getWinner()).toBeNull();
    });

    it('should determine winner by stars', () => {
      game.players[0].addStars(10);
      game.players[1].addStars(5);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(game.isGameOver()).toBe(true);
      expect(game.getWinner()).toBe(game.players[0]);
    });

    it('should return null for tie', () => {
      game.players[0].addStars(10);
      game.players[1].addStars(10);

      while (!game.deck.isEmpty()) {
        game.deck.draw();
      }
      game.endTurn();

      expect(game.isGameOver()).toBe(true);
      expect(game.getWinner()).toBeNull();
    });
  });

  describe('full game scenario', () => {
    it('should handle a complete turn with combo', () => {
      const currentPlayer = game.getCurrentPlayer();
      const initialStars = currentPlayer.stars;
      const initialHandCount = currentPlayer.hand.getCardCount();

      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);

      game.placeCard(card1, Position.of(0, 0));
      game.placeCard(card4, Position.of(1, 1));

      const combo = new Combo(
        ComboType.TWO_CARDS_1_4,
        [card1, card4],
        [Position.of(0, 0), Position.of(1, 1)]
      );
      game.claimCombo(combo);

      expect(currentPlayer.stars).toBe(initialStars + 2);
      expect(currentPlayer.hand.getCardCount()).toBe(initialHandCount + 2);
      expect(game.board.isEmpty(Position.of(0, 0))).toBe(true);
      expect(game.board.isEmpty(Position.of(1, 1))).toBe(true);

      game.endTurn();
      expect(game.getCurrentPlayer()).toBe(game.players[1]);
    });
  });
});
