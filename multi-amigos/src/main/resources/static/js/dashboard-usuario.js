// ===============================
// AUTH + API (ÚNICO E SEGURO) - COOKIE HttpOnly
// ===============================
(function authBootstrap() {
    // Helper único de API (global)
    if (!window.Api) {
        window.Api = {
            authHeaders(extra = {}) {
                return { 'Accept': 'application/json', ...extra };
            },

            async fetchRaw(url, options = {}) {
                const opts = { ...options };
                opts.headers = this.authHeaders(opts.headers || {});
                if (!opts.credentials) opts.credentials = 'same-origin';
                return fetch(url, opts);
            },

            async fetchJson(url, options = {}) {
                const opts = { ...options };
                opts.headers = this.authHeaders(opts.headers || {});
                if (!opts.credentials) opts.credentials = 'same-origin';

                if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
                    if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
                    opts.body = JSON.stringify(opts.body);
                }

                const res = await fetch(url, opts);

                if (res.status === 401) {
                    window.location.href = "/auth/login?error=expired";
                    throw new Error('Sessão expirada. Faça login novamente.');
                }

                const contentType = res.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');

                const body = isJson
                    ? await res.json().catch(() => ({}))
                    : await res.text().catch(() => '');

                if (!res.ok) {
                    if (res.status === 403) {
                        throw new Error('Acesso negado. Você não tem permissão para essa ação.');
                    }

                    let msg = '';
                    if (typeof body === 'string') msg = body;
                    else if (body && typeof body === 'object') msg = body.error || body.message || JSON.stringify(body);

                    throw new Error(`Erro ${res.status}: ${msg || res.statusText}`);
                }

                return body;
            }
        };
    }

    // ✅ Descobre nome do usuário sem token no front:
    // preferencial: backend já renderiza no Thymeleaf ou expõe /api/me
    // então tentamos carregar /api/me e preencher navbar.
    (async () => {
        const navbarUsername = document.getElementById('navbarUsername');
        if (!navbarUsername) return;

        // Se o Thymeleaf já tiver preenchido, não mexe
        if (navbarUsername.textContent && navbarUsername.textContent.trim()) return;

        try {
            const me = await window.Api.fetchJson('/api/me', { method: 'GET' });
            const nome = me?.nome || me?.name || me?.username || me?.email || 'Usuário';
            navbarUsername.textContent = nome;
        } catch (e) {
            // Se cair aqui por 401, já redirecionou.
            // Caso seja outro erro, só deixa o placeholder.
            console.warn('Não foi possível carregar /api/me para navbar:', e?.message);
        }
    })();
})();

// ==========================
// ORQUESTRADOR DO PERFIL
// ==========================
function ensurePerfilManager() {
    if (!window.usuarioPerfilManager) {
        window.usuarioPerfilManager = new UsuarioPerfilManager();
    }
    return window.usuarioPerfilManager;
}

function atualizarPerfilUI() {
    const mgr = ensurePerfilManager();
    mgr.carregarMeuPerfil();
}

// ============================================
// FUNÇÕES DO DASHBOARD
// ============================================
async function logout() {
    if (!confirm("Deseja realmente sair?")) return;

    try {
        // ✅ backend já apaga cookie jwt_token
        await window.Api.fetchRaw('/auth/logout', { method: 'POST' }).catch(() => null);
    } finally {
        window.location.href = "/auth/login";
    }
}

function carregarMinhaRede() {
    const conteudo = document.getElementById('conteudoDinamico');

    conteudo.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-diagram-3"></i> Minha Rede</h5>
                    <button class="btn btn-light btn-sm" onclick="carregarMinhaRede()">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                </div>
            </div>
            <div class="card-body" id="redeContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-3 text-muted">Carregando sua rede...</p>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => carregarHierarquia(), 100);
}

