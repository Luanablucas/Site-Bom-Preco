document.addEventListener("DOMContentLoaded", () => {

  
  fetch("header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;

      initHeader(); 
    });

  //CARROSSEL
  let index = 0;
  const slides = document.querySelectorAll(".carousel-item");
  const next = document.querySelector(".carousel-btn.next");
  const prev = document.querySelector(".carousel-btn.prev");

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

  //CARRINHO 
  let cartCount = 0;
  const cartBadge = document.querySelector('.cart-count');
  const buyButtons = document.querySelectorAll('.btn-comprar');

  buyButtons.forEach(button => {
    button.addEventListener('click', () => {
      cartCount++;
      cartBadge.textContent = cartCount;
      cartBadge.style.display = 'flex';
    });
  });

  //MODAL REUTILIZÁVEL 
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');
  const closeModalBtn = document.getElementById('closeModal');
function openModal(templateId) {
  const template = document.getElementById(templateId);

  modalContent.innerHTML = '';
  modalContent.appendChild(template.content.cloneNode(true));
  modal.classList.add('active');

  // troca entre login/cadastro
  modalContent.querySelectorAll('[data-open]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-open');
      openModal(target);
    });
  });

  if (templateId === 'register-template') {
    initRegisterForm();
  }

  if (templateId === 'login-template') {
    initLoginForm(); 
  }
}

  function closeModal() {
    modal.classList.remove('active');
    
  }

 closeModalBtn.addEventListener('click', closeModal);

  function initRegisterForm() {
  const password = modalContent.querySelector("#password");
  const passwordError = modalContent.querySelector("#passwordError");
  const cpfCnpj = modalContent.querySelector("#cpfCnpj");
  const cep = modalContent.querySelector("#cep");
  const rua = modalContent.querySelector("#rua");
  const bairro = modalContent.querySelector("#bairro");
  const cidade = modalContent.querySelector("#cidade");
  const uf = modalContent.querySelector("#UF");
  const email = modalContent.querySelector('input[type="email"]');

  // senha
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

  // email
  email.addEventListener("input", () => {
    if (!email.validity.valid) {
      email.setCustomValidity("Digite um e-mail válido");
    } else {
      email.setCustomValidity("");
    }
  });

  // cpf / cnpj
  cpfCnpj.addEventListener("input", () => {
    cpfCnpj.value = cpfCnpj.value.replace(/\D/g, "");
  });

  // cep
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

  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('login-template');
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('register-template');
    });
  }
}


});
