# QuickNotes API Design

A REST API for creating, reading, updating and deleting notes. Paths are nouns, HTTP methods express the action, and all bodies are JSON. Base URL: `https://api.quicknotes.example/v1`.

## Endpoints

| # | Method | Path | Description | Success status |
|---|--------|------|-------------|----------------|
| 1 | GET | `/notes` | List the authenticated user's notes (supports `?page=`, `?limit=`, `?tag=`) | 200 OK |
| 2 | POST | `/notes` | Create a new note | 201 Created |
| 3 | GET | `/notes/{id}` | Get one note | 200 OK |
| 4 | PUT | `/notes/{id}` | Replace a note (title, body, tags) | 200 OK |
| 5 | PATCH | `/notes/{id}` | Partially update a note | 200 OK |
| 6 | DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| 7 | GET | `/tags` | List the user's tags | 200 OK |
| 8 | POST | `/notes/{id}/tags` | Attach a tag to a note | 201 Created |
| 9 | DELETE | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | 204 No Content |

## Create a note

`POST /notes`

Request:

```json
{
  "title": "Buy groceries",
  "body": "Milk, eggs, bread",
  "tags": ["personal", "shopping"]
}
```

Response: `201 Created`, with a `Location: /v1/notes/42` header.

```json
{
  "id": 42,
  "userId": 7,
  "title": "Buy groceries",
  "body": "Milk, eggs, bread",
  "tags": ["personal", "shopping"],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

## List notes

`GET /notes?page=1&limit=2`

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 42,
      "title": "Buy groceries",
      "body": "Milk, eggs, bread",
      "tags": ["personal", "shopping"],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": 41,
      "title": "Project ideas",
      "body": "Build a notes app",
      "tags": [],
      "createdAt": "2025-01-14T09:00:00Z",
      "updatedAt": "2025-01-14T09:00:00Z"
    }
  ],
  "page": 1,
  "limit": 2,
  "total": 57
}
```

## Error status codes

| Code | Meaning | When it is returned |
|------|---------|---------------------|
| 400 Bad Request | Invalid input | Missing title, title over 100 characters, malformed JSON |
| 401 Unauthorized | Not authenticated | Missing, expired or invalid token |
| 403 Forbidden | Authenticated but not allowed | Trying to read or change another user's note |
| 404 Not Found | Resource does not exist | No note with that id |
| 500 Internal Server Error | Unexpected server failure | Bug or database outage |

All errors use one consistent body shape:

```json
{
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": [
      { "field": "title", "issue": "Title is required and must be 100 characters or fewer" }
    ]
  }
}
```

Example 404 body:

```json
{
  "error": {
    "code": 404,
    "message": "Note 999 not found"
  }
}
```