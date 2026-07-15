# Coding Standards

This document defines the engineering standards for the TraceMind project.

Every generated code must follow these rules.

---

# General Principles

- Prefer readability over clever code.
- Keep functions small and focused.
- One responsibility per module.
- Avoid duplicated logic.
- Prefer composition over inheritance.
- Write self-documenting code.

---

# TypeScript

Always use TypeScript strict mode.

Avoid:

- any
- unknown unless necessary
- implicit returns

Prefer:

- interfaces
- utility types
- discriminated unions
- readonly where appropriate

Every function should have explicit types.

---

# Naming Conventions

Variables

camelCase

Example

repositoryPath

Functions

camelCase

Example

getCommitHistory()

Classes

PascalCase

Example

GitService

Interfaces

PascalCase

Example

CommitMetadata

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Example

DEFAULT_PAGE_SIZE

---

# Folder Structure

Each feature follows:

feature/

controller.ts

service.ts

types.ts

utils.ts

Do not mix unrelated responsibilities.

---

# Functions

Keep functions under 40 lines whenever possible.

Each function should perform one task.

Avoid nested conditionals.

Return early.

---

# Error Handling

Never silently ignore errors.

Use custom error classes.

Return meaningful messages.

Always log unexpected errors.

---

# API Responses

Every API returns:

{
    success: true,
    data: ...
}

Errors:

{
    success: false,
    error: {
        code: "...",
        message: "..."
    }
}

Never return inconsistent response shapes.

---

# Logging

Use structured logging.

Example:

Repository imported

Commit analyzed

AI request started

AI request completed

Git parsing failed

Avoid console.log in production code.

---

# Async Code

Prefer async/await.

Avoid promise chains.

Use Promise.all when appropriate.

---

# Comments

Do not explain obvious code.

Only explain:

- business logic
- algorithms
- architectural decisions

---

# Imports

Group imports.

External libraries first.

Internal modules second.

Relative imports last.

Sort alphabetically.

---

# Frontend

Components should be presentational whenever possible.

Business logic belongs inside hooks.

Avoid large components.

Split reusable UI.

---

# State Management

Server state:

TanStack Query

Local state:

React hooks

Avoid unnecessary global state.

---

# Styling

Tailwind CSS only.

Avoid inline styles.

Avoid custom CSS unless required.

---

# Testing

Critical business logic must be testable.

Avoid tightly coupled code.

Prefer dependency injection.

---

# Performance

Avoid unnecessary renders.

Memoize expensive calculations.

Lazy load large pages.

---

# AI Integration

AI responses must never be trusted blindly.

Always validate.

Always return structured objects.

Never assume model output format.

---

# Security

Never expose API keys.

Never execute arbitrary commands.

Always validate user input.

Sanitize file paths.

Prevent path traversal.

---

# Golden Rule

Write code that another engineer can understand in five minutes.