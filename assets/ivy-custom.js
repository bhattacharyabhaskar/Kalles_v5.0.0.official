async function handleCartRemove(event) {
  console.log("🧩 handleCartRemove triggered");

  const button = event.currentTarget;

  const itemKeyToRemove = button.dataset.itemKey;
  if (!itemKeyToRemove) {
    console.warn("❌ itemKey missing");
    return;
  }

  const isFromDrawer = !!button.closest('.t4s-drawer');

  try {
    // Show loader if any
    const loader = document.getElementById('ivy-loader');
    if (loader) loader.style.display = 'block';

    // Fetch current cart
    const cart = await fetch('/cart.js').then(res => res.json());
    const items = cart.items;

    console.log("🧾 Initial cart contents:", items);

    const parentItem = items.find(item => item.key === itemKeyToRemove);
    if (!parentItem) {
      console.warn("❌ Parent item not found");
      if (loader) loader.style.display = 'none';
      return;
    }

    const parentVariantId = parentItem.variant_id;

    const updates = {
      [parentItem.key]: 0
    };

    for (const item of items) {
      if (item.properties?.['Linked to Saree'] && parseInt(item.properties['Linked to Saree']) === parentVariantId) {
        console.log(`🗑 Marking ${item.title} for removal`);
        updates[item.key] = 0;
      }
    }

    console.log("📤 Sending batch key-based update:", updates);

    const res = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ cart/update.js failed:", res.status, text);
    } else {
      console.log("✅ All items removed");

      if (isFromDrawer) {
        // Drawer context – refresh drawer content only
        const drawerRes = await fetch('/?sections=cart-drawer');
        const drawerData = await drawerRes.json();
        const drawerContainer = document.querySelector('[data-drawer-id="cart_drawer"]'); // adjust if needed
        if (drawerContainer && drawerData['cart-drawer']) {
          drawerContainer.innerHTML = drawerData['cart-drawer'];
          console.log("🔄 Drawer refreshed");
        }
      } else {
        // Full cart page – reload
        location.reload();
      }
    }
  } catch (err) {
    console.error("🚨 Exception in handleCartRemove:", err);
  }
}
