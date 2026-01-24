// admin-dashboard.js - GERENCIAMENTO COMPLETO DO DASHBOARD ADMIN

class AdminDashboard {
    constructor() {
        this.jwtToken = null;
        this.currentSection = 'dashboard';
        this.initialized = false;
        this.isLoggingOut = false; // 🔥 Flag para evitar logout duplo
    }

    init() {
        if (this.initialized) {
            console.warn('⚠️ Dashboard já inicializado');
            return;
        }

        console.log('=== DASHBOARD INICIALIZADO ===');
        
        // 1. Configura verificação de token
        if (!this.setupTokenVerification()) {
            return; // Se não tem token, já redirecionou para login
        }
        
        // 2. Configura eventos da interface (interceptor já está no apoio.js)
        this.setupInterfaceEvents();
        
        // 3. Verificação de conexão com API
        this.testAPIConnection();
        
        // 4. Inicialização padrão
        this.loadDefaultSection();
        
        this.initialized = true;
        console.log('=== DASHBOARD PRONTO ===');
    }

    setupTokenVerification() {
        console.log('🔐 Configurando verificação de token...');
        
        // A. Tenta da URL (se veio da busca com token na URL)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
            console.log('⚠️ Token encontrado na URL (não recomendado)');
            this.jwtToken = tokenFromUrl;
            localStorage.setItem('token', this.jwtToken);
            
            // LIMPA IMEDIATAMENTE a URL por segurança
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('✅ URL limpa (token removido do histórico)');
        }
        
        // B. Tenta do sessionStorage (método mais seguro - vindo da busca)
        if (!this.jwtToken) {
            const tokenFromSession = sessionStorage.getItem('dashboard_token') || 
                                     sessionStorage.getItem('jwt_token') ||
                                     sessionStorage.getItem('busca_token');
            
            if (tokenFromSession) {
                console.log('✅ Token recebido via sessionStorage (método seguro)');
                this.jwtToken = tokenFromSession;
                localStorage.setItem('token', this.jwtToken);
                
                // Limpa sessionStorage (uso único)
                sessionStorage.removeItem('dashboard_token');
                sessionStorage.removeItem('jwt_token');
                sessionStorage.removeItem('busca_token');
            }
        }
        
        // C. Tenta do localStorage (persistente)
        if (!this.jwtToken) {
            this.jwtToken = localStorage.getItem('token');
            if (this.jwtToken) {
                console.log('✅ Token encontrado no localStorage');
            }
        }
        
        // VALIDAÇÃO - SE NÃO TEM TOKEN, REDIRECIONA
        if (!this.jwtToken) {
            console.error('❌ Token JWT não encontrado em nenhuma fonte!');
            console.error('Fontes verificadas: URL, sessionStorage, localStorage');
            window.location.href = '/auth/login';
            return false;
        }
        
