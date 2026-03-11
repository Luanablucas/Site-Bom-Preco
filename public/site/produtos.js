function slugify(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const params = new URLSearchParams(window.location.search);
const setorId = (params.get("setor") || "").trim();
const SETOR = setores?.[setorId];

if (!SETOR) console.warn("Setor inválido ou não informado:", setorId);

document.addEventListener("DOMContentLoaded", () => {
  if (!SETOR) return;

  renderBreadcrumb();
  renderTitulo();
  renderMenu();
  renderProdutos();
  initFiltro();
});

function renderBreadcrumb() {
  document.getElementById("breadcrumb-setor").textContent = SETOR.breadcrumb[1];
}

function renderTitulo() {
  document.getElementById("titulo-setor").textContent = SETOR.titulo;
  document.getElementById("titulo-pagina").textContent = SETOR.titulo;
}

function renderMenu() {
  const menu = document.getElementById("menu-categorias");
  menu.innerHTML = "";

  SETOR.categorias.forEach((cat, index) => {
    const li = document.createElement("li");
    li.textContent = cat.nome;
    li.dataset.filter = cat.id;
    if (index === 0) li.classList.add("active");
    menu.appendChild(li);
  });
}

function renderProdutos() {
  const grid = document.getElementById("produtos-grid");
  grid.innerHTML = "";

  SETOR.produtos.forEach(prod => {
    const id = `${setorId}--${slugify(prod.nome)}`;

    const cardLink = document.createElement("a");
    cardLink.className = "destaque-card";
    cardLink.href = `detalheproduto.html?id=${encodeURIComponent(id)}`;
    cardLink.dataset.category = prod.categoria;

    cardLink.innerHTML = `
      <img src="${prod.imagem}" alt="${prod.nome}">
      <h3>${prod.nome}</h3>
      <p><span class="preco">R$ ${String(prod.preco).trim()}</span></p>
      <button class="btn-comprar" type="button">Comprar</button>
    `;

   
    cardLink.querySelector(".btn-comprar").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  window.Carrinho.addToCart({
    id,
    nome: prod.nome,
    preco: prod.preco,
    imagem: prod.imagem
  }, 1);
});

    grid.appendChild(cardLink);
  });
}

function initFiltro() {
  const menuItems = document.querySelectorAll(".sidebar-menu li");
  const produtos = document.querySelectorAll(".destaque-card");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const filtro = item.dataset.filter;

      produtos.forEach(p => {
        p.style.display =
          filtro === "all" || p.dataset.category === filtro
            ? "flex"
            : "none";
      });
    });
  });
}