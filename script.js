const HUBSPOT_PORTAL_ID = "242626590";
const HUBSPOT_FORM_ID = "2fa361a5-94e4-4c94-8d88-fb9ef08682c9";
const HUBSPOT_SUBMIT_HOST = "https://api.hsforms.com"; // account region is na2; change only if submissions fail

const form = document.getElementById("diagnostic-form");
const formShell = document.getElementById("form-shell");
const successShell = document.getElementById("success-shell");
const formError = document.getElementById("form-error");
const resetBtn = document.getElementById("reset-btn");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = submitBtn.querySelector(".btn-gradient__label");
const submitLabelDefault = submitLabel.textContent;

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

  if (missing.length) {
    missing.forEach(markInvalid);
    setError("Please add your name and work email.");
    missing[0].focus();
    return false;
  }

  if (!EMAIL_PATTERN.test(email)) {
    markInvalid(form.email);
    setError("Enter a valid work email address.");
    form.email.focus();
    return false;
  }

  if (website && !isValidWebsite(website)) {
    markInvalid(form.website);
    setError("Enter a valid website, e.g. https://yourdealership.com");
    form.website.focus();
    return false;
  }

  return true;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function buildPayload() {
  const [firstname, ...rest] = form.name.value.trim().split(/\s+/);
  const lastname = rest.join(" ");
  const website = form.website.value.trim();

  const entries = [
    ["0-1", "firstname", firstname],
    ["0-1", "lastname", lastname],
    ["0-1", "email", form.email.value.trim()],
    ["0-1", "mobilephone", form.phone.value.trim()],
    ["0-2", "dealership_group_name", form.dealership.value.trim()],
    ["0-2", "website", normalizeWebsite(website)],
    ["0-1", "number_of_rooftops", form.rooftops.value.trim()],
  ];

  const fields = entries
    .filter(([, , value]) => value)
    .map(([objectTypeId, name, value]) => ({ objectTypeId, name, value }));

  const context = { pageUri: window.location.href, pageName: document.title };
  const hutk = getCookie("hubspotutk");
  if (hutk) context.hutk = hutk;

  return { fields, context };
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitBtn.classList.toggle("is-loading", isSubmitting);
  submitBtn.setAttribute("aria-busy", String(isSubmitting));
  submitLabel.textContent = isSubmitting ? "Booking…" : submitLabelDefault;
}

function describeHubSpotError(body) {
  const errors = (body && body.errors) || [];
  if (errors.some((e) => e.errorType === "BLOCKED_EMAIL")) {
    markInvalid(form.email);
    return "Please use your work email address.";
  }
  if (errors.some((e) => e.errorType === "INVALID_EMAIL")) {
    markInvalid(form.email);
    return "Enter a valid work email address.";
  }
  return "Something went wrong submitting the form. Please try again.";
}

async function submitToHubSpot(payload) {
  const url = `${HUBSPOT_SUBMIT_HOST}/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}

  return { ok: response.ok, status: response.status, body };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitBtn.disabled || !validate()) return;

  setSubmitting(true);

  try {
    const result = await submitToHubSpot(buildPayload());

    if (!result.ok) {
      console.error(`HubSpot submission failed (${result.status}):`, result.body);
      setError(describeHubSpotError(result.body));
      return;
    }

    formShell.hidden = true;
    successShell.hidden = false;
  } catch (error) {
    console.error("HubSpot submission failed:", error);
    setError("We couldn't reach the server. Check your connection and try again.");
  } finally {
    setSubmitting(false);
  }
});

form.addEventListener("input", (event) => {
  if (event.target.classList.contains("is-invalid")) {
    event.target.classList.remove("is-invalid");
    event.target.removeAttribute("aria-invalid");
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  clearInvalidStates();
  setError("");
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
