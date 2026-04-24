import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ConnectFourState } from './ConnectFour/state';
import { DobutsuShogiState } from './DobutsuShogi/state';
import { FillerState } from './Filler/state';
import { GoroGoroDobutsuShogiState } from './GoroGoroDobutsuShogi/state';
import { createOnitamaPlayMove, OnitamaState } from './Onitama/state';
import { OthelloState } from './Othello/state';
import { buildGameFamilies, gameEntries, gameFamilies, gameIdToFamilyId, games } from './gameRegistry';

interface ComplexityDataset {
  games: Array<{
    gameId: string;
  }>;
}

describe('gameRegistry', () => {
  it.each([
    ['ConnectFour', games.ConnectFour, '0'],
    ['TicTacToe', games.TicTacToe, 0],
    ['UltimateTicTacToe', games.UltimateTicTacToe, 0],
  ])('adapts typed board moves for %s', (_gameName, game, expectedMove) => {
    const onMove = vi.fn();
    const { container } = render(<game.Board state={game.createInitialState()} onMove={onMove} />);

    const firstClickableElement = screen.queryAllByRole('button')[0]
      ?? container.querySelector('.cursor-pointer');
    expect(firstClickableElement).not.toBeNull();
    fireEvent.click(firstClickableElement!);

    expect(onMove).toHaveBeenCalledWith(expectedMove);
  });

  it('adapts typed board moves for Connect Four after some columns are filled', () => {
    const onMove = vi.fn();
    const state = new ConnectFourState([
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null, 'R', null, null, null,
      null, null, null, 'Y', null, null, null,
    ], true, 38);

    render(<games.ConnectFour.Board state={state} onMove={onMove} />);

    fireEvent.click(screen.getByTestId('connect-four-cell-3'));

    expect(onMove).toHaveBeenCalledWith('3');
  });

  it('adapts typed board moves for Filler', () => {
    const onMove = vi.fn();
    const fillerBoard = new Uint8Array([
      0, 2, 2, 2, 3, 3, 4, 4,
      0, 0, 2, 3, 3, 4, 4, 4,
      5, 0, 2, 2, 3, 4, 5, 5,
      5, 5, 1, 1, 1, 4, 4, 5,
      2, 5, 1, 3, 1, 1, 4, 5,
      2, 2, 1, 3, 3, 1, 5, 1,
      2, 2, 1, 3, 3, 5, 1, 1,
    ]);
    const state = new FillerState(fillerBoard, true);

    render(<games.Filler.Board state={state} onMove={onMove} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onMove).toHaveBeenCalledWith(2);
  });

  it('adapts typed board moves for Dobutsu Shogi', () => {
    const onMove = vi.fn();

    render(<games.DobutsuShogi.Board state={new DobutsuShogiState()} onMove={onMove} />);

    fireEvent.click(screen.getByTestId('dobutsu-cell-7'));
    fireEvent.click(screen.getByTestId('dobutsu-cell-4'));

    expect(onMove).toHaveBeenCalledWith({
      type: 'move',
      from: 7,
      to: 4,
    });
  });

  it('adapts typed board moves for Goro-Goro Dobutsu Shogi', () => {
    const onMove = vi.fn();

    render(
      <games.GoroGoroDobutsuShogi.Board
        state={new GoroGoroDobutsuShogiState()}
        onMove={onMove}
      />,
    );

    fireEvent.click(screen.getByTestId('gorogoro-cell-21'));
    fireEvent.click(screen.getByTestId('gorogoro-cell-16'));

    expect(onMove).toHaveBeenCalledWith({
      type: 'move',
      from: 21,
      to: 16,
      promote: false,
    });
  });

  it('adapts typed board moves for Onitama', () => {
    const onMove = vi.fn();
    const state = new OnitamaState(
      OnitamaState.initializeBoard(),
      true,
      { r: [2, 4], b: [1, 3], n: 0 },
      0,
    );

    render(<games.Onitama.Board state={state} onMove={onMove} />);

    fireEvent.click(screen.getByTestId('onitama-card-2'));
    fireEvent.click(screen.getByTestId('onitama-cell-22'));
    fireEvent.click(screen.getByTestId('onitama-cell-17'));

    expect(onMove).toHaveBeenCalledWith(createOnitamaPlayMove(2, 22, 17));
  });

  it('adapts typed board moves for Othello', () => {
    const onMove = vi.fn();

    render(<games.Othello.Board state={new OthelloState()} onMove={onMove} />);

    fireEvent.click(screen.getByTestId('othello-cell-19'));

    expect(onMove).toHaveBeenCalledWith('19');
  });

  it('creates singleton families for existing games', () => {
    expect(gameIdToFamilyId.Onitama).toBe('Onitama');
    expect(gameFamilies.Onitama).toMatchObject({
      id: 'Onitama',
      name: 'Onitama',
      defaultGameId: 'Onitama',
      gameIds: ['Onitama'],
    });
  });

  it('maps Dobutsu Shogi into the Shogi family', () => {
    expect(gameIdToFamilyId.DobutsuShogi).toBe('Shogi');
    expect(gameFamilies.Shogi).toMatchObject({
      id: 'Shogi',
      name: 'Shogi',
      defaultGameId: 'DobutsuShogi',
      gameIds: ['DobutsuShogi', 'GoroGoroDobutsuShogi'],
    });
  });

  it('groups multiple games into one family when entries share family metadata', () => {
    const families = buildGameFamilies([
      {
        id: 'DobutsuShogi',
        name: 'Dobutsu Shogi',
        familyId: 'Shogi',
        familyName: 'Shogi',
        variantName: 'Dobutsu',
        game: games.DobutsuShogi,
      },
      {
        id: 'MiniShogi',
        name: 'Mini Shogi',
        familyId: 'Shogi',
        familyName: 'Shogi',
        variantName: 'Mini',
        game: games.DobutsuShogi,
      },
    ]);

    expect(families).toEqual([
      {
        id: 'Shogi',
        name: 'Shogi',
        defaultGameId: 'DobutsuShogi',
        gameIds: ['DobutsuShogi', 'MiniShogi'],
      },
    ]);
  });

  it('has a complexity profile for every registered game', () => {
    const dataset = JSON.parse(
      readFileSync(resolve(__dirname, '../../public/generated/complexity.json'), 'utf8'),
    ) as ComplexityDataset;
    const expectedGameIds = gameEntries.map((entry) => entry.id).sort();
    const actualGameIds = dataset.games.map((entry) => entry.gameId).sort();

    expect(actualGameIds).toEqual(expectedGameIds);
  });
});
