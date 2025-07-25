async function handleCartRemove(event) {
  try {
    event.preventDefault();
    console.log("🧾 handleCartRemove triggered");

    const button = event.currentTarget;
    const itemKey = button.dataset.itemKey;
    const context = button.dataset.context || 'cart';
    console.log("🔑 Item key:", itemKey);
    console.log("🧭 Context:", context);

    // Fetch the cart
    const cart = await fetch('/cart.js').then(res => res.json());
    console.log("📦 Cart fetched:", cart.items.length, "items");

    // Find the clicked item
    const clickedItem = cart.items.find(item => item.key === itemKey);
    if (!clickedItem) {
      console.warn("❌ Clicked item not found in cart.");
      return;
    }

    // Determine parentVariantId
    const parentVariantId = clickedItem.properties?.['Linked to Saree'] || clickedItem.variant_id.toString();
    console.log("🔗 Parent Variant ID:", parentVariantId);

    // Log all items with Linked to Saree
    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    cart.items.forEach(item => {
      const linked = item.properties?.['Linked to Saree'] || '❌ None';
      console.log(`- ${item.title} | ${item.key} | Linked to: ${linked}`);
    });

    // Determine which lines to delete
    const linesToDelete = {};
    cart.items.forEach((item, index) => {
      const isParent = item.variant_id.toString() === parentVariantId;
      const isChild = item.properties?.['Linked to Saree'] === parentVariantId;
      if (isParent || isChild) {
        linesToDelete[index + 1] = 0; // Shopify line index starts at 1
      }
    });

    console.log("🧹 Items to delete:", linesToDelete);

    if (Object.keys(linesToDelete).length === 0) {
      console.warn("⚠️ No items matched for deletion.");
      return;
    }

    // Make /cart/change.js request
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates: linesToDelete })
    });

    if (!response.ok) {
      throw new Error(`cart/change.js failed: ${response.status}`);
    }

    console.log("✅ Deletion complete.");

    // Refresh logic
    if (context === 'drawer') {
      const drawerTrigger = document.querySelector('[data-drawer-options*="cart"]');
      if (drawerTrigger) {
        drawerTrigger.click(); // Simulate native drawer refresh
        console.log("🌀 Drawer refreshed.");
      } else {
        console.warn("⚠️ Drawer trigger not found. Reloading page as fallback.");
        location.reload();
      }
    } else {
      location.reload();
    }

  } catch (error) {
    console.error("❌ Error in handleCartRemove:", error);
  }
}
