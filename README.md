# In-N-Outify

Track your income and expenses with a clean, dark-first dashboard. Built with Angular, Firebase, and spartan-ng/ui-helm.

## Features

- **Income & expense tracking** — log transactions with title, amount, date, description, and tags.
- **Dashboard** — stat cards (In, Out, On Hand), income/expense charts, and a filterable transactions table (AG Grid).
- **Tag management** — create and delete income/expense tags from the Settings page.
- **Date range filtering** — pick a date range to scope the dashboard.
- **Settings** — currency and number-format preferences, profile management.
- **PWA** — installable and offline-capable via the Angular service worker.
- **Notifications** — toast feedback for save/delete/errors.

## Tech stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | Angular 22 (SSR via Angular)                      |
| UI         | Tailwind CSS v4 + spartan-ng/ui-helm + ng-icons   |
| Data       | Firebase (Auth + Firestore)                       |
| Charts     | ECharts (ngx-echarts)                            |
| Grid       | AG Grid                                          |
| Tests      | Vitest                                            |
| Package    | pnpm                                             |

## Getting started

### Prerequisites

- Node.js (LTS)
- pnpm — `corepack enable` or `npm i -g pnpm`

### Install & run

```bash
pnpm install
pnpm start
```

Navigate to `http://localhost:4200/`. The app hot-reloads on changes.

## Commands

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm start`   | Run the dev server on `http://localhost:4200` |
| `pnpm build`   | Build the app into `dist/`                    |
| `pnpm test`    | Run unit tests (Vitest)                       |
| `pnpm watch`   | Rebuild on change (development config)        |
| `pnpm serve:ssr:expense-tracker` | Serve the SSR build locally      |

## Configuration

Firebase credentials and environment-specific values live in `src/environments/`. Add your own Firebase project config there before deploying.

## Deployment

### GitHub Pages

This repo deploys to GitHub Pages using `angular-cli-ghpages`:

```bash
pnpm build
pnpm dlx angular-cli-ghpages --dir=dist/expense-tracker/browser --cname=tracker.mikasjames.com
```

The built app is served from the `gh-pages` branch. The repository page (the one you're reading now) is rendered from the `README.md` on the default branch.

## License

Private / proprietary — see the repository owner for details.
