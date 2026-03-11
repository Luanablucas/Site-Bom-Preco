document.addEventListener("DOMContentLoaded", async () => {
  const tituloPagina = document.getElementById("titulo-pagina");
  const breadcrumbSetor = document.getElementById("breadcrumb-setor");
  const tituloSetor = document.getElementById("titulo-setor");
  const menuCategorias = document.getElementById("menu-categorias");
  const grid = document.getElementById("produtos-grid");

  if (!tituloPagina || !breadcrumbSetor || !tituloSetor || !menuCategorias || !grid) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const setorId = params.get("setor");
  const categoriaAtiva = params.get("categoria") || "all";

  const setor = setoresConfig[setorId];

  if (!setor) {
    tituloPagina.textContent = "Setor não encontrado";
    grid.innerHTML = "<p>Setor não encontrado.</p>";
    return;
  }

  tituloPagina.textContent = setor.titulo;
  breadcrumbSetor.textContent = setor.titulo;
  tituloSetor.textContent = setor.titulo;

  menuCategorias.innerHTML = "";

  setor.categorias.forEach((categoria) => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    a.textContent = categoria.nome;
    a.href = `produtos-setor.html?setor=${encodeURIComponent(setorId)}&categoria=${encodeURIComponent(categoria.id)}`;
  

    if (categoria.id === categoriaAtiva) {
      a.classList.add("active");
    }

    li.appendChild(a);
    menuCategorias.appendChild(li);
  });

  grid.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const paramsApi = { sector: setorId };

    if (categoriaAtiva !== "all") {
      paramsApi.category = categoriaAtiva;
    }

    const produtos = await fetchProducts(paramsApi);

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
    grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
  }
});