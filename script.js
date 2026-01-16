console.log("script loaded");

const ORDER_API_URL = "https://script.google.com/macros/s/AKfycbwvoT6aQFMHuiuIJKnCLrPbT5SQan55fsbYhqRXaMr-E2DMQxNdyUjmy93sfd4sPQyO/exec";

function setMenuOpen(isOpen) {
  const header = document.querySelector(".header");
  const btn = document.querySelector(".burgerBtn");
  const mobileNav = document.querySelector(".header-nav-mobile");

  if (!header || !btn || !mobileNav) return;

  header.classList.toggle("isMenuOpen", isOpen);
  btn.setAttribute("aria-expanded", String(isOpen));
  mobileNav.setAttribute("aria-hidden", String(!isOpen));
}

document.addEventListener("click", (e) => {
  const header = document.querySelector(".header");
  if (!header) return;

  const burger = e.target.closest(".burgerBtn");
  const backdrop = e.target.closest(".mobileNavBackdrop");
  const mobileLink = e.target.closest(".header-nav-mobile .header-link");

  if (burger) {
    const isOpen = header.classList.contains("isMenuOpen");
    setMenuOpen(!isOpen);
    return;
  }

  if (backdrop) {
    setMenuOpen(false);
    return;
  }

  if (mobileLink) {
    setMenuOpen(false);
    return;
  }

  if (header.classList.contains("isMenuOpen")) {
    const clickedInsideNav = e.target.closest(".header-nav-mobile");
    if (!clickedInsideNav) setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) setMenuOpen(false);
});


function setActiveImage(sliderEl, newIndex) {
  if (!sliderEl) return;

  const images = Array.from(sliderEl.querySelectorAll(".sliderImage"));
  const dots = Array.from(sliderEl.querySelectorAll(".dot"));
  const prev = sliderEl.querySelector(".sliderPrev");
  const next = sliderEl.querySelector(".sliderNext");
  const dotsWrap = sliderEl.querySelector(".sliderDots");

  if (images.length === 0) return;

  const max = images.length - 1;
  const index = Math.max(0, Math.min(newIndex, max));

  images.forEach((img, i) => img.classList.toggle("isActive", i === index));
  dots.forEach((dot, i) => dot.classList.toggle("isActive", i === index));

  sliderEl.dataset.index = String(index);

  // Single image => hide nav + dots
  const multi = images.length > 1;

  // Use display:none so they truly vanish (no click area, no layout weirdness)
  if (prev) prev.style.display = (!multi || index === 0) ? "none" : "";
  if (next) next.style.display = (!multi || index === max) ? "none" : "";
  if (dotsWrap) dotsWrap.style.display = (!multi) ? "none" : "";
}

function openModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add("isOpen");
  goToStep(modal, 1);
  syncSummary(modal);


  // Initialize any sliders inside this modal (important when opening)
  modal.querySelectorAll(".modalSlider").forEach((slider) => {
    setActiveImage(slider, 0);
  });
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("isOpen");
}

let snackbarTimer = null;

function showSnackbar(message, duration = 3500) {
  const el = document.getElementById("snackbar");
  if (!el) return;

  el.textContent = message;

  // reset if already open
  el.classList.add("isOpen");
  if (snackbarTimer) clearTimeout(snackbarTimer);

  snackbarTimer = setTimeout(() => {
    el.classList.remove("isOpen");
  }, duration);
}


document.addEventListener("click", (e) => {

    // ----- OPEN CANCEL ORDER MODAL -----
    const cancelBtn = e.target.closest(".cancelOrderBtn");
    if (cancelBtn) {
        const id = cancelBtn.getAttribute("data-modal");
        if (id) openModalById(id);
        return;
    }

  // ----- OPEN MODAL (View button only) -----
  const viewBtn = e.target.closest(".orderButton");
  if (viewBtn) {
    const card = viewBtn.closest(".productCard");
    const id = card?.getAttribute("data-modal");
    if (id) openModalById(id);
    return;
  }

  // ----- CLOSE MODAL (X button) -----
  const closeBtn = e.target.closest(".modalClose");
  if (closeBtn) {
    closeModal(closeBtn.closest(".modalOverlay"));
    return;
  }

  // ----- CLOSE MODAL (click outside) -----
  const overlay = e.target.classList?.contains("modalOverlay") ? e.target : null;
  if (overlay) {
    closeModal(overlay);
    return;
  }

  // ----- SLIDER PREV -----
  const prevBtn = e.target.closest(".sliderPrev");
  if (prevBtn) {
    const slider = prevBtn.closest(".modalSlider");
    const current = Number(slider?.dataset.index || 0);
    setActiveImage(slider, current - 1);
    return;
  }

  // ----- SLIDER NEXT -----
  const nextBtn = e.target.closest(".sliderNext");
  if (nextBtn) {
    const slider = nextBtn.closest(".modalSlider");
    const current = Number(slider?.dataset.index || 0);
    setActiveImage(slider, current + 1);
    return;
  }

  // ----- SLIDER DOTS -----
  const dotBtn = e.target.closest(".sliderDots .dot");
  if (dotBtn) {
    const slider = dotBtn.closest(".modalSlider");
    const dots = Array.from(slider.querySelectorAll(".dot"));
    const idx = dots.indexOf(dotBtn);
    setActiveImage(slider, idx);
  }
});

