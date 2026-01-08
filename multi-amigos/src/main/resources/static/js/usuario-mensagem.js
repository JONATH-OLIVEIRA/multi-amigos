// usuario-mensagem.js - Gerencia mensagens para usuário comum
// VERSÃO CORRIGIDA: Inclui tratamento de token

class UsuarioMensagemManager {
    
    constructor() {
        console.log('📢 UsuarioMensagemManager inicializado');
        this.mensagensContainer = document.getElementById('mensagensContainer');
    }
    
    // Método seguro para fazer fetch com token
    fetchComToken(url, options = {}) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('❌ Token não encontrado no localStorage');
            this.mostrarErro('Sessão expirada. Faça login novamente.');
            return Promise.reject(new Error('Token não encontrado'));
        }
        
        console.log(`📤 Fetch com token para: ${url}`);
        console.log(`🔑 Token (primeiros 20 chars): ${token.substring(0, 20)}...`);
        
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        
        return fetch(url, {
            ...options,
            headers
        });
    }
    
    init() {
        console.log('🚀 Iniciando carregamento de mensagens...');
        this.carregarMensagensSistema();
    }
    
    // Carrega mensagens visíveis do sistema
    carregarMensagensSistema() {
        console.log('📥 Carregando mensagens do sistema...');
        
        // Verifica se o container existe
        if (!this.mensagensContainer) {
            console.warn('⚠️ Container de mensagens não encontrado no DOM');
            console.warn('Elemento com id="mensagensContainer" não encontrado');
            return;
        }
        
        console.log('✅ Container encontrado:', this.mensagensContainer);
        
        this.mostrarLoading();
        
        // Usa fetchComToken que adiciona o header de autorização
        this.fetchComToken('/api/mensagens/visiveis')
            .then(response => {
                console.log(`📊 Resposta do servidor: ${response.status} ${response.statusText}`);
                
                if (response.status === 401) {
                    throw new Error('Não autorizado. Token pode ter expirado.');
                }
                if (response.status === 403) {
                    throw new Error('Acesso negado à mensagens.');
                }
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                
                return response.json();
            })
            .then(mensagens => {
                console.log(`✅ ${mensagens.length} mensagens carregadas com sucesso`);
                console.log('📋 Mensagens:', mensagens);
                this.renderizarMensagens(mensagens);
            })
            .catch(error => {
                console.error('❌ Erro ao carregar mensagens:', error);
                
                // Mensagem amigável baseada no tipo de erro
                let mensagemErro = 'Não foi possível carregar as mensagens do sistema.';
                
                if (error.message.includes('401') || error.message.includes('Não autorizado')) {
                    mensagemErro = 'Sessão expirada. Faça login novamente.';
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        window.location.href = '/auth/login';
                    }, 2000);
                } else if (error.message.includes('403') || error.message.includes('Acesso negado')) {
                    mensagemErro = 'Você não tem permissão para ver as mensagens.';
                } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                    mensagemErro = 'Erro de conexão. Verifique sua internet.';
                }
                
                this.mostrarErro(mensagemErro);
            });
    }
    
    // Mostra estado de carregamento
    mostrarLoading() {
        if (this.mensagensContainer) {
            this.mensagensContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                    <p class="mt-3 text-muted">Carregando mensagens do sistema...</p>
                    <small class="text-muted">Aguarde um momento</small>
                </div>
            `;
        }
    }
    
    // Mostra erro
    mostrarErro(mensagem) {
        if (this.mensagensContainer) {
            this.mensagensContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Erro!</strong> ${mensagem}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="window.usuarioMensagemManager.carregarMensagensSistema()">
                        <i class="bi bi-arrow-clockwise"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }
    
    // Renderiza as mensagens
    renderizarMensagens(mensagens) {
        if (!this.mensagensContainer) return;
        
        if (!mensagens || mensagens.length === 0) {
            this.mensagensContainer.innerHTML = `
                <div class="alert alert-info">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-info-circle fs-4 me-3"></i>
                        <div>
                            <h5 class="alert-heading mb-1">Nenhuma mensagem no momento</h5>
                            <p class="mb-0">Quando o administrador publicar mensagens, elas aparecerão aqui.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        `;
        
        mensagens.forEach((mensagem, index) => {
            const dataFormatada = this.formatarData(mensagem.dataCriacao);
            const tipoClasse = this.getTipoClasse(mensagem.tipo);
            const tipoIcone = this.getTipoIcone(mensagem.tipo);
            const tipoFormatado = this.formatarTipo(mensagem.tipo);
            
            // Efeito de fade-in sequencial
            const fadeDelay = index * 100;
            
            html += `
                <div class="col">
                    <div class="card h-100 border-${tipoClasse} shadow-sm mensagem-card" 
                         style="animation: fadeIn 0.5s ease-out ${fadeDelay}ms both;">
                        <div class="card-header bg-${tipoClasse} text-white d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="bi ${tipoIcone} me-2"></i>
                                <h6 class="mb-0">${tipoFormatado}</h6>
                            </div>
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-calendar"></i> ${dataFormatada}
                            </span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title text-${tipoClasse}">${this.escapeHtml(mensagem.titulo) || 'Sem título'}</h5>
                            <p class="card-text">${this.escapeHtml(mensagem.conteudo) || 'Sem conteúdo'}</p>
                            
                            ${mensagem.link ? `
                                <div class="mt-3">
                                    <a href="${this.escapeHtml(mensagem.link)}" target="_blank" 
                                       class="btn btn-outline-${tipoClasse} btn-sm">
                                        <i class="bi bi-link-45deg"></i> Saiba mais
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                        <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-person-circle"></i>
                                ${this.escapeHtml(mensagem.autorNome) || 'Administrador'}
                            </small>
                            ${mensagem.prioridade === 'ALTA' ? `
                                <span class="badge bg-danger">
                                    <i class="bi bi-exclamation-triangle"></i> Importante
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Adiciona animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .mensagem-card:hover {
                transform: translateY(-5px);
                transition: transform 0.3s ease;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
        
        this.mensagensContainer.innerHTML = html;
    }
    
    // Formata data
    formatarData(dataString) {
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
    
    // Retorna classe CSS baseada no tipo
    getTipoClasse(tipo) {
        const tipos = {
            'INFORMATIVA': 'info',
            'ALERTA': 'warning',
            'URGENTE': 'danger',
            'PROMOCAO': 'success',
            'GERAL': 'primary'
        };
        return tipos[tipo] || 'secondary';
    }
    
    // Retorna ícone baseado no tipo
    getTipoIcone(tipo) {
        const icones = {
            'INFORMATIVA': 'bi-info-circle',
            'ALERTA': 'bi-exclamation-triangle',
            'URGENTE': 'bi-bell',
            'PROMOCAO': 'bi-tag',
            'GERAL': 'bi-megaphone'
        };
        return icones[tipo] || 'bi-chat';
    }
    
    // Formata o tipo para exibição
    formatarTipo(tipo) {
        const formatos = {
            'INFORMATIVA': 'Informativa',
            'ALERTA': 'Alerta',
            'URGENTE': 'Urgente',
            'PROMOCAO': 'Promoção',
            'GERAL': 'Geral'
        };
        return formatos[tipo] || tipo;
    }
    
    // Segurança: escapa HTML para prevenir XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Método público para recarregar
    recarregar() {
        console.log('🔄 Recarregando mensagens...');
        this.carregarMensagensSistema();
    }
}

// Inicialização segura
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 DOM carregado, inicializando UsuarioMensagemManager...');
    
    // Aguarda um pouco para garantir que o token foi processado
    setTimeout(() => {
        const token = localStorage.getItem('token');
        console.log('🔍 Verificando token durante inicialização:', token ? '✅ Presente' : '❌ Ausente');
        
        if (token) {
            console.log('🚀 Inicializando UsuarioMensagemManager...');
            window.usuarioMensagemManager = new UsuarioMensagemManager();
            window.usuarioMensagemManager.init();
        } else {
            console.warn('⚠️ Token não encontrado, manager não será inicializado');
            // Mostra mensagem amigável
            const container = document.getElementById('mensagensContainer');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        Sessão não encontrada. Faça login para ver as mensagens.
                    </div>
                `;
            }
        }
    }, 300); // Pequeno delay para garantir que tudo foi carregado
});

// Torna acessível globalmente
window.UsuarioMensagemManager = UsuarioMensagemManager;