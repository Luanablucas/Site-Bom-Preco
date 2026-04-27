document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());

  try {
    const res = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || "Erro");
      return;
    }

    if (data.role === "admin") {
      window.location.href = "/admin";
    } else {
      alert("Você não é admin.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor.");
  }
});