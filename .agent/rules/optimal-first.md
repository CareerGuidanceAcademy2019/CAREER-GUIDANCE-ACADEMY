# Rule: Optimal Solution First

Before changing code for any goal:
1. Restate the problem in two lines and list what must stay unchanged.
2. List 2 to 4 candidate solutions from simplest to most complex. Always include "use what already exists" (a built-in setting, an existing library, an existing table, or a few changed lines).
3. Compare them in a short table: files touched, new tables or services, security strength, speed and cost impact, risk to existing features, maintenance. Check current documentation for the tools involved instead of relying on memory.
4. Pick the simplest option that meets every requirement. Add no extra tables, jobs or dependencies unless a requirement cannot be met without them. If the chosen option proves insufficient, go back to step 2 instead of stacking patches.
5. Write the options, table, decision and reason in `docs/DECISIONS.md`, then implement only that option.
6. After implementing, remove any code, files or config the final solution does not need.
