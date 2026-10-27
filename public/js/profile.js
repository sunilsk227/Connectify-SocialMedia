window.Profile = (() => {
  const C=window.Connectify;
  async function load(id) {
    C.state.currentProfile=Number(id);C.navigate('profile');
    const host=C.$('#profileContent');host.innerHTML='<div class="loading">Loading profile…</div>';
    try{
      const [{user},{posts}]=await Promise.all([C.api(`/api/users/${id}`),C.api(`/api/posts/user/${id}`)]);
      const isMe=Number(id)===C.state.user.id;
      host.innerHTML=`<div class="profile-hero card"><div class="profile-cover"></div><div class="profile-main">${C.avatar(user,'lg')}<div class="profile-actions">${isMe?'<button class="outline-btn" id="editProfileBtn">✎ Edit profile</button>':`<button class="${user.is_following?'outline-btn':'primary-btn'}" data-follow="${user.id}" data-following="${user.is_following}">${user.is_following?'Following':'+ Follow'}</button>`}</div></div><h2 class="profile-name">${C.escapeHTML(user.full_name)}</h2><div class="profile-handle">@${C.escapeHTML(user.username)}</div><p class="profile-bio">${C.escapeHTML(user.bio||'This person is still writing their story…')}</p><div class="profile-stats"><button class="profile-stat" data-list="posts"><strong>${user.post_count}</strong> posts</button><button class="profile-stat" data-list="followers" data-user="${user.id}"><strong>${user.follower_count}</strong> followers</button><button class="profile-stat" data-list="following" data-user="${user.id}"><strong>${user.following_count}</strong> following</button></div></div><h2 class="profile-posts-title"> ${isMe?'Your moments':`${C.escapeHTML(user.full_name.split(' ')[0])}'s moments`}</h2><div class="feed" id="profilePosts">${posts.length?posts.map(CPost).join(''):'<div class="empty-state"><div class="empty-icon">✧</div><strong>No posts just yet.</strong>The next great moment could start here.</div>'}</div>`;
      C.$('#editProfileBtn')?.addEventListener('click',()=>editModal(user));
      // Profile feed uses the same post actions as home.
    }catch(e){host.innerHTML=`<div class="empty-state"><strong>Profile unavailable</strong>${C.escapeHTML(e.message)}<p><button class="outline-btn" data-view="home">Back to home</button></p></div>`;}
  }
  function CPost(p){return window.Posts.postHTML(p);}
  function editModal(user){
    const modal=C.$('#modal');C.$('#modalBody').innerHTML=`<span class="eyebrow">YOUR PROFILE</span><h2>Edit your details</h2><form id="editProfileForm"><label>Full name<input name="full_name" value="${C.escapeHTML(user.full_name)}" required minlength="2" maxlength="80"></label><label>Bio<textarea name="bio" rows="4" maxlength="180" placeholder="A few words about you...">${C.escapeHTML(user.bio||'')}</textarea><small class="muted">Up to 180 characters.</small></label><button class="primary-btn" type="submit">Save changes ↗</button></form>`;
    modal.hidden=false;C.$('#editProfileForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const button=form.querySelector('button');button.disabled=true;try{const values=Object.fromEntries(new FormData(form));await C.api(`/api/users/${user.id}`,{method:'PUT',body:values});C.state.user={...C.state.user,...values};C.$('#modal').hidden=true;C.toast('Profile updated!');C.showApp();C.navigate('profile');}catch(err){C.toast(err.message,true);}finally{button.disabled=false;}});
  }
  async function loadSuggestions(full=false){await C.loadSuggestions(full);}
  document.addEventListener('click',async e=>{
    const stat=e.target.closest('[data-list]');if(stat&&stat.dataset.list!=='posts'){const id=stat.dataset.user;const type=stat.dataset.list;try{const data=await C.api(`/api/users/${id}/${type}`);const modal=C.$('#modal');C.$('#modalBody').innerHTML=`<span class="eyebrow">COMMUNITY</span><h2>${type==='followers'?'People following':'People followed by'} ${id==C.state.user.id?'you':'this user'}</h2>${data.users.length?data.users.map(u=>`<div class="person-row">${C.avatar(u,'sm')}<div class="person-info"><strong>${C.escapeHTML(u.full_name)}</strong><small class="muted">@${C.escapeHTML(u.username)}</small></div><button class="outline-btn" data-open-profile="${u.id}">Profile</button></div>`).join(''):'<p class="muted">No one here just yet.</p>'}`;modal.hidden=false;}catch(err){C.toast(err.message,true);}}
  });
  return {load,loadSuggestions};
})();
