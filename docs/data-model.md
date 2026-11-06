# QuickNotes Data Model

## Entities

### users
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT, auto-increment | **Primary key** |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, default now |

### notes
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT, auto-increment | **Primary key** |
| user_id | BIGINT | **Foreign key** to `users.id`, NOT NULL |
| title | VARCHAR(100) | NOT NULL |
| body | TEXT | |
| created_at | TIMESTAMP | NOT NULL, default now |
| updated_at | TIMESTAMP | NOT NULL, default now |

### tags
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT, auto-increment | **Primary key** |
| user_id | BIGINT | **Foreign key** to `users.id`, NOT NULL |
| name | VARCHAR(50) | NOT NULL, UNIQUE per user |

### note_tags (join table)
| Column | Type | Key / constraint |
|--------|------|------------------|
| note_id | BIGINT | **Foreign key** to `notes.id`, part of composite **primary key** |
| tag_id | BIGINT | **Foreign key** to `tags.id`, part of composite **primary key** |

## Relationships

- **One-to-many: users to notes.** One user owns many notes; each note belongs to exactly one user (`notes.user_id`). The same applies to users and tags.
- **Many-to-many: notes to tags.** A note can have many tags and a tag can be applied to many notes. A relational database cannot store this directly in two tables, so the `note_tags` table holds one row per note/tag pair. Its composite primary key `(note_id, tag_id)` prevents the same tag being attached to the same note twice.

## CREATE TABLE statements

```sql
CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  title      VARCHAR(100) NOT NULL,
  body       TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name    VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL,
  tag_id  BIGINT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);
```

## Example queries

**1. Latest 10 notes for a user** (uses the index below):

```sql
SELECT id, title, created_at
FROM notes
WHERE user_id = 7
ORDER BY created_at DESC
LIMIT 10;
```

**2. Create a note:**

```sql
INSERT INTO notes (user_id, title, body)
VALUES (7, 'Buy groceries', 'Milk, eggs, bread');
```

**3. JOIN: all notes with a given tag, including the tag name** (joins three tables):

```sql
SELECT n.id, n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t       ON t.id = nt.tag_id
WHERE n.user_id = 7
  AND t.name = 'shopping';
```

**4. Count notes per tag:**

```sql
SELECT t.name, COUNT(nt.note_id) AS note_count
FROM tags t
LEFT JOIN note_tags nt ON nt.tag_id = t.id
WHERE t.user_id = 7
GROUP BY t.id, t.name;
```

## Index

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);
```

**Reason:** the most common query is "show this user's newest notes". Without an index the database scans every row in `notes` (hundreds of millions at scale). This composite index lets it jump straight to one user's rows already sorted by date, so the query stays fast as the table grows. The cost is slightly slower writes and extra storage, which is acceptable because reads far outnumber writes.

(`note_tags` also gets a reverse index on `(tag_id, note_id)` to speed up "notes for a tag" lookups.)

## SQL or NoSQL?

I chose **SQL (PostgreSQL or MySQL)**. QuickNotes data is clearly relational (users own notes, notes have tags), and foreign keys keep those links consistent, for example preventing notes that belong to no user. Many-to-many tags and queries such as "notes with tag X" are natural with JOINs. The data is structured and the scale (hundreds of GB per year) is well within what one primary plus read replicas can handle. NoSQL would help for massive horizontal write scaling or flexible schemas, which we do not need yet. If we later need extreme scale, we can shard by `user_id`.