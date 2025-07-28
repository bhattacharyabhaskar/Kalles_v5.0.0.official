async function handleCartRemove(event) {
  event.preventDefault();
  console.log("🧾 handleCartRemove triggered");

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;
  const context = button.dataset.context || "cart";
  console.log("🔑 Item key:", itemKey);
  console.log("🧭 Context:", context);

  try {
    // Extract parent variant ID from the item key
    const parentVariantId = itemKey.split(":")[0];
    console.log("🔗 Parent Variant ID:", parentVariantId);

    // Fetch current cart
    const res = await fetch("/cart.js");
    const cart = await res.json();
    console.log(`📦 Cart fetched: ${cart.items.length} items`);

    const linesToDelete = {};
    console.log("🔍 Cart items with their 'Linked to Saree' values:");

    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const linkedTo = item.properties?.["Linked to Saree"] || null;
      const itemTitle = item.title;
      const itemKeyFull = item.key;

      console.log(
        `- ${itemTitle} | ${itemKeyFull} | Linked to: ${
          linkedTo || "❌ None"
        }`
      );

      if (itemKey === item.key) {
        console.log(`🗑 Marking ${itemTitle} for removal`);
        linesToDelete[item.key] = 0;
      } else if (
        linkedTo &&
        linkedTo.toString() === parentVariantId.toString()
      ) {
        console.log(`🗑 Marking linked item ${itemTitle} for removal`);
        linesToDelete[item.key] = 0;
      }
    }

    if (Object.keys(linesToDelete).length === 0) {
      console.warn("⚠️ No items matched for deletion");
      return;
    }

    console.log("🧹 Items to delete:", linesToDelete);

    // Perform update
    const updateRes = await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: linesToDelete }),
    });

    if (!updateRes.ok) {
      throw new Error("cart/update.js failed: " + updateRes.status);
    }

    console.log("✅ Deletion complete.");

    // Refresh drawer or page
    if (context === "drawer") {
      const trigger = document.querySelector('[data-drawer-options*="cart"]');
      if (trigger) {
        console.log("🔄 Reopening drawer via trigger click");
        trigger.click();
      } else {
        console.warn("⚠️ Drawer trigger not found. Reloading page as fallback.");
        window.location.reload();
      }
    } else {
      console.log("🔄 Reloading cart page");
      window.location.reload();
    }
  } catch (err) {
    console.error("❌ Error in handleCartRemove:", err);
    alert("Something went wrong while removing the item(s). Please try again.");
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const atcForm = document.querySelector('form[action="/cart/add"]');
  const atcButton = atcForm?.querySelector('button[type="submit"]');
  const atcTextSpan = atcButton?.querySelector('.hdt-btn-atc_text');
  const floatingBtnWrapper = document.getElementById("floating-atc-wrapper");
  const floatingBtn = document.getElementById("floating-atc-button");
  const floatingText = floatingBtn?.querySelector('.hdt-btn-atc_text');
  console.log("🧾 ADd To Cart triggered");

  if (!atcForm || !atcButton || !floatingBtn) return;

  const defaultBtnText = atcTextSpan?.textContent.trim() || "Add to Cart";
  const withAddonsText = "Add to Cart with Add-ons";
  const defaultBg = window.getComputedStyle(atcButton).backgroundColor;
  const defaultColor = window.getComputedStyle(atcButton).color;
  const addonBg = "#8A1253";
  const addonColor = "#ffffff";

  // ✅ Clone styles from parent → floating
  function copyParentStylesToFloating() {
    const parentStyle = window.getComputedStyle(atcButton);
    if (!parentStyle || !floatingBtn) return;

    floatingBtn.style.backgroundColor = parentStyle.backgroundColor;
    floatingBtn.style.color = parentStyle.color;
    floatingBtn.style.border = parentStyle.border;
    floatingBtn.style.fontSize = parentStyle.fontSize;
    floatingBtn.style.fontWeight = parentStyle.fontWeight;
    floatingBtn.style.borderRadius = parentStyle.borderRadius;
    floatingBtn.style.padding = parentStyle.padding;
    floatingBtn.style.textTransform = "uppercase";
  }

  // 🔁 Update text + color for both buttons
  function updateButtonState() {
    const anyChecked = document.querySelectorAll(".addon-checkbox:checked").length > 0;
    const text = anyChecked ? withAddonsText : defaultBtnText;

    // Update text
    if (atcTextSpan) atcTextSpan.textContent = text;
    if (floatingText) floatingText.textContent = text;

    // Update color
    const bg = anyChecked ? addonBg : defaultBg;
    const color = anyChecked ? addonColor : defaultColor;

    atcButton.style.backgroundColor = bg;
    atcButton.style.color = color;

    // Now sync styles from parent to floating
    copyParentStylesToFloating();
  }

  // ✅ Setup event listeners
  document.querySelectorAll(".addon-checkbox").forEach(cb => {
    cb.addEventListener("change", updateButtonState);
  });

  updateButtonState(); // initial

  // ✅ Scroll detection
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  function handleFloatingButtonVisibility() {
  if (window.innerWidth >= 768) {
    floatingBtnWrapper.style.display = "none";
    return;
  }

  const inView = isElementInViewport(atcButton);
  const scrolledPastFold = window.scrollY > window.innerHeight;

  if (!inView && scrolledPastFold) {
    floatingBtnWrapper.style.display = "block";
  } else {
    floatingBtnWrapper.style.display = "none";
  }
}

  document.addEventListener("scroll", handleFloatingButtonVisibility, { passive: true });
  window.addEventListener("resize", handleFloatingButtonVisibility);
  handleFloatingButtonVisibility();

  // ✅ Floating button triggers main click
  floatingBtn.addEventListener("click", function (e) {
    e.preventDefault();
    atcButton.click();
  });

  // 🧾 Submit logic (no changes here — your existing logic continues)
  atcForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const parentVariantId =
      window.product?.selected_or_first_available_variant?.id ||
      window.meta?.product?.variants?.[0]?.id ||
      ShopifyAnalytics?.meta?.selectedVariantId;

    if (!parentVariantId) return;

    const cart = await fetch('/cart.js').then(res => res.json());
    const updates = {};
    let hadRemovals = false;

    cart.items.forEach(item => {
      const linked = item.properties?.['Linked to Saree'];
      const match = item.variant_id == parentVariantId || linked == parentVariantId;
      if (match) {
        updates[item.key] = 0;
        hadRemovals = true;
      }
    });

    if (Object.keys(updates).length > 0) {
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      await new Promise(res => setTimeout(res, 300));
    }

    atcForm.querySelectorAll(".addon-dynamic").forEach(el => el.remove());

    document.querySelectorAll(".addon-checkbox:checked").forEach(cb => {
      const vid = cb.dataset.variantId;
      if (!vid) return;

      ["id", "quantity", "properties[Linked to Saree]"].forEach((name, i) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `items[][${name}]`;
        input.value = i === 0 ? vid : i === 1 ? "1" : parentVariantId;
        input.classList.add("addon-dynamic");
        atcForm.appendChild(input);
      });
    });

    // Add parent item last
    const parentIdInput = atcForm.querySelector('input[name="id"]');
    const parentQtyInput = atcForm.querySelector('input[name="quantity"]');
    if (parentIdInput) {
      const id = parentIdInput.value;
      const qty = parentQtyInput?.value || "1";
      const formData = new FormData();
      document.querySelectorAll(".addon-dynamic").forEach(i => formData.append(i.name, i.value));
      formData.append("items[][id]", id);
      formData.append("items[][quantity]", qty);

      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (hadRemovals) window.location.href = "/cart";
    }
  });

  atcButton.addEventListener("click", () => {
    const parentVariantId =
      window.product?.selected_or_first_available_variant?.id ||
      window.meta?.product?.variants?.[0]?.id ||
      ShopifyAnalytics?.meta?.selectedVariantId;

    if (!parentVariantId) return;

    atcForm.querySelectorAll(".addon-dynamic").forEach(el => el.remove());

    document.querySelectorAll(".addon-checkbox:checked").forEach(cb => {
      const vid = cb.dataset.variantId;
      if (!vid) return;

      ["id", "quantity", "properties[Linked to Saree]"].forEach((name, i) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `items[][${name}]`;
        input.value = i === 0 ? vid : i === 1 ? "1" : parentVariantId;
        input.classList.add("addon-dynamic");
        atcForm.appendChild(input);
      });
    });
  });
});

