window.Auth = (() => {
  const C = window.Connectify;
  function setMode(mode) {
    C.$('#loginForm').hidden = mode !== 'login'; C.$('#registerForm').hidden = mode !== 'register';
    C.$$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.auth === mode));
  }
  C.$('#loginFormEl').addEventListener('submit', async e => {
    e.preventDefault(); const form=e.currentTarget; const button=form.querySelector('button[type=submit]'); button.disabled=true;
    const values=Object.fromEntries(new FormData(form));
    try { const data=await C.api('/api/auth/login',{method:'POST',body:values}); C.state.user=data.user; C.showApp(); C.toast(`Welcome back, ${data.user.full_name.split(' ')[0]}!`); form.reset(); }
    catch(err){C.toast(err.message,true);} finally{button.disabled=false;}
  });
  C.$('#registerFormEl').addEventListener('submit', async e => {
    e.preventDefault(); const form=e.currentTarget; const button=form.querySelector('button[type=submit]'); button.disabled=true;
    const values=Object.fromEntries(new FormData(form));
    try { const data=await C.api('/api/auth/register',{method:'POST',body:values}); C.state.user=data.user; C.showApp(); C.toast('Welcome to Connectify!'); form.reset(); }
    catch(err){C.toast(err.message,true);} finally{button.disabled=false;}
  });
  return { setMode };
})();
