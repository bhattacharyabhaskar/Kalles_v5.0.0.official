async function handleCartRemove(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;
  const context = button.dataset.context || 'page';

  if (!itemKey) {
    console.warn("🚫 No itemKey found on button.");
    return;
  }

  console.log(`🧾 handleCartRemove triggered`);
  console.log(`🔑 Item key: ${itemKey}`);
  console.log(`🧭 Context: ${context}`);

  try {
    // Step 1: Fetch current cart state
    const cart = await (await fetch('/cart.js')).json();
    console.log(`📦 Cart fetched: ${cart.items.length} items`);

    // Step 2: Identify parent item
    const parentItem = cart.items.find(item => item.key === itemKey);

    if (!parentItem) {
      console.warn("⚠️ Item not found in cart by key:", itemKey);
      return;
    }

    const linkedId = parentItem.variant_id;
    console.log(`🔗 Parent Variant ID: ${linkedId}`);
    console.log(`🔍 Cart items with their 'Linked to Saree' values:`);

    cart.items.forEach(item => {
      console.log(`- ${item.title} | ${item.key} | Linked to: ${item.properties?.['Linked to Saree'] || '❌ None'}`);
    });

    // Step 3: Identify all items to delete (parent + linked)
    const keysToDelete = cart.items
      .filter(item =>
        item.key === itemKey ||
        item.properties?.['Linked to Saree'] == linkedId
      )
      .map(item => ({ id: item.key, quantity: 0 }));

    console.log(`🧹 Items to delete:`, keysToDelete);

    // Step 4: Fire delete requests
    const deletePromises = keysToDelete.map(obj =>
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj),
      })
    );

    await Promise.all(deletePromises);
    console.log(`✅ Deletion complete.`);

    // Step 5: Refresh based on context
    if (context === 'drawer') {
      const cartTrigger = document.querySelector('[data-drawer-options*="cart"]');
      if (cartTrigger) {
        console.log("🧼 Refreshing cart drawer...");
        cartTrigger.click(); // Close
        setTimeout(() => {
          cartTrigger.click(); // Reopen
          console.log("📂 Drawer reopened.");
        }, 300);
      } else {
        console.warn("⚠️ Drawer trigger not found. Reloading page as fallback.");
        location.reload();
      }
    } else {
      console.log("🔄 Reloading cart page...");
      location.reload();
    }

  } catch (error) {
    console.error("❌ Error during item removal:", error);
  }
}
