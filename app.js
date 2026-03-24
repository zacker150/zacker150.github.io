const recipes = [
  { name: "Bacon Potato Soup",                              file: "Recipes/Bacon%20Potato%20Soup.pdf" },
  { name: "Burger",                                         file: "Recipes/Burger.pdf" },
  { name: "Butter Chicken",                                 file: "Recipes/Butter%20Chicken.pdf" },
  { name: "Fish Tacos",                                     file: "Recipes/Fish%20Tacos.pdf" },
  { name: "Honey Walnut Shrimp",                            file: "Recipes/Honey%20Walnut%20Shrimp.pdf" },
  { name: "Japanese Curry",                                 file: "Recipes/Japanese%20Curry.pdf" },
  { name: "Mexican Plate",                                  file: "Recipes/Mexican%20Plate.pdf" },
  { name: "Nachos",                                         file: "Recipes/Nachos.pdf" },
  { name: "Panko Crusted Salmon with Roasted Vegetables",   file: "Recipes/Panko%20Crusted%20Salmon%20with%20Roasted%20Vegetables.pdf" },
  { name: "Pork Belly Noodle Soup",                         file: "Recipes/Pork%20Belly%20Noodle%20Soup.pdf" },
  { name: "Pork Egg Roll",                                  file: "Recipes/Pork%20Egg%20Roll.pdf" },
  { name: "Roasted Tomato Soup",                            file: "Recipes/Roasted%20Tomato%20Soup.pdf" },
  { name: "Test Kabob",                                     file: "Recipes/Test%20Kabob.pdf" },
  { name: "Unagi Sushi",                                    file: "Recipes/Unagi%20Sushi.pdf" },
  { name: "Vermicelli Bun",                                 file: "Recipes/Vermicelli%20Bun.pdf" },
];

const grid     = document.getElementById("card-grid");
const modal    = document.getElementById("modal");
const pdfFrame = document.getElementById("pdf-frame");
const closeBtn = document.getElementById("close-btn");
const search   = document.getElementById("search");

function renderCards(list) {
  grid.innerHTML = list.length
    ? list.map(r => `
        <button class="card" data-file="${r.file}" aria-label="Open ${r.name}">
          <span class="card-name">${r.name}</span>
        </button>`).join("")
    : `<p class="no-results">No recipes found.</p>`;
}

function openModal(file) {
  pdfFrame.src = file;
  modal.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  closeBtn.focus();
}

function closeModal() {
  modal.setAttribute("hidden", "");
  pdfFrame.src = "";
  document.body.style.overflow = "";
}

// Card clicks (event delegation)
grid.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (card) openModal(card.dataset.file);
});

// Close button
closeBtn.addEventListener("click", closeModal);

// Backdrop click
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

// Escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
});

// Search / filter
search.addEventListener("input", () => {
  const query = search.value.trim().toLowerCase();
  renderCards(query ? recipes.filter(r => r.name.toLowerCase().includes(query)) : recipes);
});

// Initial render
renderCards(recipes);
