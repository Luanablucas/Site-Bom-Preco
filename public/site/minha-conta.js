let currentUser = null;
let currentAddress = null;

document.addEventListener("DOMContentLoaded", async () => {
  const btnEditar = document.getElementById("btnEditarPerfil");
  const btnSalvar = document.getElementById("btnSalvarPerfil");
  const btnCancelar = document.getElementById("btnCancelarPerfil");

  const perfilView = document.getElementById("perfilView");
  const perfilEdit = document.getElementById("perfilEdit");

  const editName = document.getElementById("editName");
  const editPhone = document.getElementById("editPhone");

  const btnEditarEndereco = document.getElementById("btnEditarEndereco");
  const btnSalvarEndereco = document.getElementById("btnSalvarEndereco");
  const btnCancelarEndereco = document.getElementById("btnCancelarEndereco");

  const enderecoView = document.getElementById("enderecoView");
  const enderecoEdit = document.getElementById("enderecoEdit");

  const editCep = document.getElementById("editCep");
  const editStreet = document.getElementById("editStreet");
  const editNeighborhood = document.getElementById("editNeighborhood");
  const editCity = document.getElementById("editCity");
  const editState = document.getElementById("editState");
  const editNumber = document.getElementById("editNumber");
  const editComplement = document.getElementById("editComplement");

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function setError(input, errorId, message) {
    const errorEl = document.getElementById(errorId);

    if (errorEl) errorEl.textContent = message || "";

    if (input) {
      input.classList.toggle("input-error", Boolean(message));
    }
  }

  //// Validações

  function validateEditName() {
    const valid = editName.value.trim().replace(/\s+/g, " ").length >= 3;

    setError(editName, "editNameError", valid ? "" : "Informe um nome válido.");
    return valid;
  }

  function validateEditPhone() {
    editPhone.value = onlyNumbers(editPhone.value);

    const valid =
      editPhone.value.length === 10 || editPhone.value.length === 11;

    setError(
      editPhone,
      "editPhoneError",
      valid ? "" : "Informe um telefone válido com DDD.",
    );

    return valid;
  }

  function validateEditCep() {
    editCep.value = onlyNumbers(editCep.value);

    const valid = editCep.value.length === 8;

    setError(editCep, "editCepError", valid ? "" : "CEP deve ter 8 dígitos.");
    return valid;
  }

  function validateEditStreet() {
    const valid = editStreet.value.trim().length >= 2;

    setError(editStreet, "editStreetError", valid ? "" : "Informe a rua.");
    return valid;
  }

  function validateEditNeighborhood() {
    const valid = editNeighborhood.value.trim().length >= 2;

    setError(
      editNeighborhood,
      "editNeighborhoodError",
      valid ? "" : "Informe o bairro.",
    );

    return valid;
  }

  function validateEditCity() {
    const valid = editCity.value.trim().length >= 2;

    setError(editCity, "editCityError", valid ? "" : "Informe a cidade.");
    return valid;
  }

  function validateEditNumber() {
  editNumber.value = editNumber.value.trimStart();
  return true;
}

  function validateEditState() {
    editState.value = editState.value.trim().toUpperCase();

    const valid = /^[A-Z]{2}$/.test(editState.value);

    setError(
      editState,
      "editStateError",
      valid ? "" : "Informe a UF com 2 letras.",
    );

    return valid;
  }

  //// Render

  function renderAccount(user, address) {
    document.getElementById("accountName").textContent = user?.name || "-";
    document.getElementById("accountEmail").textContent = user?.email || "-";
    document.getElementById("accountCpfCnpj").textContent =
      user?.cpf_cnpj || "-";
    document.getElementById("accountPhone").textContent = user?.phone || "-";
    document.getElementById("accountNumber").textContent =
      address?.number || "-";

    document.getElementById("accountCep").textContent = address?.cep || "-";
    document.getElementById("accountStreet").textContent =
      address?.street || "-";
    document.getElementById("accountNeighborhood").textContent =
      address?.neighborhood || "-";
    document.getElementById("accountCity").textContent = address?.city || "-";
    document.getElementById("accountState").textContent = address?.state || "-";
    document.getElementById("accountComplement").textContent =
      address?.complement || "-";
  }

  function fillProfileForm(user) {
    editName.value = user?.name || "";
    editPhone.value = user?.phone || "";
  }

  function fillAddressForm(address) {
    editCep.value = address?.cep || "";
    editStreet.value = address?.street || "";
    editNeighborhood.value = address?.neighborhood || "";
    editCity.value = address?.city || "";
    editState.value = address?.state || "";
    editNumber.value = address?.number || "";
    editComplement.value = address?.complement || "";
  }

  //// Eventos Input

  editName?.addEventListener("input", validateEditName);
  editPhone?.addEventListener("input", validateEditPhone);
  editCep?.addEventListener("input", () => {
    editCep.value = onlyNumbers(editCep.value).slice(0, 8);
    setError(editCep, "editCepError", "");
  });
  editStreet?.addEventListener("input", validateEditStreet);
  editNeighborhood?.addEventListener("input", validateEditNeighborhood);
  editCity?.addEventListener("input", validateEditCity);
  editState?.addEventListener("input", validateEditState);
  editNumber?.addEventListener("input", validateEditNumber);

  try {
    const res = await fetch("/api/account");

    if (res.status === 401) {
      alert("Faça login para acessar sua conta.");
      window.location.href = "index.html";
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao carregar conta.");
      return;
    }

    currentUser = data.user;
    currentAddress = data.address;

    renderAccount(currentUser, currentAddress);
  } catch (error) {
    console.error("Erro ao carregar conta:", error);
    alert("Erro ao carregar conta.");
    return;
  }

  //// Perfil

  btnEditar?.addEventListener("click", () => {
    fillProfileForm(currentUser);
    perfilView.style.display = "none";
    perfilEdit.style.display = "block";
  });

  btnCancelar?.addEventListener("click", () => {
    perfilView.style.display = "block";
    perfilEdit.style.display = "none";
  });

  btnSalvar?.addEventListener("click", async () => {
    const valid = validateEditName() & validateEditPhone();
    if (!valid) return;

    const name = editName.value.trim().replace(/\s+/g, " ");
    const phone = onlyNumbers(editPhone.value);

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao salvar.");
        return;
      }

      currentUser.name = name;
      currentUser.phone = phone;

      renderAccount(currentUser, currentAddress);

      perfilView.style.display = "block";
      perfilEdit.style.display = "none";

      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar.");
    }
  });

  //// Endereço

  btnEditarEndereco?.addEventListener("click", () => {
    fillAddressForm(currentAddress);
    enderecoView.style.display = "none";
    enderecoEdit.style.display = "block";
  });

  btnCancelarEndereco?.addEventListener("click", () => {
    enderecoView.style.display = "block";
    enderecoEdit.style.display = "none";
  });

  async function fetchAddressByCep(cep) {
    const cleanCep = onlyNumbers(cep);

    if (cleanCep.length !== 8) {
      throw new Error("CEP deve ter 8 dígitos.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      throw new Error("Erro ao consultar CEP.");
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado.");
    }

    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  }

  function clearAddressFields() {
    editStreet.value = "";
    editNeighborhood.value = "";
    editCity.value = "";
    editState.value = "";
  }

  function fillAddressFields(address) {
    editStreet.value = address.street;
    editNeighborhood.value = address.neighborhood;
    editCity.value = address.city;
    editState.value = address.state;

    validateEditStreet();
    validateEditNeighborhood();
    validateEditCity();
    validateEditState();
  }

  editCep?.addEventListener("blur", async () => {
    const cep = onlyNumbers(editCep.value);

    if (!cep) return;

    if (!validateEditCep()) {
      clearAddressFields();
      return;
    }

    try {
      setError(editCep, "editCepError", "");

      editCep.disabled = true;

      const address = await fetchAddressByCep(cep);

      fillAddressFields(address);
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);

      clearAddressFields();
      setError(editCep, "editCepError", error.message || "Erro ao buscar CEP.");
    } finally {
      editCep.disabled = false;
    }
  });

  btnSalvarEndereco?.addEventListener("click", async () => {
    const valid =
      validateEditCep() &
      validateEditStreet() &
      validateEditNeighborhood() &
      validateEditCity() &
      validateEditNumber() &
      validateEditState();

    if (!valid) return;

    const body = {
      cep: onlyNumbers(editCep.value),
      street: editStreet.value.trim(),
      neighborhood: editNeighborhood.value.trim(),
      city: editCity.value.trim(),
      state: editState.value.trim().toUpperCase(),
      number: editNumber.value.trim(),
      complement: editComplement.value.trim(),
    };

    try {
      const res = await fetch("/api/account/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao salvar endereço.");
        return;
      }

      currentAddress = body;

      renderAccount(currentUser, currentAddress);

      enderecoView.style.display = "block";
      enderecoEdit.style.display = "none";

      alert("Endereço atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço.");
    }
  });
});
