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
  return `<article class="sop-card" data-index="${index}" style="z-index:${profiles.length - index}"${stackIndex ? " aria-hidden=\"true\"" : ""}>
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

function setDetailsExpanded(card, expanded) {
  const toggle = card.querySelector(".sop-details-toggle");
  const panel = card.querySelector(".sop-details-panel");
  card.classList.toggle("is-expanded", expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  panel.setAttribute("aria-hidden", String(!expanded));
  panel.inert = !expanded;
  if (expanded) panel.querySelector(".sop-details-close").focus();
  else toggle.focus();
}

function bindCard(card) {
  const toggle = card.querySelector(".sop-details-toggle");
  const panel = card.querySelector(".sop-details-panel");
  toggle.addEventListener("pointerdown", event => event.stopPropagation());
  toggle.addEventListener("click", event => {
    event.stopPropagation();
    setDetailsExpanded(card, true);
  });
  panel.addEventListener("pointerdown", event => event.stopPropagation());
  panel.querySelector(".sop-details-close").addEventListener("click", () => setDetailsExpanded(card, false));

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
  votes.push({ name: profiles[current].name, choice });
  card.dataset.preview = choice;
  card.classList.add(`exit-${choice}`);
  current += 1;
  setTimeout(current < profiles.length ? renderDeck : renderResults, 360);
}

function renderResults() {
  counter.textContent = "Deck complete";
  actions.hidden = true;
  document.querySelector(".sop-hints").hidden = true;
  const counts = choice => votes.filter(vote => vote.choice === choice).length;
  deck.innerHTML = `<section class="sop-results">
    <span class="sop-results-icon"><i class="fa-solid fa-fire"></i></span>
    <p class="sop-eyebrow">No more matches.</p><h2>Your verdicts are in.</h2>
    <div class="sop-result-grid">
      <div><strong>${counts("pass")}</strong><span>Pass</span></div>
      <div><strong>${counts("marry")}</strong><span>Marry</span></div>
      <div><strong>${counts("smash")}</strong><span>Smash</span></div>
    </div>
    <button id="restart" class="sop-dialog-primary" type="button"><i class="fa-solid fa-rotate-right"></i> Play again</button>
  </section>`;
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
