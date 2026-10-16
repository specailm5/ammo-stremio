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
const STREMIO_API = "https://api.strem.io/api";
const DRAMAYO = "https://dramayo.stream";
const HDHUB = "https://hdhub.thevolecitor.qzz.io";
const FLIX = "https://free.flixnest.app";
const OPENSUBS = "https://opensubtitlesv3-pro.dexter21767.com";

const STORE_STEPS = "ammo.steps";
const STORE_THEME = "ammo.theme";
const STORE_INSTALL = "ammo.installId";

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
  Dramayo puts the whole configuration in the path as JSON, and its own page encodes
  that JSON with btoa. The install id it stores is per browser, so ours is generated
  once and kept, which keeps the upstream's install count honest without a server.

  A base64 payload can hold "/" and "+", and either one inside a path would break the
  link. Neither can appear here: a "/" needs a byte of 0x3F or 0x7F and a "+" needs
  0x3E or 0x7E, and the characters this JSON can contain are letters, digits and
  - _ : , [ ] { } ". Adding a catalog whose id holds "~" or "?" would end that, so a
  new catalog id has to be checked against the fetched manifest before it ships.
*/
const DRAMAYO_CATALOGS = [
  "dramayo-discover",
  "dramayo-discover-movies",
  "dramayo-korean",
  "dramayo-chinese",
  "dramayo-japanese",
  "dramayo-thai",
  "dramayo-taiwanese",
  "dramayo-filipino",
  "dramayo-hongkong",
  "dramayo-korean-movies",
  "dramayo-chinese-movies",
  "dramayo-japanese-movies",
  "dramayo-thai-movies",
  "dramayo-taiwanese-movies",
  "dramayo-filipino-movies",
  "dramayo-hongkong-movies",
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
      "<bdi dir=\"ltr\">HBO Max</bdi>، أفلام ومسلسلات.",
    proof: "10 boards, fetched 2026-10-16",
    ready: true,
    url: () => `${CATALOGS}/manifest.json`,
  },
  {
    id: "dramayo",
    name: "Dramayo",
    gives: "مسلسلات آسيوية مترجمة: كوري وصيني وياباني وتايلندي.",
    proof: "16 boards; asking for 2 of them returned 4, so the field is honoured, 2026-10-16",
    ready: true,
    url: () => `${DRAMAYO}/${encodeConfig(dramayoConfig())}/manifest.json`,
  },
  {
    id: "hdhub",
    name: "HdHub",
    gives: "مصادر تشاهد منها الأفلام والمسلسلات.",
    proof: "4 boards; qualities=2160p returned 4KHDHub 4K and qualities=480p returned HdHub 480p, 2026-10-16",
    ready: true,
    url: () => `${HDHUB}/${encodeConfig(hdhubConfig())}/manifest.json`,
  },
  {
    id: "flix",
    name: "Flix-Streams",
    gives:
      "مصادر زيادة، وفيها صفوف قنوات مباشرة. ويمكن يجيك نفس الملف مرتين.",
    proof: "the bare url returns the same 8 streams and 40 live events as the publisher's own default blob, 2026-10-16",
    ready: true,
    url: () => `${FLIX}/manifest.json`,
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
    proof: "43 Arabic subtitles under langs=[arabic]; the bare url answers 500, 2026-10-16",
    ready: true,
    url: () => `${OPENSUBS}/${encodeConfig(opensubsConfig())}/manifest.json`,
  },
  {
    id: "pengu",
    name: "PenguPlay",
    gives: "مصادر سريعة، وتبي لها رمز خاص لك.",
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

/*
  Captured from each addon's own configure page on 2026-10-16 and proved by fetching
  the resulting manifest. The encodings differ per project, so each one is built the
  way its own page builds it:

  Dramayo    btoa(JSON), install id generated once per browser.
  HdHub      unpadded url-safe base64, which is what encodeConfig already emits.
  Flix       base64 of zlib-compressed JSON, but its bare url behaves the same as its
             own default blob, so there is nothing to encode and no schema to pin.
  OpenSubs   standard base64, the code that writes the manifest url is Buffer.from(...)
             .toString("base64"), and this payload carries no "+" or "/" or padding,
             so encodeConfig emits the identical string.
*/
function installId() {
  const saved = store.get(STORE_INSTALL, "");
  if (saved) return saved;
  const fresh =
    window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  store.set(STORE_INSTALL, fresh);
  return fresh;
}

function dramayoConfig() {
  return {
    installId: installId(),
    enabledCatalogs: DRAMAYO_CATALOGS,
    /*
      Both filters stay as the upstream ships them. Hiding NSFW is a content decision,
      not a technical one, so it is left to the addon's own default rather than made
      here on the reader's behalf.
    */
    hideAnime: false,
    hideNsfw: false,
  };
}

function hdhubConfig() {
  /* torbox empty means no debrid key, which is the point: one click, nothing to paste. */
  return { torbox: "", qualities: "all", sort: "desc", catalogs: "featured,popular" };
}

function opensubsConfig() {
  /* source and aiTranslated change nothing for Arabic, so they stay at upstream defaults. */
  return { langs: ["arabic"], source: "all", aiTranslated: true, autoAdjustment: false };
}

/*
 * A Stremio deep link is the manifest URL with the scheme swapped and nothing else:
 * https://host/path/manifest.json becomes stremio://host/path/manifest.json
 * (stremio-addon-sdk/docs/deep-links.md).
 *
 * The "stremio://install?url=..." form that some SDK examples print is not understood
 * by the desktop shell: it reads "install" as the host, builds https://install/, and
 * reports "Failed to fetch". Confirmed on Stremio 5 for Windows.
 */
function installLink(url) {
  return url.replace(/^https?:\/\//, "stremio://");
}

/*
  A key copied out of a browser console arrives wrapped in the quote marks the console puts
  around a returned string, and a paste can carry spaces on either side. Both are removed
  here, so the reader never has to tidy the value by hand. Curly quotes are included because
  a phone keyboard can convert straight ones on its way in.
*/
const KEY_QUOTES = ["'", '"', "`", "\u2018", "\u2019", "\u201c", "\u201d"];

function cleanAuthKey(value) {
  let key = String(value == null ? "" : value).trim();
  /* Two passes, so a value wrapped twice, as a console can echo it, still comes out clean. */
  for (let pass = 0; pass < 2; pass += 1) {
    if (KEY_QUOTES.includes(key[0])) key = key.slice(1).trim();
    if (KEY_QUOTES.includes(key[key.length - 1])) key = key.slice(0, -1).trim();
  }
  return key;
}

/*
  The bulk path is the only part of this page that sends anything anywhere. It talks to
  Stremio's own API and to nothing else. The three calls, and the descriptor shape below
  them, are taken from Stremio's own client (stremio-api-client/apiClient.js):

    login              { email, password }                -> { authKey, user }
    addonCollectionGet { authKey, update, addFromURL }     -> { addons, lastModified }
    addonCollectionSet { authKey, addons }

  An entry in that collection is { transportUrl, manifest, flags }, which is also the
  shape a real signed-in profile holds on disk.

  Two properties matter more than the calls. Nothing is persisted: the password and the
  auth key live in one argument object for the length of one request and are never
  written to storage. And the collection is merged, never replaced, so an addon that is
  already there is left exactly as its owner configured it, and nothing can be removed.
*/
function loginMessage(error) {
  const text = String((error && error.message) || error || "");
  const key = " وإذا حسابك على فيسبوك أو آبل، استعمل مفتاح الدخول اللي تحت.";
  if (/user not found/i.test(text)) {
    return "ما فيه حساب في ستريميو بهالإيميل." + key;
  }
  if (/passphrase|password|incorrect|invalid/i.test(text)) {
    return "الإيميل أو كلمة المرور غلط." + key;
  }
  if (/facebook|apple|oauth|token|third/i.test(text)) {
    return "هالحساب ما يدخل بكلمة مرور. افتح الخيار اللي تحت، والصق مفتاح الدخول.";
  }
  return `ستريميو ما قبل الدخول: ${text}`;
}

function sessionMessage(error) {
  const text = String((error && error.message) || error || "");
  if (/session does not exist|expired|invalid/i.test(text)) {
    return "مفتاح الدخول غلط، أو انتهت صلاحيته. انسخه من جديد.";
  }
  return `ما قدرنا نقرا إضافاتك: ${text}`;
}

async function stremio(method, params, requireResult = true) {
  let response;
  try {
    response = await fetch(`${STREMIO_API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (error) {
    throw new Error("ما قدرنا نوصل لستريميو. شيّك على اتصالك وجرّب مرة ثانية.");
  }
  if (!response.ok) throw new Error(`ستريميو رد بخطأ ${response.status}.`);
  let body;
  try {
    body = await response.json();
  } catch (error) {
    throw new Error("ما فهمنا رد ستريميو.");
  }
  if (body.error) throw new Error(body.error.message || "ستريميو رفض الطلب.");
  if (requireResult && !body.result) throw new Error("ما وصل رد من ستريميو.");
  return body.result;
}

async function bulkAdd({ steps, credentials, onStatus }) {
  let authKey = (credentials.authKey || "").trim();
  if (!authKey) {
    onStatus("نتأكد من حسابك في ستريميو…");
    let login;
    try {
      login = await stremio("login", {
        email: (credentials.email || "").trim(),
        password: credentials.password || "",
      });
    } catch (error) {
      throw new Error(loginMessage(error));
    }
    if (!login || !login.authKey) {
      throw new Error("ستريميو ما أرسل مفتاح الدخول. تأكد من الإيميل وكلمة المرور.");
    }
    authKey = login.authKey;
  }

  onStatus("نقرا إضافاتك الحالية…");
  let collection;
  try {
    collection = await stremio("addonCollectionGet", {
      authKey,
      update: true,
      addFromURL: [],
    });
  } catch (error) {
    throw new Error(sessionMessage(error));
  }
  const existing = Array.isArray(collection.addons) ? collection.addons : [];
  const haveIds = new Set(existing.map((item) => (item.manifest || {}).id).filter(Boolean));
  const haveUrls = new Set(existing.map((item) => item.transportUrl).filter(Boolean));

  const added = [];
  const skipped = [];
  const failed = [];
  const descriptors = [];

  for (const [index, step] of steps.entries()) {
    if (haveUrls.has(step.url)) {
      skipped.push({ name: step.name, why: "موجودة عندك" });
      continue;
    }
    onStatus(`نقرا إعدادات ${step.name} (${index + 1} من ${steps.length})…`);
    let manifest;
    try {
      const response = await fetch(step.url);
      if (!response.ok) throw new Error(String(response.status));
      manifest = await response.json();
    } catch (error) {
      failed.push({ name: step.name, why: "ما قدرنا نقرا إعداداتها" });
      continue;
    }
    if (!manifest || !manifest.id) {
      failed.push({ name: step.name, why: "ردها غير مفهوم" });
      continue;
    }
    if (haveIds.has(manifest.id)) {
      skipped.push({ name: step.name, why: "عندك بإعداداتك" });
      continue;
    }
    descriptors.push({
      transportUrl: step.url,
      manifest,
      flags: { official: false, protected: false },
    });
    added.push({ name: step.name });
  }

  if (descriptors.length) {
    onStatus("نكتبها في حسابك…");
    await stremio(
      "addonCollectionSet",
      { authKey, addons: existing.concat(descriptors) },
      false,
    );
  }

  authKey = "";
  return { added, skipped, failed };
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
      <a class="btn btn-primary" data-install>أضفها لستريميو</a>
      <button class="btn btn-quiet" type="button" data-copy>انسخ الرابط</button>
      <button class="btn btn-mark" type="button" aria-pressed="false" data-mark>أضفتها</button>
    </div>
    <div class="step-fallback"></div>`;
}

function tokenMarkup() {
  return `
    <p class="token-intro">
      هذي الإضافة لحالها تبي لها رمز، وتعطيك إياه قناة <bdi dir="ltr">PenguPlay</bdi> على
      تيليجرام، وببلاش.
    </p>
    <ol class="mini">
      <li>افتح محادثة البوت في تيليجرام: <a href="${BOT_URL}" rel="noopener">افتح البوت</a></li>
      <li>أرسل له الأمر <code dir="ltr">/token</code></li>
      <li>بيجيك رمز. انسخه.</li>
      <li>الصقه في الحقل اللي تحت.</li>
    </ol>
    <figure class="qr">
      <img src="assets/penguplay-qr.png" width="444" height="444" decoding="async"
           alt="رمز QR يفتح محادثة PenguPlayBot في تيليجرام">
      <figcaption>
        أو امسح هالرمز بكاميرا جوالك.
      </figcaption>
    </figure>
    <div class="field">
      <label for="token">الرمز</label>
      <input id="token" type="text" autocomplete="off" autocapitalize="off" autocorrect="off"
             spellcheck="false" placeholder="الصق الرمز هنا">
      <p class="hint" data-hint>ما لصقت رمز للحين.</p>
    </div>
    <p class="privacy">ما نرسل رمزك لأي جهة.</p>
    <p class="fallback-line">
      إذا البوت ما رد، ادخل سيرفر <bdi dir="ltr">PenguPlay</bdi> على ديسكورد، واكتب
      نفس الأمر هناك: <a href="${DISCORD_URL}" rel="noopener">سيرفر ديسكورد</a>
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
      `<p class="pending">ما جهّزنا إعدادات هذي الإضافة للحين.</p>`;
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

  const extra = document.getElementById("bulk-extra");

  const pengu = UPSTREAMS.find((step) => step.token);
  const penguCard = () => list.querySelector(`[data-id="${pengu.id}"]`);

  function urlFor(step) {
    if (!step.url) return null;
    return step.url(step.token ? token : undefined);
  }

  function render() {
    track.style.width = `${(done.size / total) * 100}%`;
    progress.textContent = done.size === 0 ? "ما أضفت شي للحين." : `أضفت ${done.size} من ${total}.`;
    /* Once a token is typed, the shortcut carries that addon too, so the note stops applying. */
    extra.hidden = Boolean(token.trim());

    for (const card of list.children) {
      const step = UPSTREAMS.find((item) => item.id === card.dataset.id);
      const marked = done.has(step.id);
      const install = card.querySelector("[data-install]");
      const mark = card.querySelector("[data-mark]");
      const url = urlFor(step);

      card.classList.toggle("is-done", marked);
      mark.setAttribute("aria-pressed", String(marked));
      mark.textContent = marked ? "خلصت" : "أضفتها";

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
      hint.textContent = "ما لصقت رمز للحين، والزر يشتغل بعد اللصق.";
      hint.classList.remove("is-warning");
    } else if (trimmed.length < 20) {
      hint.textContent = "الرمز أقصر من العادة، تأكد إنك نسخته كامل.";
      hint.classList.add("is-warning");
    } else {
      hint.textContent = "الرمز يطول عادة، تأكد إنك نسخته كامل.";
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
      button.textContent = "نسخناه";
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

  /*
    The bulk form. The password and the auth key are read here, passed straight into one
    request, and then the fields are cleared whether the attempt worked or not. Neither
    value is put in storage, in the URL, or in the page's own output.
  */
  const bulkForm = document.getElementById("bulk-form");
  if (bulkForm) {
    const emailField = document.getElementById("bulk-email");
    const passwordField = document.getElementById("bulk-password");
    const keyField = document.getElementById("bulk-key");
    const runButton = document.getElementById("bulk-run");
    const status = document.getElementById("bulk-status");
    const result = document.getElementById("bulk-result");
    const hint = document.querySelector("[data-bulk-hint]");

    bulkForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const authKey = cleanAuthKey(keyField.value);
      const email = emailField.value.trim();
      const password = passwordField.value;

      /*
        The snippet prints "undefined" when the profile has no auth key yet, and a reader who
        pastes that back deserves the real reason rather than a generic rejection.
      */
      if (authKey === "undefined" || authKey === "null") {
        hint.textContent =
          "اللي لصقته مو مفتاح. تأكد إنك مسجّل دخول في web.stremio.com.";
        hint.classList.add("is-warning");
        return;
      }

      if (!authKey && (!email || !password)) {
        hint.textContent = "يبي لها إيميلك وكلمة المرور، أو مفتاح الدخول لحاله.";
        hint.classList.add("is-warning");
        return;
      }
      hint.classList.remove("is-warning");

      const steps = UPSTREAMS.map((step) => ({
        id: step.id,
        name: step.name,
        url: urlFor(step),
      })).filter((step) => step.url);

      runButton.disabled = true;
      result.hidden = true;
      result.replaceChildren();
      status.textContent = "";

      try {
        const outcome = await bulkAdd({
          steps,
          credentials: { email, password, authKey },
          onStatus: (text) => {
            status.textContent = text;
          },
        });

        passwordField.value = "";
        keyField.value = "";

        for (const step of steps) {
          const broke = outcome.failed.some((item) => item.name === step.name);
          if (!broke) done.add(step.id);
        }
        store.set(STORE_STEPS, [...done]);
        render();

        const lines = [];
        if (outcome.added.length) {
          lines.push(`أضفنا: ${outcome.added.map((item) => item.name).join("، ")}.`);
        }
        if (outcome.skipped.length) {
          lines.push(
            `خلّيناها مثل ما هي: ${outcome.skipped
              .map((item) => `${item.name} (${item.why})`)
              .join("، ")}.`,
          );
        }
        if (outcome.failed.length) {
          lines.push(
            `ما ضبطت: ${outcome.failed
              .map((item) => `${item.name} (${item.why})`)
              .join("، ")}.`,
          );
        }
        for (const line of lines) {
          const item = document.createElement("li");
          item.textContent = line;
          result.appendChild(item);
        }
        result.hidden = lines.length === 0;

        if (outcome.added.length) {
          status.textContent = "تم. افتح ستريميو وتلقاها في «إضافاتي».";
        } else if (outcome.failed.length) {
          status.textContent = "ما كملت. جرّب بعد شوي.";
        } else if (outcome.skipped.length) {
          status.textContent = "كلها عندك، وما غيّرنا شي.";
        } else {
          status.textContent = "ما لقينا شي نضيفه.";
        }
      } catch (error) {
        passwordField.value = "";
        status.textContent = error.message;
      } finally {
        runButton.disabled = false;
      }
    });

    /*
      The snippet is read back out of the page instead of being repeated here, so the copy
      button can never hand out a different line than the one on screen.
    */
    const keySnippet = document.querySelector(".bulk-alt .snippet");
    const copyKeyButton = document.querySelector("[data-copy-key]");
    if (keySnippet && copyKeyButton) {
      copyKeyButton.addEventListener("click", async () => {
        if (await copyText(keySnippet.textContent.trim())) {
          const original = copyKeyButton.textContent;
          copyKeyButton.textContent = "نسخناه";
          setTimeout(() => {
            copyKeyButton.textContent = original;
          }, 1600);
          return;
        }
        /* No clipboard access here, so leave the line selected for a manual copy. */
        try {
          const range = document.createRange();
          range.selectNodeContents(keySnippet);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          /* Nothing left to offer, and the line stays readable either way. */
        }
      });
    }

    document.getElementById("bulk-extra-go").addEventListener("click", () => {
      const card = penguCard();
      if (!card) return;
      /*
        block "start" rather than "center": the card is taller than a phone viewport, so
        the reader needs its name and its first step, not its middle.
      */
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      const field = card.querySelector("#token");
      if (field) field.focus({ preventScroll: true });
    });
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

  /* Sign-in is the first choice now, so the one button on the hero lands there. */
  document.getElementById("start").addEventListener("click", () => {
    const heading = document.getElementById("bulk-heading");
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
