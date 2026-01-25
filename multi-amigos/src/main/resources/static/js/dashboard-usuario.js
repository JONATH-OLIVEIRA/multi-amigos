// ===============================
// AUTH + FETCH (ÚNICO E SEGURO)
// ===============================
(function authBootstrap() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/auth/login?error=expired";
        return;
    }

    function parseJwt(t) {
        try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    const payload = parseJwt(token);
    const navbarUsername = document.getElementById('navbarUsername');
    if (navbarUsername) {
        const nome =
            payload?.name ||
            payload?.nome ||
            payload?.username ||
            payload?.preferred_username ||
            payload?.sub ||
            payload?.email ||
            'Usuário';
        navbarUsername.textContent = nome;
    }

    if (window.fetch && window.fetch.__jwtIntercepted) return;

    const originalFetch = window.fetch;
    window.fetch = async function(resource, options = {}) {
        const url = typeof resource === 'string' ? resource : resource.url;

        const isStatic =
            url.includes('/css/') || url.includes('/js/') || url.includes('/images/') ||
            url.endsWith('.css') || url.endsWith('.js') || url.endsWith('.ico') ||
            url.includes('/webjars/') || url.includes('cdn.jsdelivr.net') || url.includes('d3js.org');

        if (isStatic) {
            return originalFetch(resource, options);
        }

        const latestToken = localStorage.getItem('token');
        if (!latestToken) {
            window.location.href = "/auth/login?error=expired";
            return originalFetch(resource, options);
        }

        const newOptions = { ...options };
        newOptions.headers = { ...(newOptions.headers || {}) };

        if (!newOptions.headers['Authorization']) {
            newOptions.headers['Authorization'] = `Bearer ${latestToken}`;
        }

        const resp = await originalFetch(resource, newOptions);

        if (resp.status === 401 || resp.status === 403) {
            localStorage.removeItem('token');
            window.location.href = "/auth/login?error=expired";
        }

        return resp;
    };

    window.fetch.__jwtIntercepted = true;
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
function logout() {
    if (confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
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

function carregarHierarquia() {
    fetch('/api/me/hierarquia')
        .then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json(); })
        .then(hierarquia => {
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
        })
        .catch(err => {
            console.error(err);
            const container = document.getElementById('redeContainer');
            if (!container) return;
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Não foi possível carregar sua rede. Tente novamente.
                </div>
            `;
        });
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

function gerarLink() {
    fetch('/api/me/link-convite')
        .then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json(); })
        .then(data => {
            const container = document.getElementById('conviteContainer');
            if (!container) return;

            container.innerHTML = `
                <div class="text-center">
                    <div class="alert alert-success">
                        <h5><i class="bi bi-check-circle"></i> ${data.mensagem}</h5>
                        <p class="mb-3">${data.instrucoes}</p>
                    </div>

                    <div class="card mt-3">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Seu link de convite:</h6>
                        </div>
                        <div class="card-body">
                            <div class="input-group">
                                <input type="text" class="form-control" id="linkConvite" value="${data.link}" readonly>
                                <button class="btn btn-success" type="button" onclick="copiarLink()">
                                    <i class="bi bi-clipboard"></i> Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            const container = document.getElementById('conviteContainer');
            if (!container) return;
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Não foi possível gerar o link de convite. Tente novamente.
                </div>
            `;
        });
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
            ${texto}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', mensagemHtml);
    setTimeout(() => document.querySelector('.mensagem-flutuante')?.remove(), 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
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

    // Configurar event listeners
    document.getElementById('btnVerRede').addEventListener('click', carregarMinhaRede);
    document.getElementById('btnGerarLink').addEventListener('click', gerarLinkConvite);
    document.getElementById('btnVerPerfil').addEventListener('click', verMeuPerfil);
    
    if (document.getElementById('btnAtualizarMensagens')) {
        document.getElementById('btnAtualizarMensagens').addEventListener('click', function() {
            if (window.usuarioMensagemManager) {
                window.usuarioMensagemManager.carregarMensagensSistema();
            }
        });
    }

    setTimeout(() => {
        if (window.UsuarioMensagemManager && !window.usuarioMensagemManager) {
            console.log('🚀 Inicializando UsuarioMensagemManager...');
            window.usuarioMensagemManager = new UsuarioMensagemManager();
        }
    }, 0);
});