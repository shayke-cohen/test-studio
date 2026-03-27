const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- List routes ---

app.get('/api/lists', (req, res) => {
  res.json(db.getAllLists());
});

app.post('/api/lists', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  res.status(201).json(db.createList(title.trim()));
});

app.put('/api/lists/:id', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  res.json(db.renameList(Number(req.params.id), title.trim()));
});

app.delete('/api/lists/:id', (req, res) => {
  db.deleteList(Number(req.params.id));
  res.status(204).end();
});

// --- Card routes ---

app.post('/api/cards', (req, res) => {
  const { title, description, list_id } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!list_id) return res.status(400).json({ error: 'list_id is required' });
  res.status(201).json(db.createCard(title.trim(), description, Number(list_id)));
});

app.put('/api/cards/:id', (req, res) => {
  const result = db.updateCard(Number(req.params.id), req.body);
  if (!result) return res.status(404).json({ error: 'Card not found' });
  res.json(result);
});

app.delete('/api/cards/:id', (req, res) => {
  db.deleteCard(Number(req.params.id));
  res.status(204).end();
});

const server = app.listen(PORT, () => {
  console.log(`Trello app running at http://localhost:${PORT}`);
});

module.exports = { app, server };
