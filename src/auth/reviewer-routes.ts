import { Hono } from "hono";

function reviewerSignInPage(): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Munch reviewer sign in</title>
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="auth-page">
<main class="auth-main">
<section class="auth-card">
<a class="brand" href="/"><img class="brand-logo" src="/brand/munch-mark.svg" alt=""><span>Munch</span></a>
<p class="section-kicker spacer-top">Marketplace review</p>
<h1>Reviewer sign in</h1>
<p>Use the pre-provisioned reviewer credentials supplied with the Munch submission. Public password registration is disabled.</p>
<p id="reviewer-message" class="message-bar" role="status"></p>
<form id="reviewer-sign-in" class="auth-form">
<div class="field"><label for="reviewer-email">Email</label><input id="reviewer-email" name="email" type="email" autocomplete="username" required maxlength="320"></div>
<div class="field"><label for="reviewer-password">Password</label><input id="reviewer-password" name="password" type="password" autocomplete="current-password" required minlength="16" maxlength="128"></div>
<button class="button button-primary" type="submit">Sign in</button>
</form>
<p class="auth-footnote"><a href="/connect/sign-in">Use ordinary passwordless sign in</a></p>
</section>
</main>
<script>
const form=document.getElementById('reviewer-sign-in');
const message=document.getElementById('reviewer-message');
form.addEventListener('submit',async(event)=>{event.preventDefault();message.textContent='Signing in…';const data=new FormData(form);try{const response=await fetch('/api/auth/sign-in/email',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({email:data.get('email'),password:data.get('password'),rememberMe:false,callbackURL:'/account/portal'})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.message||result.error||'Sign-in failed');location.href='/account/portal'}catch(error){message.textContent='The supplied reviewer credentials were not accepted.'}});
</script>
</body>
</html>`;
}

export function createReviewerRouter(): Hono {
    const router = new Hono();
    router.get("/review/sign-in", (c) =>
        c.html(reviewerSignInPage(), 200, {
            "Cache-Control": "private, no-store",
            Pragma: "no-cache",
            "X-Robots-Tag": "noindex, nofollow",
        }),
    );
    return router;
}
