# HCMS Frontend

Frontend application for the **Healthcare Conflict Management System (HCMS)**.

## Technologies

* React
* Vite
* React Router
* Axios
* ESLint

## Requirements

Make sure the following are installed:

* Node.js
* npm
* Git

## Installation

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
