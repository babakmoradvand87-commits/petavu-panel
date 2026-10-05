const O = PETAVU_ENV.origins;
const nav = (user) =>
  user
    ? `<a href="#/app">میز کار</a><a href="#/logout">خروج</a><a href="${O.website}">سایت</a>`
    : `<a href="#/login">ورود</a><a href="#/signup">عضویت</a><a href="${O.website}">سایت</a>`;

async function render() {
  const path = (location.hash.replace("#", "") || "/login");
  if (path === "/logout") {
    await petavuData.auth.signOut();
    location.hash = "#/login";
    return;
  }
  const user = await petavuData.auth.user();
  if (path === "/signup") return viewAuth("signup");
  if (path === "/login" || !user) return viewAuth("login");
  return viewApp(user);
}

function viewAuth(mode) {
  const signup = mode === "signup";
  petavuGate({
    image: "assets/login.jpg",
    kicker: signup ? "عضویت در شبکه" : "فضای کار عضو",
    title: signup ? "حساب حرفه‌ای بسازید" : "ورود به میز کار",
    lead: signup
      ? "برای پت‌شاپ، کلینیک، اصطبل، دامپزشکی، تولید و تأمین. معرفی عمومی پس از تأیید منتشر می‌شود."
      : "اینجا فضای کار عضو است — جدا از ادارهٔ شبکه. با حساب خود وارد شوید.",
    captionTitle: "سامانهٔ اعضای پتاوو",
    caption: "سگ، گربه و اسب در یک صنعت. میز کار شما برای معرفی کسب‌وکار و حضور در شبکه.",
    form: `<form id="f">
       <label>ایمیل</label>
       <input name="email" type="email" required placeholder="you@example.com" dir="ltr" autocomplete="username">
       <label>رمز عبور</label>
       <input name="password" type="password" required minlength="6" placeholder="رمز عبور" autocomplete="${signup ? "new-password" : "current-password"}">
       <button class="btn" type="submit">${signup ? "ساخت حساب" : "ورود به شبکه"}</button>
       <p id="m" class="muted"></p>
     </form>`,
    extra: signup
      ? `<p class="gate-extra">حساب دارید؟ <a href="#/login">ورود به میز کار</a></p>`
      : `<p class="gate-extra">عضو نیستید؟ <a href="#/signup">عضویت در پتاوو</a> · <a href="${O.website}">بازگشت به سایت</a></p>`,
  });
  qs("#f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const fn = mode === "signup" ? petavuData.auth.signUp : petavuData.auth.signIn;
    const { error } = await fn(String(fd.get("email")), String(fd.get("password")));
    qs("#m").className = error ? "err" : "ok";
    qs("#m").textContent = error ? error.message : mode === "signup" ? "حساب ساخته شد. وارد شوید." : "وارد شدید.";
    if (!error && mode === "login") location.hash = "#/app";
    if (!error && mode === "signup") location.hash = "#/login";
  };
}

async function viewApp(user) {
  const me = await petavuData.profile.me();
  const { data: mine } = await petavuData.businesses.mine(user.id);
  const cards = (mine || [])
    .map((b) => `<article class="card"><h3>${b.name}</h3><p class="muted">${b.published ? "منتشرشده" : "در انتظار انتشار"} · ${b.slug}</p></article>`)
    .join("") || `<p class="muted">هنوز کسب‌وکاری ثبت نکرده‌اید.</p>`;
  petavuShell(
    "میز کار",
    nav(user),
    `<p class="muted">${me?.display_name || user.email}</p>
     <form id="biz">
       <input name="name" required placeholder="نام کسب‌وکار">
       <input name="slug" required placeholder="نامک لاتین" dir="ltr">
       <select name="kind">
         <option value="clinic">کلینیک</option>
         <option value="petshop">پت‌شاپ</option>
         <option value="stable">باشگاه / اسب</option>
         <option value="manufacturer">تولیدکننده</option>
         <option value="importer">واردکننده</option>
       </select>
       <input name="city" placeholder="شهر">
       <textarea name="description" placeholder="معرفی کوتاه برای پروفایل عمومی"></textarea>
       <button class="btn">ثبت برای بررسی</button>
       <p id="m" class="muted"></p>
     </form>
     <div class="grid">${cards}</div>`
  );
  qs("#biz").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await petavuData.businesses.create({
      owner_id: user.id,
      name: String(fd.get("name")),
      slug: String(fd.get("slug")).toLowerCase(),
      kind: String(fd.get("kind")),
      city: String(fd.get("city") || ""),
      description: String(fd.get("description") || ""),
      published: false,
    });
    qs("#m").className = error ? "err" : "ok";
    qs("#m").textContent = error ? error.message : "ثبت شد. پس از تأیید مدیر روی سایت می‌آید.";
    if (!error) render();
  };
}

window.addEventListener("hashchange", render);
render();
