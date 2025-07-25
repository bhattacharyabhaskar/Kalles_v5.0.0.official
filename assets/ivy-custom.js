async function handleCartRemove(event) {
  event.preventDefault();
  console.log("🧾 handleCartRemove triggered");

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;
  const context = button.dataset.context || 'cart';
  console.log("🔑 Item key:", itemKey);
  console.log("🧭 Context:", context);

  const parentVariantId = itemKey.split(':')[0];
  console.log("🔗 Parent Variant ID:", parentVariantId);

  try {
    const cart = await fetch('/cart.js').then(res => res.json());
    console.log("📦 Cart fetched:", cart.items.length, "items");

    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    cart.items.forEach(item => {
      const link = item.properties?.['Linked to Saree'] || '❌ None';
      console.log(`- ${item.title} | ${item.key} | Linked to: ${link}`);
    });

    // Get items to delete with their line numbers (index + 1)
    const itemsToDelete = cart.items.map((item, index) => {
      if (
        item.key === itemKey ||
        item.properties?.['Linked to Saree'] === parentVariantId
      ) {
        return { line: index + 1, key: item.key };
      }
      return null;
    }).filter(Boolean);

    console.log("🧹 Items to delete:", itemsToDelete);

    const updates = {};
    itemsToDelete.forEach(item => {
      updates[item.line] = 0;
    });

    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    });

    if (!response.ok) {
      throw new Error(`cart/change.js failed: ${response.status}`);
    }

    console.log("✅ Deletion complete.");

    if (context === 'drawer') {
      console.log("🔄 Refreshing cart drawer...");
      fetch('/?section_id=cart-drawer')
        .then(res => res.text())
        .then(html => {
          const tempDOM = document.createElement('div');
          tempDOM.innerHTML = html;

          const newItems = tempDOM.querySelector('.hdt-mini-cart__items');
          const currentItems = document.querySelector('.hdt-mini-cart__items');

          if (newItems && currentItems) {
            currentItems.innerHTML = newItems.innerHTML;
            console.log("✅ Drawer content updated.");
          } else {
            console.warn("⚠️ Drawer content missing. Reloading...");
            location.reload();
          }
        })
        .catch(err => {
          console.error("❌ Failed to refresh drawer:", err);
          location.reload();
        });

    } else {
      console.log("🔁 Reloading cart page...");
      location.reload();
    }

  } catch (err) {
    console.error("❌ Error in handleCartRemove:", err);
    location.reload();
  }
}
