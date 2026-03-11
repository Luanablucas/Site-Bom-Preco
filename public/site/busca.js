function iniciarBusca() {
  const input = document.querySelector(".search-box input");
  if (!input) return false;

  if (input.dataset.buscaAtiva === "1") return true;
  input.dataset.buscaAtiva = "1";

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const termo = input.value.trim();
    if (!termo) return;

    const url = new URL("busca.html", window.location.href);
    url.searchParams.set("q", termo);
    url.searchParams.set("_ts", Date.now().toString());

    window.location.href = url.toString();
  });

  return true;
}