function goToStep(modalEl, stepNumber) {
  const steps = modalEl.querySelectorAll(".modalStep");
  steps.forEach((s) => s.classList.remove("isActive"));

  const next = modalEl.querySelector(`.modalStep[data-step="${stepNumber}"]`);
  if (next) next.classList.add("isActive");
}

function getState(modalEl) {
  const selected = modalEl.querySelector(".sizeOption.isSelected")?.textContent?.trim() || "S";
  const qty = modalEl.querySelector(".qtyValue")?.textContent?.trim() || "1";
  const name = modalEl.querySelector("#orderName")?.value?.trim() || "";
  const email = modalEl.querySelector("#orderEmail")?.value?.trim() || "";
  return { size: selected, qty, name, email };
}

function parsePrice(text) {
  // "$50.00" -> 50
  const n = Number(String(text || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : "";
}

function formatMoney(n) {
  return `$${n.toFixed(2)}`;
}


function buildOrderPayload(modalEl) {
  const { size, qty, name, email } = getState(modalEl);

  const item = modalEl.querySelector('.modalStep[data-step="1"] .modalTitle')?.textContent?.trim() || "McMasr Item";
  const priceText = modalEl.querySelector('.modalStep[data-step="1"] .modalPrice')?.textContent?.trim() || "";
  const price = parsePrice(priceText);

  return {
    name,
    email,
    item,
    size,
    quantity: Number(qty),
    price
  };
}

async function submitOrderToSheet(modalEl) {
  const payload = buildOrderPayload(modalEl);

  await fetch(ORDER_API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  return { success: true };
}




function syncSummary(modalEl) {
  const { size, qty, name, email } = getState(modalEl);

  const sizeEl = modalEl.querySelector(".summarySize");
  const qtyEl = modalEl.querySelector(".summaryQty");
  const emailEl = modalEl.querySelector(".summaryEmail");
  const nameEl = modalEl.querySelector(".summaryName");   // optional if you add it in HTML
  const totalEl = modalEl.querySelector(".summaryTotal"); // add this class in your HTML

  if (sizeEl) sizeEl.textContent = size;
  if (qtyEl) qtyEl.textContent = qty;
  if (emailEl) emailEl.textContent = email || "—";
  if (nameEl) nameEl.textContent = name || "—";

  const priceText =
    modalEl.querySelector('.modalStep[data-step="1"] .modalPrice')?.textContent?.trim() || "";

  const unitPrice = parsePrice(priceText);     
  const quantity = Number(qty);

  if (totalEl && Number.isFinite(unitPrice) && Number.isFinite(quantity) && quantity > 0) {
    const total = unitPrice * quantity;
    totalEl.textContent = `$${total.toFixed(2)}`;
  } else if (totalEl) {
    totalEl.textContent = "—";
  }

  const receivedEmailEl = modalEl.querySelector(".receivedEmail");
  if (receivedEmailEl) receivedEmailEl.textContent = email || "your email";
}


function isValidEmail(email) {
  // simple + reliable enough for UI validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(inputEl, message) {
  if (!inputEl) return;

  inputEl.classList.add("isInvalid");

  let err = inputEl.parentElement?.querySelector(".fieldError");
  if (!err) {
    err = document.createElement("div");
    err.className = "fieldError";
    inputEl.parentElement?.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(inputEl) {
  if (!inputEl) return;

  inputEl.classList.remove("isInvalid");

  const err = inputEl.parentElement?.querySelector(".fieldError");
  if (err) err.remove();
}



document.addEventListener("click", async (e) => {
  // ===== Cancel modal confirmation flow =====
const cancelModal = e.target.closest(".modalOverlay.cancelModal");

// Click "Cancel My Order" -> switch to confirm state (NO submitting here)
const cancelStart = e.target.closest(".cancelSubmitBtn");
if (cancelStart && cancelModal) {
  const body = cancelModal.querySelector(".cancelBody");
  const confirmBox = cancelModal.querySelector(".cancelConfirmBox");

  if (confirmBox) confirmBox.setAttribute("aria-hidden", "false");
  body?.classList.add("isConfirming");
  return;
}

// Click "No, go back" -> return to first state
const cancelNo = e.target.closest(".cancelNoBtn");
if (cancelNo && cancelModal) {
  const body = cancelModal.querySelector(".cancelBody");
  const confirmBox = cancelModal.querySelector(".cancelConfirmBox");

  if (confirmBox) confirmBox.setAttribute("aria-hidden", "true");
  body?.classList.remove("isConfirming");
  return;
}

// Click "Yes, cancel it"
const cancelYes = e.target.closest(".cancelYesBtn");
if (cancelYes && cancelModal) {
  const emailInput = cancelModal.querySelector("#cancelEmail");
  const idInput = cancelModal.querySelector("#cancelOrderId");

  const email = emailInput?.value.trim() || "";
  const orderId = idInput?.value.trim() || "";

  clearFieldError(emailInput);
  clearFieldError(idInput);

  let ok = true;
  if (!email) { showFieldError(emailInput, "Email is required."); ok = false; }
  else if (!isValidEmail(email)) { showFieldError(emailInput, "Please enter a valid email."); ok = false; }
  if (!orderId) { showFieldError(idInput, "Order ID is required."); ok = false; }
  if (!ok) return;

  const oldText = cancelYes.textContent;

  cancelYes.disabled = true;
  cancelYes.textContent = "Canceling...";

  try {
    const result = await cancelOrderInSheet(email, orderId);

    const canceled = result?.success === true && String(result?.code || "") === "CANCELED";
    if (!canceled) {
      showSnackbar("This email/orderID combination does not exist, or the order has already been canceled or completed.");

      // kick them back to edit inputs
      cancelModal.querySelector(".cancelConfirmBox")?.setAttribute("aria-hidden", "true");
      cancelModal.querySelector(".cancelBody")?.classList.remove("isConfirming");
      return;
    }

    closeModal(cancelModal);
    showSnackbar("✅ Order cancelled. You’ll get a confirmation email.");
  } catch (err) {
    showSnackbar("Cancellation failed. Please try again.");
  } finally {
    // ✅ ALWAYS restore button state
    cancelYes.disabled = false;
    cancelYes.textContent = oldText;
  }

  return;
}





  const modal = e.target.closest(".modalOverlay");

  // size select
  const sizeBtn = e.target.closest(".sizeOption");
  if (sizeBtn && modal) {
    modal.querySelectorAll(".sizeOption").forEach((b) => b.classList.remove("isSelected"));
    sizeBtn.classList.add("isSelected");
    syncSummary(modal);
    return;
  }

  // qty +/-
  const plus = e.target.closest(".qtyBtn");
  if (plus && modal) {
    const isMinus = plus.textContent.trim() === "−" || plus.textContent.trim() === "-";
    const valueEl = modal.querySelector(".qtyValue");
    let n = Number(valueEl?.textContent || 1);
    n = isMinus ? Math.max(1, n - 1) : Math.min(10, n + 1);
    if (valueEl) valueEl.textContent = String(n);
    syncSummary(modal);
    return;
  }

  // steps next/prev
const nextBtn = e.target.closest(".nextStep");
if (nextBtn && modal) {
  const next = Number(nextBtn.dataset.next);

  // Validate Step 2 -> Step 3
  if (next === 3) {
    const nameInput = modal.querySelector("#orderName");
    const emailInput = modal.querySelector("#orderEmail");

    const nameVal = nameInput?.value.trim() || "";
    const emailVal = emailInput?.value.trim() || "";

    // clear old errors
    clearFieldError(nameInput);
    clearFieldError(emailInput);

    let ok = true;

    if (!nameVal) {
      showFieldError(nameInput, "Name is required.");
      ok = false;
    }

    if (!emailVal) {
      showFieldError(emailInput, "Email is required.");
      ok = false;
    } else if (!isValidEmail(emailVal)) {
      showFieldError(emailInput, "Please enter a valid email.");
      ok = false;
    }

    if (!ok) return;

    syncSummary(modal); // update confirm + step 4 copy
    goToStep(modal, next);
    return;
  }

  // Step 3 -> Step 4: submit order to Google Sheets first
  if (next === 4) {
    nextBtn.disabled = true;
    const oldText = nextBtn.textContent;
    nextBtn.textContent = "Submitting...";

    try {
      await submitOrderToSheet(modal); // appends to Google Sheet
      syncSummary(modal);              // keeps step 4 email text correct
      goToStep(modal, 4);              
    } catch (err) {
      alert(err?.message || "Order request failed. Please try again.");
    } finally {
      nextBtn.disabled = false;
      nextBtn.textContent = oldText;
    }

    return;
  }

  goToStep(modal, next);
  return;
}



  const prevBtn = e.target.closest(".prevStep");
  if (prevBtn && modal) {
    goToStep(modal, Number(prevBtn.dataset.prev));
    return;
  }

  // close via Cancel/Close buttons
  const closeBtn = e.target.closest(".modalCloseBtn");
  if (closeBtn && modal) {
    modal.classList.remove("isOpen");
  }
});

// keep summary updated when typing email
document.addEventListener("input", (e) => {
  if (e.target?.id === "orderEmail") {
    const modal = e.target.closest(".modalOverlay");
    if (modal) syncSummary(modal);
  }
});

async function cancelOrderInSheet(email, orderId) {
  const payload = { action: "cancel", email, orderId };

  const res = await fetch(ORDER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return data; // { success, code }
}

// ===============================
// Modal QOL: Esc to close + Enter to continue
// Paste this near the bottom of your script (after your functions),
// OR anywhere after closeModal/openModalById/goToStep/getState/isValidEmail are defined.
// ===============================

function getOpenModal() {
  return document.querySelector(".modalOverlay.isOpen");
}

function getActiveStep(modalEl) {
  return modalEl?.querySelector(".modalStep.isActive");
}

function getActiveStepNumber(modalEl) {
  const stepEl = getActiveStep(modalEl);
  const n = Number(stepEl?.dataset.step);
  return Number.isFinite(n) ? n : 1;
}

// Returns the "Continue / Confirm" button for the active step (if any)
function getPrimaryNextButton(modalEl) {
  const stepEl = getActiveStep(modalEl);
  if (!stepEl) return null;
  return stepEl.querySelector(".nextStep"); // Step 1, 2, 3 have .nextStep
}

// Mirrors your click validation logic for Step 2 -> Step 3
function validateStep2(modalEl) {
  const nameInput = modalEl.querySelector("#orderName");
  const emailInput = modalEl.querySelector("#orderEmail");

  const nameVal = nameInput?.value.trim() || "";
  const emailVal = emailInput?.value.trim() || "";

  clearFieldError(nameInput);
  clearFieldError(emailInput);

  let ok = true;

  if (!nameVal) {
    showFieldError(nameInput, "Name is required.");
    ok = false;
  }

  if (!emailVal) {
    showFieldError(emailInput, "Email is required.");
    ok = false;
  } else if (!isValidEmail(emailVal)) {
    showFieldError(emailInput, "Please enter a valid email.");
    ok = false;
  }

  return ok;
}

// Mirrors your click behavior for "Continue"/"Confirm" without duplicating DOM events
async function advanceFromActiveStep(modalEl) {
  if (!modalEl) return;

  const step = getActiveStepNumber(modalEl);
  const nextBtn = getPrimaryNextButton(modalEl);
  const next = Number(nextBtn?.dataset.next);

  if (!Number.isFinite(next)) return;

  // Step 2 -> Step 3 validation
  if (step === 2 && next === 3) {
    if (!validateStep2(modalEl)) return;
    syncSummary(modalEl);
    goToStep(modalEl, 3);
    return;
  }

  // Step 3 -> Step 4 submit to sheets
  if (step === 3 && next === 4) {
    if (!nextBtn) return;

    nextBtn.disabled = true;
    const oldText = nextBtn.textContent;
    nextBtn.textContent = "Submitting...";

    try {
      await submitOrderToSheet(modalEl);
      syncSummary(modalEl);
      goToStep(modalEl, 4);
    } catch (err) {
      alert(err?.message || "Order request failed. Please try again.");
    } finally {
      nextBtn.disabled = false;
      nextBtn.textContent = oldText;
    }

    return;
  }

  // Normal steps
  goToStep(modalEl, next);
}

// Global key handling: Esc closes modal, Enter triggers Continue/Confirm
document.addEventListener("keydown", async (e) => {
  const modal = getOpenModal();
  if (!modal) return;

  // ESC: close modal
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal(modal);
    return;
  }

  // ENTER: continue (but don't hijack textarea or multiline inputs)
  if (e.key === "Enter") {
    const target = e.target;

    // If they're typing in a textarea or contenteditable, do normal Enter behavior
    const isTextArea = target && target.tagName === "TEXTAREA";
    const isContentEditable = target && target.isContentEditable;
    if (isTextArea || isContentEditable) return;

    // If focus is on a button that is NOT the primary action, let default happen
    const isButton = target && target.tagName === "BUTTON";
    if (isButton) {
      const isPrimary =
        target.classList.contains("nextStep") ||
        target.classList.contains("modalPrimary");
      if (!isPrimary) return;
    }

    e.preventDefault();
    await advanceFromActiveStep(modal);
  }
});
