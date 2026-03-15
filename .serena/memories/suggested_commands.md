# Suggested Commands

## Development

- `pnpm dev`: Start the development server with watch mode (tsx).
- `pnpm install`: Install dependencies.

## Linting and Formatting

- `pnpm exec eslint .`: Run ESLint to check for code style issues.
- `pnpm exec eslint . --fix`: Run ESLint and fix issues automatically.
- `pnpm exec prettier . --check`: Check for formatting issues with Prettier.
- `pnpm exec prettier . --write`: Format code with Prettier.

## Database (Prisma)

- `pnpm exec prisma generate`: Generate the Prisma client.
- `pnpm exec prisma db push`: Push the database schema to the database (for development).
- `pnpm exec prisma studio`: Open Prisma Studio to manage database records.

## System/Utility (Windows/PowerShell)

- `ls`: List files and directories.
- `cd <path>`: Change directory.
- `rm <file>`: Remove file.
- `mkdir <dir>`: Create directory.
- `git status`: Check git status.
- `git log -n <number>`: View recent git commits.
- `grep -r "<pattern>" .`: Search for pattern in files (using ripgrep if available).
