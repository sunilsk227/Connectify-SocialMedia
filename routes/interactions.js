const router = require('express').Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.post('/posts/:id/like', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM posts WHERE id=?').get(id)) return res.status(404).json({ error: 'Post not found.' });
  db.prepare('INSERT OR IGNORE INTO likes (post_id,user_id) VALUES (?,?)').run(id, req.session.userId);
  res.json({ liked: true, like_count: db.prepare('SELECT COUNT(*) AS n FROM likes WHERE post_id=?').get(id).n });
});
router.delete('/posts/:id/like', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(id, req.session.userId);
  res.json({ liked: false, like_count: db.prepare('SELECT COUNT(*) AS n FROM likes WHERE post_id=?').get(id).n });
});
router.post('/users/:id/follow', requireAuth, (req, res) => {
  const target = Number(req.params.id);
  if (target === Number(req.session.userId)) return res.status(400).json({ error: 'You cannot follow yourself.' });
  if (!db.prepare('SELECT id FROM users WHERE id=?').get(target)) return res.status(404).json({ error: 'User not found.' });
  db.prepare('INSERT OR IGNORE INTO followers (follower_id,following_id) VALUES (?,?)').run(req.session.userId, target);
  res.json({ following: true, follower_count: db.prepare('SELECT COUNT(*) AS n FROM followers WHERE following_id=?').get(target).n });
});
router.delete('/users/:id/follow', requireAuth, (req, res) => {
  const target = Number(req.params.id);
  db.prepare('DELETE FROM followers WHERE follower_id=? AND following_id=?').run(req.session.userId, target);
  res.json({ following: false, follower_count: db.prepare('SELECT COUNT(*) AS n FROM followers WHERE following_id=?').get(target).n });
});
module.exports = router;
