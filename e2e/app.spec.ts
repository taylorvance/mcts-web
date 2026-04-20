import { expect, type Page, test } from '@playwright/test';

const attachErrorCollectors = (page: Page) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if(message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  return {
    expectNoErrors: () => {
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    },
  };
};

test('loads the built app under the GitHub Pages base path', async ({ page }) => {
  const { expectNoErrors } = attachErrorCollectors(page);

  await page.goto('/mcts-web/');

  await expect(page.getByRole('heading', { name: 'MCTS Settings' })).toBeVisible();
  await expect(page.getByLabel('Game')).toHaveValue('TicTacToe');

  const cells = page.locator('.game-board button');
  await expect(cells).toHaveCount(9);

  await cells.first().click();
  await expect(cells.first()).toBeDisabled();

  expectNoErrors();
});

test('supports querystring game selection and reset on the built site', async ({ page }) => {
  const { expectNoErrors } = attachErrorCollectors(page);

  await page.goto('/mcts-web/?game=Onitama');

  const gameSelect = page.getByLabel('Game');
  await expect(gameSelect).toHaveValue('Onitama');

  await gameSelect.selectOption('Filler');
  await expect(gameSelect).toHaveValue('Filler');
  await expect(page).toHaveURL(/\/mcts-web\/\?game=Filler$/);

  await page.getByRole('button', { name: 'Reset saved data' }).click();
  await expect(gameSelect).toHaveValue('TicTacToe');
  await expect(page).toHaveURL(/\/mcts-web\/$/);

  expectNoErrors();
});

test('persists Ultimate Tic-Tac-Toe state across reloads', async ({ page }) => {
  const { expectNoErrors } = attachErrorCollectors(page);

  await page.goto('/mcts-web/');

  const gameSelect = page.getByLabel('Game');
  await gameSelect.selectOption('UltimateTicTacToe');
  await expect(gameSelect).toHaveValue('UltimateTicTacToe');

  const playableOpeningCells = page.locator('.game-board .bg-red-200');
  await expect(playableOpeningCells).toHaveCount(81);

  await playableOpeningCells.first().click();
  await expect(page.locator('.game-board .bg-blue-200')).toHaveCount(8);

  await page.reload();

  await expect(gameSelect).toHaveValue('UltimateTicTacToe');
  await expect(page.locator('.game-board .bg-blue-200')).toHaveCount(8);
  await expect(page.locator('.game-board .bg-red-200')).toHaveCount(0);

  expectNoErrors();
});
