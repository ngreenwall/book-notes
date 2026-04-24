# Handoff

Use this command at the end of a work session to capture only durable, high-signal context for the next chat.

Before we end, do a quick handoff:
1) Update docs/CONTEXT.md session log with only essentials (max 3 bullets total: what changed, what is next, blockers).
2) Update other project memory/docs only if changes are durable and user-facing (skip duplicates/speculative notes; if none, say "No additional doc updates needed.").
3) Deduplicate before adding: if the same point appears in the newest 1-2 session notes, update that note instead of appending a near-duplicate.
4) Keep edits concise by updating existing text when possible, not adding new sections; if session notes exceed 10 entries, archive the oldest to `docs/archive/context-YYYY-MM.md` before adding a new one.
5) Quick noise check before finishing: run `rg "maybe|investigate later|brainstorm" docs/CONTEXT.md` and remove/replace speculative wording in session notes.
If context will matter in the next chat, give me a 1-paragraph next-session starter prompt. Otherwise skip it.
