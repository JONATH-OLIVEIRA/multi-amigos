// main.js - COOKIE MODE (HttpOnly jwt_token)
console.log("MultiAmigos - main.js (cookie mode) carregado");

// ==============================
// Helper: fetch sempre com cookie
// ==============================
async function apiFetch(url, options = {}) {
  const opts = {
    ...options,
    credentials: "include", // 🔥 manda cookie jwt_token
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  };
  return fetch(url, opts);
}

// ==============================
// Sessão: valida via /auth/validate
// ==============================
async function getSession() {
  try {
    const res = await apiFetch("/auth/validate", { method: "GET" });
    if (!res.ok) return { authenticated: false };
    return await res.json(); // { authenticated, email, nome, role }
  } catch (e) {
    console.warn("validate falhou:", e?.message);
    return { authenticated: false };
  }
}

// ==============================
// Navegar pro dashboard certo
// ==============================
async function goToDashboard() {
  const session = await getSession();
  if (!session?.authenticated) {
    alert("Faça login primeiro!");
    window.location.href = "/auth/login";
    return;
  }

  const dashboardUrl =
    session.role === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

  window.location.replace(dashboardUrl);
}

// expõe global (pra onclick antigo não quebrar)
window.goToDashboard = goToDashboard;

// ==============================
// Guard de páginas protegidas
// ==============================
async function protectPageIfNeeded() {
  const path = window.location.pathname;

  // páginas protegidas
  const protectedPrefixes = ["/admin/", "/usuario/", "/dashboard/"];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (!isProtected) return;

  const session = await getSession();
  if (!session?.authenticated) {
    window.location.replace("/auth/login?error=expired");
    return;
  }

  // bloqueia admin vs usuario
  if (path.startsWith("/admin/") && session.role !== "ADMIN") {
    window.location.replace("/usuario/dashboard");
    return;
  }
}

// ==============================
// Navbar / UI
// ==============================
async function updateNavbarForLogin() {
  const currentPath = window.location.pathname;

  // só mexe em páginas públicas
  const shouldUpdate =
    currentPath === "/" ||
    currentPath.includes("/auth/login") ||
    currentPath.includes("/auth/register") ||
    currentPath.includes("/public/");

  if (!shouldUpdate) return;

  const navbarNav = document.querySelector(".navbar-nav");
  if (!navbarNav) return;

  // limpa itens custom antigos
  document.querySelector("#dashboardNavItem")?.remove();

  // valida sessão
  const session = await getSession();
  const isLogged = !!session?.authenticated;

  const navLinks = document.querySelectorAll("a.nav-link");

  if (isLogged) {
    // adiciona item Dashboard
    const dashboardItem = document.createElement("li");
    dashboardItem.className = "nav-item";
    dashboardItem.id = "dashboardNavItem";
    dashboardItem.innerHTML = `
      <a class="nav-link text-success fw-bold" href="#" id="goDashboardLink">
        <i class="bi bi-speedometer2"></i> Dashboard
      </a>
    `;
    navbarNav.prepend(dashboardItem);

    // transforma "Login" em "Sair"
    navLinks.forEach((link) => {
      const isLoginLink =
        link.textContent.trim() === "Login" ||
        (link.getAttribute("href") || "").includes("/auth/login");

      if (isLoginLink) {
        link.textContent = "Sair";
        link.href = "#";
        link.classList.remove("active", "text-white");
        link.classList.add("text-danger", "fw-bold");
        link.onclick = null;

        link.addEventListener("click", async (e) => {
          e.preventDefault();
          if (!confirm("Deseja realmente sair do sistema?")) return;

          await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
          window.location.href = "/";
        });
      }
    });

    // evento dashboard
    document
      .getElementById("goDashboardLink")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        await goToDashboard();
      });
  } else {
    // garante que "Sair" volte a "Login"
    navLinks.forEach((link) => {
      const isLogoutLink =
        link.textContent.trim() === "Sair" ||
        link.textContent.trim() === "Logout" ||
        link.classList.contains("text-danger");

      if (isLogoutLink) {
        link.textContent = "Login";
        link.href = "/auth/login";
        link.classList.remove("text-danger", "fw-bold");
        link.classList.add("text-white");
        link.onclick = null;
      }
    });
  }
}

// ==============================
// Boot
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  await protectPageIfNeeded();
  await updateNavbarForLogin();
});

// opcional (se quiser revalidar)
// setInterval(updateNavbarForLogin, 15000);
