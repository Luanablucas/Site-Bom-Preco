document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("ofertas-grid");
  if (!grid) return;

  grid.innerHTML = "<p>Carregando ofertas...</p>";

  try {
    const produtos = await fetchProducts({ offer: "true" });

    if (!produtos.length) {
      grid.innerHTML = "<p>Nenhuma oferta disponível no momento.</p>";
      return;
    }

    grid.innerHTML = "";

    produtos.forEach((produto) => {
      grid.appendChild(createProductCard(produto));
    });
  } catch (error) {
    console.error(error);
    grid.innerHTML = "<p>Erro ao carregar ofertas.</p>";
  }
});