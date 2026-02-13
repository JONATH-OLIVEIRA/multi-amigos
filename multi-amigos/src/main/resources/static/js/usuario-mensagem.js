// usuario-mensagem.js - Gerencia mensagens para usuário comum
// COOKIE HttpOnly (jwt_token) + window.Api.fetchJson

class UsuarioMensagemManager {
    constructor() {
        console.log('📢 UsuarioMensagemManager inicializado');
        this.mensagensContainer = document.getElementById('mensagensContainer');
        this._loading = false;
        this._abortController = null;
    }

    init() {
        console.log('🚀 Iniciando carregamento de mensagens...');
        this.carregarMensagensSistema();
    }

    async carregarMensagensSistema() {
        if (!this.mensagensContainer) {
            this.mensagensContainer = document.getElementById('mensagensContainer');
        }
        if (!this.mensagensContainer) {
            console.warn('⚠️ Container de mensagens não encontrado no DOM');
            return;
        }

        if (this._loading) return;
        this._loading = true;

        // aborta chamadas anteriores
        if (this._abortController) {
            try { this._abortController.abort(); } catch (_) {}
        }
        this._abortController = new AbortController();

        this.mostrarLoading();

        try {
            const mensagens = await window.Api.fetchJson('/api/mensagens/visiveis', {
                method: 'GET',
                signal: this._abortController.signal
            });

            console.log(`✅ ${mensagens?.length ?? 0} mensagens carregadas`);
            this.renderizarMensagens(mensagens || []);
        } catch (error) {
            if (error?.name === 'AbortError') return;

            console.error('❌ Erro ao carregar mensagens:', error);

            let mensagemErro = 'Não foi possível carregar as mensagens do sistema.';

            if (String(error.message || '').includes('Acesso negado')) {
                mensagemErro = 'Você não tem permissão para ver as mensagens.';
            } else if (String(error.message || '').includes('Failed to fetch')) {
                mensagemErro = 'Erro de conexão. Verifique sua internet.';
            }

            this.mostrarErro(mensagemErro);
        } finally {
            this._loading = false;
        }
    }

    mostrarLoading() {
        this.mensagensContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-muted">Carregando mensagens do sistema...</p>
                <small class="text-muted">Aguarde um momento</small>
            </div>
        `;
    }

    mostrarErro(mensagem) {
        this.mensagensContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Erro!</strong> ${this.escapeHtml(mensagem)}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="window.usuarioMensagemManager?.carregarMensagensSistema()">
                    <i class="bi bi-arrow-clockwise"></i> Tentar novamente
                </button>
            </div>
        `;
    }

    renderizarMensagens(mensagens) {
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

        let html = `<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">`;

        mensagens.forEach((mensagem, index) => {
            const dataFormatada = this.formatarData(mensagem.dataCriacao);
            const tipoClasse = this.getTipoClasse(mensagem.tipo);
            const tipoIcone = this.getTipoIcone(mensagem.tipo);
            const tipoFormatado = this.formatarTipo(mensagem.tipo);
            const fadeDelay = index * 100;

            html += `
                <div class="col">
                    <div class="card h-100 border-${tipoClasse} shadow-sm mensagem-card"
                         style="animation: fadeIn 0.5s ease-out ${fadeDelay}ms both;">
                        <div class="card-header bg-${tipoClasse} text-white d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="bi ${tipoIcone} me-2"></i>
                                <h6 class="mb-0">${this.escapeHtml(tipoFormatado)}</h6>
                            </div>
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-calendar"></i> ${this.escapeHtml(dataFormatada)}
                            </span>
                        </div>

                        <div class="card-body">
                            <h5 class="card-title text-${tipoClasse}">
                                ${this.escapeHtml(mensagem.titulo) || 'Sem título'}
                            </h5>
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

        // injeta CSS uma vez
        if (!document.getElementById('mensagensFadeStyle')) {
            const style = document.createElement('style');
            style.id = 'mensagensFadeStyle';
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
        }

        this.mensagensContainer.innerHTML = html;
    }

    formatarData(dataString) {
        if (!dataString) return 'Data não informada';
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return String(dataString);
        }
    }

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

    formatarTipo(tipo) {
        const formatos = {
            'INFORMATIVA': 'Informativa',
            'ALERTA': 'Alerta',
            'URGENTE': 'Urgente',
            'PROMOCAO': 'Promoção',
            'GERAL': 'Geral'
        };
        return formatos[tipo] || (tipo || 'Mensagem');
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    recarregar() {
        this.carregarMensagensSistema();
    }
}

window.UsuarioMensagemManager = UsuarioMensagemManager;
