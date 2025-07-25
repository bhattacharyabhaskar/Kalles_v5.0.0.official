async function handleCartRemove(event) {
  event.preventDefault();
  console.log("🧾 handleCartRemove triggered");

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;
  const context = button.dataset.context || 'cart'; // default to 'cart' if not provided
  console.log("🔑 Item key:", itemKey);
  console.log("🧭 Context:", context);

  // Extract variant ID from key
  const parentVariantId = itemKey.split(':')[0];
  console.log("🔗 Parent Variant ID:", parentVariantId);

  try {
    // Fetch current cart
    const cart = await fetch('/cart.js').then(res => res.json());
    console.log("📦 Cart fetched:", cart.items.length, "items");

    console.log("🔍 Cart items with their 'Linked to Saree' values:");
    cart.items.forEach(item => {
      const link = item.properties?.['Linked to Saree'] || '❌ None';
      console.log(`- ${item.title} | ${item.key} | Linked to: ${link}`);
    });

    // Find all items to remove (parent or linked)
    const itemsToDelete = cart.items.filter(item => {
      return (
        item.key === itemKey || 
        item.properties?.['Linked to Saree'] === parentVariantId
      );
    });

    console.log("🧹 Items to delete:", itemsToDelete);

    // Construct the payload
    const updates = {};
    itemsToDelete.forEach(item => {
      updates[item.line] = 0;
    });

    // Perform batch removal
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

    // Refresh cart drawer or cart page
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
