let profiles = [];

const deck = document.getElementById("deck");
const counter = document.getElementById("counter");
const actions = document.getElementById("actions");
let current = 0;
let votes = [];
let dragging = false;
let startX = 0;
let startY = 0;

function cardMarkup(profile, index, stackIndex) {
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
    </div>
  </article>`;
}

function renderDeck() {
  deck.innerHTML = profiles.slice(current, current + 3).map((profile, i) => cardMarkup(profile, current + i, i)).join("");
  [...deck.children].forEach((card, i) => {
    card.style.setProperty("--stack", i);
    if (i === 0) bindDrag(card);
  });
  counter.textContent = `${Math.min(current + 1, profiles.length)} of ${profiles.length}`;
}

function bindDrag(card) {
  card.addEventListener("pointerdown", event => {
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
    <p class="sop-eyebrow">That’s the deck</p><h2>Your verdicts are in.</h2>
    <div class="sop-result-grid">
      <div><strong>${counts("pass")}</strong><span>Pass</span></div>
      <div><strong>${counts("marry")}</strong><span>Marry</span></div>
      <div><strong>${counts("smash")}</strong><span>Smash</span></div>
    </div>
    <button id="restart" class="sop-dialog-primary" type="button"><i class="fa-solid fa-rotate-right"></i> Play again</button>
    <p class="sop-private"><i class="fa-solid fa-lock"></i> Your choices never leave this page.</p>
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
