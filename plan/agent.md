# Plan Directory Guide

This directory contains the planning artifacts for the OpenClaude Registry/Descriptor Architecture migration.

## Files

### `cheeky-cooking-moon.md` — Master Plan
The authoritative architecture and rollout plan. It defines:
- The problem (provider terminology overload)
- The target descriptor model (vendors, gateways, models, brands, anthropic proxies)
- Behavioral rules (routing, OpenAI shim quirks, `/usage`, model lookup, discovery cache)
- Backward compatibility strategy
- Migration inventory (every preset mapped to descriptor type)
- Full rollout phases (1–4) with work packets, checklists, and merge checkpoints
- Verification test plan
- PR conflict checks and design decisions

**When in doubt, refer to the master plan.** It contains the canonical interface definitions, example descriptor files, and detailed rules that subtasks reference.

### `progress.md` — Phase 1 Task Breakdown
A concrete, actionable breakdown of Phase 1 (Foundation and Parity) into numbered tasks with explicit requirements. Each task:
- References the master plan section it implements
- Lists the exact file(s) to create or modify
- States acceptance criteria (what "done" means)
- Includes merge checkpoint ordering

**Use this file to track day-to-day work.** Check off tasks as they are completed. When a phase (1A–1F) is fully checked, update the exit criteria in the master plan and proceed.

---

## How to Start Work

1. **Read the master plan first** (`cheeky-cooking-moon.md`) to understand the architecture, goals, and non-goals.
2. **Open `progress.md`** and find the first unchecked task in the current phase.
3. **Implement the task** following the requirements listed. Do not deviate from the master plan interfaces without updating both files.
4. **Write tests** as specified in the task requirements.
5. **Check off the task** in `progress.md` when done.
6. **Run the test suites** listed in Phase 1F before declaring a merge checkpoint complete.

## Merge Order

Follow the merge checkpoints in `progress.md` exactly:
1. Phase 1A (registry skeleton)
2. Phase 1B + 1C (descriptor inventory + brand/model index)
3. Phase 1D + 1E (config compatibility + CLI/usage migration)
4. Phase 1F (verification and tests)

Do not merge later phases before earlier ones are complete and stable.

## Questions or Ambiguity?

- If a task requirement conflicts with the master plan, the master plan wins.
- If both are ambiguous, ask for clarification before implementing.
- Do not handwave or skip requirements — every checkbox in `progress.md` is intentional.
