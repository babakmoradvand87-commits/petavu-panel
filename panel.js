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
  petavuShell(
    mode === "signup" ? "عضویت در شبکه" : "ورود به فضای کار",
    nav(null),
    `<p class="muted">نسخهٔ ۱: ساخت حساب و ثبت کسب‌وکار. تیم، پیام و بازرگانی کامل در نسخه‌های بعد.</p>
     <form id="f">
       <input name="email" type="email" required placeholder="ایمیل" dir="ltr">
       <input name="password" type="password" required minlength="6" placeholder="رمز">
       <button class="btn" type="submit">${mode === "signup" ? "ساخت حساب" : "ورود"}</button>
       <p id="m" class="muted"></p>
     </form>`
  );
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
