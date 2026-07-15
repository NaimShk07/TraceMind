# REST API

---

## POST /repositories/import

Import a local repository.

Response

```json
{
  "repositoryId": "...",
  "name": "...",
  "branch": "main"
}
```

---

## GET /repositories/:id

Repository information.

---

## GET /repositories/:id/commits

Return commit history.

Query

- page
- limit

---

## GET /commits/:hash

Return commit details.

Includes

- metadata
- files
- diff

---

## GET /commits/:hash/explain

Return AI explanation of commit.

---

## POST /chat

Body

```json
{
  "repositoryId": "...",
  "question": "Why is login failing?"
}
```

Response

```json
{
  "answer": "...",
  "confidence": 0.92,
  "evidence": []
}
```

---

## GET /search

Search:

- commits
- files
- authors

Query

?q=

---

## GET /health

Health endpoint.