require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const hash = bcrypt.hashSync('Connectify123!', 10);
const users = [
 ['Aarav Mehta','aarav.mehta','aarav@example.com','Collecting little moments and big ideas.'],
 ['Maya Patel','mayapatel','maya@example.com','Books, coffee, and finding the good in everyday things.'],
 ['Ishaan Rao','ishaan.rao','ishaan@example.com','Curious mind. Always learning something new.'],
 ['Zoya Khan','zoyakhan','zoya@example.com','Making things, sharing stories, staying kind.']
];
const insertUser=db.prepare('INSERT OR IGNORE INTO users(full_name,username,email,password_hash,bio) VALUES(?,?,?,?,?)');
const insertPost=db.prepare('INSERT INTO posts(user_id,content) VALUES(?,?)');
const seed=db.transaction(()=>{
 for(const u of users) insertUser.run(u[0],u[1],u[2],hash,u[3]);
 const ids=db.prepare('SELECT id,username FROM users WHERE username IN (?,?,?,?)').all('aarav.mehta','mayapatel','ishaan.rao','zoyakhan');
 if(db.prepare('SELECT COUNT(*) AS n FROM posts').get().n===0){
  const samples=[
   ['aarav.mehta','A reminder to slow down and notice the little things. A good playlist, a warm cup of tea, and a little time to think. ☀️'],
   ['mayapatel','Finished a book that made me look at ordinary days in a completely different way. What are you reading lately? 📚'],
   ['ishaan.rao','Tiny progress is still progress. Spent an hour learning something new today, and that counts. ✨'],
   ['zoyakhan','Today’s challenge: send someone a message telling them one thing you appreciate about them. Let’s make someone smile. 💜']
  ];
  for(const [username,content] of samples){const u=ids.find(x=>x.username===username);if(u)insertPost.run(u.id,content);}
  const follow=db.prepare('INSERT OR IGNORE INTO followers(follower_id,following_id) VALUES(?,?)');
  if(ids.length>1){follow.run(ids[0].id,ids[1].id);follow.run(ids[1].id,ids[2].id);}
 }
});
seed();
console.log('Demo data ready. Demo password for seeded users: Connectify123!');
console.log('Demo usernames: aarav.mehta, mayapatel, ishaan.rao, zoyakhan');
db.close();
