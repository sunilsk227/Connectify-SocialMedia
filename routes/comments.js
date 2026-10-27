const router = require('express').Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.post('/posts/:postId/comments', requireAuth, (req, res) => {
  const postId = Number(req.params.postId);
  const content = String(req.body.content || '').trim().slice(0, 500);
  if (!db.prepare('SELECT id FROM posts WHERE id=?').get(postId)) return res.status(404).json({ error: 'Post not found.' });
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty.' });
  const result = db.prepare('INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)').run(postId, req.session.userId, content);
  const comment = db.prepare(`SELECT c.id,c.post_id,c.user_id,c.content,c.created_at,u.full_name,u.username FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`).get(result.lastInsertRowid);
  res.status(201).json({ comment });
});
router.delete('/comments/:id', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id=?').get(Number(req.params.id));
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });
  if (comment.user_id !== Number(req.session.userId)) return res.status(403).json({ error: 'You can only delete your own comments.' });
  db.prepare('DELETE FROM comments WHERE id=?').run(comment.id);
  res.json({ message: 'Comment deleted.' });
});
module.exports = router;
