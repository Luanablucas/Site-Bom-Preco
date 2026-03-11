async function fetchProducts(params = {}) {
  const url = new URL("/api/products", window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar produtos.");
  }

  const data = await response.json();

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error("Resposta inválida da API.");
  }

  return data.products;
}

function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function createProductCard(product) {
  const card = document.createElement("a");
  card.className = "destaque-card";
  card.href = `detalheproduto.html?id=${encodeURIComponent(product.id)}`;

  card.innerHTML = `
    <img src="${product.imageUrl || "imagens/sem-imagem.png"}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p>
      <span class="preco">${formatPrice(product.price)}</span>
      ${product.oldPrice
      ? `<span class="preco-antigo">${formatPrice(product.oldPrice)}</span>`
      : ""
    }
    </p>
    <button class="btn-comprar" type="button">Comprar</button>
  `;

  const btn = card.querySelector(".btn-comprar");

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.Carrinho?.addToCart) {
      window.Carrinho.addToCart(
        {
          id: product.id,
          nome: product.name,
          precoCentavos: product.priceCents,
          imagem: product.imageUrl,
        },
        1
      );
    }
  });

  return card;
}