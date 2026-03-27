const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'kanban.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    list_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
  );
`);

// Seed default lists if empty
const count = db.prepare('SELECT COUNT(*) as c FROM lists').get();
if (count.c === 0) {
  const insert = db.prepare('INSERT INTO lists (title, position) VALUES (?, ?)');
  insert.run('To Do', 0);
  insert.run('In Progress', 1);
  insert.run('Done', 2);
}

// --- List queries ---

function getAllLists() {
  const lists = db.prepare('SELECT * FROM lists ORDER BY position').all();
  const cardStmt = db.prepare('SELECT * FROM cards WHERE list_id = ? ORDER BY position');
  return lists.map(list => ({
    ...list,
    cards: cardStmt.all(list.id)
  }));
}

function createList(title) {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM lists').get();
  const result = db.prepare('INSERT INTO lists (title, position) VALUES (?, ?)').run(title, maxPos.m + 1);
  return { id: result.lastInsertRowid, title, position: maxPos.m + 1, cards: [] };
}

function renameList(id, title) {
  db.prepare('UPDATE lists SET title = ? WHERE id = ?').run(title, id);
  return { id, title };
}

function deleteList(id) {
  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
}

// --- Card queries ---

function createCard(title, description, listId) {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM cards WHERE list_id = ?').get(listId);
  const result = db.prepare('INSERT INTO cards (title, description, list_id, position) VALUES (?, ?, ?, ?)').run(title, description || '', listId, maxPos.m + 1);
  return { id: result.lastInsertRowid, title, description: description || '', list_id: listId, position: maxPos.m + 1 };
}

function updateCard(id, updates) {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!card) return null;

  const title = updates.title !== undefined ? updates.title : card.title;
  const description = updates.description !== undefined ? updates.description : card.description;
  const listId = updates.list_id !== undefined ? updates.list_id : card.list_id;
  const position = updates.position !== undefined ? updates.position : card.position;

  // If moving to a new list or new position, reorder
  if (updates.list_id !== undefined || updates.position !== undefined) {
    const targetListId = listId;
    const targetPos = position;

    // Shift cards in target list to make room
    db.prepare('UPDATE cards SET position = position + 1 WHERE list_id = ? AND position >= ? AND id != ?').run(targetListId, targetPos, id);

    // Close gap in source list if moving between lists
    if (updates.list_id !== undefined && updates.list_id !== card.list_id) {
      db.prepare('UPDATE cards SET position = position - 1 WHERE list_id = ? AND position > ?').run(card.list_id, card.position);
    }
  }

  db.prepare('UPDATE cards SET title = ?, description = ?, list_id = ?, position = ? WHERE id = ?').run(title, description, listId, position, id);
  return { id, title, description, list_id: listId, position };
}

function deleteCard(id) {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (card) {
    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
    db.prepare('UPDATE cards SET position = position - 1 WHERE list_id = ? AND position > ?').run(card.list_id, card.position);
  }
}

module.exports = { getAllLists, createList, renameList, deleteList, createCard, updateCard, deleteCard };
