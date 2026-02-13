(function () {
  console.log("=== INTERCEPTOR (COOKIE MODE) ===");

  // Evita duplicar interceptor
  if (window.fetch.isIntercepted) {
    console.log("✅ Interceptor já configurado (cookie mode)");
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = function (resource, options = {}) {
    const newOptions = { ...options };

    // 🔥 Cookie mode: sempre incluir cookie HttpOnly jwt_token
    newOptions.credentials = "include";

    // Mantém headers existentes
    newOptions.headers = { ...(newOptions.headers || {}) };

    // Configura JSON automaticamente quando body for objeto (sem FormData)
    const method = (newOptions.method || "GET").toUpperCase();
    const modifyingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (modifyingMethods.includes(method)) {
      if (
        newOptions.body &&
        typeof newOptions.body === "object" &&
        !(newOptions.body instanceof FormData)
      ) {
        if (!newOptions.headers["Content-Type"]) {
          newOptions.headers["Content-Type"] = "application/json";
        }
        newOptions.body = JSON.stringify(newOptions.body);
      }
    }

    const urlStr = typeof resource === "string" ? resource : (resource?.url || "");
    console.log(`📤 Fetch: ${method} ${urlStr}`);

    return originalFetch.call(this, resource, newOptions).catch((error) => {
      console.error("❌ Erro na requisição:", error);
      throw error;
    });
  };

  window.fetch.isIntercepted = true;
  console.log("✅ Interceptor configurado (cookie mode)");
})();

// ============================================
// FUNÇÕES AUXILIARES GLOBAIS (mantidas)
// ============================================

// Função para limpar backdrops e modais
window.limparBackdropEModal = function () {
  const backdrops = document.querySelectorAll(".modal-backdrop");
  backdrops.forEach((backdrop) => backdrop.remove());

  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";

  const modais = document.querySelectorAll(".modal.show");
  modais.forEach((modal) => {
    modal.classList.remove("show");
    modal.style.display = "none";
  });

  if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
    const modaisInstances = document.querySelectorAll(".modal");
    modaisInstances.forEach((modalEl) => {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    });
  }
};

// Atualiza mensagem na UI
window.atualizarMensagemNaUI = function (mensagemAtualizada) {
  const mensagensContainer = document.getElementById("mensagensContainer");
  if (!mensagensContainer) return;

  const cards = mensagensContainer.querySelectorAll(".mensagem-card");
  cards.forEach((card) => {
    const msgId = card.querySelector(".btn-toggle-msg")?.dataset.id;
    if (msgId == mensagemAtualizada.id) {
      const statusBadge = card.querySelector(
        ".badge.bg-success, .badge.bg-secondary"
      );
      if (statusBadge) {
        if (mensagemAtualizada.ativo) {
          statusBadge.className = "badge bg-success";
          statusBadge.textContent = "Ativa";
        } else {
          statusBadge.className = "badge bg-secondary";
          statusBadge.textContent = "Inativa";
        }
      }

      const toggleBtn = card.querySelector(".btn-toggle-msg");
      if (toggleBtn) {
        const icon = toggleBtn.querySelector("i");
        if (mensagemAtualizada.ativo) {
          toggleBtn.className =
            "btn btn-sm btn-outline-warning btn-toggle-msg";
          toggleBtn.title = "Desativar";
          if (icon) icon.className = "bi bi-toggle-off";
        } else {
          toggleBtn.className =
            "btn btn-sm btn-outline-success btn-toggle-msg";
          toggleBtn.title = "Ativar";
          if (icon) icon.className = "bi bi-toggle-on";
        }
      }
    }
  });
};

// Loading globals
window.showLoading = function () {
  const loadingArea = document.getElementById("loadingArea");
  const contentArea = document.getElementById("contentArea");

  if (loadingArea) loadingArea.classList.remove("d-none");
  if (contentArea) contentArea.style.opacity = "0.5";
};

window.hideLoading = function () {
  const loadingArea = document.getElementById("loadingArea");
  const contentArea = document.getElementById("contentArea");

  if (loadingArea) loadingArea.classList.add("d-none");
  if (contentArea) contentArea.style.opacity = "1";
};

// Formatar datas
window.formatDate = function (dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};
