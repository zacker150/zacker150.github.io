let profiles = [];

const deck = document.getElementById("deck");
const counter = document.getElementById("counter");
const actions = document.getElementById("actions");
let current = 0;
let votes = [];
let dragging = false;
let startX = 0;
let startY = 0;

const workIcons = {
  "Kindling": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_00.webp",
  "Watering": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_01.webp",
  "Planting": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_02.webp",
  "Generating Electricity": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_03.webp",
  "Handiwork": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_04.webp",
  "Gathering": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_05.webp",
  "Lumbering": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_06.webp",
  "Mining": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_07.webp",
  "Medicine Production": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_08.webp",
  "Cooling": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_10.webp",
  "Transporting": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_11.webp",
  "Farming": "https://cdn.paldb.cc/image/Pal/Texture/UI/InGame/T_icon_palwork_12.webp"
};

function workSuitabilityMarkup(profile) {
  const suitabilities = profile.workSuitabilities || [];
  if (!suitabilities.length) {
    return `<p class="sop-work-empty">Work suitability data is unavailable.</p>`;
  }
  return `<ul class="sop-work-grid">${suitabilities.map(item => `<li aria-label="${item.name}, level ${item.level}">
    <span class="sop-work-icon">${workIcons[item.name]
      ? `<img src="${workIcons[item.name]}" alt="" loading="lazy">`
      : `<i class="fa-solid fa-briefcase" aria-hidden="true"></i>`}</span>
    <strong>${item.level}</strong>
  </li>`).join("")}</ul>`;
}

function cardMarkup(profile, index, stackIndex) {
  const detailsId = `profile-details-${index}`;
  return `<article class="sop-card" data-index="${index}" style="z-index:${3 - stackIndex}"${stackIndex ? " aria-hidden=\"true\"" : ""}>
    <img src="${profile.image}" alt="${profile.name} from Palworld" draggable="false">
    <div class="sop-photo-shade"></div>
    <div class="sop-stamp sop-stamp-pass">Pass</div>
    <div class="sop-stamp sop-stamp-smash">Smash</div>
    <div class="sop-stamp sop-stamp-marry">Marry</div>
    <div class="sop-profile-copy">
      <div class="sop-name-row"><h2>${profile.name}</h2><span class="sop-online" title="Online now"></span></div>
      <p class="sop-location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${profile.location} · ${profile.type}</p>
      <p class="sop-bio">${profile.description}</p>
      <ul class="sop-tags">${profile.tags.map(tag => `<li>${tag}</li>`).join("")}</ul>
      <button class="sop-details-toggle" type="button" aria-label="View ${profile.name} details" aria-expanded="false" aria-controls="${detailsId}"${stackIndex ? " tabindex=\"-1\"" : ""}>
        <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
      </button>
    </div>
    <section id="${detailsId}" class="sop-details-panel" aria-hidden="true" inert>
      <div class="sop-details-heading">
        <h2>${profile.name}</h2>
        <button class="sop-details-close" type="button" aria-label="Close ${profile.name} details"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>
      </div>
      <p class="sop-details-location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${profile.location} · ${profile.type}</p>
      <p class="sop-details-bio">${profile.description}</p>
      ${workSuitabilityMarkup(profile)}
    </section>
  </article>`;
}

function renderDeck() {
  deck.innerHTML = profiles.slice(current, current + 3).map((profile, i) => cardMarkup(profile, current + i, i)).join("");
  [...deck.children].forEach((card, i) => {
    card.style.setProperty("--stack", i);
    if (i === 0) bindCard(card);
  });
  counter.textContent = `${Math.min(current + 1, profiles.length)} of ${profiles.length}`;
}

