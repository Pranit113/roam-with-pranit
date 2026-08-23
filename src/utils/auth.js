// ─── Auth Utility ─────────────────────────────────────────────────────────────
// Simple email+password auth stored in localStorage
// Per-user data isolation via email-keyed storage
// ─────────────────────────────────────────────────────────────────────────────

const USERS_KEY   = 'tl_users';
const SESSION_KEY = 'tl_session';

/* Very simple obfuscation — sufficient for localStorage demo app.
   For production, use Firebase Auth or bcrypt server-side. */
function hashPw(pw) {
  return btoa(unescape(encodeURIComponent(pw + '__tl_salt_v1')));
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

// ─── Session ──────────────────────────────────────────────────────────────────
export function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export function signUp(name, email, password) {
  const trimName  = (name  || '').trim();
  const trimEmail = (email || '').toLowerCase().trim();

  if (!trimName)              return { error: 'Please enter your name.' };
  if (!trimEmail.includes('@'))return { error: 'Enter a valid email address.' };
  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters.' };

  const users = getUsers();
  if (users[trimEmail]) return { error: 'Account already exists. Please sign in.' };

  const user = {
    name: trimName,
    email: trimEmail,
    passwordHash: hashPw(password),
    createdAt: new Date().toISOString(),
  };
  users[trimEmail] = user;
  saveUsers(users);

  const session = { name: user.name, email: user.email };
  setSession(session);
  return { user: session };
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export function signIn(email, password) {
  const trimEmail = (email || '').toLowerCase().trim();

  // Demo account
  if (trimEmail === 'demo@travel.com' && password === 'demo123') {
    const demo = { name: 'Demo User', email: 'demo@travel.com' };
    setSession(demo);
    return { user: demo };
  }

  const users = getUsers();
  const user  = users[trimEmail];
  if (!user) return { error: 'No account found with this email. Please sign up.' };
  if (user.passwordHash !== hashPw(password)) return { error: 'Incorrect password. Please try again.' };

  const session = { name: user.name, email: user.email };
  setSession(session);
  return { user: session };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Per-user Storage Key Helper ──────────────────────────────────────────────
export function userKey(suffix) {
  const user = getCurrentUser();
  if (!user) return null;
  // Sanitise email for use as localStorage key segment
  const safe = user.email.replace(/[^a-zA-Z0-9]/g, '_');
  return `tl_${suffix}_${safe}`;
}