        console.log('✅ Token JWT presente e válido');
        return true;
    }

    setupInterfaceEvents() {
        console.log('🎛️ Configurando eventos da interface...');
        
        // 🔥 LOGOUT APENAS AQUI - Sistema centralizado
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remove qualquer listener existente
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            // Adiciona nosso listener
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
            
            console.log('✅ Botão logout configurado');
        }
        
        // Menu de Navegação
        this.setupMenuNavigation();
    }
   
    clearAuthCookies() {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Remove cookies relacionados a autenticação
            if (name.includes('token') || name.includes('jwt') || name.includes('auth') || 
                name.includes('session') || name === 'JSESSIONID') {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                console.log(`🍪 Cookie removido: ${name}`);
            }
        });
    }

    setupMenuNavigation() {
        const menus = {
            'menuUsuarios': 'usuarios',
            'menuHierarquia': 'hierarquia',
            'menuMensagens': 'mensagens',
            'menuDashboard': 'dashboard',
            'menuBusca': 'busca',
            'menuHome': 'home'
        };
        
        Object.entries(menus).forEach(([menuId, section]) => {
            const menuElement = document.getElementById(menuId);
            if (menuElement) {
                menuElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (section === 'busca') {
                        this.navigateToBusca();
                    } else if (section === 'home') {
                        window.location.href = '/';
                    } else {
                        this.loadSection(section);
                    }
                });
            }
        });
    }

    navigateToBusca() {
        console.log('🔍 Navegando para Busca Avançada...');
        
        if (!this.jwtToken) {
            alert('❌ Token não encontrado! Faça login novamente.');
            window.location.href = '/auth/login';
            return;
        }
        
        console.log('✅ Token encontrado:', this.jwtToken.substring(0, 20) + '...');
        
        // Salva também no sessionStorage (backup)
        sessionStorage.setItem('busca_token', this.jwtToken);
        
        // Passa o token na URL para o JwtFilter encontrar
        const tokenEncoded = encodeURIComponent(this.jwtToken);
        
        // Navega para busca COM TOKEN NA URL
        window.location.href = `/admin/busca?token=${tokenEncoded}`;
        
        console.log('✅ Navegando para busca com token na URL...');
    }

    loadSection(section) {
        console.log(`📂 Carregando seção: ${section}`);
        
        this.currentSection = section;
        const contentArea = document.getElementById('contentArea');
        const pageTitle = document.getElementById('pageTitle');
        
        if (!contentArea || !pageTitle) {
            console.error('❌ Elementos do DOM não encontrados');
            return;
        }
        
        // Remove active de todos os menus
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adiciona active no menu selecionado
        const menuId = `menu${section.charAt(0).toUpperCase() + section.slice(1)}`;
        const menuElement = document.getElementById(menuId);
        if (menuElement) {
            menuElement.classList.add('active');
        }
        
        // Mostra loading
        contentArea.innerHTML = `
            <div class="text-center my-5" id="loadingContent">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Carregando ${section}...</p>
            </div>
        `;
        
        // Atualiza título da página
        const titles = {
            'usuarios': '<i class="bi bi-people"></i> Gerenciar Usuários',
            'hierarquia': '<i class="bi bi-diagram-3"></i> Hierarquia da Rede',
            'mensagens': '<i class="bi bi-megaphone"></i> Mensagens do Sistema',
            'dashboard': '<i class="bi bi-speedometer2"></i> Dashboard Administrativo'
        };
        
        pageTitle.innerHTML = titles[section] || titles.dashboard;
        
        // Carrega conteúdo específico
        setTimeout(() => {
            switch(section) {
                case 'usuarios':
                    this.loadUsuarios();
                    break;
                case 'hierarquia':
                    this.loadHierarquia();
                    break;
                case 'mensagens':
                    this.loadMensagens();
                    break;
                case 'dashboard':
                    this.loadDashboard();
                    break;
                default:
                    this.loadDashboard();
            }
        }, 100);
    }

    loadUsuarios() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h4 class="mb-0"><i class="bi bi-people"></i> Gerenciamento de Usuários</h4>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i> 
                                Carregando usuários do sistema...
                            </div>
                            <div id="usuarios-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Se o manager de usuários estiver disponível, use-o
        setTimeout(() => {
            if (window.usuariosManager && typeof window.usuariosManager.loadUsuariosData === 'function') {
                window.usuariosManager.loadUsuariosData();
            } else {
                this.loadFallbackUsuarios();
            }
        }, 300);
    }
    
    loadFallbackUsuarios() {
        const usuariosContent = document.getElementById('usuarios-content');
        if (!usuariosContent) return;
        
        fetch('/api/usuarios')
            .then(response => response.json())
            .then(usuarios => {
                let html = `<p>Total de usuários: ${usuarios.length}</p>`;
                html += '<ul class="list-group">';
                
                usuarios.slice(0, 10).forEach(user => {
                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${user.nome}
                            <span class="badge ${user.ativo ? 'bg-success' : 'bg-secondary'}">
                                ${user.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </li>
                    `;
                });
                
                html += '</ul>';
                usuariosContent.innerHTML = html;
            })
            .catch(error => {
                usuariosContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        Erro ao carregar usuários: ${error.message}
                    </div>
                `;
            });
    }

    loadHierarquia() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div id="hierarquiaContainer"></div>
                </div>
            </div>
        `;
        
        // Inicializa a hierarquia
        setTimeout(() => {
            if (typeof hierarquia !== 'undefined' && typeof hierarquia.init === 'function') {
                hierarquia.init('hierarquiaContainer');
            } else {
                console.error('❌ Hierarquia não carregada. Verifique se admin-hierarquia.js está incluído.');
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
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h4 class="mb-0"><i class="bi bi-megaphone"></i> Mensagens do Sistema</h4>
                        </div>
                        <div class="card-body">
                            <div id="mensagens-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Se o manager de mensagens estiver disponível, use-o
        setTimeout(() => {
            if (window.mensagensManager && typeof window.mensagensManager.loadMensagensData === 'function') {
                window.mensagensManager.loadMensagensData();
            } else {
                this.loadFallbackMensagens();
            }
        }, 300);
    }
    
    loadFallbackMensagens() {
        const mensagensContent = document.getElementById('mensagens-content');
        if (!mensagensContent) return;
        
        fetch('/api/mensagens/todas')
            .then(response => response.json())
            .then(mensagens => {
                let html = `<p>Total de mensagens: ${mensagens.length}</p>`;
                mensagensContent.innerHTML = html;
            })
            .catch(error => {
                mensagensContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        Erro ao carregar mensagens: ${error.message}
                    </div>
                `;
            });
    }

    loadDashboard() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h4 class="mb-0"><i class="bi bi-speedometer2"></i> Dashboard Administrativo</h4>
                        </div>
                        <div class="card-body">
                            <p>Dashboard do sistema MultiAmigos</p>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="card text-white bg-primary mb-3">
                                        <div class="card-body">
                                            <h5 class="card-title">Usuários</h5>
                                            <p class="card-text">Gerenciar todos os usuários</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-white bg-info mb-3">
                                        <div class="card-body">
                                            <h5 class="card-title">Hierarquia</h5>
                                            <p class="card-text">Visualizar estrutura da rede</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-white bg-warning mb-3">
                                        <div class="card-body">
                                            <h5 class="card-title">Mensagens</h5>
                                            <p class="card-text">Gerenciar mensagens do sistema</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card text-white bg-secondary mb-3">
                                        <div class="card-body">
                                            <h5 class="card-title">Busca</h5>
                                            <p class="card-text">Busca avançada de usuários</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    testAPIConnection() {
        // Testa se a API está acessível com o token
        setTimeout(() => {
            fetch('/api/usuarios')
                .then(response => {
                    if (response.ok) {
                        console.log('🌐 Conexão com API: ✅ OK');
                    } else {
                        console.warn('⚠️ API retornou status:', response.status);
                        if (response.status === 401 || response.status === 403) {
                            console.error('❌ Token pode ter expirado!');
                            localStorage.removeItem('token');
                            window.location.href = '/auth/login';
                        }
                    }
                })
                .catch(error => {
                    console.error('❌ Erro ao conectar com API:', error);
                });
        }, 500);
    }

    loadDefaultSection() {
        this.loadSection('dashboard');
    }

    // Método para verificar se o usuário está autenticado
    isAuthenticated() {
        return !!this.jwtToken;
    }

    // Método para obter o token atual
    getToken() {
        return this.jwtToken;
    }

    // Método para fazer requisições autenticadas
    async fetchAuthenticated(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.jwtToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Se tiver body e for objeto, converte para JSON
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }
        
        return fetch(url, mergedOptions);
    }
}

// Cria instância global
const adminDashboard = new AdminDashboard();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    adminDashboard.init();
});