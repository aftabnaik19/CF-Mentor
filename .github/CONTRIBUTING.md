# Contributing to CF-Mentor

Thanks for helping! Workflow:
1. Create or pick an existing issue.
2. `git checkout -b <type>/<short-desc>-#<issue-number>`
   e.g. `git checkout -b fix/default-sort-#4`
3. Make small, focused commits.
4. Push and open a Pull Request targeting `main`.
5. Include `Fixes #<issue-number>` in PR body to close the issue on merge.

Commit message format:
- `fix: ... (#4)` for bug fixes
- `feat: ... (#7)` for new features
- Keep messages concise.

Code style & tests:
- Run `npm run lint` and `npm run build` before opening a PR.
- For details on project structure, conventions, and architecture, please see our [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) guide.
