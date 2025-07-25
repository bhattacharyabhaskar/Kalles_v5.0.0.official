async function handleCartRemove(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;

  if (!itemKey) {
    console.error("❌ No item key found.");
    return;
  }

  // Show loading spinner on the button
  button.classList.add('loading');

  try {
    // Fetch the cart first to get all items
    const cartResponse = await fetch('/cart.js');
    const cartData = await cartResponse.json();

    // Determine if it's a parent item
    const parentItem = cartData.items.find(item => item.key === itemKey);
    const linkedId = parentItem?.variant_id;

    // Prepare list of keys to delete (parent + linked addons)
    const keysToDelete = cartData.items
      .filter(item => item.key === itemKey || item.properties?.['Linked to Saree'] == linkedId)
      .map(item => ({ id: item.key, quantity: 0 }));

    const deletePromises = keysToDelete.map(obj =>
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: obj.id, quantity: obj.quantity }),
      })
    );

    await Promise.all(deletePromises);

    // Determine context: Drawer or Page
    const inDrawer = document.querySelector('cart-items-component') !== null;

    if (inDrawer) {
      // Refresh cart drawer without closing
      if (window.T4SThemeSP && window.T4SThemeSP.CartDrawer) {
        window.T4SThemeSP.CartDrawer.updateCart(); // for T4S-based themes
      } else {
        document.querySelector('[data-drawer-options*="cart"]')?.click(); // fallback
      }
    } else {
      // Reload cart page
      location.reload();
    }

  } catch (error) {
    console.error("❌ Failed to remove item(s):", error);
  } finally {
    button.classList.remove('loading');
  }
}
