# Archived from docs/CONTEXT.md (session notes cap)

## Detail merged from CONTEXT (2026-04-24 — handoff iteration cluster)

Consolidated into one line in Recent session notes; retained here for audit trail.

- **2026-04-24** — handoff hygiene hardening pass: standardized single-source session history guidance, added retention/dedup/template/blocker guardrails in docs, and tightened `/handoff` with a noise-word check. **Next:** follow this policy in normal use and create `docs/archive/context-YYYY-MM.md` once recent notes exceed 10 entries. **Blockers:** none.

- **2026-04-24** — command rename pass: replaced project handoff command from `/closeout` to `/handoff`; updated command file path to `.cursor/commands/handoff.md`; aligned README and context references to the new name. **Next:** keep using `/handoff` for end-of-session updates and copy `.cursor/commands/handoff.md` into new repos when useful. **Blockers:** none.

- **2026-04-24** — `/handoff` alignment pass: project command now matches README behavior by making next-session starter prompt conditional (only when prior context matters). **Next:** keep handoff entries high-signal and reuse by copying `.cursor/commands/handoff.md` into new repos. **Blockers:** none.

- **2026-04-24** — docs + workflow handoff pass: `README.md` was rewritten for beginner clarity (what/when/why intros, step labels, iPhone quick checklist) and now includes a reusable handoff flow plus `/handoff` usage; project command added at `.cursor/commands/handoff.md`. **Next:** validate `/handoff` in normal use and keep `docs/CONTEXT.md` updates to max 3 bullets per session. **Blockers:** none.

---

- **2026-04-24** — export + metadata pass: markdown now exports Obsidian frontmatter (`date/title/author/page/tags`) with `MM-DD-YYYY` date formatting and filename `Book Title, Page Number, Date.md`; Capture collects author; Review edits title/author/page and transcript; save to vault now requires title, normalizes metadata spacing, and gives proactive vault-access-expired guidance on stale iOS folder permissions; Vitest suite added for markdown/path/store behaviors.

- **2026-04-24** — handoff workflow refinement: `README.md` now clarifies `/handoff` is project-local, how to reuse it across repos (`.cursor/commands/handoff.md` copy), and starter-prompt usage is conditional for context-heavy new chats only. **Next:** optionally mirror this command template into future repos when created. **Blockers:** none.

---

## Archived from `docs/CONTEXT.md` recent cap (2026-04-27)

Moved here to keep Recent session notes ≤10 entries.

- **2026-04-24** — **Shipped:** `SafeAreaProvider` at app root (`App.tsx`); removed vault subfolder—settings persist `vaultRootUri` only, `saveNoteToVault` writes `.md` at picked folder root; README notes iCloud/any folder and Obsidian optional. **Next:** anyone who used a subfolder should pick that destination folder once in **Choose vault folder**. **Blockers:** none.

- **2026-04-24** — **Shipped:** Repo layout for handoffs—handoff prompt (now `.cursor/skills/handoff/SKILL.md`); README **Continuing in a new chat**; session rubric (≤10 entries, overflow → `docs/archive/`). **Next:** none. **Blockers:** none.

- **2026-04-24** — **Shipped:** Note pipeline hardening—pending transcription cancelled on unmount (`AbortSignal`); dirty-ref guard so store updates do not clobber local edits; `deleteNote` removes backing audio; empty transcript shows `_(no transcript yet)_` in markdown; `NoteStatus` no longer includes `"draft"`; `openai` dependency removed. **Next:** none. **Blockers:** none.
