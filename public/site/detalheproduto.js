function slugify(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

document.addEventListener("DOMContentLoaded", () => {
  const alvo = document.getElementById("produto-detalhe");
  if (!alvo) return;

  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").trim();

  if (!id || !id.includes("--")) {
    alvo.innerHTML = "<p>Produto não informado.</p>";
    return;
  }

  const [setorId, nomeSlug] = id.split("--");

  const setor = setores[setorId];
  if (!setor) {
    alvo.innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  const produto = setor.produtos.find(p => slugify(p.nome) === nomeSlug);
  if (!produto) {
    alvo.innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  const tituloPagina = document.getElementById("titulo-pagina");
  if (tituloPagina) tituloPagina.textContent = produto.nome;
  document.title = produto.nome;

 alvo.innerHTML = `
  <div class="produto-page">
    <div class="produto-page-img">
      <img src="${produto.imagem}" alt="${produto.nome}">
    </div>

    <div class="produto-page-info">
      <h1 class="produto-titulo">${produto.nome}</h1>

      <div class="produto-precos">
        ${produto.oferta && produto.precoAntigo ? `
          <span class="produto-preco-antigo">R$ ${String(produto.precoAntigo).trim()}</span>
        ` : ""}

        <span class="produto-preco">R$ ${String(produto.preco).trim()}</span>
      </div>

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
    id: `${setorId}--${slugify(produto.nome)}`,
    nome: produto.nome,
    preco: produto.preco,
    imagem: produto.imagem
  };

  window.Carrinho.addToCart(produtoCarrinho, 1);
 });
});