# Architecture Decision Log

This file records important engineering decisions.

Future AI sessions must respect these decisions unless explicitly instructed otherwise.

---

## ADR-001

Title

Modular Monorepo

Decision

The project uses a monorepo.

Structure

apps/

packages/

.ai/

Reason

Better separation between frontend, backend, and reusable libraries.

Status

Accepted

---

## ADR-002

Title

Git Engine

Decision

All Git operations are isolated inside a dedicated Git Engine.

No other module interacts directly with Git.

Reason

Single responsibility.

Easy testing.

Reusable.

Status

Accepted

---

## ADR-003

Title

AI Engine

Decision

All LLM communication happens through a dedicated AI Engine.

Frontend never communicates with OpenAI directly.

Reason

Security.

Prompt consistency.

Future provider flexibility.

Status

Accepted

---

## ADR-004

Title

Repository Context Builder

Decision

LLMs never receive raw repositories.

A Context Builder prepares optimized context.

Reason

Reduce token usage.

Improve response quality.

Status

Accepted

---

## ADR-005

Title

MVP Storage

Decision

Repository state remains in memory.

No PostgreSQL during MVP.

Reason

Hackathon speed.

Lower complexity.

Future migration possible.

Status

Accepted

---

## ADR-006

Title

API Style

Decision

REST API.

Reason

Simple.

Predictable.

Frontend compatible.

Status

Accepted

---

## ADR-007

Title

Frontend

Decision

React + TypeScript.

Tailwind CSS.

TanStack Query.

Reason

Fast development.

Excellent developer experience.

Status

Accepted

---

## ADR-008

Title

Backend

Decision

Node.js.

Express.

TypeScript.

Reason

Developer familiarity.

Rapid prototyping.

Status

Accepted

---

## ADR-009

Title

Git Library

Decision

simple-git.

Reason

Reliable.

Lightweight.

Well maintained.

Status

Accepted

---

## ADR-010

Title

AI Provider

Decision

OpenAI Responses API.

Reason

Primary AI engine.

Future providers may be added behind the AI Engine interface.

Status

Accepted

---

## ADR-011

Title

Evidence First

Decision

Every AI answer must include supporting evidence whenever possible.

Examples

Relevant commits

Files

Diff snippets

Confidence

Reason

Increase trust.

Reduce hallucinations.

Status

Accepted

---

## ADR-012

Title

Repository Investigation

Decision

TraceMind is an investigation platform.

Not a GitHub clone.

Not an IDE.

Not a code editor.

Reason

Maintain product focus.

Status

Accepted

---

# Future Decisions

New architecture decisions should be appended below using the same format.

Never modify previous accepted decisions unless intentionally superseded by a new ADR.
