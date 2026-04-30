document.addEventListener("DOMContentLoaded", () => {
  let currentUser = null;

  function showToast(message, type = "info", title = "") {
    let container = document.getElementById("toastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const defaultTitle = {
      success: "Sucesso",
      error: "Erro",
      info: "Aviso",
    };

    toast.innerHTML = `
    <strong>${title || defaultTitle[type] || "Aviso"}</strong>
    <p>${message}</p>
  `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  window.showToast = showToast;

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      currentUser = data.user;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      currentUser = null;
    }
  }

  function updateHeaderAuthState() {
    const user = window.Auth?.getUser?.();

    const userLabel = document.getElementById("user-label");
    const loginBtn = document.getElementById("btn-login");
    const registerBtn = document.getElementById("btn-register");
    const logoutBtn = document.getElementById("btn-logout");
    const accountBtn = document.getElementById("btn-account");

    if (!userLabel) return;

    if (user) {
      const firstName = user.name.split(" ")[0];

      userLabel.textContent = `Olá, ${firstName}!`;

      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (accountBtn) accountBtn.style.display = "block";
    } else {
      userLabel.textContent = "Fazer login";

      if (loginBtn) loginBtn.style.display = "block";
      if (registerBtn) registerBtn.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (accountBtn) accountBtn.style.display = "none";
    }
  }

  function isLoggedIn() {
    return currentUser !== null;
  }

  window.Auth = {
    checkAuth,
    isLoggedIn,
    getUser: () => currentUser,
  };

  fetch("header.html")
    .then((res) => res.text())
    .then(async (html) => {
      document.getElementById("header").innerHTML = html;

      initModal();

      await window.Auth.checkAuth();
      updateHeaderAuthState();

      initHeader();

      if (typeof iniciarBusca === "function") iniciarBusca();

      window.Carrinho?.updateCartBadge?.();
    });

  initCarousel();

  function initCarousel() {
    const slides = document.querySelectorAll(".carousel-item");
    const next = document.querySelector(".carousel-btn.next");
    const prev = document.querySelector(".carousel-btn.prev");

    if (!slides.length || !next || !prev) return;

    let index = 0;

    function showSlide(i) {
      slides.forEach((slide) => slide.classList.remove("active"));
      slides[i].classList.add("active");
    }

    next.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      showSlide(index);
    });

    prev.addEventListener("click", () => {
      index = (index - 1 + slides.length) % slides.length;
      showSlide(index);
    });

    setInterval(() => {
      index = (index + 1) % slides.length;
      showSlide(index);
    }, 5000);
  }

  //// Modal - Registro/Login

  function initModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;

    const modalContent = modal.querySelector(".modal-content");
    const closeModalBtn = document.getElementById("closeModal");

    function openModal(templateId) {
      const template = document.getElementById(templateId);
      if (!template) return;

      modalContent.innerHTML = "";
      modalContent.appendChild(template.content.cloneNode(true));
      modal.classList.add("active");

      modalContent.querySelectorAll("[data-open]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          openModal(link.dataset.open);
        });
      });

      if (templateId === "register-template") {
        initRegisterForm(modalContent);
      }

      if (templateId === "login-template") {
        initLoginForm(modalContent);
      }

      if (templateId === "forgot-password-template") {
        initForgotPasswordForm(modalContent);
      }

      if (templateId === "verify-code-template") {
        initVerifyCodeForm(modalContent);
      }

      if (templateId === "reset-password-template") {
        initResetPasswordForm(modalContent);
      }
    }

    function closeModal() {
      modal.classList.remove("active");
    }

    closeModalBtn?.addEventListener("click", closeModal);

    window.openModal = openModal;
    window.closeModal = closeModal;
  }

  //// Cadastro usuário

  function initRegisterForm(modalContent) {
    const nameInput = modalContent.querySelector("#name");
    const birthDateInput = modalContent.querySelector("#birthDate");
    const cpfCnpjInput = modalContent.querySelector("#cpfCnpj");
    const phoneInput = modalContent.querySelector("#phone");
    const emailInput = modalContent.querySelector("#registerEmail");
    const passwordInput = modalContent.querySelector("#password");

    const cepInput = modalContent.querySelector("#cep");
    const ruaInput = modalContent.querySelector("#rua");
    const bairroInput = modalContent.querySelector("#bairro");
    const cidadeInput = modalContent.querySelector("#cidade");
    const ufInput = modalContent.querySelector("#UF");
    const numberInput = modalContent.querySelector("#number");
    const complementoInput = modalContent.querySelector("#complemento");

    const btnCriarConta = modalContent.querySelector(".btn-primary");

    function onlyNumbers(value) {
      return String(value || "").replace(/\D/g, "");
    }

    function setError(input, errorId, message) {
      const errorEl = modalContent.querySelector(`#${errorId}`);
      if (errorEl) errorEl.textContent = message || "";

      if (input) {
        input.classList.toggle("input-error", Boolean(message));
      }
    }

    //// Validações

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    function isStrongPassword(password) {
      return (
        password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
      );
    }

    function isValidBirthDate(value) {
      if (!value) return false;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;

      const today = new Date();
      if (date > today) return false;

      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);

      return date >= minDate;
    }

    function isValidPhone(value) {
      const phone = onlyNumbers(value);
      return phone.length === 10 || phone.length === 11;
    }

    function isValidCPF(value) {
      const cpf = onlyNumbers(value);

      if (cpf.length !== 11) return false;
      if (/^(\d)\1+$/.test(cpf)) return false;

      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += Number(cpf[i]) * (10 - i);
      }

      let digit1 = 11 - (sum % 11);
      if (digit1 >= 10) digit1 = 0;

      if (digit1 !== Number(cpf[9])) return false;

      sum = 0;

      for (let i = 0; i < 10; i++) {
        sum += Number(cpf[i]) * (11 - i);
      }

      let digit2 = 11 - (sum % 11);
      if (digit2 >= 10) digit2 = 0;

      return digit2 === Number(cpf[10]);
    }

    function isValidCNPJ(value) {
      const cnpj = onlyNumbers(value);

      if (cnpj.length !== 14) return false;
      if (/^(\d)\1+$/.test(cnpj)) return false;

      const calcDigit = (base) => {
        let size = base.length;
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
          sum += Number(base[size - i]) * pos--;
          if (pos < 2) pos = 9;
        }

        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
      };

      const digit1 = calcDigit(cnpj.slice(0, 12));
      if (digit1 !== Number(cnpj[12])) return false;

      const digit2 = calcDigit(cnpj.slice(0, 13));
      return digit2 === Number(cnpj[13]);
    }

    function isValidCpfOrCnpj(value) {
      const clean = onlyNumbers(value);

      if (clean.length === 11) return isValidCPF(clean);
      if (clean.length === 14) return isValidCNPJ(clean);

      return false;
    }

    function validateName() {
      const valid = nameInput.value.trim().replace(/\s+/g, " ").length >= 3;
      setError(nameInput, "nameError", valid ? "" : "Informe um nome válido.");
      return valid;
    }

    function validateBirthDate() {
      const valid = isValidBirthDate(birthDateInput.value);
      setError(
        birthDateInput,
        "birthDateError",
        valid ? "" : "Informe uma data de nascimento válida.",
      );
      return valid;
    }

    function validateCpfCnpj() {
      const value = cpfCnpjInput.value;
      const clean = onlyNumbers(value);

      let message = "";

      if (!clean) {
        message = "Informe CPF ou CNPJ.";
      } else if (clean.length !== 11 && clean.length !== 14) {
        message = "CPF deve ter 11 dígitos ou CNPJ deve ter 14.";
      } else if (!isValidCpfOrCnpj(clean)) {
        message = clean.length === 11 ? "CPF inválido." : "CNPJ inválido.";
      }

      setError(cpfCnpjInput, "cpfCnpjError", message);
      return !message;
    }

    function validatePhone() {
      const valid = isValidPhone(phoneInput.value);
      setError(
        phoneInput,
        "phoneError",
        valid ? "" : "Informe um telefone válido com DDD.",
      );
      return valid;
    }

    function validateEmail() {
      const valid = isValidEmail(emailInput.value.trim());
      setError(
        emailInput,
        "emailError",
        valid ? "" : "Informe um e-mail válido.",
      );
      return valid;
    }

    function validatePassword() {
      const valid = isStrongPassword(passwordInput.value);
      setError(
        passwordInput,
        "passwordError",
        valid ? "" : "Senha deve ter no mínimo 8 caracteres, letras e números.",
      );
      return valid;
    }

    function validateCep() {
      const valid = onlyNumbers(cepInput.value).length === 8;
      setError(cepInput, "cepError", valid ? "" : "CEP deve ter 8 dígitos.");
      return valid;
    }

    function validateAddress() {
      let valid = true;

      if (ruaInput.value.trim().length < 2) {
        setError(ruaInput, "ruaError", "Informe a rua.");
        valid = false;
      } else {
        setError(ruaInput, "ruaError", "");
      }

      if (bairroInput.value.trim().length < 2) {
        setError(bairroInput, "bairroError", "Informe o bairro.");
        valid = false;
      } else {
        setError(bairroInput, "bairroError", "");
      }

      if (cidadeInput.value.trim().length < 2) {
        setError(cidadeInput, "cidadeError", "Informe a cidade.");
        valid = false;
      } else {
        setError(cidadeInput, "cidadeError", "");
      }

      if (!/^[A-Za-z]{2}$/.test(ufInput.value.trim())) {
        setError(ufInput, "ufError", "Informe a UF com 2 letras.");
        valid = false;
      } else {
        setError(ufInput, "ufError", "");
      }

      return valid;
    }

    nameInput?.addEventListener("input", validateName);
    birthDateInput?.addEventListener("change", validateBirthDate);
    cpfCnpjInput?.addEventListener("input", () => {
      cpfCnpjInput.value = onlyNumbers(cpfCnpjInput.value);
      validateCpfCnpj();
    });
    phoneInput?.addEventListener("input", () => {
      phoneInput.value = onlyNumbers(phoneInput.value);
      validatePhone();
    });
    emailInput?.addEventListener("input", validateEmail);
    passwordInput?.addEventListener("input", validatePassword);

    cepInput?.addEventListener("input", () => {
      cepInput.value = onlyNumbers(cepInput.value);
      validateCep();
    });

    cepInput?.addEventListener("blur", async () => {
      if (!validateCep()) return;

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepInput.value}/json/`,
        );
        const data = await response.json();

        if (data.erro) {
          setError(cepInput, "cepError", "CEP não encontrado.");
          return;
        }

        ruaInput.value = data.logradouro || "";
        bairroInput.value = data.bairro || "";
        cidadeInput.value = data.localidade || "";
        ufInput.value = data.uf || "";
        numberInput.value = data.number || "";

        validateAddress();
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setError(cepInput, "cepError", "Não foi possível buscar o CEP.");
      }
    });

    ruaInput?.addEventListener("input", validateAddress);
    bairroInput?.addEventListener("input", validateAddress);
    cidadeInput?.addEventListener("input", validateAddress);
    ufInput?.addEventListener("input", () => {
      ufInput.value = ufInput.value.toUpperCase();
      validateAddress();
    });
    numberInput?.addEventListener("input", validateAddress);

    btnCriarConta?.addEventListener("click", async (e) => {
      e.preventDefault();

      const formValid =
        validateName() &&
        validateBirthDate() &&
        validateCpfCnpj() &&
        validatePhone() &&
        validateEmail() &&
        validatePassword() &&
        validateCep() &&
        validateAddress();

      if (!formValid) {
        return;
      }

      const body = {
        name: nameInput.value.trim(),
        birthDate: birthDateInput.value,
        cpfCnpj: cpfCnpjInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        password: passwordInput.value,
        cep: cepInput.value.trim(),
        street: ruaInput.value.trim(),
        neighborhood: bairroInput.value.trim(),
        city: cidadeInput.value.trim(),
        state: ufInput.value.trim().toUpperCase(),
        number: numberInput.value.trim().toUpperCase(),
        complement: complementoInput?.value.trim() || "",
      };

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Erro ao cadastrar.", "error");
          return;
        }

        showToast("Conta criada com sucesso. Faça login.", "success");
        window.openModal?.("login-template");
      } catch (error) {
        console.error("Erro no cadastro:", error);
        showToast("Erro ao cadastrar.", "error");
      }
    });
  }

  function initHeader() {
    const loginBtn = document.getElementById("btn-login");
    const registerBtn = document.getElementById("btn-register");
    const userBtn = document.getElementById("btn-user");
    const logoutBtn = document.getElementById("btn-logout");
    const dropdown = document.getElementById("user-dropdown");

    userBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!window.Auth?.isLoggedIn?.()) {
        window.openModal?.("login-template");
        return;
      }

      dropdown?.classList.toggle("active");
    });

    loginBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      window.openModal?.("login-template");
    });

    registerBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      window.openModal?.("register-template");
    });

    logoutBtn?.addEventListener("click", async (e) => {
      e.preventDefault();

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      await window.Auth.checkAuth();
      updateHeaderAuthState();

      dropdown?.classList.remove("active");

      showToast("Você saiu da conta.", "success");
    });

    document.addEventListener("click", () => {
      dropdown?.classList.remove("active");
    });

    dropdown?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  function initLoginForm(modalContent) {
    const email = modalContent.querySelector('input[type="email"]');
    const password = modalContent.querySelector('input[type="password"]');
    const btnEntrar = modalContent.querySelector(".btn-primary");

    if (!btnEntrar) return;

    btnEntrar.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.value.trim().toLowerCase(),
            password: password.value,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Erro ao entrar.", "error");
          return;
        }

        await window.Auth.checkAuth();
        updateHeaderAuthState();
        window.closeModal?.();

        showToast("Login realizado com sucesso.", "success");
      } catch (error) {
        console.error("Erro no login:", error);
        showToast("Erro ao entrar.", "error");
      }
    });
  }

  ///  Resetar senha (esqueci senha)

  let recoveryEmail = "";
  let recoveryCode = "";

  function initForgotPasswordForm(modalContent) {
    const emailInput = modalContent.querySelector("#recoveryEmail");
    const btn = modalContent.querySelector("#btnSendRecoveryCode");
    const errorEl = modalContent.querySelector("#recoveryEmailError");

    btn?.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim().toLowerCase();

      if (!email) {
        errorEl.textContent = "Informe seu e-mail.";
        return;
      }

      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          errorEl.textContent = data.error || "Erro ao enviar código.";
          return;
        }

        recoveryEmail = email;

        showToast(
          "Enviamos um código de recuperação para seu e-mail.",
          "success",
        );
        window.openModal?.("verify-code-template");
      } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        errorEl.textContent = "Erro ao enviar código.";
      }
    });
  }

  function initVerifyCodeForm(modalContent) {
    const emailInput = modalContent.querySelector("#verifyEmail");
    const codeInput = modalContent.querySelector("#recoveryCode");
    const errorEl = modalContent.querySelector("#recoveryCodeError");
    const btn = modalContent.querySelector("#btnVerifyRecoveryCode");

    emailInput.value = recoveryEmail;

    btn?.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim().toLowerCase();
      const code = codeInput.value.trim();

      try {
        const res = await fetch("/api/auth/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        const data = await res.json();

        if (!res.ok) {
          errorEl.textContent = data.error || "Código inválido.";
          return;
        }

        recoveryEmail = email;

        showToast(
          "Enviamos um código de recuperação para seu e-mail.",
          "success",
        );
        window.openModal?.("verify-code-template");
        recoveryCode = code;

        window.openModal?.("reset-password-template");
      } catch (error) {
        console.error("Erro ao verificar código:", error);
        errorEl.textContent = "Erro ao verificar código.";
      }
    });
  }

  function initResetPasswordForm(modalContent) {
    const emailInput = modalContent.querySelector("#resetEmail");
    const codeInput = modalContent.querySelector("#resetCode");
    const passwordInput = modalContent.querySelector("#newPassword");
    const confirmInput = modalContent.querySelector("#confirmNewPassword");

    const passwordError = modalContent.querySelector("#newPasswordError");
    const confirmError = modalContent.querySelector("#confirmNewPasswordError");

    const btn = modalContent.querySelector("#btnResetPassword");

    emailInput.value = recoveryEmail;
    codeInput.value = recoveryCode;

    function isStrongPassword(password) {
      return (
        password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
      );
    }

    function setError(input, errorEl, message) {
      errorEl.textContent = message || "";
      input.classList.toggle("input-error", Boolean(message));
    }

    function validatePassword() {
      const value = passwordInput.value;

      let message = "";

      if (!value) {
        message = "Informe a nova senha.";
      } else if (value.length < 8) {
        message = "A senha deve ter pelo menos 8 caracteres.";
      } else if (!/[A-Za-z]/.test(value)) {
        message = "A senha deve conter letras.";
      } else if (!/\d/.test(value)) {
        message = "A senha deve conter números.";
      }

      setError(passwordInput, passwordError, message);
      return !message;
    }

    function validateConfirm() {
      let message = "";

      if (!confirmInput.value) {
        message = "Confirme a senha.";
      } else if (confirmInput.value !== passwordInput.value) {
        message = "As senhas não conferem.";
      }

      setError(confirmInput, confirmError, message);
      return !message;
    }

    passwordInput?.addEventListener("input", () => {
      validatePassword();
      validateConfirm();
    });


    btn?.addEventListener("click", async (e) => {
      e.preventDefault();

      const valid = validatePassword() & validateConfirm();

      if (!valid) return;

      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value.trim().toLowerCase(),
            code: codeInput.value.trim(),
            newPassword: passwordInput.value,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          passwordError.textContent = data.error || "Erro ao redefinir senha.";
          return;
        }

        showToast("Senha redefinida com sucesso. Faça login.", "success");
        window.openModal?.("login-template");
      } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        passwordError.textContent = "Erro ao redefinir senha.";
      }
     });
    }
  });