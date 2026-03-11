document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("produtos-grid");
  const titulo = document.getElementById("titulo-busca");

  if (!grid || !titulo) return;

  const params = new URLSearchParams(window.location.search);
  const termo = (params.get("q") || "").trim();

  if (!termo) {
    titulo.textContent = "Nenhum termo informado";
    grid.innerHTML = "<p>Nenhum produto para mostrar.</p>";
    return;
  }

  titulo.textContent = `Resultados para: "${termo}"`;
  grid.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const produtos = await fetchProducts({ search: termo });

    if (!produtos.length) {
      grid.innerHTML = "<p>Nenhum produto encontrado.</p>";
      return;
    }

    grid.innerHTML = "";

    produtos.forEach((produto) => {
      grid.appendChild(createProductCard(produto));
    });
  } catch (error) {
    console.error(error);
    grid.innerHTML = "<p>Erro ao buscar produtos.</p>";
  }
});