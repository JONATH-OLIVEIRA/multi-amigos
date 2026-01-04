// admin-dashboard.js - VERSÃO COMPLETA COM MENU
(function() {
    // Interceptador global para token
    const originalFetch = window.fetch;
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Faça login primeiro!");
        window.location.href = '/auth/login';
        return;
    }
    
    window.fetch = function(resource, options = {}) {
        if (token && resource && typeof resource === 'string') {
            if (resource.startsWith('/') || resource.includes('localhost:8080')) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }
        return originalFetch.call(this, resource, options);
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    // Elementos DOM
    const contentArea = document.getElementById("contentArea");
    const loadingArea = document.getElementById("loadingArea");
    const pageTitle = document.getElementById("pageTitle");
    const logoutBtn = document.getElementById("logoutBtn");
    
    // Menu items
    const menuUsuarios = document.getElementById("menuUsuarios");
    const menuMensagens = document.getElementById("menuMensagens");
    const menuDashboard = document.getElementById("menuDashboard");
    const menuHome = document.getElementById("menuHome");
    
    // Estado atual
    let currentPage = 'usuarios';
    
    // Inicialização
    initialize();
    
    function initialize() {
        // Setup dos eventos
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }
        
        if (menuUsuarios) {
            menuUsuarios.addEventListener("click", (e) => {
                e.preventDefault();
                loadPage('usuarios');
                setActiveMenu('usuarios');
            });
        }
        
        if (menuMensagens) {
            menuMensagens.addEventListener("click", (e) => {
                e.preventDefault();
                loadPage('mensagens');
                setActiveMenu('mensagens');
            });
        }
        
        if (menuDashboard) {
            menuDashboard.addEventListener("click", (e) => {
                e.preventDefault();
                loadPage('dashboard');
                setActiveMenu('dashboard');
            });
        }
        
        if (menuHome) {
            menuHome.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = '/';
            });
        }
        
        // Carrega página inicial
        loadPage('usuarios');
        setActiveMenu('usuarios');
    }
    
    // Função para carregar páginas
    function loadPage(page) {
        currentPage = page;
        
        // Atualiza título
        updatePageTitle(page);
        
        // Mostra loading
        showLoading();
        
        // Carrega conteúdo baseado na página
        switch(page) {
            case 'usuarios':
                loadUsuariosPage();
                break;
            case 'mensagens':
                loadMensagensPage();
                break;
            case 'dashboard':
                loadDashboardPage();
                break;
            default:
                loadUsuariosPage();
        }
    }
    
    // Página de Usuários
    function loadUsuariosPage() {
        const html = `
            <div class="row mb-4">
                <div class="col">
                    <h2><i class="bi bi-people"></i> Usuários Cadastrados</h2>
                    <p class="text-muted">
                        <span class="badge bg-danger">ADMIN</span> Gerencie todos os usuários do sistema
                    </p>
                </div>
                <div class="col-auto">
                    <button id="refreshUsuarios" class="btn btn-primary">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                    <button id="addUserBtn" class="btn btn-success ms-2">
                        <i class="bi bi-person-plus"></i> Novo Usuário
                    </button>
                </div>
            </div>
            
            <div id="usuariosContainer" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 fade-in">
                <!-- Usuários serão carregados aqui -->
            </div>
            
            <div id="emptyUsuarios" class="text-center py-5 d-none">
                <i class="bi bi-people display-1 text-muted"></i>
                <h4 class="mt-3">Nenhum usuário encontrado</h4>
                <p class="text-muted">Não há usuários cadastrados no sistema.</p>
            </div>
            
            <div id="errorUsuarios" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="errorUsuariosMessage">Erro ao carregar usuários</span>
            </div>
        `;
        
        contentArea.innerHTML = html;
        hideLoading();
        
        // Carrega dados
        loadUsuariosData();
        
        // Adiciona eventos aos novos botões
        setTimeout(() => {
            const refreshBtn = document.getElementById('refreshUsuarios');
            const addBtn = document.getElementById('addUserBtn');
            
            if (refreshBtn) {
                refreshBtn.addEventListener('click', loadUsuariosData);
            }
            
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    window.location.href = '/auth/register';
                });
            }
        }, 100);
    }
    
    // Carrega dados dos usuários
    function loadUsuariosData() {
        const container = document.getElementById('usuariosContainer');
        const emptyState = document.getElementById('emptyUsuarios');
        const errorState = document.getElementById('errorUsuarios');
        const errorMessage = document.getElementById('errorUsuariosMessage');
        
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.add('d-none');
        if (errorState) errorState.classList.add('d-none');
        
        showLoading();
        
        fetch("/api/usuarios")
            .then(response => {
                if (response.status === 403) {
                    throw new Error("Acesso negado! Verifique suas permissões.");
                }
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    window.location.href = "/auth/login";
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(usuarios => {
                hideLoading();
                renderUsuarios(usuarios);
            })
            .catch(err => {
                hideLoading();
                if (errorMessage) errorMessage.textContent = err.message;
                if (errorState) errorState.classList.remove('d-none');
            });
    }
    
    // Renderiza usuários
    function renderUsuarios(usuarios) {
        const container = document.getElementById('usuariosContainer');
        const emptyState = document.getElementById('emptyUsuarios');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!usuarios || usuarios.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }
        
        usuarios.forEach(usuario => {
            const col = document.createElement('div');
            col.className = 'col';
            
            const badgeClass = usuario.perfil === 'ADMIN' ? 'badge-admin' : 'badge-user';
            const borderClass = usuario.perfil === 'ADMIN' ? 'border-danger' : 'border-primary';
            
            col.innerHTML = `
                <div class="card h-100 user-card ${borderClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${usuario.nome || 'Sem nome'}</h5>
                            <span class="badge ${badgeClass}">${usuario.perfil || 'USER'}</span>
                        </div>
                        <p class="card-text text-muted mb-1">
                            <i class="bi bi-envelope"></i> ${usuario.email || 'Sem email'}
                        </p>
                        ${usuario.telefone ? `
                            <p class="card-text text-muted mb-1">
                                <i class="bi bi-telephone"></i> ${usuario.telefone}
                            </p>
                        ` : ''}
                        <p class="card-text text-muted mb-3">
                            <small>
                                <i class="bi bi-calendar"></i> 
                                ${formatDate(usuario.dataCriacao)}
                            </small>
                        </p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm btn-hierarchy" data-id="${usuario.id}">
                                <i class="bi bi-diagram-3"></i> Hierarquia
                            </button>
                            <button class="btn btn-outline-secondary btn-sm btn-details" data-id="${usuario.id}">
                                <i class="bi bi-info-circle"></i> Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
        
        // Adiciona eventos aos botões
        setTimeout(() => {
            document.querySelectorAll('.btn-hierarchy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.target.closest('button').dataset.id;
                    verHierarquia(userId);
                });
            });
            
            document.querySelectorAll('.btn-details').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.target.closest('button').dataset.id;
                    verDetalhesUsuario(userId);
                });
            });
        }, 100);
    }
    
    // Página de Mensagens
    function loadMensagensPage() {
        const html = `
            <div class="row mb-4">
                <div class="col">
                    <h2><i class="bi bi-megaphone"></i> Mensagens do Sistema</h2>
                    <p class="text-muted">
                        <span class="badge bg-danger">ADMIN</span> Crie e gerencie mensagens para todos os usuários
                    </p>
                </div>
                <div class="col-auto">
                    <button id="refreshMensagens" class="btn btn-primary">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                    <button id="addMensagemBtn" class="btn btn-success ms-2" data-bs-toggle="modal" data-bs-target="#mensagemModal">
                        <i class="bi bi-plus-circle"></i> Nova Mensagem
                    </button>
                </div>
            </div>
            
            <div id="mensagensContainer" class="row row-cols-1 g-3 fade-in">
                <!-- Mensagens serão carregadas aqui -->
            </div>
            
            <div id="emptyMensagens" class="text-center py-5 d-none">
                <i class="bi bi-megaphone display-1 text-muted"></i>
                <h4 class="mt-3">Nenhuma mensagem encontrada</h4>
                <p class="text-muted">Crie sua primeira mensagem para os usuários.</p>
            </div>
            
            <div id="errorMensagens" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="errorMensagensMessage">Erro ao carregar mensagens</span>
            </div>
        `;
        
        contentArea.innerHTML = html;
        hideLoading();
        
        // Carrega dados
        loadMensagensData();
        
        // Adiciona eventos
        setTimeout(() => {
            const refreshBtn = document.getElementById('refreshMensagens');
            const addBtn = document.getElementById('addMensagemBtn');
            
            if (refreshBtn) {
                refreshBtn.addEventListener('click', loadMensagensData);
            }
            
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    // O modal já abre via data-bs-toggle
                });
            }
            
            // Formulário de mensagem
            const formMensagem = document.getElementById('formMensagem');
            if (formMensagem) {
                formMensagem.addEventListener('submit', criarMensagem);
            }
        }, 100);
    }
    
    // Carrega dados das mensagens
    function loadMensagensData() {
        const container = document.getElementById('mensagensContainer');
        const emptyState = document.getElementById('emptyMensagens');
        const errorState = document.getElementById('errorMensagens');
        const errorMessage = document.getElementById('errorMensagensMessage');
        
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.add('d-none');
        if (errorState) errorState.classList.add('d-none');
        
        showLoading();
        
        fetch("/api/mensagens/todas")
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(mensagens => {
                hideLoading();
                renderMensagens(mensagens);
            })
            .catch(err => {
                hideLoading();
                if (errorMessage) errorMessage.textContent = err.message;
                if (errorState) errorState.classList.remove('d-none');
            });
    }
    
    // Renderiza mensagens
    function renderMensagens(mensagens) {
        const container = document.getElementById('mensagensContainer');
        const emptyState = document.getElementById('emptyMensagens');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!mensagens || mensagens.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }
        
        mensagens.forEach(msg => {
            const col = document.createElement('div');
            col.className = 'col';
            
            const tipoClasse = msg.tipo === 'URGENTE' ? 'mensagem-urgente' :
                              msg.tipo === 'IMPORTANTE' ? 'mensagem-importante' : 'mensagem-informativa';
            
            const badgeClass = msg.tipo === 'URGENTE' ? 'bg-danger' :
                              msg.tipo === 'IMPORTANTE' ? 'bg-warning' : 'bg-info';
            
            const statusBadge = msg.visivel ? 
                '<span class="badge bg-success">Ativa</span>' :
                '<span class="badge bg-secondary">Inativa</span>';
            
            col.innerHTML = `
                <div class="card mensagem-card ${tipoClasse}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${msg.titulo}</strong>
                            <span class="badge ${badgeClass} ms-2">${msg.tipo}</span>
                            ${statusBadge}
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary btn-edit-msg" data-id="${msg.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger ms-1 btn-delete-msg" data-id="${msg.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${msg.conteudo}</p>
                        <div class="text-muted small">
                            <i class="bi bi-person"></i> ${msg.autorNome} 
                            <i class="bi bi-calendar ms-2"></i> ${formatDate(msg.dataCriacao)}
                            ${msg.dataExpiracao ? `
                                <br><i class="bi bi-clock"></i> Expira em: ${formatDate(msg.dataExpiracao)}
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
        
        // Adiciona eventos aos botões
        setTimeout(() => {
            document.querySelectorAll('.btn-edit-msg').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const msgId = e.target.closest('button').dataset.id;
                    editarMensagem(msgId);
                });
            });
            
            document.querySelectorAll('.btn-delete-msg').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const msgId = e.target.closest('button').dataset.id;
                    excluirMensagem(msgId);
                });
            });
        }, 100);
    }
    
    // Página de Dashboard (resumo)
    function loadDashboardPage() {
        const html = `
            <div class="row mb-4">
                <div class="col">
                    <h2><i class="bi bi-speedometer2"></i> Dashboard Resumo</h2>
                    <p class="text-muted">Visão geral do sistema</p>
                </div>
            </div>
            
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total Usuários</h5>
                            <h2 id="totalUsuarios" class="mb-0">0</h2>
                            <p class="card-text mt-2">No sistema</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Usuários Ativos</h5>
                            <h2 id="usuariosAtivos" class="mb-0">0</h2>
                            <p class="card-text mt-2">Hoje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h5 class="card-title">Mensagens Ativas</h5>
                            <h2 id="mensagensAtivas" class="mb-0">0</h2>
                            <p class="card-text mt-2">Visíveis</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Hierarquia</h5>
                            <h2 id="niveisHierarquia" class="mb-0">0</h2>
                            <p class="card-text mt-2">Níveis</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-activity"></i> Atividade Recente</h5>
                        </div>
                        <div class="card-body">
                            <div id="atividadeList" class="list-group list-group-flush">
                                <!-- Atividade será carregada aqui -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-bell"></i> Mensagens Recentes</h5>
                        </div>
                        <div class="card-body">
                            <div id="mensagensRecentes" class="list-group list-group-flush">
                                <!-- Mensagens recentes serão carregadas aqui -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contentArea.innerHTML = html;
        hideLoading();
        
        // Carrega dados do dashboard
        loadDashboardData();
    }
    
    // Carrega dados do dashboard
    function loadDashboardData() {
        // Implemente a busca de dados do dashboard aqui
        // Por enquanto, valores estáticos
        document.getElementById('totalUsuarios').textContent = '--';
        document.getElementById('usuariosAtivos').textContent = '--';
        document.getElementById('mensagensAtivas').textContent = '--';
        document.getElementById('niveisHierarquia').textContent = '--';
    }
    
    // Funções auxiliares
    function setActiveMenu(menu) {
        // Remove active de todos os menus
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adiciona active ao menu selecionado
        const activeMenu = document.getElementById(`menu${menu.charAt(0).toUpperCase() + menu.slice(1)}`);
        if (activeMenu) {
            activeMenu.classList.add('active');
        }
    }
    
    function updatePageTitle(page) {
        const titles = {
            'usuarios': '<i class="bi bi-people"></i> Gerenciar Usuários',
            'mensagens': '<i class="bi bi-megaphone"></i> Gerenciar Mensagens',
            'dashboard': '<i class="bi bi-speedometer2"></i> Dashboard Admin'
        };
        
        if (pageTitle && titles[page]) {
            pageTitle.innerHTML = titles[page];
        }
    }
    
    function showLoading() {
        if (loadingArea) {
            loadingArea.classList.remove('d-none');
        }
        if (contentArea) {
            contentArea.style.opacity = '0.5';
        }
    }
    
    function hideLoading() {
        if (loadingArea) {
            loadingArea.classList.add('d-none');
        }
        if (contentArea) {
            contentArea.style.opacity = '1';
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    // Funções para mensagens
    function criarMensagem(e) {
        e.preventDefault();
        
        const titulo = document.getElementById('tituloMensagem').value;
        const conteudo = document.getElementById('conteudoMensagem').value;
        const tipo = document.getElementById('tipoMensagem').value;
        const diasValidade = document.getElementById('diasValidade').value;
        
        const mensagemData = {
            titulo: titulo,
            conteudo: conteudo,
            tipo: tipo,
            diasValidade: diasValidade ? parseInt(diasValidade) : null
        };
        
        fetch('/api/mensagens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mensagemData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao criar mensagem');
            return response.json();
        })
        .then(() => {
            alert('Mensagem criada com sucesso!');
            document.getElementById('formMensagem').reset();
            bootstrap.Modal.getInstance(document.getElementById('mensagemModal')).hide();
            loadMensagensData();
        })
        .catch(err => {
            alert('Erro: ' + err.message);
        });
    }
    
    function editarMensagem(id) {
        alert('Editar mensagem ' + id);
        // Implemente a edição
    }
    
    function excluirMensagem(id) {
        if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;
        
        fetch(`/api/mensagens/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao excluir mensagem');
            loadMensagensData();
        })
        .catch(err => {
            alert('Erro: ' + err.message);
        });
    }
    
    // Funções para usuários
    function verHierarquia(userId) {
        fetch(`/api/usuarios/${userId}/hierarquia`)
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(data => {
                let mensagem = `Hierarquia:\n\n`;
                if (data.usuarioPai) {
                    mensagem += `👤 Pai: ${data.usuarioPai.nome}\n\n`;
                }
                if (data.filhos && data.filhos.length > 0) {
                    mensagem += `👥 Filhos (${data.filhos.length}):\n`;
                    data.filhos.forEach((filho, i) => {
                        mensagem += `${i+1}. ${filho.nome}\n`;
                    });
                } else {
                    mensagem += '👥 Sem filhos\n';
                }
                alert(mensagem);
            })
            .catch(err => {
                alert('Erro: ' + err.message);
            });
    }
    
    function verDetalhesUsuario(userId) {
        fetch(`/api/usuarios/${userId}`)
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(usuario => {
                const userDetails = document.getElementById('userDetails');
                if (userDetails) {
                    userDetails.innerHTML = `
                        <h6>${usuario.nome}</h6>
                        <p><i class="bi bi-envelope"></i> ${usuario.email}</p>
                        ${usuario.telefone ? `<p><i class="bi bi-telephone"></i> ${usuario.telefone}</p>` : ''}
                        <p><span class="badge ${usuario.perfil === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}">${usuario.perfil}</span></p>
                        <p><small>Criado em: ${formatDate(usuario.dataCriacao)}</small></p>
                    `;
                    new bootstrap.Modal(document.getElementById('userModal')).show();
                }
            })
            .catch(err => {
                alert('Erro: ' + err.message);
            });
    }
    
    function logout() {
        if (confirm('Deseja realmente sair?')) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
    }
});