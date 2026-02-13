// admin-dashboard.js - COOKIE MODE (dashboard completo + atividade + ações rápidas)
// Ajustes: modal hierarquia único (sem piscar), listeners sem duplicar, dashboard real com fallback, ações rápidas robustas

class AdminDashboard {
  constructor() {
    this.currentSection = "dashboard";
    this.initialized = false;
    this.isLoggingOut = false;
    this.session = null;

    // evita render atrasado ao trocar rápido de seção
    this._sectionAbort = null;

    // cache leve para dashboard/atividade
    this._cacheUsuarios = null;
    this._cacheMensagens = null;
  }

  async init() {
    if (this.initialized) {
      console.warn("⚠️ Dashboard já inicializado");
      return;
    }

    console.log("=== DASHBOARD INICIALIZADO (cookie mode) ===");

    // 0) Garante modal hierarquia único (FIX do "pisca")
    this.ensureHierarquiaModal();

    // 1) Protege página (admin)
    const ok = await this.verifySessionOrRedirect();
    if (!ok) return;

    // 2) Interface events
    this.setupInterfaceEvents();

    // 3) Testa API (opcional)
    this.testAPIConnection();

    // 4) Carrega seção default
    this.loadDefaultSection();

    this.initialized = true;
    console.log("=== DASHBOARD PRONTO ===");
  }

  // ----------------------------
  // UTIL
  // ----------------------------
  safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  safeBindClick(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;

    // evita múltiplos handlers (cloneNode)
    const cloned = el.cloneNode(true);
    el.parentNode.replaceChild(cloned, el);

    cloned.addEventListener("click", (e) => {
      e.preventDefault();
      handler(e);
    });
  }

  abortSectionRequests() {
    try {
      this._sectionAbort?.abort();
    } catch {}
    this._sectionAbort = new AbortController();
    return this._sectionAbort.signal;
  }

