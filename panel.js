const O = PETAVU_ENV.origins;
const items = [
  { id: "home", href: "#/home", label: "خانه" },
  { id: "biz", href: "#/biz", label: "کسب‌وکار من" },
  { id: "status", href: "#/status", label: "وضعیت انتشار" },
  { id: "account", href: "#/account", label: "حساب" },
  { id: "out", href: "#/logout", label: "خروج", out: true },
];

async function render() {
  const path = location.hash.replace("#", "") || "/login";
  if (path === "/logout") {
    await petavuData.auth.signOut();
    location.hash = "#/login";
    return;
  }
  const user = await petavuData.auth.user();
  if (path === "/signup") return viewAuth("signup");
  if (path === "/login" || !user) return viewAuth("login");
  const me = await petavuData.profile.me();
  const { data: mine } = await petavuData.businesses.mine(user.id);
  const list = mine || [];
  if (path === "/biz") return viewBiz(user, me, list);
  if (path === "/status") return viewStatus(list);
  if (path === "/account") return viewAccount(user, me);
  return viewHome(user, me, list);
}

function viewAuth(mode) {
  const signup = mode === "signup";
  petavuGate({
    image: "assets/login.jpg",
    kicker: signup ? "عضویت در شبکه" : "پنل اعضا",
    title: signup ? "حساب حرفه‌ای بسازید" : "ورود به پنل اعضا",
    lead: signup
      ? "برای پت‌شاپ، کلینیک، اصطبل، دامپزشکی، تولید و تأمین. معرفی عمومی پس از تأیید منتشر می‌شود."
      : "این پنل برای همهٔ اعضای پتاوو است. با حساب خود وارد شوید.",
    captionTitle: "سامانهٔ اعضای پتاوو",
    caption: "سگ، گربه و اسب در یک صنعت. میز کار همهٔ اعضا برای معرفی کسب‌وکار و حضور در شبکه.",
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
    if (!error && mode === "login") location.hash = "#/home";
    if (!error && mode === "signup") location.hash = "#/login";
  };
}

function viewHome(user, me, list) {
  const cards = list.length
    ? list.map((b) => `<article class="card"><h3>${b.name}</h3><p class="muted">${b.published ? "منتشرشده" : "در انتظار انتشار"} · ${b.kind} · ${b.city || ""}</p></article>`).join("")
    : `<p class="muted">هنوز کسب‌وکاری ثبت نکرده‌اید. از «کسب‌وکار من» شروع کنید.</p>`;
  petavuChrome({
    items, active: "home", still: "assets/still-home.jpg",
    kicker: "پنل اعضا",
    title: "میز کار شما",
    lead: "پت‌شاپ، کلینیک، اصطبل، دامپزشک و تأمین اینجا به هم می‌رسند.",
    body: `<p class="muted">${me?.display_name || user.email}</p><div class="grid">${cards}</div>`,
  });
}

function viewBiz(user, me, list) {
  petavuChrome({
    items, active: "biz", still: "assets/still-biz.jpg",
    kicker: "کسب‌وکار من",
    title: "معرفی در شبکه",
    lead: "نام، صنف و شهر را ثبت کنید. دیده شدن عمومی پس از تأیید است.",
    body: `<form class="stack" id="biz">
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
     <div class="grid" style="margin-top:28px">${list.map((b) => `<article class="card"><h3>${b.name}</h3><p class="muted">${b.published ? "منتشرشده" : "در انتظار"} · ${b.slug}</p></article>`).join("")}</div>`,
  });
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

function viewStatus(list) {
  const rows = list.length
    ? list.map((b) => `<article class="card"><h3>${b.name}</h3><p class="muted">${b.published ? "روی سایت دیده می‌شود." : "در صف تأیید است."}</p></article>`).join("")
    : `<p class="muted">کسب‌وکاری برای نمایش وضعیت نیست.</p>`;
  petavuChrome({
    items, active: "status", still: "assets/still-status.jpg",
    kicker: "وضعیت انتشار",
    title: "جای شما در ویترین",
    lead: "انتشار عمومی فقط پس از تأیید شبکه انجام می‌شود.",
    body: `<div class="grid">${rows}</div>`,
  });
}

function viewAccount(user, me) {
  petavuChrome({
    items, active: "account", still: "assets/still-account.jpg",
    kicker: "حساب",
    title: "ورود شما",
    lead: "همین حساب برای همهٔ اعضای صنعت است.",
    body: `<article class="card">
      <p><b>${me?.display_name || "عضو"}</b></p>
      <p class="muted" dir="ltr">${user.email}</p>
      <p class="muted">نقش: ${me?.role === "admin" ? "مدیر" : "عضو"}</p>
    </article>
    <p><a class="btn" href="${O.website}">بازگشت به سایت</a></p>`,
  });
}

window.addEventListener("hashchange", render);
render();