async function carregarHierarquia() {
    try {
        const hierarquia = await window.Api.fetchJson('/api/me/hierarquia', { method: 'GET' });

        const container = document.getElementById('redeContainer');
        if (!container) return;

        if (!hierarquia || hierarquia.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    Você ainda não tem ninguém na sua rede.
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th>Data Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        hierarquia.forEach(filho => {
            const status = filho.ativo
                ? '<span class="badge bg-success">Ativo</span>'
                : '<span class="badge bg-secondary">Inativo</span>';

            html += `
                <tr>
                    <td>${escapeHtml(filho.nome)}</td>
                    <td>${escapeHtml(filho.email)}</td>
                    <td>${escapeHtml(filho.telefone || 'Não informado')}</td>
                    <td>${status}</td>
                    <td>${formatarData(filho.dataCriacao)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <div class="alert alert-success">
                    <i class="bi bi-people"></i>
                    <strong>Total na sua rede:</strong> ${hierarquia.length} pessoa${hierarquia.length !== 1 ? 's' : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        const container = document.getElementById('redeContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Não foi possível carregar sua rede. Tente novamente.
            </div>
        `;
    }
}

function gerarLinkConvite() {
    const conteudo = document.getElementById('conteudoDinamico');

    conteudo.innerHTML = `
        <div class="card">
            <div class="card-header bg-success text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-link-45deg"></i> Gerar Convite</h5>
                    <button class="btn btn-light btn-sm" onclick="gerarLinkConvite()">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                </div>
            </div>
            <div class="card-body" id="conviteContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-success"></div>
                    <p class="mt-3 text-muted">Gerando seu link de convite...</p>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => gerarLink(), 100);
}

async function gerarLink() {
    try {
        const data = await window.Api.fetchJson('/api/me/link-convite', { method: 'GET' });

        const container = document.getElementById('conviteContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center">
                <div class="alert alert-success">
                    <h5><i class="bi bi-check-circle"></i> ${escapeHtml(data.mensagem || 'Convite gerado')}</h5>
                    <p class="mb-3">${escapeHtml(data.instrucoes || '')}</p>
                </div>

                <div class="card mt-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Seu link de convite:</h6>
                    </div>
                    <div class="card-body">
                        <div class="input-group">
                            <input type="text" class="form-control" id="linkConvite" value="${escapeHtml(data.link || '')}" readonly>
                            <button class="btn btn-success" type="button" onclick="copiarLink()">
                                <i class="bi bi-clipboard"></i> Copiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        const container = document.getElementById('conviteContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Não foi possível gerar o link de convite. Tente novamente.
            </div>
        `;
    }
}

function verMeuPerfil() {
    const conteudo = document.getElementById('conteudoDinamico');

    conteudo.innerHTML = `
        <div class="card">
            <div class="card-header bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-person-circle"></i> Meu Perfil</h5>
                    <button class="btn btn-light btn-sm" onclick="atualizarPerfilUI()">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                </div>
            </div>
            <div class="card-body" id="perfilContainer">
                <div class="text-center py-5">
                    <div class="spinner-border text-info"></div>
                    <p class="mt-3 text-muted">Carregando perfil...</p>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        const mgr = ensurePerfilManager();
        mgr.perfilContainer = document.getElementById('perfilContainer');
        mgr.carregarMeuPerfil();
    }, 0);
}

// FUNÇÕES AUXILIARES
function copiarLink() {
    const input = document.getElementById('linkConvite');
    if (!input) return;
    input.select();
    document.execCommand('copy');
    mostrarMensagem('Link copiado para a área de transferência!', 'success');
}

function mostrarMensagem(texto, tipo = 'info') {
    document.querySelectorAll('.mensagem-flutuante').forEach(el => el.remove());

    const icone =
        tipo === 'success' ? 'bi-check-circle' :
        tipo === 'danger' ? 'bi-exclamation-triangle' :
        tipo === 'warning' ? 'bi-exclamation-triangle' :
        'bi-info-circle';

    const mensagemHtml = `
        <div class="mensagem-flutuante alert alert-${tipo} alert-dismissible fade show" role="alert">
            <i class="bi ${icone} me-2"></i>
            ${escapeHtml(texto)}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', mensagemHtml);
    setTimeout(() => document.querySelector('.mensagem-flutuante')?.remove(), 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatarData(dataString) {
    if (!dataString) return 'Data não informada';
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dataString;
    }
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard do usuário carregado');

    document.getElementById('btnVerRede')?.addEventListener('click', carregarMinhaRede);
    document.getElementById('btnGerarLink')?.addEventListener('click', gerarLinkConvite);
    document.getElementById('btnVerPerfil')?.addEventListener('click', verMeuPerfil);

    document.getElementById('btnAtualizarMensagens')?.addEventListener('click', function() {
        window.usuarioMensagemManager?.carregarMensagensSistema();
    });

    // ✅ inicializa mensagens (sem depender de token local)
    setTimeout(() => {
        if (window.UsuarioMensagemManager && !window.usuarioMensagemManager) {
            console.log('🚀 Inicializando UsuarioMensagemManager...');
            window.usuarioMensagemManager = new UsuarioMensagemManager();
            window.usuarioMensagemManager.init();
        }
    }, 0);
});
