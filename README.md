# Bridge Workflow

A React-based web application for managing projects, templates, users, companies, and other workflow-related operations.

## Tech Stack

* **React** – UI development
* **TypeScript** – Type-safe JavaScript
* **Vite** – Development server and build tool
* **Tailwind CSS** – Styling and responsive layouts
* **React Router** – Client-side routing
* **Lucide React** – Icons
* **Fetch API** – Backend API communication

## Features

* **Authentication** – Login using username and password
* **Protected Routes** – Restrict access to application pages based on login state
* **Masters Dashboard** – Central navigation to master data modules
* **Projects** – Project management
* **Templates** – Workflow template management
* **Users** – User management
* **Companies** – Company management
* **Responsive UI** – Layout designed for different screen sizes
* **Theme Support** – Light and dark theme support

## Prerequisites

Make sure the following are installed:

* [Node.js](https://nodejs.org/)
* npm
* [Git](https://git-scm.com/)
* A GitHub account for repository hosting

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bridge-react.git
```

Replace `YOUR_USERNAME` and `bridge-react` with your GitHub username and repository name.

### 2. Navigate to the project

```bash
cd bridge-react
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal. The development server is configured to use port `5000`.

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Build the application for production |
| `npm run preview` | Preview the production build         |
| `npm run lint`    | Run ESLint checks                    |

## Project Structure

```text
bridge/
├── public/
├── src/
│   ├── api/
│   │   └── auth.ts
│   ├── components/
│   │   └── shared/
│   │       ├── MainLayout.tsx
│   │       └── ThemeContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Masters.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── UsersPage.tsx
│   │   └── CompaniesPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

*The structure above is illustrative. Adjust the filenames and folders to match your actual project.*

## API Configuration

The application currently uses a Vite development proxy for API requests.

The proxy target is configured in `vite.config.ts`:

```ts
proxy: {
  "/api": {
    target: "https://bridge.sidpz.com",
    changeOrigin: true,
    secure: true,
  },
}
```

The authentication module uses:

```ts
const API_BASE_URL = "/api";
```

Authentication endpoints:

* `POST /api/login` – Authenticate a user
* `POST /api/refresh-token` – Refresh an access token

The Vite proxy is intended for local development. Configure an appropriate API URL or reverse proxy for production deployment.

## Authentication and Security

* Protected routes check for an access token before displaying authenticated pages.
* Authentication tokens are currently stored in browser storage.
* Backend APIs must independently validate authentication and authorization.
* Never commit passwords, tokens, private keys, or environment files containing secrets.
* For production, review token storage and session management security.

## Git Workflow

To commit and push your changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

Ensure `node_modules/` and sensitive environment files are excluded through `.gitignore`.
