"use strict";

/*
  The maintenance surface of this page is the UPSTREAMS table. Everything else is
  plumbing. When an upstream rotates its config format, that table is the fix, and
  the cost of the fix is that readers have to come back to this page.

  ready: false means the curated config has not been captured and proved yet, so the
  card renders with its actions disabled. A scaffold that looks like a working install
  is worse than one that admits it is unfinished.
*/

const BOT_URL = "https://t.me/PenguPlayBot";
const DISCORD_URL = "https://discord.gg/hhBs3ezNE3";

const CATALOGS = "https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club";
const KITSU = "https://anime-kitsu.strem.fun";
const PENGU = "https://pengu.uk";

const STORE_STEPS = "ammo.steps";
const STORE_THEME = "ammo.theme";

/*
  PenguPlay's own defaults are broad, so this is the curated set: the scrapers plus
  the two aggregators. Values use the configure form's own encoding, read out of its
  buildConfig function, and the whole string is confirmed with a real token in M4.
*/
const PENGU_SOURCES = [
  "source_4khdhub",
  "source_vegamovies",
  "source_moviebox",
  "source_moviesdrives",
  "source_2peckle",
  "source_miruro",
];

/*
  Step descriptions are authored here and hold no user input, so they are injected as
  markup. Each Latin run is wrapped in bdi so a name like Disney+ does not drag the
  Arabic word after it out of order.
*/
const UPSTREAMS = [
  {
    id: "catalogs",
    name: "Streaming Catalogs",
    gives:
      "صفوف <bdi dir=\"ltr\">Netflix</bdi> و <bdi dir=\"ltr\">Disney+</bdi> و " +
      "<bdi dir=\"ltr\">Prime</bdi> و <bdi dir=\"ltr\">Apple TV+</bdi> و " +
      "<bdi dir=\"ltr\">HBO Max</bdi>، أفلاماً ومسلسلات.",
    proof: "10 boards, fetched 2026-10-16",
    ready: true,
    url: () => `${CATALOGS}/manifest.json`,
  },
  {
    id: "dramayo",
    name: "Dramayo",
    gives: "مسلسلات آسيوية مترجمة: كورية وصينية ويابانية.",
    proof: "config capture pending",
    ready: false,
  },
  {
    id: "hdhub",
    name: "HdHub",
    gives: "مصادر مشاهدة للأفلام والمسلسلات.",
    proof: "config capture pending",
    ready: false,
  },
  {
    id: "flix",
    name: "Flix-Streams",
    gives:
      "مصادر مشاهدة إضافية، وفيها صفوف قنوات مباشرة. بعض ملفاتها تتكرر مع الخطوة الثالثة، " +
      "فالملف نفسه قد يظهر مرتين.",
    proof: "config capture pending",
    ready: false,
  },
  {
    id: "kitsu",
    name: "Anime Kitsu",
    gives: "صفوف الأنمي وتفاصيله.",
    proof: "6 boards, and it has no configure page at all",
    ready: true,
    url: () => `${KITSU}/manifest.json`,
  },
  {
    id: "opensubs",
    name: "OpenSubtitles PRO",
    gives: "ترجمة عربية للأفلام والمسلسلات.",
    proof: "config capture pending",
    ready: false,
  },
  {
    id: "pengu",
    name: "PenguPlay",
    gives: "مصادر مشاهدة سريعة، وتحتاج رمزاً خاصاً بك.",
    proof: "token required, source list inferred from the configure form",
    ready: true,
    token: true,
    url: (token) =>
      token ? `${PENGU}/${encodeConfig(penguConfig(token))}/manifest.json` : null,
  },
];

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* A private-mode browser refusing storage is not worth interrupting anyone over. */
    }
  },
};

