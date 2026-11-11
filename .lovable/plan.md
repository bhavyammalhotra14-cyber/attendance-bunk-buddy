# Attendance & Bunk Calculator

## What to build
- Replace the home placeholder with a per-subject attendance dashboard, seeded with sample subjects.
- Show overall attendance, attendance target, subject-level percentages, safe bunks, and a color-coded risk state.
- Let students add subjects and log present or absent classes; keep changes in browser storage.
- Keep the experience frontend-only with no connected backend.

## Technical details
- Define attendance calculations in a small pure utility and cover the 75% bunk and recovery rules with focused tests.
- Keep the seed data in the frontend and hydrate saved browser data after mount to avoid server-rendering mismatches.
- Use the existing TanStack home route and design tokens in `src/styles.css`; record the frontend-only architecture rule in `AGENTS.md`.
