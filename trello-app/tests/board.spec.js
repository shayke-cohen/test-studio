// @ts-check
const { test, expect } = require('@playwright/test');

// Helper: reset DB to a clean 3-column state before each test
async function resetBoard(request) {
  const lists = await (await request.get('/api/lists')).json();
  // Delete all lists (cascades cards)
  for (const list of lists) {
    await request.delete(`/api/lists/${list.id}`);
  }
  // Recreate the 3 default lists
  await request.post('/api/lists', { data: { title: 'To Do' } });
  await request.post('/api/lists', { data: { title: 'In Progress' } });
  await request.post('/api/lists', { data: { title: 'Done' } });
}

test.describe('Board', () => {
  test.beforeEach(async ({ request }) => {
    await resetBoard(request);
  });

  test('loads with 3 default columns', async ({ page }) => {
    await page.goto('/');
    const lists = page.locator('.list');
    await expect(lists).toHaveCount(3);

    const titles = await page.evaluate(() =>
      [...document.querySelectorAll('.list-title')].map(el => el.value)
    );
    expect(titles).toContain('To Do');
    expect(titles).toContain('In Progress');
    expect(titles).toContain('Done');
  });

  test('shows board header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Kanban Board');
  });
});

test.describe('Cards', () => {
  test.beforeEach(async ({ request }) => {
    await resetBoard(request);
  });

  test('add a card to a list', async ({ page }) => {
    await page.goto('/');

    // Click "+ Add a card" on the first list (To Do)
    const firstList = page.locator('.list').first();
    await firstList.locator('.add-card-btn').click();

    const input = firstList.locator('.add-card-form input');
    await expect(input).toBeVisible();
    await input.fill('My new card');
    await firstList.locator('.add-card-form .btn-primary').click();

    // Card should appear in the list
    await expect(firstList.locator('.card-title').filter({ hasText: 'My new card' })).toBeVisible();
  });

  test('add card with Enter key', async ({ page }) => {
    await page.goto('/');

    const firstList = page.locator('.list').first();
    await firstList.locator('.add-card-btn').click();
    await firstList.locator('.add-card-form input').fill('Card via Enter');
    await firstList.locator('.add-card-form input').press('Enter');

    await expect(firstList.locator('.card-title').filter({ hasText: 'Card via Enter' })).toBeVisible();
  });

  test('cancel add card form', async ({ page }) => {
    await page.goto('/');

    const firstList = page.locator('.list').first();
    await firstList.locator('.add-card-btn').click();
    await expect(firstList.locator('.add-card-form')).toBeVisible();

    await firstList.locator('.add-card-form .btn-cancel').click();
    await expect(firstList.locator('.add-card-form')).not.toBeVisible();
  });

  test('open modal when clicking a card', async ({ page, request }) => {
    // Seed a card via API
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    await request.post('/api/cards', {
      data: { title: 'Test Card', description: 'Test description', list_id: todoList.id }
    });

    await page.goto('/');

    await page.locator('.card').first().click();
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-title')).toHaveValue('Test Card');
    await expect(page.locator('#modal-desc')).toHaveValue('Test description');
  });

  test('edit card title and description via modal', async ({ page, request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    await request.post('/api/cards', {
      data: { title: 'Original Title', description: '', list_id: todoList.id }
    });

    await page.goto('/');
    await page.locator('.card').first().click();

    const titleInput = page.locator('#modal-title');
    await titleInput.clear();
    await titleInput.fill('Updated Title');

    const descInput = page.locator('#modal-desc');
    await descInput.fill('Updated description');

    await page.locator('#modal-save').click();

    // Modal should close
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    // Updated title visible on board
    await expect(page.locator('.card-title').filter({ hasText: 'Updated Title' })).toBeVisible();
    // Description indicator visible
    await expect(page.locator('.card-desc-indicator')).toBeVisible();
  });

  test('delete card via modal', async ({ page, request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    await request.post('/api/cards', {
      data: { title: 'Card to Delete', list_id: todoList.id }
    });

    await page.goto('/');
    await expect(page.locator('.card-title').filter({ hasText: 'Card to Delete' })).toBeVisible();

    await page.locator('.card').first().click();
    await page.locator('#modal-delete').click();

    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
    await expect(page.locator('.card-title').filter({ hasText: 'Card to Delete' })).not.toBeVisible();
  });

  test('close modal with X button', async ({ page, request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    await request.post('/api/cards', {
      data: { title: 'Close Test Card', list_id: todoList.id }
    });

    await page.goto('/');
    await page.locator('.card').first().click();
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/hidden/);

    await page.locator('#modal-close').click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
  });

  test('close modal with Escape key', async ({ page, request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    await request.post('/api/cards', {
      data: { title: 'Escape Test Card', list_id: todoList.id }
    });

    await page.goto('/');
    await page.locator('.card').first().click();
    await expect(page.locator('#modal-overlay')).not.toHaveClass(/hidden/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
  });
});

test.describe('Lists', () => {
  test.beforeEach(async ({ request }) => {
    await resetBoard(request);
  });

  test('add a new list', async ({ page }) => {
    await page.goto('/');

    await page.locator('.add-list-btn').click();
    const input = page.locator('.add-list-form input');
    await expect(input).toBeVisible();
    await input.fill('My New List');
    await page.locator('.add-list-form .btn-primary').click();

    await expect(page.locator('.list')).toHaveCount(4);
    const titles = await page.evaluate(() =>
      [...document.querySelectorAll('.list-title')].map(el => el.value)
    );
    expect(titles).toContain('My New List');
  });

  test('add list with Enter key', async ({ page }) => {
    await page.goto('/');

    await page.locator('.add-list-btn').click();
    await page.locator('.add-list-form input').fill('Enter List');
    await page.locator('.add-list-form input').press('Enter');

    await expect(page.locator('.list')).toHaveCount(4);
    const titles = await page.evaluate(() =>
      [...document.querySelectorAll('.list-title')].map(el => el.value)
    );
    expect(titles).toContain('Enter List');
  });

  test('cancel add list form', async ({ page }) => {
    await page.goto('/');

    await page.locator('.add-list-btn').click();
    await expect(page.locator('.add-list-form')).toBeVisible();
    await page.locator('.add-list-form .btn-cancel').click();
    await expect(page.locator('.add-list-form')).not.toBeVisible();
  });

  test('rename a list by editing its title', async ({ page }) => {
    await page.goto('/');

    const titleInput = page.locator('.list-title').first();
    await titleInput.click();
    await titleInput.fill('Renamed List');
    await titleInput.press('Enter');

    // Wait for re-render after blur/rename
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.list-title')].some(el => el.value === 'Renamed List')
    );
  });

  test('delete a list with its cards', async ({ page, request }) => {
    // Add an extra list so we can delete it without affecting the default 3
    const newList = await (await request.post('/api/lists', { data: { title: 'Temp List' } })).json();
    await request.post('/api/cards', {
      data: { title: 'Temp Card', list_id: newList.id }
    });

    await page.goto('/');
    await expect(page.locator('.list')).toHaveCount(4);

    // Find the list element with data-list-id matching our new list
    const tempListEl = page.locator(`.list[data-list-id="${newList.id}"]`);
    page.once('dialog', dialog => dialog.accept());
    await tempListEl.locator('.btn-delete-list').click();

    await expect(page.locator('.list')).toHaveCount(3);
    await expect(page.locator(`.list[data-list-id="${newList.id}"]`)).not.toBeVisible();
  });
});

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ request }) => {
    await resetBoard(request);
  });

  test('move card between columns via API persists after reload', async ({ page, request }) => {
    // Set up via API
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    const inProgressList = lists.find(l => l.title === 'In Progress');

    const card = await (await request.post('/api/cards', {
      data: { title: 'Movable Card', list_id: todoList.id }
    })).json();

    // Move card via API (simulating what drag-drop does)
    await request.put(`/api/cards/${card.id}`, {
      data: { list_id: inProgressList.id, position: 0 }
    });

    await page.goto('/');

    // Card should now be in "In Progress" column (use data-list-id)
    const inProgressEl = page.locator(`.list[data-list-id="${inProgressList.id}"]`);
    await expect(inProgressEl.locator('.card-title').filter({ hasText: 'Movable Card' })).toBeVisible();

    // Should not be in "To Do"
    const todoEl = page.locator(`.list[data-list-id="${todoList.id}"]`);
    await expect(todoEl.locator('.card-title').filter({ hasText: 'Movable Card' })).not.toBeVisible();
  });

  test('drag card to another column', async ({ page, request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const todoList = lists.find(l => l.title === 'To Do');
    const inProgressList = lists.find(l => l.title === 'In Progress');

    await request.post('/api/cards', {
      data: { title: 'Drag Me', list_id: todoList.id }
    });

    await page.goto('/');

    const card = page.locator('.card', { has: page.locator('.card-title', { hasText: 'Drag Me' }) });
    const inProgressCol = page.locator(`.list[data-list-id="${inProgressList.id}"]`);
    const inProgressCards = inProgressCol.locator('.cards');

    await card.dragTo(inProgressCards);

    // After drag-drop and board reload, card should be in In Progress
    await expect(inProgressCol.locator('.card-title').filter({ hasText: 'Drag Me' })).toBeVisible();
  });
});

