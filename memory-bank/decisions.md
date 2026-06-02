# Datathon 2026 — Key Decisions

> Records WHY things were built a certain way.
> Prevents the agent from second-guessing or redoing past decisions.

## Design Decisions
| Decision | Reason | Date |
|----------|--------|------|
| Scope Isolation | Only run and display tasks directly belonging to the active KSP Crime Database workspace. Stopped all other unrelated background PM2 tasks (portfolio, todo-list, nyaya-backend) to prevent context mixing and save resources. | 2026-06-02 |
| Bilingual & Local Native LLM Fallback | Integrated local Ollama for SQL generation and implemented a zero-latency semantic parser fallback to ensure high-availability and zero error rates. | 2026-06-02 |

## Technology Choices
| Choice | Alternatives Considered | Why This One |
|--------|------------------------|-------------|
| Native Node:SQLite | `sqlite3` npm dependency | Native `node:sqlite` in Node 24 requires no native build step or external binary compilation, preventing compilation and package manager errors. |
| Vanilla CSS Modules | TailwindCSS | Adheres strictly to the workspace design guidelines prioritizing high-quality vanilla layout structures. |
