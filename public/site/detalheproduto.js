function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const alvo = document.getElementById("produto-detalhe");
  if (!alvo) return;

  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").trim();

  if (!id) {
    alvo.innerHTML = "<p>Produto não informado.</p>";
    return;
  }

  try {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`);

    if (!response.ok) {
      if (response.status === 404) {
        alvo.innerHTML = "<p>Produto não encontrado.</p>";
        return;
      }

      throw new Error("Erro ao buscar produto.");
    }

    const data = await response.json();
    const produto = data.product;

    const tituloPagina = document.getElementById("titulo-pagina");
    if (tituloPagina) tituloPagina.textContent = produto.name;
    document.title = produto.name;

    alvo.innerHTML = `
      <div class="produto-page">
        <div class="produto-page-img">
          <img src="${produto.imageUrl || "imagens/sem-imagem.png"}" alt="${produto.name}">
        </div>

        <div class="produto-page-info">
          <h1 class="produto-titulo">${produto.name}</h1>

          <div class="produto-precos">
            ${
              produto.isOffer && produto.oldPrice
                ? `<span class="produto-preco-antigo">${formatPrice(produto.oldPrice)}</span>`
                : ""
            }

            <span class="produto-preco">${formatPrice(produto.price)}</span>
          </div>

          ${
            produto.description
              ? `<p class="produto-descricao">${produto.description}</p>`
              : ""
          }

          <div class="produto-acoes">
            <button class="btn-comprar btn-comprar-grande" type="button" id="btnComprarProduto">
              Comprar
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnComprarProduto")?.addEventListener("click", () => {
      const produtoCarrinho = {
        id: produto.id,
        nome: produto.name,
        precoCentavos: produto.priceCents,
        imagem: produto.imageUrl
      };

      window.Carrinho.addToCart(produtoCarrinho, 1);
    });
  } catch (error) {
    console.error(error);
    alvo.innerHTML = "<p>Erro ao carregar produto.</p>";
  }
});