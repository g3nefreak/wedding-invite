# TypeScript Frontend Template

A React + Vite + Tailwind CSS frontend template with TypeScript and shadcn components.

## Getting Started

To run this application:

```bash
npm install
npm run dev
```

## Building For Production

To build this application for production:

```bash
npm run build
npm run preview
```

## Styling

This project uses [Tailwind CSS v4](https://tailwindcss.com/) for styling and [shadcn](https://ui.shadcn.com/) for components.

## Linting & Formatting

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for linting and formatting.

```bash
npm run lint
npm run format
npm run check
```

# Adaptive Codex team

Copy `AGENTS.md`, `.codex/`, and merge the `.gitignore` entry into your repository root. If you already have `.codex/config.toml`, merge the `[agents]` settings instead of replacing your existing configuration. The `.codex/context/` directory is for agent-maintained persistent project documentation; generated files should be committed by you. `.codex/tmp/` is ignored.

Supported roles: system_analyst, architect, developer, bug_fixer, tester, code_reviewer. Natural language entry points include `hello agents, quick check`, `hello agents, deep check`, `hello architect, map project`, `hello fixer, triage ...`, and `Bootstrap the project context`.

No TOML fixes a model or reasoning effort; routing is adaptive and relies on your installed Codex client supporting custom subagents. Agent file write boundaries are instructions, not security sandbox restrictions. Agent spawning, model availability and prompt-command recognition should be tested in your local Codex environment.
