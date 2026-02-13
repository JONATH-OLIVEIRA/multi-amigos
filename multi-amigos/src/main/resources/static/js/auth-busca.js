// auth.js - COOKIE MODE (HttpOnly jwt_token) - Página /busca
(function () {
  "use strict";

  console.log("🚀 AUTH.JS - COOKIE MODE");
  console.log("📍 Página:", window.location.pathname);

  // Só roda na página de busca
  if (!window.location.pathname.includes("/busca")) {
    console.log("⏭️ Não é página de busca, ignorando");
    return;
  }

  // Estado simples
  const state = {
    authenticated: false,
    session: null, // { authenticated, email, nome, role }
  };

  // Helper fetch com cookie
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

  /**
   * PASSO 1: valida sessão via /auth/validate
   */
  async function getSession() {
    try {
      const res = await apiFetch("/auth/validate", { method: "GET" });
      if (!res.ok) return { authenticated: false };
      return await res.json();
    } catch (e) {
      console.warn("⚠️ validate falhou:", e?.message);
      return { authenticated: false };
    }
  }

  /**
   * PASSO 2: interceptor global (cookie-mode)
   * - garante credentials include
   * - mantém JSON automático quando body é objeto
   */
  function setupInterceptor() {
    console.log("2️⃣ Configurando interceptor (cookie mode)...");

    // evita duplicar
    if (window.fetch.isIntercepted) {
      console.log("✅ Interceptor já existe, reaproveitando");
      return;
    }

    const originalFetch = window.fetch;

    window.fetch = function (url, options = {}) {
      const newOptions = { ...options };

      newOptions.credentials = "include";
      newOptions.headers = { ...(newOptions.headers || {}) };

      // JSON automático
      if (
        newOptions.body &&
        typeof newOptions.body === "object" &&
        !(newOptions.body instanceof FormData)
      ) {
        if (!newOptions.headers["Content-Type"]) {
          newOptions.headers["Content-Type"] = "application/json";
        }
        // se já for string não mexe
        if (typeof newOptions.body !== "string") {
          newOptions.body = JSON.stringify(newOptions.body);
        }
      }

      return originalFetch.call(this, url, newOptions);
    };

    window.fetch.isIntercepted = true;
    console.log("✅ Interceptor configurado (cookie mode)");
  }

  /**
   * PASSO 3: mostra aplicação
   */
  function showApp() {
    console.log("3️⃣ Mostrando aplicação...");
    const loading = document.getElementById("initialLoading");
    const content = document.getElementById("mainContent");

    if (loading && content) {
      loading.style.display = "none";
      content.classList.remove("d-none");
      content.style.opacity = "1";
      console.log("🎉 APLICAÇÃO VISÍVEL!");
    }
  }

  /**
   * PASSO 4: redireciona
   */
  function redirectToLogin(reason) {
    console.log(`🚨 Redirecionando: ${reason}`);

    const loading = document.getElementById("initialLoading");
    if (loading) {
      loading.innerHTML = `
        <div style="text-align: center; padding: 50px;">
          <h4 class="text-danger">${reason}</h4>
          <p>Redirecionando para login...</p>
          <button onclick="window.location.href='/auth/login'" class="btn btn-primary mt-3">
            Ir para Login
          </button>
        </div>
      `;
    }

    setTimeout(() => {
      window.location.href = "/auth/login?error=expired";
    }, 1200);
  }

  /**
   * PROCESSO PRINCIPAL (cookie-mode)
   */
  async function main() {
    console.log("🔄 INICIANDO AUTENTICAÇÃO (cookie-mode)");

    try {
      // 1) interceptor primeiro
      setupInterceptor();

      // 2) valida sessão
      const session = await getSession();
      state.session = session;

      if (!session?.authenticated) {
        redirectToLogin("Sessão expirada ou inválida");
        return;
      }

      // 3) garante ADMIN na busca
      if (session.role !== "ADMIN") {
        console.warn("⚠️ Usuário não-admin tentou acessar busca");
        window.location.href = "/usuario/dashboard";
        return;
      }

      // 4) marca autenticado e mostra app
      state.authenticated = true;

      console.log(`👤 Usuário: ${session.nome || session.email} (${session.role})`);
      showApp();

      console.log("✅✅✅ AUTENTICAÇÃO CONCLUÍDA (cookie-mode) ✅✅✅");
    } catch (error) {
      console.error("💥 ERRO CRÍTICO:", error);
      redirectToLogin("Erro inesperado");
    }
  }

  // Funções públicas (mantendo API)
  window.verificarAutenticacao = main;

  window.authLogout = async function () {
    try {
      await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      window.location.href = "/auth/login?logout=1";
    }
  };

  window.isAuthenticated = () => state.authenticated;
  window.getCurrentSession = () => state.session;

  // Helper: admin?
  window.isAdmin = () => {
    return !!state.session?.authenticated && state.session.role === "ADMIN";
  };

  // Auto start
  console.log("🚀 Iniciando automaticamente...");

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(main, 50);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(main, 50));
  }
})();