function setDetailsExpanded(card, expanded, moveFocus = true) {
  const toggle = card.querySelector(".sop-details-toggle");
  const panel = card.querySelector(".sop-details-panel");
  card.classList.toggle("is-expanded", expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  panel.setAttribute("aria-hidden", String(!expanded));
  panel.inert = !expanded;
  if (moveFocus) {
    if (expanded) panel.querySelector(".sop-details-close").focus();
    else toggle.focus();
  }
}

function bindCard(card) {
  const toggle = card.querySelector(".sop-details-toggle");
  const panel = card.querySelector(".sop-details-panel");
  let wheelDelta = 0;
  let wheelLockUntil = 0;
  let wheelResetTimer;
  toggle.addEventListener("pointerdown", event => event.stopPropagation());
  toggle.addEventListener("click", event => {
    event.stopPropagation();
    setDetailsExpanded(card, true);
  });
  panel.addEventListener("pointerdown", event => event.stopPropagation());
  panel.querySelector(".sop-details-close").addEventListener("click", () => setDetailsExpanded(card, false));
  card.addEventListener("wheel", event => {
    if (performance.now() < wheelLockUntil) {
      event.preventDefault();
      return;
    }
    const expanded = card.classList.contains("is-expanded");
    const shouldOpen = !expanded && event.deltaY > 0;
    const shouldClose = expanded && panel.scrollTop <= 1 && event.deltaY < 0;
    if (!shouldOpen && !shouldClose) return;

    const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? card.clientHeight
      : 1;
    wheelDelta += event.deltaY * multiplier;
    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelDelta = 0; }, 180);
    if (Math.abs(wheelDelta) < 24) return;

    event.preventDefault();
    setDetailsExpanded(card, shouldOpen, false);
    wheelLockUntil = performance.now() + 320;
    wheelDelta = 0;
  }, { passive: false });

  card.addEventListener("pointerdown", event => {
    if (card.classList.contains("is-expanded") || event.target.closest("button, a")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    card.setPointerCapture(event.pointerId);
    card.classList.add("is-dragging");
  });
  card.addEventListener("pointermove", event => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * .045}deg)`;
    card.dataset.preview = Math.abs(dy) > Math.abs(dx) && dy < -30 ? "marry" : dx > 30 ? "smash" : dx < -30 ? "pass" : "";
  });
  card.addEventListener("pointerup", event => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    card.classList.remove("is-dragging");
    if (dy < -95 && Math.abs(dy) > Math.abs(dx)) choose("marry");
    else if (dx > 110) choose("smash");
    else if (dx < -110) choose("pass");
    else { card.style.transform = ""; card.dataset.preview = ""; }
  });
  card.addEventListener("pointercancel", () => { dragging = false; card.style.transform = ""; card.dataset.preview = ""; });
}

function choose(choice) {
  if (current >= profiles.length || dragging) return;
  const card = deck.firstElementChild;
  if ([...card.classList].some(className => className.startsWith("exit-"))) return;
  votes.push({ profile: profiles[current], choice });
  card.dataset.preview = choice;
  card.classList.add(`exit-${choice}`);
  current += 1;
  setTimeout(current < profiles.length ? renderDeck : renderResults, 360);
}

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const CARD_W = 300;
const CARD_H = Math.round(CARD_W * 62 / 43);
const CARD_RADIUS = CARD_W * .038;
// Card CSS is written in rem against a ~524px-wide card, so shadows scale down with ours.
const SHADOW_SCALE = CARD_W / 524;
const GROUPS = [
  { choice: "marry", label: "Marry", color: "#62a8ff" },
  { choice: "smash", label: "Smash", color: "#45dda2" },
  { choice: "pass", label: "Pass", color: "#ff6577" }
];

function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
  return `${clipped.trimEnd()}…`;
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = candidate;
  }
  if (lines.length < maxLines && line) lines.push(line);
  const overflow = lines.length === maxLines && ctx.measureText(text).width > maxWidth * maxLines;
  if (overflow) lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1], maxWidth);
  return lines;
}

// Mirrors CSS `object-fit: cover` with `object-position: <posX> <posY>`.
function drawCover(ctx, image, x, y, width, height, posX, posY) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.fillStyle = "#282332";
  ctx.fillRect(x, y, width, height);
  if (image) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    ctx.drawImage(image, x + (width - drawW) * posX, y + (height - drawH) * posY, drawW, drawH);
  }
  ctx.restore();
}

function drawPin(ctx, x, y, size) {
  const radius = size * .32;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + radius + size * .06, radius, Math.PI, 0);
  ctx.lineTo(x + size / 2, y + size);
  ctx.closePath();
  ctx.fillStyle = "#ff6784";
  ctx.fill();
}

function setTextShadow(ctx, color, blur, offsetY) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * SHADOW_SCALE;
  ctx.shadowOffsetY = offsetY * SHADOW_SCALE;
}

function clearShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

// Matches the wide-viewport card: full-bleed photo with the copy overlaid on the shade.
function drawCard(ctx, profile, image, x, y) {
  const padX = CARD_W * .043;
  const padBottom = CARD_W * .131;
  const textX = x + padX;
  const textW = CARD_W - padX * 2;
  const nameSize = CARD_W * .073;
  const locSize = CARD_W * .039;
  const bioSize = CARD_W * .045;
  const nameGap = CARD_W * .015;
  const locGap = CARD_W * .018;

  ctx.save();
  roundRectPath(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
  ctx.clip();
  ctx.fillStyle = "#252530";
  ctx.fillRect(x, y, CARD_W, CARD_H);
  drawCover(ctx, image, x, y, CARD_W, CARD_H, .5, .5);

  const shadeTop = y + CARD_H * .42;
  const shade = ctx.createLinearGradient(0, shadeTop, 0, y + CARD_H);
  shade.addColorStop(0, "rgba(8,8,12,0)");
  shade.addColorStop(.24, "rgba(8,8,12,.18)");
  shade.addColorStop(.74, "rgba(8,8,12,.92)");
  shade.addColorStop(1, "#09090d");
  ctx.fillStyle = shade;
  ctx.fillRect(x, shadeTop, CARD_W, y + CARD_H - shadeTop);

  ctx.textBaseline = "top";
  ctx.font = `400 ${bioSize}px ${FONT_STACK}`;
  const bioLines = wrapText(ctx, profile.description, textW, 3);
  const blockH = nameSize + nameGap + locSize * 1.35 + locGap + bioLines.length * bioSize * 1.42;
  let cursor = y + CARD_H - padBottom - blockH;

  const dotR = CARD_W * .015;
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  const name = ellipsize(ctx, profile.name, textW - dotR * 4);
  ctx.fillStyle = "#f7f7fb";
  setTextShadow(ctx, "rgba(0,0,0,.45)", 16, 2);
  ctx.fillText(name, textX, cursor);
  clearShadow(ctx);
  ctx.beginPath();
  ctx.arc(textX + ctx.measureText(name).width + dotR * 2.4, cursor + nameSize * .55, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#32d583";
  ctx.fill();
  ctx.lineWidth = dotR * .5;
  ctx.strokeStyle = "white";
  ctx.stroke();
  cursor += nameSize + nameGap;

  ctx.font = `400 ${locSize}px ${FONT_STACK}`;
  setTextShadow(ctx, "rgba(0,0,0,.72)", 10, 1);
  drawPin(ctx, textX, cursor + locSize * .12, locSize * .82);
  ctx.fillStyle = "#f0f0f3";
  const locX = textX + locSize * 1.15;
  ctx.fillText(ellipsize(ctx, `${profile.location} · ${profile.type}`, textX + textW - locX), locX, cursor);
  cursor += locSize * 1.35 + locGap;

  ctx.font = `400 ${bioSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#e6e6eb";
  bioLines.forEach((line, i) => ctx.fillText(line, textX, cursor + i * bioSize * 1.42));
  clearShadow(ctx);
  ctx.restore();

  roundRectPath(ctx, x + .5, y + .5, CARD_W - 1, CARD_H - 1, CARD_RADIUS);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.stroke();
}

