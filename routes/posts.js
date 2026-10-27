const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) return cb(new Error('Only JPG, PNG, GIF, and WebP images are allowed.'));
  cb(null, true);
}});
const postQuery = `
SELECT p.id, p.user_id, p.content, p.image_path, p.created_at, p.updated_at,
 u.full_name, u.username, u.profile_image,
 (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) AS like_count,
 (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS comment_count,
 EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=@viewer) AS liked_by_me
 FROM posts p JOIN users u ON u.id=p.user_id`;
const postById = db.prepare(postQuery + ' WHERE p.id=@id');
const feed = db.prepare(postQuery + ' ORDER BY p.created_at DESC, p.id DESC LIMIT 100');
const commentsFor = db.prepare(`SELECT c.id,c.post_id,c.user_id,c.content,c.created_at,u.full_name,u.username
 FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created_at ASC`);

router.get('/', requireAuth, (req, res) => {
  const posts = feed.all({ viewer: req.session.userId }).map(p => ({ ...p, comments: commentsFor.all(p.id) }));
  res.json({ posts });
});
router.get('/user/:userId', requireAuth, (req, res) => {
  const posts = db.prepare(postQuery + ' WHERE p.user_id=@userId ORDER BY p.created_at DESC LIMIT 100')
    .all({ viewer: req.session.userId, userId: Number(req.params.userId) }).map(p => ({ ...p, comments: commentsFor.all(p.id) }));
  res.json({ posts });
});
router.get('/:id', requireAuth, (req, res) => {
  const post = postById.get({ viewer: req.session.userId, id: Number(req.params.id) });
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  post.comments = commentsFor.all(post.id);
  res.json({ post });
});
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  const content = String(req.body.content || '').trim().slice(0, 2000);
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  if (!content && !image_path) return res.status(400).json({ error: 'Write something or attach an image.' });
  const result = db.prepare('INSERT INTO posts (user_id,content,image_path) VALUES (?,?,?)').run(req.session.userId, content, image_path);
  res.status(201).json({ post: postById.get({ viewer: req.session.userId, id: result.lastInsertRowid }) });
});
router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.user_id !== Number(req.session.userId)) return res.status(403).json({ error: 'You can only edit your own posts.' });
  const content = String(req.body.content || '').trim().slice(0, 2000);
  if (!content && !post.image_path) return res.status(400).json({ error: 'Post cannot be empty.' });
  db.prepare("UPDATE posts SET content=?, updated_at=datetime('now') WHERE id=?").run(content, id);
  res.json({ post: postById.get({ viewer: req.session.userId, id }) });
});
router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.user_id !== Number(req.session.userId)) return res.status(403).json({ error: 'You can only delete your own posts.' });
  db.prepare('DELETE FROM posts WHERE id=?').run(post.id);
  res.json({ message: 'Post deleted.' });
});
module.exports = router;
