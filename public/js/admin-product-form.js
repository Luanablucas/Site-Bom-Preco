console.log("admin-product-form.js carregado");

document.addEventListener("DOMContentLoaded", () => {
  const subcategoriesBySector = {
    frios: [
      { value: "queijos", label: "Queijos" },
      { value: "iogurtes", label: "Iogurtes" },
      { value: "fatiados", label: "Fatiados" },
      { value: "manteiga", label: "Manteiga e margarina" },
      { value: "diversos", label: "Diversos" }
    ],
    carnes: [
      { value: "aves", label: "Aves" },
      { value: "bovino", label: "Bovinos" },
      { value: "suinos", label: "Suínos" },
      { value: "frutosdomar", label: "Frutos do mar" }
    ],
    bebidas: [
      { value: "achocolatado", label: "Achocolatados" },
      { value: "leite", label: "Leite" },
      { value: "agua", label: "Água" },
      { value: "cafe", label: "Cafés e capuccinos" },
      { value: "refrigerante", label: "Refrigerantes" },
      { value: "suco", label: "Sucos e chás" },
      { value: "energetico", label: "Energéticos" },
      { value: "alcoolicas", label: "Alcoólicas" }
    ],
    hortifruti: [
      { value: "frutas", label: "Frutas" },
      { value: "legumes", label: "Legumes" },
      { value: "ovos", label: "Ovos" },
      { value: "hortalicas", label: "Hortaliças" }
    ],
    limpeza: [
      { value: "banheiro", label: "Banheiro" },
      { value: "cozinha", label: "Cozinha" },
      { value: "casa", label: "Casa" },
      { value: "lavanderia", label: "Lavanderia" },
      { value: "automotivo", label: "Automotivo" }
    ],
    padaria: [
      { value: "paes", label: "Pães e torradas" },
      { value: "bolos", label: "Bolos" }
    ],
    higieneebeleza: [
      { value: "cabelo", label: "Cabelo" },
      { value: "corpo", label: "Corpo e rosto" },
      { value: "maos", label: "Mãos e pés" },
      { value: "maquiagem", label: "Maquiagem" },
      { value: "higiene", label: "Higiene pessoal" }
    ],
    biscoitosedoces: [
      { value: "biscoitos", label: "Biscoitos" },
      { value: "chocolates", label: "Chocolates" },
      { value: "doces", label: "Doces" },
      { value: "balas", label: "Balas, gomas e confeitos" }
    ],
    petshop: [
      { value: "racoes", label: "Rações" },
      { value: "banho", label: "Banho e higiene" },
      { value: "acessorios", label: "Acessórios" }
    ],
    temperos: [
      { value: "sal", label: "Sal e caldo" },
      { value: "pimenta", label: "Pimenta e molhos" },
      { value: "condimentos", label: "Condimentos" },
      { value: "tempero", label: "Tempero completo" }
    ],
    utilidades: [
      { value: "utilidades", label: "Utilidades" }
    ],
    congelados: [
      { value: "sorvetes", label: "Sorvetes" },
      { value: "prontos", label: "Pratos prontos" },
      { value: "empanados", label: "Empanados e petiscos" },
      { value: "polpas", label: "Polpas" }
    ],
    basicos: [
      { value: "acucar", label: "Açúcar e adoçantes" },
      { value: "arroz", label: "Arroz e feijão" },
      { value: "farinha", label: "Farinha e massas" },
      { value: "enlatados", label: "Enlatados" },
      { value: "diversos", label: "Diversos" }
    ]
  };

  const imageInput = document.getElementById("image");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewText = document.getElementById("imagePreviewText");

  function updateImagePreview() {
    if (!imageInput || !imagePreview || !imagePreviewText) return;

    const file = imageInput.files?.[0];

    if (!file) {
      if (imagePreview.getAttribute("src")) {
        imagePreview.style.display = imagePreview.src ? "block" : "none";
        imagePreviewText.style.display = imagePreview.src ? "none" : "block";
        if (!imagePreview.src) {
          imagePreviewText.textContent = "Nenhuma imagem informada.";
        }
      } else {
        imagePreview.style.display = "none";
        imagePreview.removeAttribute("src");
        imagePreviewText.style.display = "block";
        imagePreviewText.textContent = "Nenhuma imagem informada.";
      }
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function (event) {
      imagePreview.src = event.target.result;
      imagePreview.style.display = "block";
      imagePreviewText.style.display = "none";
    };

    fileReader.readAsDataURL(file);
  }

  if (imageInput && imagePreview && imagePreviewText) {
    imageInput.addEventListener("change", updateImagePreview);

    imagePreview.addEventListener("error", () => {
      imagePreview.style.display = "none";
      imagePreviewText.style.display = "block";
      imagePreviewText.textContent = "Não foi possível carregar a imagem.";
    });
  }

  const isOfferSelect = document.getElementById("is_offer");
  const oldPriceInput = document.getElementById("old_price");

  function toggleOldPriceField() {
    if (!isOfferSelect || !oldPriceInput) return;

    const isOffer = isOfferSelect.value === "true";
    oldPriceInput.disabled = !isOffer;

    if (!isOffer) {
      oldPriceInput.value = "";
    }
  }

  if (isOfferSelect && oldPriceInput) {
    isOfferSelect.addEventListener("change", toggleOldPriceField);
    toggleOldPriceField();
  }

  const sectorSelect = document.getElementById("sector");
  const categorySelect = document.getElementById("category");

  function renderSubcategories() {
    if (!sectorSelect || !categorySelect) return;

    const selectedSector = sectorSelect.value;
    const savedCategory = categorySelect.dataset.selected || "";
    const options = subcategoriesBySector[selectedSector] || [];

    categorySelect.innerHTML = "";

    if (!selectedSector) {
      categorySelect.disabled = true;
      categorySelect.innerHTML = '<option value="">Selecione um setor primeiro</option>';
      return;
    }

    categorySelect.disabled = false;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione uma subcategoria";
    placeholder.disabled = true;
    placeholder.selected = !savedCategory;
    categorySelect.appendChild(placeholder);

    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;

      if (item.value === savedCategory) {
        option.selected = true;
      }

      categorySelect.appendChild(option);
    });
  }

  if (sectorSelect && categorySelect) {
    sectorSelect.addEventListener("change", () => {
      categorySelect.dataset.selected = "";
      renderSubcategories();
    });

    renderSubcategories();
  }
});