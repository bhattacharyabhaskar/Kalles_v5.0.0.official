async function handleCartRemove(event) {
  try {
    console.log("🧾 handleCartRemove triggered");

    const button = event.currentTarget;
    const itemKey = button.dataset.itemKey;
    const context = button.dataset.context || 'cart';

    console.log("🔑 Item key:", itemKey);
    console.log("🧭 Context:", context);

    if (!itemKey) throw new Error("Missing item key");

    // Extract variant ID from key
    const parentVariantId = itemKey.split(":")[0];
    console.log("🔗 Parent Variant ID:", parentVariantId);

    // Show loading spinner (optional)
    document.body.style.cursor = 'wait';

    // Fetch current cart
    const cartResponse = await fetch('/cart.js');
    const cart = await cartResponse.json();
    console.log(`📦 Cart fetched: ${cart.items.length} items`);

    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    const itemsToRemove = {};
    cart.items.forEach((item, index) => {
      const linkedTo = item.properties?.['Linked to Saree'] || null;
      console.log(`- ${item.product_title} | ${item.key} | Linked to: ${linkedTo || '❌ None'}`);

      if (item.key === itemKey) {
        console.log(`🗑 Marking ${item.product_title} for removal`);
        itemsToRemove[index + 1] = 0;
      }

      // If clicked item is a parent, also remove its addons
      if (item.key === itemKey && !linkedTo) {
        cart.items.forEach((childItem, idx) => {
          if (childItem.properties?.['Linked to Saree'] == parentVariantId) {
            console.log(`🗑 Marking linked item ${childItem.product_title} for removal`);
            itemsToRemove[idx + 1] = 0;
          }
        });
      }
    });

    if (Object.keys(itemsToRemove).length === 0) {
      console.warn("⚠️ No items to remove.");
      document.body.style.cursor = 'default';
      return;
    }

    console.log("🧹 Items to delete:", itemsToRemove);

    const res = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: itemsToRemove }),
    });

    if (!res.ok) {
      throw new Error('cart/update.js failed: ' + res.status);
    }

    console.log("✅ Deletion complete.");

    // Refresh drawer or cart page
    if (context === "drawer") {
      if (window.T4SThemeSP?.Drawer?.open) {
        console.log("🔄 Refreshing drawer via T4SThemeSP.Drawer.open()");
        window.T4SThemeSP.Drawer.open('[data-drawer-id="cart_drawer"]');
      } else {
        console.warn("⚠️ T4S drawer API not available. Reloading as fallback.");
        window.location.reload();
      }
    } else {
      console.log("🔄 Reloading cart page");
      window.location.reload();
    }

  } catch (err) {
    console.error("❌ Error in handleCartRemove:", err);
    alert("Something went wrong while removing the item(s). Please try again.");
    window.location.reload();
  } finally {
    document.body.style.cursor = 'default';
  }
}
