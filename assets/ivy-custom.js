async function handleCartRemove(event) {
  try {
    console.log('🧾 handleCartRemove triggered');

    const button = event.currentTarget;
    const itemKey = button.dataset.itemKey;
    const context = button.dataset.context || 'cart';

    console.log('🔑 Item key:', itemKey);
    console.log('🧭 Context:', context);

    // Extract parent variant ID from itemKey
    const parentVariantId = itemKey.split(':')[0];
    console.log('🔗 Parent Variant ID:', parentVariantId);

    // Fetch current cart state
    const cart = await fetch('/cart.js').then(res => res.json());
    console.log(`📦 Cart fetched: ${cart.items.length} items`);

    // Log cart items
    console.log('🔍 Cart items with their \'Linked to Saree\' values:');
    let linesToDelete = {};

    cart.items.forEach((item, index) => {
      const lineIndex = index + 1; // Shopify is 1-based
      const key = item.key;
      const variantId = item.variant_id.toString();
      const linkedTo = item.properties?.['Linked to Saree'];

      console.log(`- ${item.product_title} | ${key} | Linked to: ${linkedTo || '❌ None'}`);

      const isTarget = key === itemKey;
      const isLinkedAddon = linkedTo === parentVariantId;

      if (isTarget || isLinkedAddon) {
        linesToDelete[lineIndex] = 0;
        console.log(`🗑 Marking ${item.title} (line ${lineIndex}) for removal`);
      }
    });

    if (Object.keys(linesToDelete).length === 0) {
      console.warn('⚠️ No matching item(s) found to remove.');
      return;
    }

    console.log('🧹 Items to delete:', linesToDelete);

    // Perform the cart update
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: linesToDelete }),
    });

    if (!response.ok) throw new Error('cart/update.js failed: ' + response.status);

    console.log('✅ Deletion complete.');

    // Refresh cart
    if (context === 'drawer') {
      const trigger = document.querySelector('[data-drawer-options*="cart"]');
      if (trigger) {
        console.log('🔁 Reopening cart drawer');
        trigger.click();
      } else {
        console.warn('⚠️ Drawer trigger not found. Reloading page as fallback.');
        location.reload();
      }
    } else {
      console.log('🔃 Reloading cart page');
      location.reload();
    }
  } catch (err) {
    console.error('❌ Error in handleCartRemove:', err);
    alert('Something went wrong while removing the item(s). Please try again.');
  }
}