function getLiquidCalculatedPriceCents() {
  console.log("🔍 Scanning document for final price comment block...");
  const match = document.body.innerHTML.match(/<!-- FINAL PRICE START -->([\s\S]*?)<!-- FINAL PRICE END -->/);
  if (match && match[1]) {
    const value = parseInt(match[1].trim(), 10);
    console.log("✅ Found Liquid final price:", value);
    return value;
  } else {
    console.warn("❌ Could not locate final price comment block in DOM.");
    return null;
  }
}

document.addEventListener('variant:change', e => {
  console.log("🟡 variant:change event triggered");

  setTimeout(() => {
    const variant = e.detail?.variant;
    if (!variant) {
      console.warn("❌ No variant data found.");
      return;
    }

    console.log("📦 Variant data:", variant);

    let finalPrice = getLiquidCalculatedPriceCents();
    if (finalPrice === null) {
      const container = document.querySelector('#ivy-dynamic-price');
      if (container?.dataset?.finalPrice) {
        finalPrice = parseInt(container.dataset.finalPrice, 10);
        console.log("🔁 Using data-final-price fallback:", finalPrice);
      }
    }

    const compareAtPrice = variant.compare_at_price;
    const priceContainer = document.querySelector('#ivy-dynamic-price');
    console.log("🧩 priceContainer:", priceContainer);

    const allMoneySpans = priceContainer?.querySelectorAll('.hdt-money .money');
    const originalEl = allMoneySpans?.[0];
    const finalEl = allMoneySpans?.[1];

    console.log("💲 originalEl:", originalEl);
    console.log("💲 finalEl:", finalEl);
    console.log("🧮 compare_at_price:", compareAtPrice);
    console.log("🧮 finalPrice (from Liquid):", finalPrice);

    if (finalEl && originalEl && finalPrice !== null) {
      finalEl.textContent = `$${(finalPrice / 100).toFixed(2)} USD`;
      originalEl.textContent = `$${(compareAtPrice / 100).toFixed(2)} USD`;

      finalEl.closest('.hdt-money').style.display = finalPrice < compareAtPrice ? '' : 'none';
      originalEl.style.textDecoration = finalPrice < compareAtPrice ? 'line-through' : 'none';

      console.log("✅ Price DOM updated");
    } else {
      console.warn("❌ One or more price elements missing or finalPrice not available");
    }
  }, 1);
});
