# Handoff

Use at the **end of a session** to leave durable context for the next chat. Do **not** paste a full conversation recap or duplicate what already lives in `AGENTS.md` / `README.md`.

In **Recent session notes**, write **Shipped** as **facts** the next agent needs (code behavior, screens, paths, APIs)—not narration about editing documentation or session housekeeping. Process belongs here and in `README`; move stale detail to `docs/archive/` when trimming.

**Before we end:**

1. Open `docs/CONTEXT.md` → **Recent session notes**. Read the newest 1–2 dated entries for dedup context.
2. Add or update **one** session line following the **template and ordering rules written in that same section** (typically **Shipped:** / **Next:** / **Blockers:** on one or two lines). **Newest dated entry stays at the top** of that list. If your update overlaps the latest entry, **edit that line** instead of appending a near-duplicate.
3. Update other project docs only when the change is durable and user-facing; if nothing applies, say “No additional doc updates needed.”
4. If the session list would exceed **10** entries, archive the oldest to `docs/archive/context-YYYY-MM.md` first (per the instructions in that section).
5. **Noise check:** run `rg "maybe|investigate later|brainstorm" docs/CONTEXT.md`. Only fix wording in **dated session entries**; ignore matches elsewhere in the file.
6. If carryover context matters for the next chat, give a **one-paragraph** starter prompt for a new thread. Otherwise omit it.
