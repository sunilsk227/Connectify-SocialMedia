const router = require('express').Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const userSelect = `SELECT u.id, u.full_name, u.username, u.bio, u.profile_image, u.created_at,
 (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id) AS post_count,
 (SELECT COUNT(*) FROM followers f WHERE f.following_id=u.id) AS follower_count,
 (SELECT COUNT(*) FROM followers f WHERE f.follower_id=u.id) AS following_count
 FROM users u`;

router.get('/search', requireAuth, (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 50);
  if (!q) return res.json({ users: [] });
  const users = db.prepare(`${userSelect} WHERE u.username LIKE ? OR u.full_name LIKE ? ORDER BY u.username LIMIT 30`).all(`%${q}%`, `%${q}%`)
    .map(u => ({ ...u, is_following: !!db.prepare('SELECT 1 FROM followers WHERE follower_id=? AND following_id=?').get(req.session.userId, u.id) }));
  res.json({ users });
});

router.get('/:id', requireAuth, (req, res) => {
  const user = db.prepare(`${userSelect} WHERE u.id=?`).get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.is_following = !!db.prepare('SELECT 1 FROM followers WHERE follower_id=? AND following_id=?').get(req.session.userId, user.id);
  user.is_me = Number(req.session.userId) === user.id;
  res.json({ user });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (id !== Number(req.session.userId)) return res.status(403).json({ error: 'You can only edit your own profile.' });
  const full_name = String(req.body.full_name || '').trim();
  const bio = String(req.body.bio || '').trim().slice(0, 180);
  if (full_name.length < 2 || full_name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
  db.prepare('UPDATE users SET full_name=?, bio=? WHERE id=?').run(full_name, bio, id);
  res.json({ user: db.prepare(`${userSelect} WHERE u.id=?`).get(id) });
});

router.get('/:id/followers', requireAuth, (req, res) => {
  const users = db.prepare(`${userSelect} JOIN followers f ON f.follower_id=u.id WHERE f.following_id=? ORDER BY f.created_at DESC`).all(Number(req.params.id));
  res.json({ users });
});
router.get('/:id/following', requireAuth, (req, res) => {
  const users = db.prepare(`${userSelect} JOIN followers f ON f.following_id=u.id WHERE f.follower_id=? ORDER BY f.created_at DESC`).all(Number(req.params.id));
  res.json({ users });
});
module.exports = router;
