// usuario-perfil.js - Gerencia perfil do usuário comum
// VERSÃO COMPLETA: Inclui todas as funcionalidades do MeuUsuarioController

class UsuarioPerfilManager {
    
    constructor() {
        console.log('👤 UsuarioPerfilManager inicializado');
        this.perfilContainer = document.getElementById('perfilContainer');
        this.token = localStorage.getItem('token');
        
        // Inicializa se o container existir
        if (this.perfilContainer) {
            this.init();
        }
    }
    
    // Método para fazer fetch com token
    fetchComToken(url, options = {}) {
        if (!this.token) {
            console.error('❌ Token não encontrado');
            this.mostrarErro('Sessão expirada. Faça login novamente.');
            return Promise.reject(new Error('Token não encontrado'));
        }
        
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`
        };
        
        console.log(`📤 Fetch perfil: ${url}`);
        
        return fetch(url, {
            ...options,
            headers
        });
    }
    
    init() {
        console.log('🚀 Iniciando carregamento do perfil...');
        this.carregarMeuPerfil();
    }
    
    // Carrega os dados do perfil do usuário
    carregarMeuPerfil() {
        console.log('📥 Carregando meus dados...');
        
        if (!this.perfilContainer) {
            console.warn('⚠️ Container de perfil não encontrado');
            return;
        }
        
        this.mostrarLoading();
        
        // Carrega dados básicos
        Promise.all([
            this.fetchComToken('/api/me'),
            this.fetchComToken('/api/me/estatisticas'),
            this.fetchComToken('/api/me/hierarquia')
        ])
        .then(([dadosRes, estatisticasRes, hierarquiaRes]) => {
            if (!dadosRes.ok) throw new Error('Erro ao carregar dados');
            if (!estatisticasRes.ok) throw new Error('Erro ao carregar estatísticas');
            
            return Promise.all([
                dadosRes.json(),
                estatisticasRes.json(),
                hierarquiaRes.ok ? hierarquiaRes.json() : []
            ]);
        })
        .then(([dados, estatisticas, hierarquia]) => {
            console.log('✅ Dados do perfil carregados:', dados);
            console.log('📊 Estatísticas:', estatisticas);
            console.log('👥 Hierarquia:', hierarquia);
            
            this.renderizarPerfil(dados, estatisticas, hierarquia);
            this.configurarEventos();
        })
        .catch(error => {
            console.error('❌ Erro ao carregar perfil:', error);
            this.mostrarErro('Não foi possível carregar seus dados.');
        });
    }
    
    // Mostra estado de carregamento
    mostrarLoading() {
        if (this.perfilContainer) {
            this.perfilContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                    <p class="mt-3 text-muted">Carregando seus dados...</p>
                </div>
            `;
        }
    }
    
    // Mostra erro
    mostrarErro(mensagem) {
        if (this.perfilContainer) {
            this.perfilContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Erro!</strong> ${mensagem}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="window.usuarioPerfilManager.carregarMeuPerfil()">
                        <i class="bi bi-arrow-clockwise"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }
    
    // Renderiza o perfil completo
    renderizarPerfil(dados, estatisticas, hierarquia) {
        if (!this.perfilContainer) return;
        
        const statusBadge = dados.ativo ? 
            '<span class="badge bg-success">Ativo</span>' : 
            '<span class="badge bg-secondary">Inativo</span>';
        
        const perfilBadge = dados.perfil === 'ADMIN' ? 
            '<span class="badge bg-danger">ADMIN</span>' : 
            '<span class="badge bg-primary">USUÁRIO</span>';
        
        let html = `
            <div class="row">
                <!-- Coluna 1: Dados Pessoais -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-person-badge"></i> Dados Pessoais</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <label class="form-label"><strong>Nome Completo</strong></label>
                                    <input type="text" class="form-control" id="inputNome" value="${this.escapeHtml(dados.nome || '')}">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label"><strong>Email</strong></label>
                                    <input type="email" class="form-control" id="inputEmail" value="${this.escapeHtml(dados.email || '')}">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label"><strong>Telefone</strong></label>
                                    <input type="text" class="form-control" id="inputTelefone" value="${this.escapeHtml(dados.telefone || '')}" placeholder="(11) 99999-9999">
                                </div>
                                
                                <div class="col-12 mb-3">
                                    <label class="form-label"><strong>Nova Senha</strong> <small class="text-muted">(deixe em branco para manter a atual)</small></label>
                                    <input type="password" class="form-control" id="inputSenha" placeholder="Mínimo 6 caracteres">
                                </div>
                                
                                <div class="col-12 mb-3">
                                    <label class="form-label"><strong>Confirmar Nova Senha</strong></label>
                                    <input type="password" class="form-control" id="inputConfirmarSenha" placeholder="Repita a senha">
                                </div>
                                
                                <div class="col-12">
                                    <button class="btn btn-primary" onclick="window.usuarioPerfilManager.atualizarPerfil()">
                                        <i class="bi bi-check-circle"></i> Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Coluna 2: Informações da Conta -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-info-circle"></i> Informações da Conta</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <strong>Status:</strong> ${statusBadge} ${perfilBadge}
                            </div>
                            
                            <div class="mb-3">
                                <strong>Data de Cadastro:</strong><br>
                                ${this.formatarData(dados.dataCriacao)}
                            </div>
                            
                            <div class="mb-3">
                                <strong>Quem me indicou:</strong><br>
                                ${estatisticas.pai || 'Nenhum'}
                            </div>
                            
                            <div class="mb-3">
                                <strong>Total na minha rede:</strong><br>
                                <span class="badge bg-success fs-6">${estatisticas.totalFilhos || 0} pessoas</span>
                            </div>
                            
                            <div class="mb-3">
                                <strong>Minhas ações:</strong>
                                <div class="d-grid gap-2 mt-2">
                                    <button class="btn btn-outline-success" onclick="window.usuarioPerfilManager.gerarLinkConvite()">
                                        <i class="bi bi-link-45deg"></i> Gerar Link de Convite
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="window.usuarioPerfilManager.verMinhaHierarquia()">
                                        <i class="bi bi-diagram-3"></i> Ver Minha Rede
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="window.usuarioPerfilManager.solicitarDesativacao()">
                                        <i class="bi bi-power"></i> Solicitar Desativação
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Seção de Estatísticas -->
            <div class="card mb-4">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Minhas Estatísticas</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 text-center mb-3">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h2 class="text-primary">${estatisticas.totalFilhos || 0}</h2>
                                    <p class="mb-0">Filhos Diretos</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 text-center mb-3">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h2 class="text-success">${dados.ativo ? 'Ativo' : 'Inativo'}</h2>
                                    <p class="mb-0">Status</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 text-center mb-3">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h2 class="text-info">${this.formatarData(dados.dataCriacao, true)}</h2>
                                    <p class="mb-0">Membro desde</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 text-center mb-3">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h2 class="text-warning">${estatisticas.pai ? 'Sim' : 'Não'}</h2>
                                    <p class="mb-0">Tem indicador</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Seção de Hierarquia (se houver filhos) -->
        `;
        
        // Adiciona seção de filhos se existirem
        if (hierarquia && hierarquia.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header bg-warning text-white">
                        <h5 class="mb-0"><i class="bi bi-people"></i> Minha Rede (${hierarquia.length} filhos)</h5>
                    </div>
                    <div class="card-body">
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
                const filhoStatus = filho.ativo ? 
                    '<span class="badge bg-success">Ativo</span>' : 
                    '<span class="badge bg-secondary">Inativo</span>';
                
                html += `
                    <tr>
                        <td>${this.escapeHtml(filho.nome)}</td>
                        <td>${this.escapeHtml(filho.email)}</td>
                        <td>${this.escapeHtml(filho.telefone || 'Não informado')}</td>
                        <td>${filhoStatus}</td>
                        <td>${this.formatarData(filho.dataCriacao)}</td>
                    </tr>
                `;
            });
            
            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.perfilContainer.innerHTML = html;
    }
    
    // Configura eventos dos elementos
    configurarEventos() {
        // Validação de email em tempo real
        const emailInput = document.getElementById('inputEmail');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const email = this.value.trim();
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    this.classList.add('is-invalid');
                    document.getElementById('emailError')?.remove();
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'emailError';
                    errorDiv.className = 'invalid-feedback';
                    errorDiv.textContent = 'Email inválido';
                    this.parentNode.appendChild(errorDiv);
                } else {
                    this.classList.remove('is-invalid');
                    document.getElementById('emailError')?.remove();
                }
            });
        }
        
        // Validação de senha em tempo real
        const senhaInput = document.getElementById('inputSenha');
        const confirmarInput = document.getElementById('inputConfirmarSenha');
        
        if (senhaInput && confirmarInput) {
            const validarSenhas = () => {
                const senha = senhaInput.value;
                const confirmar = confirmarInput.value;
                
                if (senha && confirmar && senha !== confirmar) {
                    confirmarInput.classList.add('is-invalid');
                    document.getElementById('senhaError')?.remove();
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'senhaError';
                    errorDiv.className = 'invalid-feedback';
                    errorDiv.textContent = 'As senhas não coincidem';
                    confirmarInput.parentNode.appendChild(errorDiv);
                } else {
                    confirmarInput.classList.remove('is-invalid');
                    document.getElementById('senhaError')?.remove();
                }
            };
            
            senhaInput.addEventListener('input', validarSenhas);
            confirmarInput.addEventListener('input', validarSenhas);
        }
    }
    
    // Atualiza o perfil do usuário
    atualizarPerfil() {
        const nome = document.getElementById('inputNome')?.value.trim();
        const email = document.getElementById('inputEmail')?.value.trim();
        const telefone = document.getElementById('inputTelefone')?.value.trim();
        const senha = document.getElementById('inputSenha')?.value;
        const confirmarSenha = document.getElementById('inputConfirmarSenha')?.value;
        
        // Validações
        if (!nome) {
            this.mostrarMensagem('Nome é obrigatório', 'danger');
            return;
        }
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.mostrarMensagem('Email inválido', 'danger');
            return;
        }
        
        if (senha && senha.length < 6) {
            this.mostrarMensagem('A senha deve ter no mínimo 6 caracteres', 'danger');
            return;
        }
        
        if (senha && senha !== confirmarSenha) {
            this.mostrarMensagem('As senhas não coincidem', 'danger');
            return;
        }
        
        // Prepara dados para atualização
        const dadosAtualizacao = {
            nome: nome,
            email: email,
            telefone: telefone || null
        };
        
        if (senha) {
            dadosAtualizacao.senha = senha;
        }
        
        console.log('📤 Enviando atualização:', dadosAtualizacao);
        
        this.fetchComToken('/api/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizacao)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(usuarioAtualizado => {
            console.log('✅ Perfil atualizado:', usuarioAtualizado);
            this.mostrarMensagem('Perfil atualizado com sucesso!', 'success');
            
            // Recarrega os dados
            setTimeout(() => this.carregarMeuPerfil(), 1500);
        })
        .catch(error => {
            console.error('❌ Erro ao atualizar perfil:', error);
            this.mostrarMensagem('Erro ao atualizar perfil: ' + error.message, 'danger');
        });
    }
    
    // Gera link de convite
    gerarLinkConvite() {
        console.log('🔗 Gerando link de convite...');
        
        this.fetchComToken('/api/me/link-convite')
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('✅ Link gerado:', data);
                
                // Mostra modal com o link
                this.mostrarModalLinkConvite(data);
            })
            .catch(error => {
                console.error('❌ Erro ao gerar link:', error);
                this.mostrarMensagem('Erro ao gerar link de convite', 'danger');
            });
    }
    
    // Ver hierarquia completa
    verMinhaHierarquia() {
        console.log('👥 Carregando hierarquia completa...');
        
        this.fetchComToken('/api/me/hierarquia')
            .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(hierarquia => {
                console.log('✅ Hierarquia carregada:', hierarquia);
                this.mostrarModalHierarquia(hierarquia);
            })
            .catch(error => {
                console.error('❌ Erro ao carregar hierarquia:', error);
                this.mostrarMensagem('Erro ao carregar sua rede', 'danger');
            });
    }
    
    // Solicita desativação da conta
    solicitarDesativacao() {
        if (!confirm('⚠️ Tem certeza que deseja desativar sua conta?\n\nApós desativação, você não poderá acessar o sistema até que um administrador reative sua conta.')) {
            return;
        }
        
        console.log('🛑 Solicitando desativação da conta...');
        
        this.fetchComToken('/api/me/desativar', {
            method: 'PATCH'
        })
        .then(response => {
            if (!response.ok) throw new Error(`Erro ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('✅ Conta desativada:', data);
            
            // Mostra mensagem e faz logout após 3 segundos
            this.mostrarMensagem(data.mensagem + ' Você será desconectado em 3 segundos.', 'warning');
            
            setTimeout(() => {
                localStorage.removeItem('token');
                window.location.href = '/auth/login';
            }, 3000);
        })
        .catch(error => {
            console.error('❌ Erro ao desativar conta:', error);
            
            let mensagem = 'Erro ao desativar conta';
            if (error.message.includes('filhos ativos')) {
                mensagem = 'Você não pode desativar sua conta porque tem filhos ativos na sua rede.';
            }
            
            this.mostrarMensagem(mensagem, 'danger');
        });
    }
    
    // Mostra modal com link de convite
    mostrarModalLinkConvite(data) {
        const modalHtml = `
            <div class="modal fade" id="linkConviteModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-link-45deg"></i> Seu Link de Convite</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${data.mensagem}</p>
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" id="linkConviteInput" value="${data.link}" readonly>
                                <button class="btn btn-outline-success" type="button" onclick="copiarLinkConvite()">
                                    <i class="bi bi-clipboard"></i> Copiar
                                </button>
                            </div>
                            <p class="text-muted small"><i class="bi bi-info-circle"></i> ${data.instrucoes}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove modal anterior se existir
        document.getElementById('linkConviteModal')?.remove();
        
        // Adiciona novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostra modal
        const modal = new bootstrap.Modal(document.getElementById('linkConviteModal'));
        modal.show();
        
        // Função para copiar link
        window.copiarLinkConvite = () => {
            const input = document.getElementById('linkConviteInput');
            input.select();
            document.execCommand('copy');
            
            // Feedback visual
            const btn = document.querySelector('[onclick="copiarLinkConvite()"]');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check"></i> Copiado!';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-outline-success');
            
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-success');
            }, 2000);
        };
    }
    
    // Mostra modal com hierarquia
    mostrarModalHierarquia(hierarquia) {
        let tabelaHtml = '';
        
        if (hierarquia.length === 0) {
            tabelaHtml = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    Você ainda não tem ninguém na sua rede.
                </div>
            `;
        } else {
            tabelaHtml = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            hierarquia.forEach(filho => {
                const status = filho.ativo ? 
                    '<span class="badge bg-success">Ativo</span>' : 
                    '<span class="badge bg-secondary">Inativo</span>';
                
                tabelaHtml += `
                    <tr>
                        <td>${this.escapeHtml(filho.nome)}</td>
                        <td>${this.escapeHtml(filho.email)}</td>
                        <td>${status}</td>
                        <td>${this.formatarData(filho.dataCriacao)}</td>
                    </tr>
                `;
            });
            
            tabelaHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        const modalHtml = `
            <div class="modal fade" id="hierarquiaModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-diagram-3"></i> Minha Rede (${hierarquia.length} pessoas)</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${tabelaHtml}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove modal anterior se existir
        document.getElementById('hierarquiaModal')?.remove();
        
        // Adiciona novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostra modal
        const modal = new bootstrap.Modal(document.getElementById('hierarquiaModal'));
        modal.show();
    }
    
    // Mostra mensagem de feedback
    mostrarMensagem(texto, tipo = 'info') {
        // Remove mensagens anteriores
        document.querySelectorAll('.mensagem-flutuante').forEach(el => el.remove());
        
        const mensagemHtml = `
            <div class="mensagem-flutuante alert alert-${tipo} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <i class="bi ${tipo === 'success' ? 'bi-check-circle' : tipo === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2"></i>
                ${texto}
                <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', mensagemHtml);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            document.querySelector('.mensagem-flutuante')?.remove();
        }, 5000);
    }
    
    // Formata data
    formatarData(dataString, apenasData = false) {
        if (!dataString) return 'Data não informada';
        
        try {
            const data = new Date(dataString);
            if (apenasData) {
                return data.toLocaleDateString('pt-BR');
            }
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
    
    // Segurança: escapa HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Inicializando UsuarioPerfilManager...');
    
    // Verifica se estamos na página de perfil
    if (document.getElementById('perfilContainer')) {
        console.log('✅ Página de perfil detectada, inicializando manager...');
        window.usuarioPerfilManager = new UsuarioPerfilManager();
    }
});

// Torna acessível globalmente
window.UsuarioPerfilManager = UsuarioPerfilManager;