test.describe('API', () => {
  test.beforeEach(async ({ request }) => {
    await resetBoard(request);
  });

  test('GET /api/lists returns lists with cards', async ({ request }) => {
    const response = await request.get('/api/lists');
    expect(response.status()).toBe(200);
    const lists = await response.json();
    expect(Array.isArray(lists)).toBe(true);
    expect(lists.length).toBeGreaterThanOrEqual(3);
    expect(lists[0]).toHaveProperty('id');
    expect(lists[0]).toHaveProperty('title');
    expect(lists[0]).toHaveProperty('cards');
    expect(Array.isArray(lists[0].cards)).toBe(true);
  });

  test('POST /api/lists creates a list', async ({ request }) => {
    const response = await request.post('/api/lists', { data: { title: 'New API List' } });
    expect(response.status()).toBe(201);
    const list = await response.json();
    expect(list.title).toBe('New API List');
    expect(list).toHaveProperty('id');
  });

  test('POST /api/lists rejects empty title', async ({ request }) => {
    const response = await request.post('/api/lists', { data: { title: '' } });
    expect(response.status()).toBe(400);
  });

  test('POST /api/cards creates a card', async ({ request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const response = await request.post('/api/cards', {
      data: { title: 'API Card', list_id: lists[0].id }
    });
    expect(response.status()).toBe(201);
    const card = await response.json();
    expect(card.title).toBe('API Card');
    expect(card.list_id).toBe(lists[0].id);
  });

  test('POST /api/cards rejects missing title', async ({ request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const response = await request.post('/api/cards', {
      data: { list_id: lists[0].id }
    });
    expect(response.status()).toBe(400);
  });

  test('PUT /api/cards/:id updates a card', async ({ request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const card = await (await request.post('/api/cards', {
      data: { title: 'Original', list_id: lists[0].id }
    })).json();

    const response = await request.put(`/api/cards/${card.id}`, {
      data: { title: 'Updated' }
    });
    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.title).toBe('Updated');
  });

  test('DELETE /api/cards/:id removes a card', async ({ request }) => {
    const lists = await (await request.get('/api/lists')).json();
    const card = await (await request.post('/api/cards', {
      data: { title: 'To Delete', list_id: lists[0].id }
    })).json();

    const deleteRes = await request.delete(`/api/cards/${card.id}`);
    expect(deleteRes.status()).toBe(204);

    const afterLists = await (await request.get('/api/lists')).json();
    const firstList = afterLists.find(l => l.id === lists[0].id);
    const found = firstList.cards.find(c => c.id === card.id);
    expect(found).toBeUndefined();
  });

  test('DELETE /api/lists/:id removes list and cascades cards', async ({ request }) => {
    const newList = await (await request.post('/api/lists', { data: { title: 'Cascade Test' } })).json();
    await request.post('/api/cards', { data: { title: 'Orphan Card', list_id: newList.id } });

    const deleteRes = await request.delete(`/api/lists/${newList.id}`);
    expect(deleteRes.status()).toBe(204);

    const lists = await (await request.get('/api/lists')).json();
    expect(lists.find(l => l.id === newList.id)).toBeUndefined();
  });
});