function drawGroupHeader(ctx, group, x, y, width, height) {
  roundRectPath(ctx, x, y, width, height, height * .28);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.1)";
  ctx.lineWidth = 1;
  ctx.stroke();
  roundRectPath(ctx, x + height * .3, y + height * .24, height * .14, height * .52, height * .07);
  ctx.fillStyle = group.color;
  ctx.fill();

  ctx.textBaseline = "middle";
  ctx.font = `900 ${height * .42}px ${FONT_STACK}`;
  ctx.fillStyle = group.color;
  ctx.fillText(group.label.toUpperCase(), x + height * .74, y + height / 2);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

async function buildSummaryCanvas() {
  const groups = GROUPS
    .map(group => ({ ...group, items: votes.filter(vote => vote.choice === group.choice).map(vote => vote.profile) }))
    .filter(group => group.items.length);
  const images = new Map();
  await Promise.all([...new Set(votes.map(vote => vote.profile.image))].map(src =>
    loadImage(src).then(image => images.set(src, image), error => console.warn(error))
  ));

  const pad = 48;
  const gap = 20;
  const headerH = 66;
  const headerGap = 20;
  const groupGap = 36;
  const titleH = 96;
  const footerH = 46;
  const widest = Math.max(...groups.map(group => group.items.length));
  const cols = Math.max(1, Math.min(8, widest, Math.round(Math.sqrt(votes.length * 1.6)) || 1));
  const contentW = cols * CARD_W + (cols - 1) * gap;
  const rowsOf = group => Math.ceil(group.items.length / cols);
  const height = pad + titleH + groups.reduce((total, group, i) =>
    total + (i ? groupGap : 0) + headerH + headerGap + rowsOf(group) * CARD_H + (rowsOf(group) - 1) * gap, 0) + footerH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = contentW + pad * 2;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const backdrop = ctx.createLinearGradient(0, 0, 0, canvas.height);
  backdrop.addColorStop(0, "#221a2c");
  backdrop.addColorStop(.35, "#14111d");
  backdrop.addColorStop(1, "#0b0b10");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = ctx.createRadialGradient(canvas.width / 2, -canvas.width * .1, 0, canvas.width / 2, -canvas.width * .1, canvas.width * .62);
  glow.addColorStop(0, "rgba(122,58,138,.55)");
  glow.addColorStop(1, "rgba(122,58,138,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height * .5);

  ctx.textBaseline = "top";
  const wordmark = ctx.createLinearGradient(pad, 0, pad + 260, 0);
  wordmark.addColorStop(0, "#ff5a72");
  wordmark.addColorStop(1, "#f43f8a");
  ctx.font = `900 62px ${FONT_STACK}`;
  ctx.fillStyle = wordmark;
  ctx.fillText("Palder", pad, pad);

  let y = pad + titleH;
  for (const [i, group] of groups.entries()) {
    if (i) y += groupGap;
    drawGroupHeader(ctx, group, pad, y, contentW, headerH);
    y += headerH + headerGap;
    group.items.forEach((profile, index) => {
      const col = index % cols;
      if (col === 0 && index) y += CARD_H + gap;
      drawCard(ctx, profile, images.get(profile.image), pad + col * (CARD_W + gap), y);
    });
    y += CARD_H;
  }

  ctx.textBaseline = "alphabetic";
  ctx.font = `600 18px ${FONT_STACK}`;
  ctx.fillStyle = "#5c5c6a";
  ctx.fillText("zacker150.dev/smash-or-pass", pad, canvas.height - pad + 6);
  return canvas;
}

async function downloadSummary(button) {
  const label = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Building image…`;
  try {
    const canvas = await buildSummaryCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "palder.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    button.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Couldn’t build image`;
    setTimeout(() => { button.innerHTML = label; button.disabled = false; }, 2400);
    return;
  }
  button.innerHTML = label;
  button.disabled = false;
}

