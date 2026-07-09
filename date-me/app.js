const form = document.getElementById("twitch-form");
const usernameInput = document.getElementById("twitch-username");
const modal = document.getElementById("booking-modal");
const closeButton = document.getElementById("booking-close");
const bookingFor = document.getElementById("booking-for");
const calendarGrid = document.querySelector(".calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const previousMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const waitlistRow = document.querySelector(".waitlist-row");
const waitlistButton = document.getElementById("waitlist-button");
const waitlistModal = document.getElementById("waitlist-modal");
const waitlistCloseButton = document.getElementById("waitlist-close");

const availabilityUsernameHash = "411915681060a7e912d873b44857eb9fe745df2930da10bdccd163554706e71e";
const availableMonth = 6;
const availableDays = new Set([24, 25, 26]);
const bookingEmail = "zacker150@hotmail.com";
const today = new Date();
const year = today.getFullYear();
let selectedMonth = today.getMonth();
let currentUserHasAvailability = false;

async function hashUsername(username) {
  const bytes = new TextEncoder().encode(username.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function renderBookedCalendar() {
  const monthName = new Date(year, selectedMonth).toLocaleString(undefined, { month: "long" });
  const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
  const firstWeekday = new Date(year, selectedMonth, 1).getDay();
  const existingDays = calendarGrid.querySelectorAll(".calendar-day");
  const selectedMonthHasAvailability = currentUserHasAvailability && selectedMonth === availableMonth;

  existingDays.forEach(day => day.remove());
  calendarMonth.textContent = `${monthName} ${year}`;
  calendarGrid.setAttribute(
    "aria-label",
    selectedMonthHasAvailability
      ? `${monthName} ${year} calendar. The 24th through 26th are available.`
      : `${monthName} ${year} calendar. Every date is unavailable.`
  );
  waitlistRow.hidden = selectedMonthHasAvailability;
  previousMonthButton.disabled = selectedMonth === 0;
  nextMonthButton.disabled = selectedMonth === 11;

  for (let i = 0; i < firstWeekday; i += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-day calendar-day-empty";
    blank.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = document.createElement("button");
    const isAvailable = selectedMonthHasAvailability && availableDays.has(day);
    const dateLabel = `${monthName} ${day}, ${year}`;
    const subject = `Date request for ${dateLabel}`;
    const body = `I am requesting a date on ${dateLabel}`;
    const mailto = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    date.className = isAvailable ? "calendar-day calendar-day-available" : "calendar-day";
    date.type = "button";
    date.disabled = !isAvailable;
    date.setAttribute("aria-label", `${dateLabel}: ${isAvailable ? "available" : "unavailable"}`);

    if (isAvailable) {
      date.dataset.mailto = mailto;
    }

    date.innerHTML = `<span>${day}</span><small>${isAvailable ? "Available" : "Unavailable"}</small>`;
    calendarGrid.appendChild(date);
  }
}

function openEmailDraft(mailto) {
  window.location.href = mailto;
}

function openBookingModal(username, hasAvailability) {
  currentUserHasAvailability = hasAvailability;
  bookingFor.textContent = hasAvailability
    ? `Available dates for @${username} are shown below.`
    : `No dates are currently available for @${username}.`;
  renderBookedCalendar();
  modal.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeBookingModal() {
  modal.setAttribute("hidden", "");
  closeWaitlistModal();
  document.body.style.overflow = "";
  usernameInput.focus();
}

function openWaitlistModal() {
  waitlistModal.removeAttribute("hidden");
  waitlistCloseButton.focus();
}

function closeWaitlistModal() {
  waitlistModal.setAttribute("hidden", "");

  if (!modal.hasAttribute("hidden") && !waitlistRow.hidden) {
    waitlistButton.focus();
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const username = usernameInput.value.trim().replace(/^@+/, "").toLowerCase();

  if (!username) {
    usernameInput.focus();
    return;
  }

  openBookingModal(username, await hashUsername(username) === availabilityUsernameHash);
});

closeButton.addEventListener("click", closeBookingModal);

waitlistButton.addEventListener("click", openWaitlistModal);

waitlistCloseButton.addEventListener("click", closeWaitlistModal);

calendarGrid.addEventListener("click", event => {
  const availableDate = event.target.closest(".calendar-day-available");

  if (availableDate?.dataset.mailto) {
    openEmailDraft(availableDate.dataset.mailto);
  }
});

previousMonthButton.addEventListener("click", () => {
  if (selectedMonth > 0) {
    selectedMonth -= 1;
    renderBookedCalendar();
  }
});

nextMonthButton.addEventListener("click", () => {
  if (selectedMonth < 11) {
    selectedMonth += 1;
    renderBookedCalendar();
  }
});

modal.addEventListener("click", event => {
  if (event.target === modal) closeBookingModal();
});

waitlistModal.addEventListener("click", event => {
  if (event.target === waitlistModal) closeWaitlistModal();
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") {
    return;
  }

  if (!waitlistModal.hasAttribute("hidden")) {
    closeWaitlistModal();
  } else if (!modal.hasAttribute("hidden")) {
    closeBookingModal();
  }
});

renderBookedCalendar();
