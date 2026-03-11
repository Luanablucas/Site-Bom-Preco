console.log("admin-products.js carregado");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado");

  const deleteForms = document.querySelectorAll(".delete-form");
  const deleteModal = document.getElementById("deleteModal");
  const deleteProductName = document.getElementById("deleteProductName");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const closeDeleteModal = document.getElementById("closeDeleteModal");

  let currentDeleteForm = null;

  function openDeleteModal(form, productName) {
    if (!deleteModal || !deleteProductName) return;

    currentDeleteForm = form;
    deleteProductName.textContent = productName || "este produto";
    deleteModal.classList.add("is-open");
    document.body.classList.add("modal-open");
  }

  function closeDeleteModalFn() {
    if (!deleteModal) return;

    deleteModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    currentDeleteForm = null;
  }

  deleteForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const productCard = form.closest("[data-product-card]");
      const productName = productCard?.dataset.productName || "este produto";

      openDeleteModal(form, productName);
    });
  });

  confirmDeleteBtn?.addEventListener("click", () => {
    if (currentDeleteForm) {
      currentDeleteForm.submit();
    }
  });

  cancelDeleteBtn?.addEventListener("click", closeDeleteModalFn);
  closeDeleteModal?.addEventListener("click", closeDeleteModalFn);

  deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModalFn();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && deleteModal?.classList.contains("is-open")) {
      closeDeleteModalFn();
    }
  });

  const stockControlsList = document.querySelectorAll("[data-stock-controls]");
  console.log("Controles de estoque encontrados:", stockControlsList.length);

  stockControlsList.forEach((controls) => {
    const productId = controls.dataset.productId;
    const productCard = controls.closest("[data-product-card]");

    const stockValueEl = productCard?.querySelector("[data-stock-value]");
    const stockBadgeEl = productCard?.querySelector("[data-stock-badge]");
    const stockInput = controls.querySelector("[data-stock-input]");
    const feedbackEl = controls.querySelector("[data-stock-feedback]");
    const buttons = controls.querySelectorAll("button");

    if (!productId || !stockValueEl || !stockBadgeEl || !stockInput || !feedbackEl) {
      return;
    }

    function updateBadge(stock) {
      stockBadgeEl.classList.remove("badge-danger", "badge-warning", "badge-success");

      if (stock <= 0) {
        stockBadgeEl.classList.add("badge-danger");
        stockBadgeEl.textContent = "Sem estoque";
      } else if (stock <= 10) {
        stockBadgeEl.classList.add("badge-warning");
        stockBadgeEl.textContent = "Estoque baixo";
      } else {
        stockBadgeEl.classList.add("badge-success");
        stockBadgeEl.textContent = "Em estoque";
      }
    }

    function setLoading(isLoading) {
      buttons.forEach((button) => {
        button.disabled = isLoading;
      });

      stockInput.disabled = isLoading;
    }

    async function updateStock(payload) {
      try {
        setLoading(true);
        feedbackEl.textContent = "";

        const response = await fetch(`/admin/products/${productId}/stock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar estoque.");
        }

        stockValueEl.textContent = data.stock;
        stockInput.value = data.stock;
        updateBadge(Number(data.stock));
        feedbackEl.textContent = "Estoque atualizado com sucesso.";
      } catch (error) {
        console.error(error);
        feedbackEl.textContent = error.message || "Erro ao atualizar estoque.";
      } finally {
        setLoading(false);
      }
    }

    controls.addEventListener("click", async (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const action = button.dataset.action;

      if (action === "increment" || action === "decrement") {
        const amount = Number(button.dataset.amount);

        if (!Number.isInteger(amount) || amount <= 0) {
          feedbackEl.textContent = "Quantidade inválida.";
          return;
        }

        await updateStock({ action, amount });
      }

      if (action === "set") {
        const stock = Number(stockInput.value);

        if (!Number.isInteger(stock) || stock < 0) {
          feedbackEl.textContent = "Digite um estoque válido.";
          return;
        }

        await updateStock({ action: "set", stock });
      }
    });
  });
});