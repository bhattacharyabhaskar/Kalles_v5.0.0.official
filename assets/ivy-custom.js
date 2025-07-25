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