function renderResults() {
  counter.textContent = "Deck complete";
  actions.hidden = true;
  document.querySelector(".sop-hints").hidden = true;
  const counts = choice => votes.filter(vote => vote.choice === choice).length;
  deck.innerHTML = `<section class="sop-results">
    <span class="sop-results-icon"><i class="fa-solid fa-fire"></i></span>
    <p class="sop-eyebrow">No more matches.</p>
    <div class="sop-result-grid">
      <div><strong>${counts("pass")}</strong><span>Pass</span></div>
      <div><strong>${counts("marry")}</strong><span>Marry</span></div>
      <div><strong>${counts("smash")}</strong><span>Smash</span></div>
    </div>
    <div class="sop-results-actions">
      <button id="share" class="sop-dialog-primary" type="button"><i class="fa-solid fa-image"></i> Export to PNG</button>
      <button id="restart" class="sop-dialog-secondary" type="button"><i class="fa-solid fa-rotate-right"></i> Swipe again</button>
    </div>
  </section>`;
  document.getElementById("share").addEventListener("click", event => downloadSummary(event.currentTarget));
  document.getElementById("restart").addEventListener("click", restart);
}

function restart() {
  current = 0; votes = []; actions.hidden = false; document.querySelector(".sop-hints").hidden = false; renderDeck();
}

actions.addEventListener("click", event => {
  const button = event.target.closest("[data-choice]");
  if (button) choose(button.dataset.choice);
});
document.addEventListener("keydown", event => {
  const card = deck.firstElementChild;
  if (card?.classList.contains("is-expanded")) {
    if (event.key === "Escape" || event.key === "ArrowDown") {
      event.preventDefault();
      setDetailsExpanded(card, false);
    }
    return;
  }
  if (event.key === "ArrowLeft") choose("pass");
  if (event.key === "ArrowRight") choose("smash");
  if (event.key === "ArrowUp") choose("marry");
});
async function loadProfiles() {
  try {
    const response = await fetch("profiles.json");
    if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
    profiles = await response.json();
    renderDeck();
  } catch (error) {
    counter.textContent = "Unable to load profiles";
    deck.innerHTML = `<section class="sop-results"><span class="sop-results-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><h2>The Paldeck didn’t load.</h2><p class="sop-private">Refresh the page to try again.</p></section>`;
    actions.hidden = true;
    document.querySelector(".sop-hints").hidden = true;
    console.error(error);
  }
}

loadProfiles();
