document.addEventListener("DOMContentLoaded", () => {
  const itensEl = document.getElementById("carrinho-itens");
  const totalEl = document.getElementById("carrinho-total");
  const btnLimpar = document.getElementById("btnLimparCarrinho");

  function render() {
    const items = window.Carrinho.getCartItemsArray();
    itensEl.innerHTML = "";

    if (items.length === 0) {
      itensEl.innerHTML = "<p>Seu carrinho está vazio.</p>";
      totalEl.textContent = window.Carrinho.centavosParaBRL(0);
      return;
    }

    items.forEach(item => {
      const linha = document.createElement("div");
      linha.className = "carrinho-item";

      linha.innerHTML = `
        <img class="carrinho-item-img" src="${item.imagem}" alt="${item.nome}">
        <div class="carrinho-item-info">
          <h3>${item.nome}</h3>
          <p class="carrinho-preco">${window.Carrinho.centavosParaBRL(item.precoCentavos)}</p>

          <div class="carrinho-qtd">
            <button class="qtd-btn" data-action="minus">-</button>
            <input class="qtd-input" type="number" min="1" value="${item.qtd}">
            <button class="qtd-btn" data-action="plus">+</button>
          </div>

          <button class="carrinho-remover">Remover</button>
        </div>

        <div class="carrinho-subtotal">
          ${window.Carrinho.centavosParaBRL(item.precoCentavos * item.qtd)}
        </div>
      `;

      // Quantidade

      const input = linha.querySelector(".qtd-input");
      const btnMinus = linha.querySelector('[data-action="minus"]');
      const btnPlus = linha.querySelector('[data-action="plus"]');

      btnMinus.addEventListener("click", () => {
        window.Carrinho.setItemQty(item.id, item.qtd - 1);
        render();
      });

      btnPlus.addEventListener("click", () => {
        window.Carrinho.setItemQty(item.id, item.qtd + 1);
        render();
      });

      input.addEventListener("change", () => {
        window.Carrinho.setItemQty(item.id, input.value);
        render();
      });

      // Remover item

      linha.querySelector(".carrinho-remover").addEventListener("click", () => {
        window.Carrinho.removeFromCart(item.id);
        render();
      });

      itensEl.appendChild(linha);
    });

    totalEl.textContent = window.Carrinho.centavosParaBRL(
      window.Carrinho.getCartTotalCentavos()
    );
  }

  btnLimpar?.addEventListener("click", () => {
    window.Carrinho.clearCart();
    render();
  });

  render();

  document.getElementById("btnFinalizarCompra")?.addEventListener("click", () => {
    if (!window.Auth?.isLoggedIn?.()) {
      window.openModal?.("login-template");
      return;
    }

    alert("Finalizar compra (próximo passo)");
  });
});