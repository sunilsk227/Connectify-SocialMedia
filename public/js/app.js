window.Connectify = (() => {
  const state = { user: null, view: 'home', currentProfile: null, theme: localStorage.getItem('connectify-theme') || 'light', posts: [], searchTimer: null };
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const initials = name => String(name || 'U').trim().split(/\s+/).slice(0,2).map(x=>x[0] || '').join('').toUpperCase();
  const avatar = (user, size = '') => `<div class="avatar ${size}">${user && user.profile_image ? `<img src="${escapeHTML(user.profile_image)}" alt="">` : escapeHTML(initials(user && user.full_name))}</div>`;
  async function api(url, options = {}) {
    const opts = { credentials: 'same-origin', ...options, headers: { ...(options.headers || {}) } };
    if (options.body && !(options.body instanceof FormData)) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(options.body); }
    const response = await fetch(url, opts);
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  let toastTimer;
  function toast(message, error = false) {
    const el = $('#toast'); el.textContent = message; el.classList.toggle('error', error); el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function setTheme(theme) {
    state.theme = theme; document.body.classList.toggle('dark', theme === 'dark'); localStorage.setItem('connectify-theme', theme);
    const label = $('#themeToggle small'); if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
  function showAuth() { $('#authScreen').hidden = false; $('#appScreen').hidden = true; }
  function showApp() { $('#authScreen').hidden = true; $('#appScreen').hidden = false; updateUserBits(); navigate('home'); loadSuggestions(); }
  function updateUserBits() {
    if (!state.user) return;
    $('#sideName').textContent = state.user.full_name; $('#sideHandle').textContent = '@' + state.user.username;
    const a = $('#sideAvatar'); a.innerHTML = state.user.profile_image ? `<img src="${escapeHTML(state.user.profile_image)}" alt="">` : escapeHTML(initials(state.user.full_name));
    const c = $('#composerAvatar'); c.innerHTML = a.innerHTML;
  }
  function navigate(view) {
    state.view = view;
    $$('.view').forEach(el => el.hidden = true);
    const target = $(`#${view}View`); if (target) target.hidden = false;
    $$('.nav-item[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    const copy = {
      home: ['YOUR COMMUNITY', `Good to see you, ${state.user.full_name.split(' ')[0]} `, 'A little inspiration from your corner of the world.'],
      explore: ['A WORLD OF PEOPLE', 'Find your kind of people ✦', 'Every connection starts with a hello.'],
      profile: ['YOUR LITTLE CORNER', 'Your story, your space ✦', 'A collection of moments that make you, you.']
    }[view];
    $('#pageEyebrow').textContent = copy[0]; $('#pageTitle').textContent = copy[1]; $('#pageSubtitle').textContent = copy[2];
    $('#headerExplore').hidden = view === 'explore';
    if (view === 'home') window.Posts.loadFeed();
    if (view === 'profile') window.Profile.load(state.user.id);
    if (view === 'explore') window.Profile.loadSuggestions(true);
  }
  async function loadSuggestions(full = false) {
    try {
      const data = await api('/api/users/search?q=');
      // Empty search intentionally returns no records; load a small set using broad search below.
      const found = await api('/api/users/search?q=a');
      const people = found.users.filter(u => u.id !== state.user.id).slice(0, 5);
      renderSuggestions(people);
      if (full && !$('#userSearch').value) renderExplorePeople(people);
    } catch (_) {}
  }
  function renderSuggestions(people) {
    const host = $('#suggestedPeople');
    if (!people.length) { host.innerHTML = '<p class="muted small">No suggestions just yet. Invite a friend to join!</p>'; return; }
    host.innerHTML = people.map(u => `<div class="suggested-person">${avatar(u,'sm')}<div class="person-info"><strong>${escapeHTML(u.full_name)}</strong><small>@${escapeHTML(u.username)}</small></div><button class="follow-mini ${u.is_following?'following':''}" data-follow="${u.id}">${u.is_following?'Following':'+ Follow'}</button></div>`).join('');
  }
  function renderExplorePeople(people) {
    const host = $('#searchResults');
    if (!people.length) { host.innerHTML = '<div class="empty-state">No people found yet.</div>'; return; }
    host.innerHTML = people.map(u => `<article class="person-card card">${avatar(u,'lg')}<h3>${escapeHTML(u.full_name)}</h3><div class="handle">@${escapeHTML(u.username)}</div><p class="bio">${escapeHTML(u.bio || 'Still writing their story…')}</p><button class="${u.is_following?'outline-btn':'primary-btn'}" data-follow="${u.id}">${u.is_following?'Following':'＋ Follow'}</button> <button class="outline-btn" data-open-profile="${u.id}">Profile</button></article>`).join('');
  }
  async function follow(id, currentlyFollowing, button) {
    try {
      const result = await api(`/api/users/${id}/follow`, { method: currentlyFollowing ? 'DELETE' : 'POST' });
      if (button) { button.textContent = result.following ? 'Following' : '+ Follow'; button.classList.toggle('following', result.following); button.classList.toggle('outline-btn', result.following); button.classList.toggle('primary-btn', !result.following); button.dataset.following = String(result.following); }
      toast(result.following ? 'You’re connected now!' : 'You unfollowed this person.');
      loadSuggestions(state.view === 'explore');
      if (state.view === 'profile' && state.currentProfile === Number(id)) window.Profile.load(Number(id));
    } catch (e) { toast(e.message, true); }
  }
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-view]'); if (nav) navigate(nav.dataset.view);
    const authTab = e.target.closest('[data-auth]'); if (authTab) window.Auth.setMode(authTab.dataset.auth);
    const followBtn = e.target.closest('[data-follow]');
    if (followBtn) { const following = followBtn.dataset.following ? followBtn.dataset.following === 'true' : followBtn.textContent.toLowerCase().includes('following'); follow(followBtn.dataset.follow, following, followBtn); }
    const openProfile = e.target.closest('[data-open-profile]'); if (openProfile) window.Profile.load(Number(openProfile.dataset.openProfile));
    const modalClose = e.target.closest('#modalClose'); if (modalClose) $('#modal').hidden = true;
  });
  $('#themeToggle').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  ['#themeAuth','#mobileTheme','#rightTheme'].forEach(sel => { const el=$(sel); if(el) el.addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark')); });
  $('#headerExplore').addEventListener('click', () => navigate('explore'));
  $('#seeAll').addEventListener('click', () => navigate('explore'));
  $('#logoutBtn').addEventListener('click', async () => { try { await api('/api/auth/logout',{method:'POST'}); state.user=null; showAuth(); toast('You’ve logged out. See you soon!'); } catch(e){toast(e.message,true);} });
  $('#userSearch').addEventListener('input', () => {
    clearTimeout(state.searchTimer); state.searchTimer = setTimeout(async () => {
      const q = $('#userSearch').value.trim(); if (!q) { loadSuggestions(true); return; }
      try { const data=await api('/api/users/search?q='+encodeURIComponent(q)); renderExplorePeople(data.users.filter(u=>u.id!==state.user.id)); }
      catch(e){toast(e.message,true);}
    }, 220);
  });
  setTheme(state.theme);
  return { state, $, $$, api, toast, escapeHTML, initials, avatar, setTheme, showAuth, showApp, navigate, loadSuggestions, renderSuggestions, renderExplorePeople, follow };
})();
window.addEventListener('DOMContentLoaded', async () => {
  try { const { user } = await Connectify.api('/api/auth/me'); if (user) { Connectify.state.user=user; Connectify.showApp(); } else Connectify.showAuth(); }
  catch (_) { Connectify.showAuth(); }
});
