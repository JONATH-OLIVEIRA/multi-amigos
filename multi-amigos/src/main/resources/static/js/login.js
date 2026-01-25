// login.js - VERSÃO AJUSTADA (sem document.write + sem voltar pro pai no ?cadastro=success)

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const token = localStorage.getItem("token");
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  const isLoginPage = pathname === "/auth/login";
  const cadastroSuccess = params.get("cadastro") === "success";
  const hasAuthError = params.has("error"); // expired / denied / etc
  const resetSuccess = params.get("reset") === "success";

  // ✅ Mensagem de sucesso do reset
  if (isLoginPage && resetSuccess) {
    const box = document.getElementById("loginMsg");
    if (box) {
      box.innerHTML = `<div class="alert alert-success">Senha redefinida com sucesso. Faça login.</div>`;
    }
  }

  // ✅ Regra: se veio de cadastro=success ou error=..., NÃO auto-redireciona.
  // (E opcionalmente limpa token para não “voltar pro pai”)
  if (isLoginPage && (cadastroSuccess || hasAuthError || resetSuccess)) {
    console.log("ℹ️ Login page com flag (cadastro/error/reset). Não fará auto-redirect.");
    localStorage.removeItem("token");
    localStorage.removeItem("perfil");
  } else {
    // ✅ Auto-redirect somente se:
    // - está na página de login
    // - tem token
    // - NÃO tem flags cadastro/error/reset
    if (token && isLoginPage) {
      console.log("🔄 Usuário já logado, validando token...");

      fetch("/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error("Token inválido");
        })
        .then((userData) => {
          console.log("✅ Token válido! Perfil:", userData.role);

          const dashboardUrl =
            userData.role === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

          console.log(`📍 Redirecionando para: ${dashboardUrl}`);
          window.location.replace(dashboardUrl);
        })
        .catch((err) => {
          console.warn("⚠️ Token inválido/expirado:", err?.message);
          localStorage.removeItem("token");
          localStorage.removeItem("perfil");
          showLoggedInOptions();
        });
    }
  }

  // ============================================
  // SUBMIT LOGIN
  // ============================================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const senha = document.getElementById("senha")?.value;

      if (!email || !senha) {
        alert("Por favor, preencha todos os campos!");
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm"></span> Entrando...';
      }

      try {
        console.log("📤 Enviando credenciais...");

        const res = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        if (!res.ok) {
          throw new Error("Login falhou! Verifique email e senha.");
        }

        const data = await res.json();
        const newToken = data.token;
        const perfil = data.perfil;

        localStorage.setItem("token", newToken);
        localStorage.setItem("perfil", perfil);

        const dashboardUrl =
          perfil === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

        window.location.replace(dashboardUrl);
      } catch (err) {
        console.error("❌ Erro no login:", err);
        alert("Erro: " + err.message);

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml || "Entrar";
        }
      }
    });
  }

  function showLoggedInOptions() {
    const container = document.querySelector(".card");
    if (container && !document.querySelector("#loggedInMsg")) {
      const div = document.createElement("div");
      div.id = "loggedInMsg";
      div.className = "alert alert-info mt-3";
      div.innerHTML = `
        <p><strong>Sessão expirada ou inválida</strong></p>
        <p>Faça login novamente.</p>
      `;
      container.appendChild(div);
    }
  }
});

// ============================================
// FUNÇÕES GLOBAIS
// ============================================
async function goToDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Faça login primeiro!");
    window.location.href = "/auth/login";
    return;
  }

  try {
    const validateRes = await fetch("/auth/validate", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!validateRes.ok) throw new Error("Token inválido ou expirado");

    const userData = await validateRes.json();
    const dashboardUrl =
      userData.role === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

    window.location.replace(dashboardUrl);
  } catch (err) {
    console.error("❌ Erro ao ir para dashboard:", err);
    alert("Erro: " + err.message);
    localStorage.removeItem("token");
    localStorage.removeItem("perfil");
    window.location.href = "/auth/login";
  }
}

function logout() {
  if (confirm("Deseja realmente sair?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("perfil");
    window.location.href = "/";
  }
}
