const board = document.getElementById('board');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalSave = document.getElementById('modal-save');
const modalDelete = document.getElementById('modal-delete');
const modalClose = document.getElementById('modal-close');

let editingCard = null;

// --- API helpers ---

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (res.status === 204) return null;
  return res.json();
}

// --- Render ---

async function loadBoard() {
  const lists = await api('GET', '/api/lists');
  renderBoard(lists);
}

function renderBoard(lists) {
  board.innerHTML = '';
  lists.forEach(list => board.appendChild(createListEl(list)));
  board.appendChild(createAddListPlaceholder());
}

function createListEl(list) {
  const el = document.createElement('div');
  el.className = 'list';
  el.dataset.listId = list.id;

  // Header
  const header = document.createElement('div');
  header.className = 'list-header';

  const titleInput = document.createElement('input');
  titleInput.className = 'list-title';
  titleInput.type = 'text';
  titleInput.value = list.title;
  titleInput.addEventListener('blur', () => renameList(list.id, titleInput.value));
  titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') titleInput.blur(); });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete-list';
  deleteBtn.textContent = '×';
  deleteBtn.title = 'Delete list';
  deleteBtn.addEventListener('click', () => deleteList(list.id));

  header.appendChild(titleInput);
  header.appendChild(deleteBtn);

  // Cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards';
  cardsContainer.dataset.listId = list.id;

  // Drag-and-drop on container
  cardsContainer.addEventListener('dragover', e => {
    e.preventDefault();
    cardsContainer.classList.add('drag-over');
  });
  cardsContainer.addEventListener('dragleave', () => {
    cardsContainer.classList.remove('drag-over');
  });
  cardsContainer.addEventListener('drop', e => {
    e.preventDefault();
    cardsContainer.classList.remove('drag-over');
    handleDrop(e, list.id, cardsContainer);
  });

  list.cards.forEach(card => {
    cardsContainer.appendChild(createCardEl(card));
  });

  // Add card
  const addBtn = document.createElement('button');
  addBtn.className = 'add-card-btn';
  addBtn.textContent = '+ Add a card';
  addBtn.addEventListener('click', () => showAddCardForm(el, list.id, addBtn));

  el.appendChild(header);
  el.appendChild(cardsContainer);
  el.appendChild(addBtn);
  return el;
}

function createCardEl(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.cardId = card.id;

  const titleEl = document.createElement('div');
  titleEl.className = 'card-title';
  titleEl.textContent = card.title;
  el.appendChild(titleEl);

  if (card.description) {
    const descEl = document.createElement('div');
    descEl.className = 'card-desc-indicator';
    descEl.textContent = '📝 Description';
    el.appendChild(descEl);
  }

  el.addEventListener('click', () => openModal(card));

  el.addEventListener('dragstart', e => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, fromListId: card.list_id }));
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  return el;
}

function createAddListPlaceholder() {
  const el = document.createElement('div');
  el.className = 'add-list-placeholder';

  const btn = document.createElement('button');
  btn.className = 'add-list-btn';
  btn.textContent = '+ Add another list';
  btn.addEventListener('click', () => showAddListForm(el, btn));

  el.appendChild(btn);
  return el;
}

// --- Add card form ---

function showAddCardForm(listEl, listId, addBtn) {
  // Remove existing form if any
  const existing = listEl.querySelector('.add-card-form');
  if (existing) { existing.remove(); addBtn.style.display = ''; return; }

  addBtn.style.display = 'none';

  const form = document.createElement('div');
  form.className = 'add-card-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter a title for this card...';

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Add Card';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-cancel';
  cancelBtn.textContent = '×';

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(input);
  form.appendChild(actions);

  listEl.appendChild(form);
  input.focus();

  saveBtn.addEventListener('click', async () => {
    if (!input.value.trim()) return;
    await api('POST', '/api/cards', { title: input.value.trim(), list_id: listId });
    loadBoard();
  });

  cancelBtn.addEventListener('click', () => {
    form.remove();
    addBtn.style.display = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
}

// --- Add list form ---

function showAddListForm(placeholder, btn) {
  const existing = placeholder.querySelector('.add-list-form');
  if (existing) { existing.remove(); btn.style.display = ''; return; }

  btn.style.display = 'none';

  const form = document.createElement('div');
  form.className = 'add-list-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter list title...';

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Add List';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-cancel';
  cancelBtn.textContent = '×';

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(input);
  form.appendChild(actions);

  placeholder.appendChild(form);
  input.focus();

  saveBtn.addEventListener('click', async () => {
    if (!input.value.trim()) return;
    await api('POST', '/api/lists', { title: input.value.trim() });
    loadBoard();
  });

  cancelBtn.addEventListener('click', () => {
    form.remove();
    btn.style.display = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
}

// --- List actions ---

async function renameList(id, title) {
  if (!title.trim()) return loadBoard();
  await api('PUT', `/api/lists/${id}`, { title: title.trim() });
}

async function deleteList(id) {
  if (!confirm('Delete this list and all its cards?')) return;
  await api('DELETE', `/api/lists/${id}`);
  loadBoard();
}

// --- Drag and drop ---

function handleDrop(e, targetListId, container) {
  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
  const { cardId } = data;

  // Calculate drop position
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  let position = cards.length; // default: end

  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      position = i;
      break;
    }
  }

  api('PUT', `/api/cards/${cardId}`, { list_id: targetListId, position }).then(() => loadBoard());
}

// --- Modal ---

function openModal(card) {
  editingCard = card;
  modalTitle.value = card.title;
  modalDesc.value = card.description || '';
  modalOverlay.classList.remove('hidden');
  modalTitle.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  editingCard = null;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

modalSave.addEventListener('click', async () => {
  if (!editingCard) return;
  await api('PUT', `/api/cards/${editingCard.id}`, {
    title: modalTitle.value.trim(),
    description: modalDesc.value.trim()
  });
  closeModal();
  loadBoard();
});

modalDelete.addEventListener('click', async () => {
  if (!editingCard) return;
  await api('DELETE', `/api/cards/${editingCard.id}`);
  closeModal();
  loadBoard();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) closeModal();
});

// --- Init ---

loadBoard();
