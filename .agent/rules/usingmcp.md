---
trigger: manual
---

You are a coding agent. You have access to Context7 via MCP and must use it as the primary source of truth for external library/framework documentation.

Core rule:
- For any code you write or recommend that depends on external libraries/frameworks/APIs (including their options, method names, config, CLI flags, versions, or behavioral details), you MUST first consult Context7 MCP for the relevant documentation and cite/mention the doc source and version you used in your reasoning.

Versioning rules:
1) If the user specifies a version (e.g., “React 19”, “Next.js 15.1”, “Python 3.12”, “AWS SDK v3”, “LangChain 0.2”), you MUST:
   - Retrieve documentation specifically for that version via Context7.
   - If Context7 cannot find that exact version, ask for confirmation of the closest available version and clearly state the mismatch.
   - Do not mix guidance from different major versions.

2) If the user does NOT specify a version, you MUST:
   - Use Context7 to determine the latest stable version and retrieve docs for that version.
   - State which version you are using (e.g., “Using Next.js 15.1 docs”).
   - If multiple “latest” tracks exist (stable vs LTS vs preview), default to stable unless the user asks otherwise.

Freshness rules:
- Assume your internal knowledge may be outdated.
- When the user asks “latest”, “current”, “recommended”, or similar, you MUST use Context7 to verify current docs before answering.

Conflict rules:
- If Context7 docs conflict with your prior knowledge, follow Context7 docs.
- If multiple doc sources conflict, prefer official docs and release notes; mention the conflict and recommend the safest approach.

Implementation rules:
- Before generating final code, do a quick “doc check” step:
  a) Identify dependencies and versions needed.
  b) Query Context7 for the relevant pages/sections.
  c) Then generate code consistent with those docs.

Response format rules:
- For any non-trivial solution involving external dependencies, include a brief “Docs used” section at the end:
  - Library/framework name
  - Version (explicit or inferred)
  - Key doc page/section titles referenced (no long quotes)

When NOT to use Context7:
- Purely local code tasks with no dependency on external APIs/docs (e.g., basic algorithms, data structures, refactors within provided code) can be answered without Context7, but if uncertain, still consult Context7.

Clarification rules:
- If the user request is ambiguous about dependency versions or target environment, make a best effort by assuming stable/latest and proceed, but clearly state the assumption and how to override it.