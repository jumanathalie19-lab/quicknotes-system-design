# QuickNotes System Design

QuickNotes is a simple notes application. This repository contains:

1. A small **browser-based API client** (HTML, CSS, JavaScript) that loads, creates and deletes notes using the free fake API [JSONPlaceholder](https://jsonplaceholder.typicode.com/).
2. Three **design documents** describing how a full QuickNotes system would be designed to serve 1 million users.

## Features of the API client

- **GET:** load 10 notes
- **POST:** create a note
- **DELETE:** remove a note
- Loading, success, error and empty states shown on the page
- Title validation (required, maximum 100 characters)
- Buttons disabled while a request is running
- User text inserted with `textContent` only (prevents XSS)

## How to run the API client

No build step or installation is needed.

1. Clone the repository: `git clone https://github.com/your-username/quicknotes-system-design.git`
2. Open `index.html` in any modern browser (double-click it, or use a tool like VS Code Live Server).
3. Click **Load notes** to fetch 10 notes, use the form to add a note, and click **Delete** on a note to remove it.

An internet connection is required. JSONPlaceholder does not store changes: created and deleted notes only appear to work, and reloading shows the original data.

## Documentation

- [API design](docs/api-design.md): REST endpoints, JSON examples and error codes
- [Data model](docs/data-model.md): tables, relationships, SQL, indexes and the SQL vs NoSQL choice
- [Architecture](docs/architecture.md): requirements, load estimate, diagram, request flows and trade-offs

## What I learned

- **One reusable `request()` function** keeps `fetch`, `response.ok` checking and error throwing in one place, so GET, POST and DELETE stay short and consistent. Note that `fetch` only rejects on network failures, so HTTP errors like 404 must be checked manually.
- **Every request needs all its states:** loading, success, error and empty. `try/catch/finally` makes sure buttons are always re-enabled, even after a failure.
- **Security starts in small habits:** using `textContent` instead of `innerHTML` stops user input from running as code, and validation should happen before any request is sent.
- **Good REST design** uses nouns for paths, HTTP methods for actions and correct status codes (201 for create, 204 for delete, 4xx for client errors).
- **Database design** uses a join table to model many-to-many relationships, and indexes should match the most common queries.
- **Scaling is about trade-offs.** Back-of-envelope estimates show the system is read-heavy, which justifies caching and read replicas, but these add complexity and possible stale data.