# Architecture

## Overview

TraceMind follows a modular architecture.

```
React Frontend

        │

REST API

        │

Git Engine

        │

Repository Context Builder

        │

AI Engine

        │

OpenAI API
```

---

# Modules

## Frontend

Responsibilities:

- Repository selection
- Commit timeline
- Commit details
- AI chat
- Search interface

Technology:

- React
- TypeScript
- Tailwind CSS
- React Query
- React Router

---

## Backend API

Responsibilities:

- REST endpoints
- Repository management
- Git engine orchestration
- AI orchestration

Technology:

- Node.js
- Express
- TypeScript

---

## Git Engine

Purpose:

Interact with Git repositories.

Responsibilities:

- Read commits
- Read branches
- Read tags
- Read file history
- Generate diffs
- Git blame
- Repository metadata

Library:

simple-git

---

## Repository Context Builder

Purpose:

Convert Git data into structured AI context.

Responsibilities:

- Summarize commits
- Build repository overview
- Collect relevant files
- Reduce token usage
- Rank important commits

Output:

Structured context for LLM.

---

## AI Engine

Responsibilities:

- Build prompts
- Call OpenAI API
- Parse responses
- Return structured answers

The AI never directly reads Git.

It only receives curated repository context.

---

## Search Engine

Responsibilities:

Search across:

- Commits
- Files
- Authors
- Branches

Future:

Semantic search using embeddings.

---

## Data Layer

Current:

No persistent database required.

Temporary cache only.

Future:

PostgreSQL

Store:

- Repository metadata
- Embeddings
- Search index
- Cached AI summaries

---

# Request Flow

User asks:

Why is login failing?

↓

Backend receives request

↓

Git Engine gathers relevant commits

↓

Context Builder selects useful evidence

↓

AI Engine creates prompt

↓

OpenAI generates response

↓

Evidence returned to frontend

↓

Frontend renders answer
