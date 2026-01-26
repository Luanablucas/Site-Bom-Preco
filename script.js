document.addEventListener("DOMContentLoaded", () => {

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
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  closeModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.getElementById('btn-login').addEventListener('click', (e) => {
  e.preventDefault();
  openModal('login-template');
});

document.getElementById('btn-register').addEventListener('click', (e) => {
  e.preventDefault();
  openModal('register-template');
});


});
