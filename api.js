// QuickNotes API client: GET, POST and DELETE against JSONPlaceholder.
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE_LENGTH = 100;

const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitBtn = document.getElementById("submit-btn");
const notesList = document.getElementById("notes-list");

// ---------- UI helpers ----------

// type is "loading", "success" or "error"
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type || "";
}

// Disable every button while a request runs so it cannot be sent twice.
function setBusy(isBusy) {
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.disabled = isBusy;
  });
}

function showEmptyState() {
  notesList.textContent = "";
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent = "No notes to show.";
  notesList.appendChild(li);
}

function clearEmptyState() {
  const empty = notesList.querySelector(".empty-state");
  if (empty) empty.remove();
}

// Builds one note. All user text goes in through textContent, never innerHTML.
function createNoteElement(note) {
  const li = document.createElement("li");

  const title = document.createElement("h2");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteNote(note.id, li));

  li.append(title, body, deleteBtn);
  return li;
}

function renderNotes(notes) {
  notesList.textContent = "";
  if (notes.length === 0) {
    showEmptyState();
    return;
  }
  notes.forEach((note) => notesList.appendChild(createNoteElement(note)));
}

// ---------- Validation ----------

function validateTitle(title) {
  if (title.length === 0) return "Title is required.";
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer (currently ${title.length}).`;
  }
  return null;
}

// ---------- Reusable request function ----------

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} ${response.statusText}`.trim());
  }

  // DELETE (and 204 responses) may have no JSON body worth parsing.
  if (response.status === 204) return null;
  return response.json();
}

// ---------- GET: load 10 notes ----------

async function loadNotes() {
  setBusy(true);
  setStatus("Loading notes...", "loading");
  try {
    const notes = await request(`${API_URL}?_limit=10`);
    renderNotes(notes);
    if (notes.length === 0) {
      setStatus("The request worked, but there are no notes yet.", "success");
    } else {
      setStatus(`Loaded ${notes.length} notes.`, "success");
    }
  } catch (error) {
    setStatus(`Could not load notes. ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ---------- POST: create a note ----------

async function createNote(title, body) {
  setBusy(true);
  setStatus("Saving note...", "loading");
  try {
    const created = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    clearEmptyState();
    notesList.prepend(createNoteElement({ ...created, title, body }));
    form.reset();
    setStatus("Note created.", "success");
  } catch (error) {
    setStatus(`Could not create note. ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ---------- DELETE: remove a note ----------

async function deleteNote(id, listItem) {
  setBusy(true);
  setStatus("Deleting note...", "loading");
  try {
    await request(`${API_URL}/${id}`, { method: "DELETE" });
    listItem.remove();
    if (notesList.children.length === 0) showEmptyState();
    setStatus("Note deleted.", "success");
  } catch (error) {
    setStatus(`Could not delete note. ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ---------- Events ----------

loadBtn.addEventListener("click", loadNotes);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  const problem = validateTitle(title);
  if (problem) {
    setStatus(problem, "error");
    titleInput.focus();
    return;
  }
  createNote(title, body);
});