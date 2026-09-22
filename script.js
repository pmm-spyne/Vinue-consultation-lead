const form = document.getElementById("lead-form");
const formShell = document.getElementById("form-shell");
const successShell = document.getElementById("success-shell");
const formError = document.getElementById("form-error");
const resetBtn = document.getElementById("reset-btn");

function setError(message) {
  if (!message) {
    formError.hidden = true;
    formError.textContent = "";
    return;
  }
  formError.hidden = false;
  formError.textContent = message;
}

function clearInvalidStates() {
  form.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });
}

function validate() {
  clearInvalidStates();
  setError("");

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const company = form.company.value.trim();

  if (!name || !email || !company) {
    if (!name) form.name.classList.add("is-invalid");
    if (!email) form.email.classList.add("is-invalid");
    if (!company) form.company.classList.add("is-invalid");
    setError("Please fill in name, work email, and company.");
    return false;
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    form.email.classList.add("is-invalid");
    setError("Enter a valid work email address.");
    return false;
  }

  return true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;

  // Frontend-only for now — payload ready for a future API.
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    company: form.company.value.trim(),
    title: form.title.value.trim(),
    phone: form.phone.value.trim(),
    event: "Vincue Unleashed",
    brand: "Spyne",
  };

  console.log("Lead submitted:", payload);

  formShell.hidden = true;
  successShell.hidden = false;
});

resetBtn.addEventListener("click", () => {
  form.reset();
  clearInvalidStates();
  setError("");
  successShell.hidden = true;
  formShell.hidden = false;
  form.name.focus();
});
