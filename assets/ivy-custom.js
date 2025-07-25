async function handleCartRemove(event) {
  event.preventDefault();

  console.log("🧾 handleCartRemove triggered");

  const button = event.currentTarget;
  const itemKey = button.getAttribute("data-item-key");
  const context = button.getAttribute("data-context") || "cart";

  console.log("🔑 Item key:", itemKey);
  console.log("🧭 Context:", context);

  // Show loading spinner
  button.disabled = true;
  const originalHTML = button.innerHTML;
  button.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" class="spinner"><circle cx="12" cy="12" r="10" stroke="#555" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" dur="0.8s" repeatCount="indefinite" from="0 12 12" to="360 12 12"/></circle></svg>`;

  try {
    const parentVariantId = itemKey.split(":")[0];
    console.log("🔗 Parent Variant ID:", parentVariantId);

    // Fetch the latest cart
    const cart = await fetch("/cart.js").then((res) => res.json());
    console.log("📦 Cart fetched:", cart.items.length, "items");

    // Find all related items to delete
    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    const itemsToRemove = {};

    cart.items.forEach((item, index) => {
      const linkedTo = item.properties?.["Linked to Saree"] || null;
      console.log(`- ${item.product_title} | ${item.key} | Linked to: ${linkedTo || "❌ None"}`);

      if (item.key === itemKey) {
        console.log(`🗑 Marking ${item.product_title} (line ${index + 1}) for removal`);
        itemsToRemove[index + 1] = 0;
      } else if (linkedTo === parentVariantId) {
        console.log(`🗑 Marking linked item ${item.product_title} (line ${index + 1}) for removal`);
        itemsToRemove[index + 1] = 0;
      }
    });

    console.log("🧹 Items to delete:", itemsToRemove);

    const response = await fetch("/cart/update.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ updates: itemsToRemove }),
    });

    if (!response.ok) {
      throw new Error(`cart/update.js failed: ${response.status}`);
    }

    console.log("✅ Deletion complete.");

    // Reload cart UI based on context
    if (context === "drawer") {
      const drawerTrigger = document.querySelector('[data-drawer-options*="cart"]');
      if (drawerTrigger) {
        console.log("🔄 Reopening drawer after update");
        drawerTrigger.click();
      } else {
        console.warn("⚠️ Drawer trigger not found. Reloading page as fallback.");
        location.reload();
      }
    } else {
      location.reload();
    }
  } catch (error) {
    console.error("❌ Error in handleCartRemove:", error);
    alert("Something went wrong while removing the item(s). Please try again.");
  } finally {
    // Restore button state
    button.disabled = false;
    button.innerHTML = originalHTML;
  }
}