  // ----------------------------
  // MODAL HIERARQUIA (FIX "PISCANDO")
  // ----------------------------
  ensureHierarquiaModal() {
    if (document.getElementById("hierarquiaModal")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal fade" id="hierarquiaModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="hierarquiaModalLabel">Hierarquia</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="hierarquiaModalBody"></div>
          </div>
        </div>
      </div>
      `
    );

    // limpeza defensiva de backdrops duplicados (quando algum script bugado abrir/fechar duas vezes)
    document.addEventListener("hidden.bs.modal", (ev) => {
      if (ev.target?.id !== "hierarquiaModal") return;

      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((b, i) => {
        if (i > 0) b.remove();
      });

      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    });
  }

  // ----------------------------
  // HTTP helpers (COOKIE MODE)
  // ----------------------------
  async apiFetch(url, options = {}) {
    const opts = {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
      },
    };

    // Se tem body e não é FormData, assume JSON
    if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
      if (!opts.headers["Content-Type"]) opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }

    return fetch(url, opts);
  }

  async apiFetchJson(url, options = {}) {
    const res = await this.apiFetch(url, options);

    // Sessão expirada
    if (res.status === 401) {
      window.location.replace("/auth/login?error=expired");
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    if (res.status === 403) {
      throw new Error("Acesso negado (403).");
    }

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

    if (!res.ok) {
      const msg =
        typeof body === "string"
          ? body
          : body?.error || body?.message || JSON.stringify(body);
      throw new Error(`Erro ${res.status}: ${msg || res.statusText}`);
    }

    return body;
  }

  async getSession() {
    try {
      const res = await this.apiFetch("/auth/validate", { method: "GET" });
      if (!res.ok) return { authenticated: false };
      return await res.json(); // { authenticated, email, nome, role }
    } catch {
      return { authenticated: false };
    }
  }

  async verifySessionOrRedirect() {
    this.session = await this.getSession();

    if (!this.session?.authenticated) {
      console.warn("⚠️ Sessão inválida/expirada, redirecionando...");
      window.location.replace("/auth/login?error=expired");
      return false;
    }

    // Garante ADMIN no dashboard admin
    if (this.session.role !== "ADMIN") {
      console.warn("⚠️ Usuário não-admin tentando acessar /admin/");
      window.location.replace("/usuario/dashboard");
      return false;
    }

    console.log("✅ Sessão OK. Admin:", this.session.email);
    return true;
  }

  setupInterfaceEvents() {
    console.log("🎛️ Configurando eventos da interface...");

    // Logout centralizado
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

      newLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
      console.log("✅ Botão logout configurado");
    }

    this.setupMenuNavigation();
    this.setupMobileSidebar();
  }

  setupMenuNavigation() {
    const menus = {
      menuUsuarios: "usuarios",
      menuHierarquia: "hierarquia",
      menuMensagens: "mensagens",
      menuDashboard: "dashboard",
      menuBusca: "busca",
      menuHome: "home",
    };

    Object.entries(menus).forEach(([menuId, section]) => {
      const el = document.getElementById(menuId);
      if (!el) return;

      // evita duplicar listeners se init for chamado em algum cenário
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);

      newEl.addEventListener("click", (e) => {
        e.preventDefault();

        if (section === "busca") {
          window.location.href = "/admin/busca"; // cookie-mode: sem token na URL
        } else if (section === "home") {
          window.location.href = "/";
        } else {
          this.loadSection(section);
        }
      });
    });
  }

  setupMobileSidebar() {
    const toggleBtn = document.getElementById("toggleSidebarBtn");
    const overlay = document.getElementById("sidebarOverlay");

    const closeSidebar = () => document.body.classList.remove("sidebar-open");

    toggleBtn?.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
    });

    overlay?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 992) closeSidebar();
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) closeSidebar();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSidebar();
    });
  }

  async handleLogout() {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    try {
      if (!confirm("Deseja realmente sair?")) return;

      await this.apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/auth/login?logout=1";
    } finally {
      this.isLoggingOut = false;
    }
  }

  // ----------------------------
  // Seções
  // ----------------------------
  loadDefaultSection() {
    this.loadSection("dashboard");
  }

  loadSection(section) {
    console.log(`📂 Carregando seção: ${section}`);

    this.currentSection = section;
    const signal = this.abortSectionRequests();

    const contentArea = document.getElementById("contentArea");
    const pageTitle = document.getElementById("pageTitle");

    if (!contentArea || !pageTitle) {
      console.error("❌ Elementos do DOM não encontrados");
      return;
    }

    // menu active
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => link.classList.remove("active"));
    const menuId = `menu${section.charAt(0).toUpperCase() + section.slice(1)}`;
    document.getElementById(menuId)?.classList.add("active");

    // loading
    contentArea.innerHTML = `
      <div class="text-center my-5" id="loadingContent">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2">Carregando ${section}...</p>
      </div>
    `;

    const titles = {
      usuarios: '<i class="bi bi-people"></i> Gerenciar Usuários',
      hierarquia: '<i class="bi bi-diagram-3"></i> Hierarquia da Rede',
      mensagens: '<i class="bi bi-megaphone"></i> Mensagens do Sistema',
      dashboard: '<i class="bi bi-speedometer2"></i> Dashboard Administrativo',
    };
    pageTitle.innerHTML = titles[section] || titles.dashboard;

    setTimeout(() => {
      // se trocar de seção muito rápido, evita render atrasado
      if (signal.aborted) return;

      switch (section) {
        case "usuarios":
          this.loadUsuarios();
          break;
        case "hierarquia":
          this.loadHierarquia();
          break;
        case "mensagens":
          this.loadMensagens();
          break;
        case "dashboard":
        default:
          this.loadDashboard();
      }
    }, 80);
  }

  loadUsuarios() {
    const contentArea = document.getElementById("contentArea");
    if (!contentArea) return;

    // IMPORTANTE: NÃO colocar #hierarquiaModal aqui (isso causava "piscar")
    contentArea.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0"><i class="bi bi-people"></i> Gerenciamento de Usuários</h4>
              <div class="d-flex gap-2">
                <button class="btn btn-light btn-sm" id="btnNovoUsuario">
                  <i class="bi bi-person-plus"></i> Novo Usuário
                </button>
                <button class="btn btn-outline-light btn-sm" id="btnRefreshUsuarios">
                  <i class="bi bi-arrow-clockwise"></i> Atualizar
                </button>
                <button class="btn btn-info btn-sm" id="btnExportUsuarios">
                  <i class="bi bi-download"></i> Exportar
                </button>
              </div>
            </div>

            <div class="card-body">
              <div id="errorUsuarios" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="errorUsuariosMessage"></span>
              </div>

              <div id="emptyUsuarios" class="alert alert-info d-none">
                <i class="bi bi-info-circle"></i> Nenhum usuário encontrado.
              </div>

              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3" id="usuariosContainer"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // binds sem duplicar
    this.safeBindClick("btnNovoUsuario", () => window.usuariosManager?.abrirModalNovoUsuario?.());
    this.safeBindClick("btnRefreshUsuarios", () => window.usuariosManager?.loadUsuariosData?.());
    this.safeBindClick("btnExportUsuarios", () => window.usuariosManager?.gerarRelatorioUsuarios?.());

    setTimeout(() => window.usuariosManager?.loadUsuariosData?.(), 0);
  }

  loadHierarquia() {
    const contentArea = document.getElementById("contentArea");
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div id="hierarquiaContainer"></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (typeof hierarquia !== "undefined" && typeof hierarquia.init === "function") {
        hierarquia.init("hierarquiaContainer");
      } else {
        console.error("❌ Hierarquia não carregada. Verifique se admin-hierarquia.js está incluído.");
        contentArea.innerHTML = `
          <div class="alert alert-danger">
            <h5><i class="bi bi-exclamation-triangle"></i> Erro ao carregar hierarquia</h5>
            <p>O arquivo admin-hierarquia.js não foi carregado corretamente.</p>
          </div>
        `;
      }
    }, 200);
  }

  loadMensagens() {
    const contentArea = document.getElementById("contentArea");
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0"><i class="bi bi-megaphone"></i> Mensagens do Sistema</h4>

              <div class="d-flex gap-2">
                <button class="btn btn-light btn-sm" id="btnNovaMensagem">
                  <i class="bi bi-plus-circle"></i> Nova Mensagem
                </button>
                <button class="btn btn-outline-light btn-sm" id="btnRefreshMensagens">
                  <i class="bi bi-arrow-clockwise"></i> Atualizar
                </button>
              </div>
            </div>

            <div class="card-body">
              <div id="errorMensagens" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="errorMensagensMessage"></span>
              </div>

              <div id="emptyMensagens" class="alert alert-info d-none">
                <i class="bi bi-info-circle"></i> Nenhuma mensagem encontrada.
              </div>

              <div class="row row-cols-1 row-cols-lg-2 g-3" id="mensagensContainer"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.safeBindClick("btnNovaMensagem", () => window.mensagensManager?.abrirModalNovaMensagem?.());
    this.safeBindClick("btnRefreshMensagens", () => window.mensagensManager?.loadMensagensData?.());

    setTimeout(() => window.mensagensManager?.loadMensagensData?.(), 0);
  }

  // ✅ DASHBOARD COMPLETO (KPIs + atividade + ações rápidas + fallbacks)
  async loadDashboard() {
    const contentArea = document.getElementById("contentArea");
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0"><i class="bi bi-speedometer2"></i> Dashboard Resumo</h4>
              <button class="btn btn-outline-light btn-sm" id="btnRefreshDashboard">
                <i class="bi bi-arrow-clockwise"></i> Atualizar
              </button>
            </div>

            <div class="card-body">
              <div id="dashError" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="dashErrorMsg"></span>
              </div>

              <div id="dashLoading" class="text-center my-4">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 mb-0">Carregando indicadores...</p>
              </div>

              <div id="dashContent" class="d-none">

                <div class="row g-4 mb-4">
                  <div class="col-md-3">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body">
                        <h6 class="mb-1">Total Usuários</h6>
                        <div class="display-6 fw-bold" id="totalUsuarios">0</div>
                        <div class="small opacity-75">No sistema</div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card bg-success text-white h-100">
                      <div class="card-body">
                        <h6 class="mb-1">Usuários Ativos</h6>
                        <div class="display-6 fw-bold" id="usuariosAtivos">0</div>
                        <div class="small opacity-75">Ativos</div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card bg-warning text-white h-100">
                      <div class="card-body">
                        <h6 class="mb-1">Mensagens Ativas</h6>
                        <div class="display-6 fw-bold" id="mensagensAtivas">0</div>
                        <div class="small opacity-75">Visíveis</div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card bg-info text-white h-100">
                      <div class="card-body">
                        <h6 class="mb-1">Administradores</h6>
                        <div class="display-6 fw-bold" id="totalAdmins">0</div>
                        <div class="small opacity-75">Perfil ADMIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row g-4">
                  <div class="col-md-6">
                    <div class="card h-100">
                      <div class="card-header d-flex justify-content-between align-items-center">
                        <strong><i class="bi bi-activity"></i> Últimos Usuários</strong>
                        <span class="badge bg-light text-dark" id="badgeUltimosUsuarios">-</span>
                      </div>
                      <div class="card-body">
                        <div id="atividadeList" class="list-group list-group-flush"></div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="card h-100">
                      <div class="card-header">
                        <strong><i class="bi bi-bell"></i> Ações Rápidas</strong>
                      </div>
                      <div class="card-body">
                        <div class="alert alert-info mb-3">
                          Sessão ativa: <strong>${this.session?.email || "-"}</strong>
                          <div class="small text-muted">Perfil: ${this.session?.role || "-"}</div>
                        </div>

                        <div class="d-grid gap-2">
                          <button class="btn btn-outline-primary" id="btnNovoUsuarioDash">
                            <i class="bi bi-person-plus"></i> Novo Usuário
                          </button>
                          <button class="btn btn-outline-success" id="btnCriarMensagemDash">
                            <i class="bi bi-megaphone"></i> Criar Mensagem
                          </button>
                          <button class="btn btn-outline-info" id="btnExportarRelatorioDash">
                            <i class="bi bi-download"></i> Exportar Relatório
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.safeBindClick("btnRefreshDashboard", () => this.loadDashboard());

    // ações rápidas (robustas)
    this.safeBindClick("btnNovoUsuarioDash", () => {
      // garante DOM/manager pronto: vai para Usuários primeiro
      this.loadSection("usuarios");
      setTimeout(() => window.usuariosManager?.abrirModalNovoUsuario?.(), 150);
    });

    this.safeBindClick("btnCriarMensagemDash", () => {
      this.loadSection("mensagens");
      setTimeout(() => window.mensagensManager?.abrirModalNovaMensagem?.(), 150);
    });

    this.safeBindClick("btnExportarRelatorioDash", () => {
      this.loadSection("usuarios");
      setTimeout(() => window.usuariosManager?.gerarRelatorioUsuarios?.(), 200);
    });

    const showError = (msg) => {
      this.safeSetText("dashErrorMsg", msg || "Erro ao carregar dashboard.");
      document.getElementById("dashError")?.classList.remove("d-none");
      document.getElementById("dashLoading")?.classList.add("d-none");
      document.getElementById("dashContent")?.classList.add("d-none");
    };

    const showContent = () => {
      document.getElementById("dashLoading")?.classList.add("d-none");
      document.getElementById("dashError")?.classList.add("d-none");
      document.getElementById("dashContent")?.classList.remove("d-none");
    };

    try {
      // 1) tenta endpoints de estatísticas
      const [statsUsuarios, statsMensagens] = await Promise.allSettled([
        this.apiFetchJson("/api/usuarios/estatisticas", { method: "GET" }),
        this.apiFetchJson("/api/mensagens/estatisticas", { method: "GET" }),
      ]);

      let totalUsuarios = null;
      let usuariosAtivos = null;
      let totalAdmins = null;
      let mensagensAtivas = null;

      if (statsUsuarios.status === "fulfilled" && statsUsuarios.value) {
        totalUsuarios = statsUsuarios.value.totalUsuarios ?? null;
        usuariosAtivos = statsUsuarios.value.usuariosAtivos ?? null;
        totalAdmins = statsUsuarios.value.totalAdmins ?? null;
      }

      if (statsMensagens.status === "fulfilled" && statsMensagens.value) {
        mensagensAtivas = statsMensagens.value.mensagensAtivas ?? null;
      }

      // 2) fallback: listas (só se precisar)
      const needUsuarios = totalUsuarios == null || usuariosAtivos == null || totalAdmins == null;
      const needMensagens = mensagensAtivas == null;

      const [usuariosRes, mensagensRes] = await Promise.allSettled([
        needUsuarios ? this.apiFetchJson("/api/usuarios", { method: "GET" }) : Promise.resolve(this._cacheUsuarios),
        needMensagens ? this.apiFetchJson("/api/mensagens/todas", { method: "GET" }) : Promise.resolve(this._cacheMensagens),
      ]);

      if (usuariosRes.status === "fulfilled") this._cacheUsuarios = usuariosRes.value;
      if (mensagensRes.status === "fulfilled") this._cacheMensagens = mensagensRes.value;

      const usuariosArr = Array.isArray(this._cacheUsuarios) ? this._cacheUsuarios : [];
      const mensagensArr = Array.isArray(this._cacheMensagens) ? this._cacheMensagens : [];

      if (needUsuarios) {
        totalUsuarios = totalUsuarios ?? usuariosArr.length;
        usuariosAtivos = usuariosAtivos ?? usuariosArr.filter((u) => u?.ativo === true).length;
        totalAdmins = totalAdmins ?? usuariosArr.filter((u) => String(u?.perfil || "").toUpperCase() === "ADMIN").length;
      }

      if (needMensagens) {
        mensagensAtivas = mensagensAtivas ?? mensagensArr.filter((m) => m?.ativo === true).length;
      }

      // render KPIs
      this.safeSetText("totalUsuarios", totalUsuarios ?? 0);
      this.safeSetText("usuariosAtivos", usuariosAtivos ?? 0);
      this.safeSetText("totalAdmins", totalAdmins ?? 0);
      this.safeSetText("mensagensAtivas", mensagensAtivas ?? 0);

      // atividade recente (usa cache se tiver)
      await this.renderAtividadeRecente(this._cacheUsuarios);

      showContent();
    } catch (e) {
      console.error("❌ Erro no dashboard:", e);
      showError(e?.message || "Erro inesperado ao carregar dashboard.");
    }
  }

  async renderAtividadeRecente(usuariosCache = null) {
    const list = document.getElementById("atividadeList");
    if (!list) return;

    list.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border spinner-border-sm"></div>
        <p class="mt-2 mb-0">Carregando...</p>
      </div>
    `;

    try {
      const usuarios = Array.isArray(usuariosCache)
        ? usuariosCache
        : await this.apiFetchJson("/api/usuarios", { method: "GET" });

      const arr = Array.isArray(usuarios) ? usuarios : [];

      const recentes = arr
        .slice()
        .sort((a, b) => new Date(b?.dataCriacao || 0) - new Date(a?.dataCriacao || 0))
        .slice(0, 5);

      this.safeSetText("badgeUltimosUsuarios", `${recentes.length}/5`);

      if (recentes.length === 0) {
        list.innerHTML = `
          <div class="text-center py-3">
            <i class="bi bi-people display-6 text-muted"></i>
            <p class="mt-2 mb-0">Nenhum usuário</p>
          </div>
        `;
        return;
      }

      const formatDate =
        window.formatDate ||
        ((dateString) => {
          if (!dateString) return "N/A";
          try {
            const d = new Date(dateString);
            return d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return String(dateString);
          }
        });

      list.innerHTML = recentes
        .map((u) => {
          const isAdmin = String(u?.perfil || "").toUpperCase() === "ADMIN";
          const ativoBadge = u?.ativo
            ? `<span class="badge bg-success">Ativo</span>`
            : `<span class="badge bg-secondary">Inativo</span>`;
          const perfilBadge = isAdmin
            ? `<span class="badge bg-danger">ADMIN</span>`
            : `<span class="badge bg-primary">USUÁRIO</span>`;

          return `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <i class="bi bi-person-circle ${isAdmin ? "text-danger" : "text-primary"} fs-4"></i>
                <div class="ms-2">
                  <div class="fw-semibold">${u?.nome || "Sem nome"}</div>
                  <div class="small text-muted">${u?.email || "-"}</div>
                </div>
              </div>
              <div class="text-end">
                ${ativoBadge} ${perfilBadge}<br/>
                <small class="text-muted">${formatDate(u?.dataCriacao)}</small>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (e) {
      console.error("❌ Erro atividade recente:", e);
      list.innerHTML = `
        <div class="alert alert-danger m-2">
          <i class="bi bi-exclamation-triangle"></i> Erro ao carregar atividade
        </div>
      `;
      this.safeSetText("badgeUltimosUsuarios", "-");
    }
  }

  testAPIConnection() {
    setTimeout(() => {
      this.apiFetch("/api/usuarios", { method: "GET" })
        .then((response) => {
          if (response.ok) console.log("🌐 Conexão com API: ✅ OK");
          else {
            console.warn("⚠️ API retornou status:", response.status);
            if (response.status === 401 || response.status === 403) {
              window.location.replace("/auth/login?error=expired");
            }
          }
        })
        .catch((error) => console.error("❌ Erro ao conectar com API:", error));
    }, 500);
  }
}

// Instância global
const adminDashboard = new AdminDashboard();

// Boot
document.addEventListener("DOMContentLoaded", function () {
  adminDashboard.init();
});
