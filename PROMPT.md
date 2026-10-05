# Ralph Loop Autonomous Task Specification

## Directive
Execute autonomous build loops to harden Qoutely for production deployment. Every milestone must be validated through mechanical verification (TypeScript compilation and automated unit/integration tests).

## Loop Protocol
1. Read `TODO.md`.
2. Pick the next uncompleted task.
3. Implement the feature/fix cleanly following existing codebase patterns.
4. Run mechanical verification (`npm run typecheck` and test script).
5. Mark the task complete `[x]` in `TODO.md`.
6. Proceed to the next task until all tasks pass.
