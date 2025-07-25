async function handleCartRemove(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const itemKey = button.dataset.itemKey;
  const context = button.dataset.context || 'page'; // default to page if not defined

  if (!itemKey) {
    console.error("❌ No item key found.");
    return;
  }

  // Optional: show spinner or disable button
  button.classList.add('loading');

  try {
    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();

    const parentItem = cart.items.find(item => item.key === itemKey);
    const linkedId = parentItem?.variant_id;

    const keysToDelete = cart.items
      .filter(item => item.key === itemKey || item.properties?.['Linked to Saree'] == linkedId)
      .map(item => ({ id: item.key, quantity: 0 }));

    const deleteRequests = keysToDelete.map(obj =>
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj),
      })
    );

    await Promise.all(deleteRequests);

    // ✅ Handle UI update
    if (context === 'drawer') {
      if (window.T4SThemeSP?.CartDrawer?.updateCart) {
        window.T4SThemeSP.CartDrawer.updateCart();
      } else {
        document.querySelector('[data-drawer-options*="cart"]')?.click();
      }
    } else {
      location.reload();
    }

  } catch (err) {
    console.error("🚨 Remove failed:", err);
  } finally {
    button.classList.remove('loading');
  }
}
