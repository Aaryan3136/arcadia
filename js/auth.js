/* ═══════════════════════════════════════════════════════
   auth.js — Client-side auth logic
   Used by: login.html, signup.html, favorites.html

   What this does NOW (no backend):
   - Form validation with real-time feedback
   - Mock "auth" using localStorage (simulates logged-in state)
   - Theme toggle (same as main.js but lightweight)
   - Password visibility toggle
   - Password strength meter (signup)

   What this will do LATER (with backend):
   - Replace mockLogin() / mockSignup() with fetch() API calls
   - Handle JWT tokens or session cookies
   - Real error messages from server responses
   ═══════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────
   STORAGE KEYS — centralized so nothing is hardcoded twice
   ──────────────────────────────────────────────────────── */
const AUTH_KEYS = {
  USER: 'nexhub_user',
  THEME: 'nexhub-theme',
  FAVORITES: 'nexhub_favorites',
};


/* ────────────────────────────────────────────────────────
   AUTH STATE HELPERS
   Used across all pages to check login status.
   When backend is ready: replace getUser() with a token
   validation check against your API.
   ──────────────────────────────────────────────────────── */
const Auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEYS.USER));
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getUser();
  },

  saveUser(userData) {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
  },

  logout() {
    localStorage.removeItem(AUTH_KEYS.USER);
    window.location.href = 'index.html';
  },
};

// Expose globally so favorites.js and main.js can use it
window.Auth = Auth;


/* ────────────────────────────────────────────────────────
   VALIDATION UTILITIES
   Pure functions — no DOM side effects.
   Easy to unit test and reuse.
   ──────────────────────────────────────────────────────── */
const Validate = {
  email(val) {
    if (!val.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    return null;
  },
  username(val) {
    if (!val.trim()) return 'Username is required.';
    if (val.length < 3) return 'Username must be at least 3 characters.';
    if (val.length > 20) return 'Username must be 20 characters or fewer.';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, and underscores allowed.';
    return null;
  },
  password(val) {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters.';
    return null;
  },
  confirmPassword(val, original) {
    if (!val) return 'Please confirm your password.';
    if (val !== original) return 'Passwords do not match.';
    return null;
  },
  terms(checked) {
    if (!checked) return 'You must agree to the Terms of Service.';
    return null;
  },
};


/* ────────────────────────────────────────────────────────
   DOM HELPERS — DRY field state management
   ──────────────────────────────────────────────────────── */
function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;
  input.classList.add('error');
  input.classList.remove('success');
  error.textContent = message;
  error.classList.add('visible');
}

function setFieldSuccess(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;
  input.classList.remove('error');
  input.classList.add('success');
  error.classList.remove('visible');
}

function clearField(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) { input.classList.remove('error', 'success'); }
  if (error) { error.classList.remove('visible'); }
}


/* ────────────────────────────────────────────────────────
   PASSWORD STRENGTH METER (signup only)
   Returns 1–4 level based on complexity.
   ──────────────────────────────────────────────────────── */
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  // Map 0–5 to 1–4
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

const STRENGTH_LABELS = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };

function updateStrengthMeter(pwd) {
  const wrap = document.getElementById('pwd-strength');
  const fill = document.getElementById('pwd-strength-fill');
  const label = document.getElementById('pwd-strength-label');
  if (!wrap || !fill || !label) return;

  if (!pwd) { wrap.hidden = true; return; }

  wrap.hidden = false;
  const level = getPasswordStrength(pwd);
  fill.dataset.level = level;
  label.textContent = `Strength: ${STRENGTH_LABELS[level]}`;
}


/* ────────────────────────────────────────────────────────
   PASSWORD TOGGLE (show/hide)
   Works for both login and signup pages.
   ──────────────────────────────────────────────────────── */
function initPasswordToggle() {
  const btn = document.getElementById('pwd-toggle');
  const pwdInput = document.getElementById('password');
  const eyeShow = document.getElementById('eye-show');
  const eyeHide = document.getElementById('eye-hide');
  if (!btn || !pwdInput) return;

  btn.addEventListener('click', () => {
    const isVisible = pwdInput.type === 'text';
    pwdInput.type = isVisible ? 'password' : 'text';
    eyeShow.style.display = isVisible ? 'block' : 'none';
    eyeHide.style.display = isVisible ? 'none' : 'block';
    btn.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
  });
}


/* ────────────────────────────────────────────────────────
   THEME TOGGLE — lightweight version for auth pages
   Shares the same localStorage key as main.js.
   ──────────────────────────────────────────────────────── */
function initTheme() {
  const htmlEl = document.documentElement;
  const themeBtn = document.getElementById('theme-btn');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  if (!themeBtn) return;

  const apply = (t) => {
    htmlEl.setAttribute('data-theme', t);
    if (iconMoon) iconMoon.style.display = t === 'dark' ? 'block' : 'none';
    if (iconSun) iconSun.style.display = t === 'dark' ? 'none' : 'block';
  };

  apply(localStorage.getItem(AUTH_KEYS.THEME) || 'dark');

  themeBtn.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(AUTH_KEYS.THEME, next);
  });
}


/* ────────────────────────────────────────────────────────
   MOCK AUTH — localStorage-based (no backend yet)
   REPLACE THESE with real fetch() calls to your API.
   ──────────────────────────────────────────────────────── */
