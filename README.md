# HCMS Frontend

## Project Overview

Frontend application for the **Healthcare Conflict Management System (HCMS)**.

## Features

* Responsive React user interface
* English and Arabic localization with LTR and RTL support
* Shared HCMS light and dark design tokens
* Language-aware typography using Inter and IBM Plex Sans Arabic
* Reusable HCMS logo and icon component with light and dark presentations
* Persistent light and dark theme foundation with operating-system fallback
* Landing page integrated with the shared brand, language, and theme controls
* Landing About and Platform Capabilities sections with localized content
* Role-based Who We Serve section for patients, doctors, organizations, and administrators
* Smooth Landing section navigation with active-section tracking
* Final Landing CTA with a shared public registration-role entry flow
* Responsive localized Landing footer with section navigation and account entry actions

## Dependencies

* React
* Vite
* React Router
* Axios
* ESLint
* Tailwind CSS
* Fontsource packages for Inter and IBM Plex Sans Arabic

## Requirements

Make sure the following are installed:

* Node.js
* npm
* Git

## Setup

Clone the repository:

```bash
git clone https://github.com/ahalnaji002/HCMS-Frontend.git
```

Enter the project directory:

```bash
cd HCMS-Frontend
```

Switch to the development branch:

```bash
git checkout develop
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a reference:

```env
VITE_API_URL=http://localhost:3000
```

> Do not commit the `.env` file to GitHub.

## Run the Frontend

Start the development server:

```bash
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

## Backend Connection

The frontend communicates with the HCMS Backend API using Axios.

The API base URL is configured through:

```env
VITE_API_URL=http://localhost:3000
```

The shared Axios configuration is located at:

```text
src/services/api.js
```

## Brand Assets

Use the shared `Logo` component with the full wordmark or icon-only variant:

```jsx
import Logo from "./components/common/Logo";

<Logo variant="logo" appearance="light" className="h-12 w-auto" />
<Logo variant="mark" appearance="dark" className="size-10" />
```

The `appearance="dark"` option selects artwork intended for dark backgrounds.

## Theme

`ThemeProvider` initializes the interface from the saved `hcms-theme` value or
the operating-system color preference. Components can read or update the theme
with `useTheme`:

```jsx
const { theme, setTheme, toggleTheme } = useTheme();
```

`ThemeToggle` is mounted in the Landing navigation and remains available as a
reusable control for future approved pages.

## Registration Entry

The Navbar, Hero, final Landing CTA, and Footer share the same role picker. Patient
registration opens the existing `/register/patient` route. Doctor and healthcare
organization registration are shown as coming soon until their frontend routes
and pages are implemented. Administrator registration is intentionally excluded
from this public entry flow.

The Landing Page supports English/Arabic, LTR/RTL, light/dark themes, and mobile
layouts. A previously observed Firefox-only decorative-corner artifact is not
treated as a layout defect unless it can be reproduced as an actual CSS issue.

## Branching

* `main` — stable version
* `develop` — development integration branch
* `feature/...` — individual feature branches

New development work should not be committed directly to `main`.

Typical workflow:

```text
develop → feature/... → develop → main
```

## Project Structure

```text
HCMS-Frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```
