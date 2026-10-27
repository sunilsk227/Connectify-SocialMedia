window.Posts = (() => {
  const C = window.Connectify;
  const timeAgo = value => {
    const d = new Date(String(value).replace(' ','T')+'Z'); if (Number.isNaN(d.getTime())) return value;
    const sec=Math.max(0,Math.floor((Date.now()-d.getTime())/1000));
    if(sec<60)return 'just now'; if(sec<3600)return `${Math.floor(sec/60)}m ago`; if(sec<86400)return `${Math.floor(sec/3600)}h ago`; if(sec<604800)return `${Math.floor(sec/86400)}d ago`;
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  };
  const commentHTML = c => `<div class="comment" data-comment-id="${c.id}">${C.avatar(c,'sm')}<div class="comment-body"><strong>${C.escapeHTML(c.full_name)}</strong><small class="muted">@${C.escapeHTML(c.username)} · ${timeAgo(c.created_at)}</small><p>${C.escapeHTML(c.content)}</p></div>${c.user_id===C.state.user.id?`<button class="comment-delete" data-delete-comment="${c.id}" title="Delete comment">×</button>`:''}</div>`;
  const postHTML = p => `<article class="post-card card" data-post-id="${p.id}"><div class="post-head">${C.avatar(p)}<div class="post-author"><strong>${C.escapeHTML(p.full_name)}</strong><small>@${C.escapeHTML(p.username)} · ${timeAgo(p.created_at)}</small></div>${p.user_id===C.state.user.id?`<button class="icon-button" data-delete-post="${p.id}" title="Delete post" aria-label="Delete post">···</button>`:''}</div>${p.content?`<p class="post-content">${C.escapeHTML(p.content)}</p>`:''}${p.image_path?`<img class="post-image" src="${C.escapeHTML(p.image_path)}" alt="Post image" loading="lazy">`:''}<div class="post-stats"><span>♡ &nbsp;${p.like_count} ${p.like_count===1?'like':'likes'}</span><span>◌ &nbsp;${p.comment_count} ${p.comment_count===1?'comment':'comments'}</span></div><div class="post-actions"><button class="post-action ${p.liked_by_me?'liked':''}" data-like="${p.id}" data-liked="${p.liked_by_me?'true':'false'}"><span>${p.liked_by_me?'♥':'♡'}</span>${p.liked_by_me?'Liked':'Like'}</button><button class="post-action" data-focus-comment="${p.id}"><span>♧</span>Comment</button>${p.user_id!==C.state.user.id?`<button class="post-action" data-open-profile="${p.user_id}"><span>◎</span>Profile</button>`:''}</div><div class="comment-list" id="comments-${p.id}">${(p.comments||[]).map(commentHTML).join('')}</div><form class="comment-form" data-comment-form="${p.id}"><input name="content" maxlength="500" placeholder="Write a kind comment..." required><button type="submit">Send ↗</button></form></article>`;
  async function loadFeed() {
    const host=C.$('#feed'); host.innerHTML='<div class="loading">Gathering your moments…</div>';
    try { const data=await C.api('/api/posts'); C.state.posts=data.posts; renderFeed(data.posts); }
    catch(e){host.innerHTML=`<div class="empty-state"><strong>We couldn't load your feed.</strong>${C.escapeHTML(e.message)}</div>`;}
  }
  function renderFeed(posts) {
    const host=C.$('#feed');
    if(!posts.length){host.innerHTML='<div class="empty-state"><div class="empty-icon">✦</div><strong>Your feed is a blank canvas.</strong>Be the first to share a thought or explore people to meet.</div>';return;}
    host.innerHTML=posts.map(postHTML).join('');
  }
  C.$('#postImage').addEventListener('change', e => {
    const file=e.target.files[0]; const preview=C.$('#imagePreview');
    if(!file){preview.hidden=true;preview.innerHTML='';return;}
    if(file.size>5*1024*1024){C.toast('Image must be 5 MB or smaller.',true);e.target.value='';return;}
    preview.hidden=false; const url=URL.createObjectURL(file); preview.innerHTML=`<img src="${url}" alt="Image preview"><button type="button" id="removePreview" aria-label="Remove image">×</button>`;
  });
  C.$('#imagePreview').addEventListener('click', e => { if(e.target.closest('#removePreview')){C.$('#postImage').value='';C.$('#imagePreview').hidden=true;C.$('#imagePreview').innerHTML='';} });
  C.$('#postForm').addEventListener('submit', async e => {
    e.preventDefault();const form=e.currentTarget;const button=form.querySelector('button[type=submit]');const content=form.elements.content.value.trim();const file=C.$('#postImage').files[0];
    if(!content&&!file){C.toast('Write something or add a photo first.',true);return;}
    const body=new FormData();body.append('content',content);if(file)body.append('image',file);button.disabled=true;
    try{await C.api('/api/posts',{method:'POST',body});form.reset();C.$('#imagePreview').hidden=true;C.$('#imagePreview').innerHTML='';await loadFeed();C.toast('Your moment is out in the world ✦');}
    catch(err){C.toast(err.message,true);}finally{button.disabled=false;}
  });
  document.addEventListener('click', async e => {
    const like=e.target.closest('[data-like]');
    if(like){const id=like.dataset.like;const liked=like.dataset.liked==='true';like.disabled=true;try{const result=await C.api(`/api/posts/${id}/like`,{method:liked?'DELETE':'POST'});like.dataset.liked=String(result.liked);like.classList.toggle('liked',result.liked);like.innerHTML=`<span>${result.liked?'♥':'♡'}</span>${result.liked?'Liked':'Like'}`;const card=like.closest('.post-card');card.querySelector('.post-stats span').innerHTML=`♡ &nbsp;${result.like_count} ${result.like_count===1?'like':'likes'}`;}catch(err){C.toast(err.message,true);}finally{like.disabled=false;}}
    const focus=e.target.closest('[data-focus-comment]');if(focus){const input=C.$(`#comments-${focus.dataset.focusComment}`).parentElement.querySelector('.comment-form input');input.focus();}
    const delPost=e.target.closest('[data-delete-post]');if(delPost&&confirm('Delete this post? This cannot be undone.')){try{await C.api(`/api/posts/${delPost.dataset.deletePost}`,{method:'DELETE'});delPost.closest('.post-card').remove();C.toast('Post deleted.');if(!C.$('#feed .post-card'))loadFeed();}catch(err){C.toast(err.message,true);}}
    const delComment=e.target.closest('[data-delete-comment]');if(delComment&&confirm('Delete this comment?')){try{await C.api(`/api/comments/${delComment.dataset.deleteComment}`,{method:'DELETE'});const card=delComment.closest('.post-card');delComment.closest('.comment').remove();const stats=card.querySelector('.post-stats span:nth-child(2)');const count=Math.max(0,Number(stats.textContent.match(/\d+/)?.[0]||0)-1);stats.innerHTML=`◌ &nbsp;${count} ${count===1?'comment':'comments'}`;}catch(err){C.toast(err.message,true);}}
  });
  document.addEventListener('submit', async e => {
    const form=e.target.closest('[data-comment-form]');if(!form)return;e.preventDefault();const input=form.elements.content;const content=input.value.trim();if(!content)return;
    const id=form.dataset.commentForm;const button=form.querySelector('button');button.disabled=true;
    try{const data=await C.api(`/api/posts/${id}/comments`,{method:'POST',body:{content}});const list=C.$(`#comments-${id}`);list.insertAdjacentHTML('beforeend',commentHTML(data.comment));input.value='';const card=form.closest('.post-card');const stats=card.querySelector('.post-stats span:nth-child(2)');const count=Number(stats.textContent.match(/\d+/)?.[0]||0)+1;stats.innerHTML=`◌ &nbsp;${count} ${count===1?'comment':'comments'}`;C.toast('Comment added.');}
    catch(err){C.toast(err.message,true);}finally{button.disabled=false;}
  });
  return {loadFeed,renderFeed,postHTML};
})();
