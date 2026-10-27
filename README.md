# Connectify — VTASK 2 Social Media Platform

A mini social media app built with **HTML, CSS, JavaScript, Node.js, Express, and SQLite**.

## Features
- Register, log in, and log out with hashed passwords
- User profiles and editable bios
- Create text posts and upload images (up to 5 MB)
- Comment on posts and delete your own comments
- Like and unlike posts, with duplicate likes prevented by the database
- Follow and unfollow users
- Search people and view followers/following lists
- Responsive light/dark interface
- SQLite persistence and session storage

## Requirements
- Node.js 18 or later (LTS recommended)
- npm (included with Node.js)
- VS Code (recommended)

## Run locally
1. Extract `connectify-social-media.zip`.
2. Open the extracted `connectify-social-media` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Install packages: `npm install`
5. Copy `.env.example` to `.env` and set `SESSION_SECRET` to a long, random value.
6. (Optional) Add demo users and posts: `npm run seed`
7. Start the server: `npm start`
8. Visit **http://localhost:3000**.

The SQLite database is created automatically at `database/connectify.sqlite` on first run.

## Demo login
After `npm run seed`:
- Username: `aarav.mehta`
- Password: `Connectify123!`

Other seeded usernames: `mayapatel`, `ishaan.rao`, `zoyakhan`. All share the same demo password. Change/remove demo accounts before any public deployment.

## Useful commands
- `npm start` — start the server
- `npm run dev` — restart on file changes (Node.js 18.11+)
- `npm run seed` — add demo users and posts

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current session user |
| GET/PUT | `/api/users/:id` | View/update profile |
| GET | `/api/users/search?q=term` | Search users |
| GET | `/api/users/:id/followers` | List followers |
| GET | `/api/users/:id/following` | List following |
| GET/POST | `/api/posts` | List/create posts |
| GET | `/api/posts/:id` | View a post |
| PUT/DELETE | `/api/posts/:id` | Edit/delete own post |
| GET | `/api/posts/user/:userId` | Posts by user |
| POST | `/api/posts/:id/like` | Like a post |
| DELETE | `/api/posts/:id/like` | Unlike a post |
| POST | `/api/posts/:postId/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete own comment |
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |

All interaction endpoints require a logged-in session.

## Troubleshooting
- **`npm` is not recognized:** Install Node.js LTS from https://nodejs.org, restart VS Code, then run `node -v` and `npm -v`.
- **Port 3000 is busy:** Set another `PORT` in `.env`, such as `PORT=3001`, then restart.
- **SQLite package install fails:** Use a supported Node.js LTS version and rerun `npm install`. Some systems need build tools if no prebuilt `better-sqlite3` binary is available.
- **Images do not upload:** Use JPG, PNG, GIF, or WebP, up to 5 MB.
- **Can't log in:** Run `npm run seed` and use the demo credentials above, or register a new account.
- **Reset database:** Stop the server, back up data you need, then remove `database/connectify.sqlite` and restart. This deletes local app data.

## Security notes
This is a local educational project, not a production-ready public service. Before public deployment, configure a strong session secret, HTTPS, secure upload validation/storage, rate limiting, CSRF protections appropriate to your deployment, and production session/cookie settings. Never commit `.env`, user databases, or real credentials.

## Project structure
```text
connectify-social-media/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── database/db.js
├── middleware/auth.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   └── interactions.js
├── scripts/seed.js
└── public/
    ├── index.html
    ├── css/style.css
    ├── js/app.js
    ├── js/auth.js
    ├── js/posts.js
    ├── js/profile.js
    └── uploads/
```
