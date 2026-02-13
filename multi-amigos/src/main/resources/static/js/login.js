// login.js - COOKIE MODE (HttpOnly jwt_token) + login por email OU telefone

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  const isLoginPage = pathname === "/auth/login";
  const cadastroSuccess = params.get("cadastro") === "success";
  const hasAuthError = params.has("error"); // expired / denied / etc
  const resetSuccess = params.get("reset") === "success";

  function normalizeLogin(value) {
    const v = (value || "").trim();
    return v.includes("@") ? v : v.replace(/\D/g, "");
  }

  // =========================
  // Mensagens da tela
  // =========================
  if (isLoginPage && resetSuccess) {
    const box = document.getElementById("loginMsg");
    if (box) {
      box.innerHTML =
        `<div class="alert alert-success">Senha redefinida com sucesso. Faça login.</div>`;
    }
  }

  // Regra: se veio de cadastro=success ou error=... ou reset=success, NÃO auto-redireciona
  if (isLoginPage && (cadastroSuccess || hasAuthError || resetSuccess)) {
    console.log("ℹ️ Login page com flag (cadastro/error/reset). Não fará auto-redirect.");
  } else {
    // Auto-redirect se já estiver autenticado via cookie
    if (isLoginPage) {
      validateAndRedirectIfLogged();
    }
  }

  // =========================
  // SUBMIT LOGIN
  // =========================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Campo no HTML ainda chama "email" — mas agora ele é "login" (email ou telefone)
      const rawLogin = document.getElementById("email")?.value;
      const login = normalizeLogin(rawLogin);
      const senha = document.getElementById("senha")?.value;

      if (!login || !senha) {
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
        console.log("📤 Enviando credenciais (cookie mode)...");

        // 🔥 IMPORTANTE:
        // - credentials: "include" para RECEBER o cookie HttpOnly jwt_token
        // - manda { login, senha } (novo) e mantém { email } compatível (legado)
        const res = await fetch("/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, email: login, senha }),
        });

        if (!res.ok) {
          let msg = "Login falhou! Verifique email/telefone e senha.";
          try {
            const err = await res.json();
            msg = err?.message || err?.error || msg;
          } catch (_) {}
          throw new Error(msg);
        }

        const data = await res.json().catch(() => ({}));

        const perfil = data?.perfil; // "ADMIN" ou "USUARIO"
        const dashboardUrl = perfil === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

        window.location.replace(dashboardUrl);

      } catch (err) {
        console.error("❌ Erro no login:", err);
        alert("Erro: " + (err?.message || "Falha no login"));

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml || "Entrar";
        }
      }
    });
  }

  // =========================
  // Helpers
  // =========================
  async function validateSession() {
    try {
      const validateRes = await fetch("/auth/validate", {
        method: "GET",
        credentials: "include",
      });

      if (!validateRes.ok) return null;
      return await validateRes.json();
    } catch (e) {
      console.warn("⚠️ validate falhou:", e?.message);
      return null;
    }
  }

  async function validateAndRedirectIfLogged() {
    console.log("🔄 Validando sessão via cookie...");
    const userData = await validateSession();

    if (userData?.authenticated) {
      console.log("✅ Sessão ativa! Perfil:", userData.role);

      const dashboardUrl =
        userData.role === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

      window.location.replace(dashboardUrl);
      return;
    }

    console.log("ℹ️ Sem sessão ativa (cookie ausente/expirado).");
    showLoggedInOptions();
  }

  function showLoggedInOptions() {
    const container = document.querySelector(".card");
    if (container && !document.querySelector("#loggedInMsg")) {
      const div = document.createElement("div");
      div.id = "loggedInMsg";
      div.className = "alert alert-info mt-3";
      div.innerHTML = `
        <p><strong>Faça login para continuar</strong></p>
      `;
      container.appendChild(div);
    }
  }
});

// ============================================
// FUNÇÕES GLOBAIS (cookie mode)
// ============================================
async function goToDashboard() {
  try {
    const validateRes = await fetch("/auth/validate", {
      method: "GET",
      credentials: "include",
    });

    if (!validateRes.ok) throw new Error("Sessão inválida ou expirada");

    const userData = await validateRes.json();
    if (!userData?.authenticated) throw new Error("Sessão inválida ou expirada");

    const dashboardUrl =
      userData.role === "ADMIN" ? "/admin/dashboard" : "/usuario/dashboard";

    window.location.replace(dashboardUrl);
  } catch (err) {
    console.error("❌ Erro ao ir para dashboard:", err);
    alert("Faça login novamente.");
    window.location.href = "/auth/login?error=expired";
  }
}

async function logout() {
  if (!confirm("Deseja realmente sair?")) return;

  try {
    await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (_) {}

  window.location.href = "/";
}
