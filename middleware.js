// Owners area login check.
//
// Vercel runs this on its servers before any page under /owners is sent, so
// nobody sees the owners area without the password. The password is never in
// this code: set OWNER_PASSWORD (at least 12 characters) in the Vercel project
// under Settings > Environment Variables. If it isn't set, the owners area stays
// locked for everyone.
//
// Optional: OWNER_SESSION_SECRET signs the login cookie. If it isn't set, the
// password is used, so changing the password signs everyone out.

export const config = { matcher: ['/owners', '/owners/:path*'] };

const COOKIE = 'mesh_owner';
const LOGIN = '/owners/login';
const HOME = '/owners';
const REMEMBER_SECONDS = 30 * 24 * 60 * 60; // "Keep me signed in": 30 days
const SESSION_SECONDS = 12 * 60 * 60; // otherwise: until the browser closes, at most 12 hours
const MIN_PASSWORD_LENGTH = 12;

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const password = process.env.OWNER_PASSWORD || '';

  if (password.length < MIN_PASSWORD_LENGTH) return notSetUp();

  const secret = process.env.OWNER_SESSION_SECRET || password;
  const isLogin = path === LOGIN || path === LOGIN + '.html';

  if (path === '/owners/logout') {
    return redirect(request, LOGIN + '?signed_out=1', clearCookie());
  }
  if (isLogin && request.method === 'POST') {
    return handleLogin(request, password, secret);
  }

  const signedIn = await hasValidSession(request, secret);
  if (isLogin) return signedIn ? redirect(request, HOME) : continueRequest();
  if (signedIn) return continueRequest();

  const back = url.pathname + url.search;
  return redirect(request, LOGIN + (back && back !== HOME ? '?next=' + encodeURIComponent(back) : ''));
}

// Let the request carry on to the page (same as next() from @vercel/functions).
function continueRequest() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

async function handleLogin(request, password, secret) {
  let form = null;
  try { form = await request.formData(); } catch (e) { form = null; }
  const given = form ? String(form.get('password') || '') : '';
  const remember = form ? form.get('remember') === 'on' : false;
  const next = safeNext(form ? form.get('next') : '');

  if (given && (await sameSecret(given, password))) {
    const maxAge = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
    const expires = Math.floor(Date.now() / 1000) + maxAge;
    const token = await makeToken(secret, expires);
    return redirect(request, next, sessionCookie(token, remember ? maxAge : null));
  }

  // Slow down password guessing.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const query = '?error=1' + (next !== HOME ? '&next=' + encodeURIComponent(next) : '');
  return redirect(request, LOGIN + query);
}

// Only send people back to pages inside the owners area.
function safeNext(value) {
  const next = String(value || '');
  if (!next.startsWith('/owners') || next.includes('//') || next.includes('\\')) return HOME;
  if (next.startsWith(LOGIN) || next.startsWith('/owners/logout')) return HOME;
  return next;
}

function redirect(request, location, cookie) {
  const headers = new Headers({ Location: new URL(location, request.url).toString(), 'Cache-Control': 'no-store' });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

function sessionCookie(token, maxAge) {
  const parts = [`${COOKIE}=${token}`, 'Path=/owners', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

function clearCookie() {
  return `${COOKIE}=; Path=/owners; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function notSetUp() {
  const body = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Owners area</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1420;color:#eef2f7;font:16px/1.6 system-ui,sans-serif;padding:24px">
<main style="max-width:440px"><h1 style="font-size:1.4rem">The owners area is locked</h1>
<p style="color:#a5afbf">It hasn't been switched on yet. The site owner needs to add an <strong>OWNER_PASSWORD</strong> of at least ${MIN_PASSWORD_LENGTH} characters in the Vercel project settings, then redeploy.</p>
<p><a href="/" style="color:#8fbde8">Back to the website</a></p></main></body></html>`;
  return new Response(body, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

// --- Signed login tokens -------------------------------------------------------

const encoder = new TextEncoder();

async function subtle() {
  if (globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto.subtle;
  const nodeCrypto = await import('node:crypto');
  return nodeCrypto.webcrypto.subtle;
}

async function hmac(secret, data) {
  const s = await subtle();
  const key = await s.importKey('raw', encoder.encode('mesh-owner-session:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await s.sign('HMAC', key, encoder.encode(data)));
  return toBase64Url(sig);
}

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(secret, expires) {
  const payload = `v1.${expires}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

async function hasValidSession(request, secret) {
  const token = readCookie(request.headers.get('cookie') || '', COOKIE);
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = await hmac(secret, `v1.${parts[1]}`);
  return constantTimeEqual(expected, parts[2]);
}

function readCookie(header, name) {
  for (const piece of header.split(';')) {
    const i = piece.indexOf('=');
    if (i > -1 && piece.slice(0, i).trim() === name) return piece.slice(i + 1).trim();
  }
  return '';
}

// Compare passwords without leaking how much of a guess was right.
async function sameSecret(a, b) {
  const s = await subtle();
  const [ha, hb] = await Promise.all([
    s.digest('SHA-256', encoder.encode(a)),
    s.digest('SHA-256', encoder.encode(b)),
  ]);
  return constantTimeEqual(toBase64Url(new Uint8Array(ha)), toBase64Url(new Uint8Array(hb)));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
