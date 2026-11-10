import { Hono, type Context } from "hono";
import { getBetterAuthRuntimeConfig } from "./config.js";
import { safeLocalRedirectPath } from "../accounts/redirect.js";
import {
    googleSignInButtonHtml,
    googleWebSignInConfigured,
    socialProviderScript,
} from "./social-sign-in.js";

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function privateHtml(c: Context, html: string) {
    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.html(html);
}

function shell(title: string, body: string): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#176b3a"><title>${escapeHtml(title)} — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"></head>
<body class="auth-page"><main class="auth-main"><section class="auth-card"><a class="brand" href="/" aria-label="Munch home"><img class="brand-logo" src="/brand/munch-mark.svg" alt=""><span>Munch</span></a>${body}</section></main></body></html>`;
}

function authScript(): string {
    return `<script>
const page=document.querySelector('[data-auth-page]');
const returnTo=page?.dataset.returnTo||'/app';
const oauthQuery=page?.dataset.oauthQuery||'';
const message=document.getElementById('auth-message');
function showMessage(value, error=false){message.textContent=value;message.dataset.error=error?'true':'false';}
function nextLocation(){
  if(!oauthQuery)return returnTo;
  const query=new URLSearchParams(oauthQuery);
  const clientId=query.get('client_id');
  const scope=query.get('scope');
  if(!clientId||!scope)return '/connect/error';
  const consent=new URL('/connect/consent',location.origin);
  consent.searchParams.set('client_id',clientId);
  consent.searchParams.set('scope',scope);
  consent.searchParams.set('oauth_query',oauthQuery);
  return consent.toString();
}
async function postJson(path,body){
  const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(body)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.message||result.error||'The request could not be completed.');
  return result;
}
document.getElementById('password-sign-in')?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const identifier=String(data.get('identifier')||'').trim();
  showMessage('Signing in…');
  try{
    const body={password:String(data.get('password')||''),rememberMe:false,callbackURL:'/app'};
    const path=identifier.includes('@')?'/api/auth/sign-in/email':'/api/auth/sign-in/username';
    body[identifier.includes('@')?'email':'username']=identifier;
    await postJson(path,body);
    location.href=nextLocation();
  }catch(error){showMessage(error.message||'The supplied credentials were not accepted.',true);}
});
document.getElementById('password-sign-up')?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  showMessage('Creating your account…');
  try{
    await postJson('/api/auth/sign-up/email',{name:String(data.get('name')||''),email:String(data.get('email')||''),username:String(data.get('username')||''),password:String(data.get('password')||''),callbackURL:'/account/password?verified=1'});
    showMessage('Account created. Check your email to verify it, then sign in here.');
    event.currentTarget.reset();
  }catch(error){showMessage(error.message||'The account could not be created.',true);}
});
document.getElementById('password-reset-request')?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  showMessage('Sending reset instructions…');
  try{
    await postJson('/api/auth/request-password-reset',{email:String(data.get('email')||''),redirectTo:location.origin+'/account/password/reset'});
    showMessage('If that email belongs to Munch, reset instructions are on the way.');
    event.currentTarget.reset();
  }catch(error){showMessage(error.message||'The reset request could not be completed.',true);}
});
document.getElementById('password-reset')?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const token=new URLSearchParams(location.search).get('token');
  const data=new FormData(event.currentTarget);
  showMessage('Saving your new password…');
  try{
    await postJson('/api/auth/reset-password',{token,newPassword:String(data.get('password')||'')});
    location.href='/account/password?reset=1';
  }catch(error){showMessage(error.message||'The password could not be reset.',true);}
});
const params=new URLSearchParams(location.search);
if(params.get('verified'))showMessage('Your email is verified. Sign in with your new credentials.');
if(params.get('reset'))showMessage('Your password was reset. Sign in with the new password.');
</script>`;
}

function passwordPage(input: {
    returnTo: string;
    oauthQuery: string;
    publicSignup: boolean;
    googleConfigured: boolean;
}): string {
    // Same configured-gated Google control as the connect shell's sign-in
    // page: this page is the other surface a web user signs in from.
    const googleBlock = input.googleConfigured
        ? `<div class="auth-social">${googleSignInButtonHtml({ callbackURL: input.returnTo, errorCallbackURL: "/connect/error", oauthQuery: input.oauthQuery || undefined })}${socialProviderScript()}</div><p class="auth-divider" aria-hidden="true"><span>or</span></p>`
        : "";
    const signup = input.publicSignup
        ? `<section class="auth-panel"><h2>Create an account</h2><p>Use a username, email, and password. We will verify your email before the first password sign-in.</p><form id="password-sign-up" class="auth-form"><label class="field" for="name"><span>Name</span><input id="name" name="name" autocomplete="name" required maxlength="120"></label><label class="field" for="signup-email"><span>Email address</span><input id="signup-email" name="email" type="email" autocomplete="email" required maxlength="320"></label><label class="field" for="username"><span>Username</span><input id="username" name="username" autocomplete="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9_.]+"></label><label class="field" for="signup-password"><span>Password</span><input id="signup-password" name="password" type="password" autocomplete="new-password" required minlength="16" maxlength="128"></label><button class="button button-secondary" type="submit">Create account</button></form></section>`
        : `<p class="auth-footnote">New password accounts are currently created through a controlled provisioning flow. Use magic-link sign-in if you do not already have credentials.</p>`;

    const returnTo = escapeHtml(input.returnTo);
    const oauthQuery = escapeHtml(input.oauthQuery);
    return shell(
        "Password sign in",
        `<div data-auth-page data-return-to="${returnTo}" data-oauth-query="${oauthQuery}"><p class="section-kicker spacer-top">Account access</p><h1>Use a username and password</h1><p>Sign in with an existing Munch email or username and password.</p><p id="auth-message" class="message-bar" role="status"></p>${googleBlock}<form id="password-sign-in" class="auth-form"><label class="field" for="identifier"><span>Username or email</span><input id="identifier" name="identifier" autocomplete="username" required maxlength="320"></label><label class="field" for="password"><span>Password</span><input id="password" name="password" type="password" autocomplete="current-password" required minlength="16" maxlength="128"></label><button class="button button-primary" type="submit">Sign in</button></form><p class="auth-footnote"><a href="/account/password/reset">Forgot your password?</a></p></div>${signup}${authScript()}`,
    );
}

function resetRequestPage(): string {
    return shell(
        "Reset password",
        `<p class="section-kicker spacer-top">Account access</p><h1>Reset your password</h1><p>Enter your Munch email and we will send a reset link if the account exists.</p><p id="auth-message" class="message-bar" role="status"></p><form id="password-reset-request" class="auth-form"><label class="field" for="reset-email"><span>Email address</span><input id="reset-email" name="email" type="email" autocomplete="email" required maxlength="320"></label><button class="button button-primary" type="submit">Send reset link</button></form><p class="auth-footnote"><a href="/account/password">Back to sign in</a></p>${authScript()}`,
    );
}

function resetPage(): string {
    return shell(
        "Choose a new password",
        `<p class="section-kicker spacer-top">Account access</p><h1>Choose a new password</h1><p>Use a password of at least 16 characters.</p><p id="auth-message" class="message-bar" role="status"></p><form id="password-reset" class="auth-form"><label class="field" for="reset-password"><span>New password</span><input id="reset-password" name="password" type="password" autocomplete="new-password" required minlength="16" maxlength="128"></label><button class="button button-primary" type="submit">Save password</button></form>${authScript()}`,
    );
}

export function createPasswordRouter(): Hono {
    const router = new Hono();
    router.get("/account/password", (c) =>
        privateHtml(
            c,
            passwordPage({
                returnTo: safeLocalRedirectPath(
                    c.req.query("return_to"),
                    "/app",
                ),
                oauthQuery: c.req.query("oauth_query") ?? "",
                publicSignup: getBetterAuthRuntimeConfig().publicPasswordSignup,
                googleConfigured: googleWebSignInConfigured(
                    getBetterAuthRuntimeConfig(),
                ),
            }),
        ),
    );
    router.get("/account/password/reset", (c) =>
        privateHtml(c, c.req.query("token") ? resetPage() : resetRequestPage()),
    );
    return router;
}
