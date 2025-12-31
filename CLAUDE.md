---
description: Rules for Claude when working on this project
globs:
alwaysApply: true
---

## Git Rules

**NEVER add Claude as a coauthor on commits.**
- No `Co-Authored-By` lines
- No `Generated with Claude` footers
- Just the commit message, nothing else

---

## Style Guide Governance

`website-guidelines/STYLE_GUIDE.md` is the authoritative global design system.

When implementing a section:
- If a design decision is reusable, document it in STYLE_GUIDE.md
- If section-specific, keep it in the section file

If implementation diverges from style guide:
1. If new approach looks/works better, keep it
2. Update style guide to match implementation
3. Add changelog entry noting what changed and why

Never silently diverge from the style guide.
