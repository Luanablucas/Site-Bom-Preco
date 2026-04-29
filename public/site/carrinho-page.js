document.addEventListener("DOMContentLoaded", () => {
  const itensEl = document.getElementById("carrinho-itens");
  const subtotalEl = document.getElementById("carrinho-subtotal");
  const freteEl = document.getElementById("carrinho-frete");
  const totalEl = document.getElementById("carrinho-total");

  const tipoEntregaInputs = document.querySelectorAll('input[name="tipoEntrega"]');

  const btnLimpar = document.getElementById("btnLimparCarrinho");
  const cepEntrega = document.getElementById("cepEntrega");
  const btnCalcularEntrega = document.getElementById("btnCalcularEntrega");
  const entregaResultado = document.getElementById("entregaResultado");
  const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");

  let tipoEntrega = "delivery";
  let entregaCalculada = false;
  let freteCentavos = 0;

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function showDeliveryMessage(message, type = "info") {
    entregaResultado.hidden = false;
    entregaResultado.className = `entrega-card ${type}`;
    entregaResultado.innerHTML = message;
  }

  function clearDeliveryMessage() {
    entregaResultado.hidden = true;
    entregaResultado.innerHTML = "";
  }

  function updateCheckoutButton() {
    if (!btnFinalizarCompra) return;

    if (tipoEntrega === "pickup") {
      btnFinalizarCompra.disabled = false;
      return;
    }

    btnFinalizarCompra.disabled = !entregaCalculada;
  }

  function updateResumo() {
    const subtotalCentavos = window.Carrinho.getCartTotalCentavos();
    const totalCentavos = subtotalCentavos + freteCentavos;

    subtotalEl.textContent = window.Carrinho.centavosParaBRL(subtotalCentavos);
    freteEl.textContent = window.Carrinho.centavosParaBRL(freteCentavos);
    totalEl.textContent = window.Carrinho.centavosParaBRL(totalCentavos);
  }

  function resetDelivery() {
    entregaCalculada = false;
    freteCentavos = 0;
    updateResumo();
    updateCheckoutButton();
  }

  function render() {
    const items = window.Carrinho.getCartItemsArray();
    itensEl.innerHTML = "";

    if (items.length === 0) {
      itensEl.innerHTML = "<p>Seu carrinho está vazio.</p>";
      freteCentavos = 0;
      entregaCalculada = false;
      updateResumo();
      updateCheckoutButton();
      return;
    }

    items.forEach((item) => {
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

      linha.querySelector(".carrinho-remover").addEventListener("click", () => {
        window.Carrinho.removeFromCart(item.id);
        render();
      });

      itensEl.appendChild(linha);
    });

    updateResumo();
    updateCheckoutButton();
  }

  tipoEntregaInputs.forEach((input) => {
    input.addEventListener("change", () => {
      tipoEntrega = input.value;

      if (tipoEntrega === "pickup") {
        entregaCalculada = true;
        freteCentavos = 0;
        cepEntrega.value = "";

        showDeliveryMessage(
          `
            <p class="entrega-titulo">Retirada selecionada</p>
            <p>Você poderá retirar seu pedido diretamente no mercado.</p>
            <p><strong>Frete:</strong> R$ 0,00</p>
          `,
          "success"
        );

        updateResumo();
        updateCheckoutButton();
        return;
      }

      resetDelivery();
      clearDeliveryMessage();
    });
  });

  cepEntrega?.addEventListener("input", () => {
    if (tipoEntrega !== "delivery") return;

    entregaCalculada = false;
    freteCentavos = 0;
    updateResumo();
    updateCheckoutButton();
  });

  btnLimpar?.addEventListener("click", () => {
    window.Carrinho.clearCart();
    resetDelivery();
    clearDeliveryMessage();
    render();
  });

  btnCalcularEntrega?.addEventListener("click", async () => {
    tipoEntrega = "delivery";

    const deliveryRadio = document.querySelector('input[name="tipoEntrega"][value="delivery"]');
    if (deliveryRadio) deliveryRadio.checked = true;

    const cep = onlyNumbers(cepEntrega.value);

    if (cep.length !== 8) {
      resetDelivery();
      showDeliveryMessage("Digite um CEP válido com 8 números.", "error");
      return;
    }

    try {
      showDeliveryMessage("Calculando entrega...", "loading");

      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const viaCepData = await viaCepRes.json();

      if (viaCepData.erro) {
        resetDelivery();
        showDeliveryMessage("CEP não encontrado.", "error");
        return;
      }

      const res = await fetch("/api/checkout/shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          neighborhood: viaCepData.bairro,
          city: viaCepData.localidade
        })
      });

      const data = await res.json();

      if (!res.ok || !data.shipping?.available) {
        resetDelivery();
        showDeliveryMessage(
          data.shipping?.message || data.error || "Entrega indisponível.",
          "error"
        );
        return;
      }

      const fee = Number(data.shipping.deliveryFee).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

      freteCentavos = Math.round(Number(data.shipping.deliveryFee) * 100);
      entregaCalculada = true;
      updateResumo();
      updateCheckoutButton();

      const enderecoCompleto = [
        viaCepData.logradouro,
        viaCepData.bairro,
        viaCepData.localidade,
        viaCepData.uf,
        viaCepData.cep
      ]
        .filter(Boolean)
        .join(" - ");

      showDeliveryMessage(
        `
          <p class="entrega-titulo">Entrega disponível</p>

          <p>
            <strong>Endereço:</strong><br>
            ${enderecoCompleto}
          </p>

          <div class="entrega-numero">
            <label for="numeroEntrega">Número / complemento</label>
            <input
              type="text"
              id="numeroEntrega"
              placeholder="Ex: 120, Apto 302, Bloco B"
            >
          </div>

          <p><strong>Frete:</strong> ${fee}</p>
          <p><strong>Prazo:</strong> ${data.shipping.estimatedDelivery}</p>
        `,
        "success"
      );
    } catch (error) {
      console.error("Erro ao calcular entrega:", error);
      resetDelivery();
      showDeliveryMessage("Erro ao calcular entrega.", "error");
    }
  });

  btnFinalizarCompra?.addEventListener("click", async () => {
    const items = window.Carrinho.getCartItemsArray();

    if (items.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    if (tipoEntrega === "delivery" && !entregaCalculada) {
      alert("Calcule o frete antes de finalizar a compra.");
      cepEntrega.focus();
      return;
    }

    if (tipoEntrega === "delivery") {
      const numeroEntrega = document.getElementById("numeroEntrega")?.value.trim();

      if (!numeroEntrega) {
        alert("Informe o número ou complemento da entrega.");
        document.getElementById("numeroEntrega")?.focus();
        return;
      }
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Você precisa entrar ou criar uma conta para finalizar a compra.");
        window.openModal?.("login-template");
        return;
      }

      if (!res.ok) {
        alert(data.error || "Erro ao iniciar checkout.");
        return;
      }

      alert("Checkout liberado. Próximo passo: página de entrega/pagamento.");
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      alert("Erro ao iniciar checkout.");
    }
  });

  render();
  updateCheckoutButton();
});