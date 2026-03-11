const CART_KEY = "carrinho_v1";

function brlParaCentavos(valor) {

  const s = String(valor || "").trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function centavosParaBRL(cents) {
  const n = (Number(cents || 0) / 100).toFixed(2).replace(".", ",");
  return `R$ ${n}`;
}

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: {} };
  } catch {
    return { items: {} };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartItemsArray() {
  const cart = getCart();
  return Object.values(cart.items);
}

function getCartCount() {
  const items = getCartItemsArray();
  return items.reduce((acc, item) => acc + (item.qtd || 0), 0);
}

function getCartTotalCentavos() {
  const items = getCartItemsArray();
  return items.reduce((acc, item) => acc + (item.precoCentavos * item.qtd), 0);
}

function updateCartBadge() {
  const badge = document.querySelector(".cart-count");
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = String(count);

  if (count > 0) {
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}


function addToCart(produto, qtd = 1) {
  if (!produto || !produto.id) return;

  const cart = getCart();
  const existing = cart.items[produto.id];

  if (existing) {
    existing.qtd += qtd;
  } else {
    cart.items[produto.id] = {
      id: produto.id,
      nome: produto.nome,
      imagem: produto.imagem,
      precoCentavos: brlParaCentavos(produto.preco),
      qtd: qtd
    };
  }

  // trava mínimo 1
  cart.items[produto.id].qtd = Math.max(1, cart.items[produto.id].qtd);

  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart.items[id];
  saveCart(cart);
  updateCartBadge();
}

function setItemQty(id, qtd) {
  const cart = getCart();
  if (!cart.items[id]) return;

  const q = Math.max(1, parseInt(qtd, 10) || 1);
  cart.items[id].qtd = q;

  saveCart(cart);
  updateCartBadge();
}

function clearCart() {
  saveCart({ items: {} });
  updateCartBadge();
}

// deixa disponível globalmente pra você chamar de qualquer JS
window.Carrinho = {
  addToCart,
  removeFromCart,
  setItemQty,
  clearCart,
  getCartItemsArray,
  getCartCount,
  getCartTotalCentavos,
  centavosParaBRL,
  updateCartBadge
};

// badge certo assim que a página abrir
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});