function mockLogin(email, password) {
  // In the real implementation:
  // return fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  //   .then(res => res.json())

  const existing = Auth.getUser();
  // If user previously signed up, validate against stored data
  if (existing && existing.email === email) {
    if (existing.mockPassword === password) {
      return Promise.resolve({ success: true, user: existing });
    }
    return Promise.resolve({ success: false, message: 'Incorrect password.' });
  }
  // Demo: accept any email/password combo as long as they're not empty
  // Remove this block when real backend is connected
  if (email && password) {
    const user = {
      id: Date.now().toString(),
      email: email,
      username: email.split('@')[0],
      mockPassword: password, // NEVER store real passwords — this is only for demo
      avatar: null,
      joinedAt: new Date().toISOString(),
    };
    return Promise.resolve({ success: true, user });
  }
  return Promise.resolve({ success: false, message: 'Invalid credentials.' });
}

function mockSignup(username, email, password) {
  // In the real implementation:
  // return fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) })
  //   .then(res => res.json())

  const user = {
    id: Date.now().toString(),
    email,
    username,
    mockPassword: password,
    avatar: null,
    joinedAt: new Date().toISOString(),
  };
  return Promise.resolve({ success: true, user });
}


/* ════════════════════════════════════════════════════════
   LOGIN FORM INIT
   ════════════════════════════════════════════════════════ */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const submit = document.getElementById('login-submit');
  const banner = document.getElementById('auth-error');
  const errMsg = document.getElementById('auth-error-msg');
  if (!form) return;

  // If already logged in, go home
  if (Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }

  // Real-time validation on blur
  document.getElementById('email')?.addEventListener('blur', function () {
    const err = Validate.email(this.value);
    err ? setFieldError('email', 'email-error', err) : setFieldSuccess('email', 'email-error');
  });
  document.getElementById('email')?.addEventListener('input', () => clearField('email', 'email-error'));

  document.getElementById('password')?.addEventListener('input', () => clearField('password', 'password-error'));

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate
    let hasError = false;
    const emailErr = Validate.email(email);
    if (emailErr) { setFieldError('email', 'email-error', emailErr); hasError = true; }

    const pwdErr = Validate.password(password);
    if (pwdErr) { setFieldError('password', 'password-error', pwdErr); hasError = true; }

    if (hasError) return;

    // Loading state
    submit.classList.add('loading');
    submit.textContent = 'Signing in…';
    if (banner) banner.hidden = true;

    // Call mock (replace with real API call)
    const response = await fetch(
      "https://arcadia-backend-moou.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const result = await response.json();

    submit.classList.remove('loading');
    submit.textContent = 'Sign In';

    if (response.ok) {

      Auth.saveUser(result.user);

      window.location.href = "index.html";

    } else {
      if (banner && errMsg) {
        errMsg.textContent = result.message;
        banner.hidden = false;
      }
    }
  });

  // "Forgot password" — placeholder for future implementation
  document.getElementById('forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof UI !== 'undefined') {
      UI.showToast('Password reset coming soon!', 'info');
    } else {
      UI.showToast('Password reset will be available once backend is connected.', "error");
    }
  });
}


/* ════════════════════════════════════════════════════════
   SIGNUP FORM INIT
   ════════════════════════════════════════════════════════ */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  const submit = document.getElementById('signup-submit');
  if (!form) return;

  if (Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }

  // Real-time: username
  document.getElementById('username')?.addEventListener('blur', function () {
    const err = Validate.username(this.value);
    err ? setFieldError('username', 'username-error', err) : setFieldSuccess('username', 'username-error');
  });
  document.getElementById('username')?.addEventListener('input', () => clearField('username', 'username-error'));

  // Real-time: email
  document.getElementById('email')?.addEventListener('blur', function () {
    const err = Validate.email(this.value);
    err ? setFieldError('email', 'email-error', err) : setFieldSuccess('email', 'email-error');
  });
  document.getElementById('email')?.addEventListener('input', () => clearField('email', 'email-error'));

  // Real-time: password strength
  document.getElementById('password')?.addEventListener('input', function () {
    clearField('password', 'password-error');
    updateStrengthMeter(this.value);
  });

  // Real-time: confirm password
  document.getElementById('confirm-password')?.addEventListener('input', function () {
    const pwd = document.getElementById('password')?.value;
    const err = Validate.confirmPassword(this.value, pwd);
    err ? setFieldError('confirm-password', 'confirm-error', err) : setFieldSuccess('confirm-password', 'confirm-error');
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;

    // Validate all fields
    let hasError = false;

    const uErr = Validate.username(username);
    if (uErr) { setFieldError('username', 'username-error', uErr); hasError = true; }

    const eErr = Validate.email(email);
    if (eErr) { setFieldError('email', 'email-error', eErr); hasError = true; }

    const pErr = Validate.password(password);
    if (pErr) { setFieldError('password', 'password-error', pErr); hasError = true; }

    const cErr = Validate.confirmPassword(confirm, password);
    if (cErr) { setFieldError('confirm-password', 'confirm-error', cErr); hasError = true; }

    const tErr = Validate.terms(terms);
    if (tErr) { setFieldError('terms', 'terms-error', tErr); hasError = true; }

    if (hasError) return;

    // Loading state
    submit.classList.add('loading');
    submit.textContent = 'Creating account…';

    const response = await fetch(
      "https://arcadia-backend-moou.onrender.com/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      }
    );

    const result = await response.json();
    submit.classList.remove('loading');
    submit.textContent = 'Create Free Account';

    if (response.ok) {

      Auth.saveUser({
        username,
        email
      });

      window.location.href = "index.html";

    } else {

      UI.showToast(result.message, "error");

    }
  });
}


/* ════════════════════════════════════════════════════════
   RUN ON PAGE LOAD
   ════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  if (
    window.location.pathname.includes('login') ||
    window.location.pathname.includes('signup')
  ) {
    initTheme();
  }

  initPasswordToggle();
  initLoginForm();
  initSignupForm();
});