function encodeConfig(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function penguConfig(token) {
  const config = { auth_token: token };
  for (const key of PENGU_SOURCES) config[key] = "on";
  return config;
}

/* The form the SDK itself prints as its install command. Verified on a device in M3. */
function installLink(url) {
  return `stremio://install?url=${encodeURIComponent(url)}`;
}

function stepMarkup(step, number) {
  return `
    <div class="step-head">
      <span class="step-num" aria-hidden="true">${number}</span>
      <h3 class="step-name">${step.name}</h3>
    </div>
    <p class="step-gives">${step.gives}</p>
    ${step.token ? tokenMarkup() : ""}
    <div class="step-actions">
      <a class="btn btn-primary" data-install>أضِف إلى ستريميو</a>
      <button class="btn btn-quiet" type="button" data-copy>انسخ الرابط</button>
      <button class="btn btn-mark" type="button" aria-pressed="false" data-mark>أضفتها</button>
    </div>
    <div class="step-fallback"></div>`;
}

function tokenMarkup() {
  return `
    <p class="token-intro">
      هذه الإضافة وحدها تطلب رمزاً. تصدره لك قناة <bdi dir="ltr">PenguPlay</bdi> على تيليجرام،
      ولا يكلّفك شيئاً.
    </p>
    <ol class="mini">
      <li>افتح محادثة البوت في تيليجرام: <a href="${BOT_URL}" rel="noopener">افتح البوت</a></li>
      <li>أرسل إليه الأمر <code dir="ltr">/token</code></li>
      <li>سيردّ عليك برمز. انسخه.</li>
      <li>الصقه في الحقل أدناه، ثم اضغط زرّ الإضافة.</li>
    </ol>
    <figure class="qr">
      <img src="assets/penguplay-qr.png" width="444" height="444" decoding="async"
           alt="رمز QR يفتح محادثة PenguPlayBot على تيليجرام">
      <figcaption>
        أو امسح هذا الرمز بكاميرا جوالك. المسح ينفع حين تكون هذه الصفحة أمامك على التلفاز أو
        الحاسوب.
      </figcaption>
    </figure>
    <div class="field">
      <label for="token">الرمز</label>
      <input id="token" type="text" autocomplete="off" autocapitalize="off" autocorrect="off"
             spellcheck="false" placeholder="الصق الرمز هنا">
      <p class="hint" data-hint>لم تلصق رمزاً بعد.</p>
    </div>
    <p class="privacy">يبني متصفحك الرابط هنا، ولا يرسل الرمز إلى أي جهة.</p>
    <p class="fallback-line">
      إن لم يستجب البوت، فانضم إلى سيرفر <bdi dir="ltr">PenguPlay</bdi> على ديسكورد، واكتب
      الأمر نفسه فيه: <a href="${DISCORD_URL}" rel="noopener">سيرفر ديسكورد</a>
    </p>`;
}

function buildStep(step, index) {
  const card = document.createElement("li");
  card.className = "step";
  card.dataset.id = step.id;
  if (!step.ready) card.classList.add("is-pending");
  if (step.token) card.classList.add("is-token");
  card.innerHTML = stepMarkup(step, index + 1);

  if (step.token) {
    card.querySelector(".token-intro").id = `token-intro`;
    card.querySelector(".mini").setAttribute("aria-labelledby", "token-intro");
  }
  if (!step.ready) {
    card.querySelector(".step-fallback").innerHTML =
      `<p class="pending">لم نجهّز إعدادات هذه الإضافة بعد.</p>`;
  }
  return card;
}

function main() {
  const list = document.getElementById("steps");
  const track = document.getElementById("track-fill");
  const progress = document.getElementById("progress");
  const themeButton = document.getElementById("theme");
  const total = UPSTREAMS.length;
  const done = new Set(store.get(STORE_STEPS, []));

  let token = "";

  const pengu = UPSTREAMS.find((step) => step.token);
  const penguCard = () => list.querySelector(`[data-id="${pengu.id}"]`);

  function urlFor(step) {
    if (!step.url) return null;
    return step.url(step.token ? token : undefined);
  }

  function render() {
    track.style.width = `${(done.size / total) * 100}%`;
    progress.textContent = done.size === 0 ? "لم تضف شيئاً بعد." : `أضفت ${done.size} من ${total}.`;

    for (const card of list.children) {
      const step = UPSTREAMS.find((item) => item.id === card.dataset.id);
      const marked = done.has(step.id);
      const install = card.querySelector("[data-install]");
      const mark = card.querySelector("[data-mark]");
      const url = urlFor(step);

      card.classList.toggle("is-done", marked);
      mark.setAttribute("aria-pressed", String(marked));
      mark.textContent = marked ? "تمت الإضافة" : "أضفتها";

      if (url) {
        install.setAttribute("href", installLink(url));
        install.removeAttribute("aria-disabled");
        install.classList.remove("is-disabled");
      } else {
        install.removeAttribute("href");
        install.setAttribute("aria-disabled", "true");
        install.classList.add("is-disabled");
      }
      card.querySelector("[data-copy]").disabled = !url;
    }

    const card = penguCard();
    const hint = card.querySelector("[data-hint]");
    const field = card.querySelector("#token");
    const trimmed = token.trim();
    if (!trimmed) {
      hint.textContent = "لم تلصق رمزاً بعد، والزر يتفعّل بعد اللصق.";
      hint.classList.remove("is-warning");
    } else if (trimmed.length < 20) {
      hint.textContent = "الرمز أقصر من المعتاد، فتأكد أنك نسخته كاملاً.";
      hint.classList.add("is-warning");
    } else {
      hint.textContent = "يطول الرمز عادةً، فتأكد أنك نسخته كاملاً.";
      hint.classList.remove("is-warning");
    }
    if (field.value !== token) field.value = token;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* Fall through to the selectable field below. */
    }
    return false;
  }

  async function handleCopy(button, step) {
    const url = urlFor(step);
    if (!url) return;
    const card = button.closest(".step");
    if (await copyText(url)) {
      const original = button.textContent;
      button.textContent = "نُسخ";
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
      return;
    }
    /*
      Clipboard access needs a secure context, and an older Android browser may not
      have it. Showing the URL selected is the difference between a button that works
      and a button that looks broken.
    */
    let target = card.querySelector(".copy-target");
    if (!target) {
      target = document.createElement("input");
      target.className = "copy-target";
      target.readOnly = true;
      target.setAttribute("aria-label", "رابط الإضافة");
      card.querySelector(".step-fallback").appendChild(target);
    }
    target.value = url;
    target.hidden = false;
    target.focus();
    target.select();
  }

  for (const [index, step] of UPSTREAMS.entries()) {
    const card = buildStep(step, index);
    list.appendChild(card);

    card.querySelector("[data-mark]").addEventListener("click", () => {
      if (done.has(step.id)) done.delete(step.id);
      else done.add(step.id);
      store.set(STORE_STEPS, [...done]);
      render();
    });
    card.querySelector("[data-copy]").addEventListener("click", (event) => {
      handleCopy(event.currentTarget, step);
    });

    if (step.token) {
      card.querySelector("#token").addEventListener("input", (event) => {
        token = event.target.value.trim();
        render();
      });
    }
  }

  function applyTheme(mode) {
    const light = mode === "light";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    themeButton.setAttribute("aria-pressed", String(light));
    themeButton.textContent = light ? "الوضع الليلي" : "الوضع النهاري";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", light ? "#F7F6F0" : "#12130F");
  }

  themeButton.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    store.set(STORE_THEME, next);
    applyTheme(next);
  });

  document.getElementById("start").addEventListener("click", () => {
    const heading = document.getElementById("steps-heading");
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  });

  applyTheme(store.get(STORE_THEME, "dark"));
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
