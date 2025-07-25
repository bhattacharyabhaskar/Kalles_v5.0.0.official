async function handleCartRemove(event) {
  console.log("🧾 handleCartRemove triggered");

  try {
    const button = event.currentTarget;
    const itemKey = button.dataset.itemKey;
    const context = button.dataset.context || 'cart'; // 'drawer' or 'cart'
    console.log("🔑 Item key:", itemKey);
    console.log("🧭 Context:", context);

    if (!itemKey) {
      console.error("❌ No itemKey found");
      return;
    }

    const parentVariantId = parseInt(itemKey.split(':')[0]);
    console.log("🔗 Parent Variant ID:", parentVariantId);

    // Show loading spinner if available
    const spinner = document.querySelector('#ivy-cart-loader');
    if (spinner) spinner.style.display = 'block';

    // Fetch cart data
    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();
    console.log("📦 Cart fetched:", cart.items.length, "items");

    const linesToDelete = {};
    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    cart.items.forEach((item, index) => {
      const linkedTo = item.properties?.['Linked to Saree'] || null;
      const currentKey = item.key;
      const isParent = item.variant_id === parentVariantId;
      const isAddon = linkedTo == parentVariantId;

      console.log(`- ${item.product_title} | ${currentKey} | Linked to: ${linkedTo || '❌ None'}`);

      if (isParent || isAddon) {
        linesToDelete[index + 1] = 0;
      }
    });

    console.log("🧹 Items to delete:", linesToDelete);

    const totalCartItems = cart.items.length;
    const totalToRemove = Object.keys(linesToDelete).length;

    if (totalToRemove === totalCartItems) {
      console.warn("⚠️ All items being removed. Using /cart/clear.js to avoid 400.");
      await fetch('/cart/clear.js', { method: 'POST' });
    } else {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: linesToDelete }),
      });

      if (!res.ok) throw new Error(`cart/change.js failed: ${res.status}`);
    }

    console.log("✅ Deletion complete.");

    // Hide spinner if visible
    if (spinner) spinner.style.display = 'none';

    // Refresh cart drawer or cart page
    if (context === 'drawer') {
      const drawerTrigger = document.querySelector('[data-drawer-options*="cart"]');
      if (drawerTrigger) {
        console.log("🔄 Refreshing drawer by clicking cart trigger");
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
  }
}
