const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

const publicUser = (u) => ({ id: u.id, full_name: u.full_name, username: u.username, email: u.email, bio: u.bio, profile_image: u.profile_image, created_at: u.created_at });

router.post('/register', (req, res) => {
  const full_name = String(req.body.full_name || '').trim();
  const username = String(req.body.username || '').trim().replace(/^@/, '');
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (full_name.length < 2 || full_name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return res.status(400).json({ error: 'Username must be 3–24 characters (letters, numbers, underscores).' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)) return res.status(409).json({ error: 'That username or email is already registered.' });
  const hash = bcrypt.hashSync(password, 12);
  try {
    const result = db.prepare('INSERT INTO users (full_name, username, email, password_hash) VALUES (?, ?, ?, ?)').run(full_name, username, email, hash);
    req.session.userId = result.lastInsertRowid;
    res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)) });
  } catch (_e) { res.status(409).json({ error: 'Could not create account. Username or email may already exist.' }); }
});

router.post('/login', (req, res) => {
  const identity = String(req.body.identity || '').trim();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE').get(identity.replace(/^@/, ''), identity);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Incorrect username/email or password.' });
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => req.session.destroy(err => {
  if (err) return res.status(500).json({ error: 'Could not log out.' });
  res.clearCookie('connect.sid');
  res.json({ message: 'Logged out successfully.' });
}));

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: user ? publicUser(user) : null });
});
module.exports = router;
