# AntigravityFlow Rules & Guidelines

## 🚨 Git Branch & Push Safety Protocols (STRICT ENFORCEMENT)

1. **Default Working Branch is `AGF`**:
   - All code edits, bug fixes, testing, commits, and regular pushes must target the `AGF` branch (`origin/AGF`).
   - The workspace branch must remain on `AGF`.

2. **NEVER Push to `scr5` without Explicit Command**:
   - The `scr5` branch triggers live production deployment to Firebase Hosting (`examflow-india`).
   - Pushing to `scr5` is **STRICTLY PROHIBITED** unless the user gives an explicit, unambiguous command in the conversation (e.g., *"push to SCR5"*, *"deploy to scr5"*).
   - Never push to `scr5` automatically, speculatively, or as part of any routine git update.

3. **Workflow Integrity on `scr5`**:
   - When explicitly instructed to push to `scr5`, always preserve `.github/workflows/firebase-hosting-merge.yml` on `scr5` so that automated deployment functions properly.
