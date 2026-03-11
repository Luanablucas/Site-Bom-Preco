document.addEventListener("DOMContentLoaded", () => {


  fetch("header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;

      initModal();
      initHeader();

      if (typeof iniciarBusca === "function") iniciarBusca();


      window.Carrinho?.updateCartBadge?.();


      setTimeout(() => window.Carrinho?.updateCartBadge?.(), 0);
      setTimeout(() => window.Carrinho?.updateCartBadge?.(), 50);
    });

  // Carrossel
  const slides = document.querySelectorAll(".carousel-item");
  const next = document.querySelector(".carousel-btn.next");
  const prev = document.querySelector(".carousel-btn.prev");

  if (slides.length && next && prev) {
    let index = 0;

    function showSlide(i) {
      slides.forEach(slide => slide.classList.remove("active"));
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
  // Modal Reutilizável
  function initModal() {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const closeModalBtn = document.getElementById('closeModal');

    function openModal(templateId) {
      const template = document.getElementById(templateId);
      if (!template) return;

      modalContent.innerHTML = '';
      modalContent.appendChild(template.content.cloneNode(true));
      modal.classList.add('active');

      modalContent.querySelectorAll('[data-open]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(link.dataset.open);
        });
      });

      if (templateId === 'register-template') {
        initRegisterForm(modalContent);
      }

      if (templateId === 'login-template') {
        initLoginForm(modalContent);
      }
    }

    function closeModal() {
      modal.classList.remove('active');
    }

    closeModalBtn.addEventListener('click', closeModal);
    window.openModal = openModal;
    window.closeModal = closeModal;
  }


  function initRegisterForm(modalContent) {
    const password = modalContent.querySelector("#password");
    const passwordError = modalContent.querySelector("#passwordError");
    const cpfCnpj = modalContent.querySelector("#cpfCnpj");
    const cep = modalContent.querySelector("#cep");
    const rua = modalContent.querySelector("#rua");
    const bairro = modalContent.querySelector("#bairro");
    const cidade = modalContent.querySelector("#cidade");
    const uf = modalContent.querySelector("#UF");
    const email = modalContent.querySelector('input[type="email"]');

    // Senha
    password.addEventListener("input", () => {
      const value = password.value;
      const valid =
        value.length >= 8 &&
        /[A-Za-z]/.test(value) &&
        /\d/.test(value);

      passwordError.textContent = valid
        ? ""
        : "Senha deve ter no mínimo 8 caracteres, letras e números";
    });

    // Email
    email.addEventListener("input", () => {
      if (!email.validity.valid) {
        email.setCustomValidity("Digite um e-mail válido");
      } else {
        email.setCustomValidity("");
      }
    });

    // Cpf / cnpj
    cpfCnpj.addEventListener("input", () => {
      cpfCnpj.value = cpfCnpj.value.replace(/\D/g, "");
    });

    // Cep
    cep.addEventListener("blur", async () => {
      const value = cep.value.replace(/\D/g, "");
      if (value.length !== 8) return;

      const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
      const data = await response.json();
      if (data.erro) return;

      rua.value = data.logradouro;
      bairro.value = data.bairro;
      cidade.value = data.localidade;
      uf.value = data.uf;
    });
  }

  function initHeader() {
    const loginBtn = document.getElementById('btn-login');
    const registerBtn = document.getElementById('btn-register');
    const userBtn = document.getElementById('btn-user');

    if (userBtn) {
      userBtn.addEventListener('click', e => {
        e.preventDefault();
        window.openModal('login-template');
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', e => {
        e.preventDefault();
        window.openModal('login-template');
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', e => {
        e.preventDefault();
        window.openModal('register-template');
      });
    }
  }

  fetch("header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;

      initModal();   // CHAMA
      initHeader();  // CHAMA

      if (typeof iniciarBusca === "function") iniciarBusca();
    });

  // Autenticação Simples
  const AUTH_KEY = "usuario_logado_v1";

  function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "1";
  }

  function setLoggedIn(value) {
    localStorage.setItem(AUTH_KEY, value ? "1" : "0");
  }

  window.Auth = { isLoggedIn, setLoggedIn };
});

function initLoginForm(modalContent) {
  const btnEntrar = modalContent.querySelector(".btn-primary");
  if (!btnEntrar) return;

  btnEntrar.addEventListener("click", (e) => {
    e.preventDefault();

    
    window.Auth?.setLoggedIn(true);

   
    window.closeModal?.();

 
  }, { once: true });
}