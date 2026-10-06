const form = document.getElementById("diagnostic-form");
const formShell = document.getElementById("form-shell");
const successShell = document.getElementById("success-shell");
const formError = document.getElementById("form-error");
const resetBtn = document.getElementById("reset-btn");
const rooftops = document.getElementById("rooftops");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setError(message) {
  formError.hidden = !message;
  formError.textContent = message || "";
}

function clearInvalidStates() {
  form.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
    el.removeAttribute("aria-invalid");
  });
}

function markInvalid(field) {
  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");
}

function normalizeWebsite(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isValidWebsite(value) {
  try {
    const url = new URL(normalizeWebsite(value));
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

function validate() {
  clearInvalidStates();
  setError("");

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const website = form.website.value.trim();

  const missing = [];
  if (!name) missing.push(form.name);
  if (!email) missing.push(form.email);
  if (!website) missing.push(form.website);

  if (missing.length) {
    missing.forEach(markInvalid);
    setError("Please add your name, work email and dealership website.");
    missing[0].focus();
    return false;
  }

  if (!EMAIL_PATTERN.test(email)) {
    markInvalid(form.email);
    setError("Enter a valid work email address.");
    form.email.focus();
    return false;
  }

  if (!isValidWebsite(website)) {
    markInvalid(form.website);
    setError("Enter a valid website, e.g. https://yourdealership.com");
    form.website.focus();
    return false;
  }

  return true;
}

function syncSelectPlaceholder() {
  rooftops.classList.toggle("is-placeholder", !rooftops.value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;

  // Frontend-only for now — payload ready for a future API.
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    dealership: form.dealership.value.trim(),
    website: normalizeWebsite(form.website.value.trim()),
    rooftops: rooftops.value,
    source: "Vincue Booth",
  };

  console.log("Diagnostic booked:", payload);

  formShell.hidden = true;
  successShell.hidden = false;
});

form.addEventListener("input", (event) => {
  if (event.target.classList.contains("is-invalid")) {
    event.target.classList.remove("is-invalid");
    event.target.removeAttribute("aria-invalid");
  }
});

rooftops.addEventListener("change", syncSelectPlaceholder);

resetBtn.addEventListener("click", () => {
  form.reset();
  clearInvalidStates();
  setError("");
  syncSelectPlaceholder();
  successShell.hidden = true;
  formShell.hidden = false;
  form.name.focus();
});

document.querySelectorAll("[data-scroll-to-form]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("book").scrollIntoView({ behavior: "smooth", block: "start" });
    if (!formShell.hidden) {
      form.name.focus({ preventScroll: true });
    }
  });
});

syncSelectPlaceholder();
