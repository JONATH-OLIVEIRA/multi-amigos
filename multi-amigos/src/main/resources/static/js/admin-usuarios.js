// ============================================
// USUARIOS MANAGER - GERENCIAMENTO DE USUÁRIOS
// (mantendo tudo que funciona + melhorias de AUTH/ERROS)
// ✅ COOKIE MODE (HttpOnly jwt_token)
// ============================================

class UsuariosManager {
	constructor() {
		console.log('👥 UsuariosManager inicializado (cookie-mode)');
		this.initializeEventListeners();
	}

	initializeEventListeners() {
		// Event listeners serão adicionados dinamicamente
	}

	// ============================================
	// HTTP HELPERS (COOKIE + JSON + ERROS) ✅ ATUALIZADO
	// ============================================

	/**
	 * Cabeçalhos básicos (sem Authorization)
	 * - não use token aqui (cookie HttpOnly)
	 */
	baseHeaders(extra = {}) {
		return {
			'Accept': 'application/json',
			...extra
		};
	}

	/**
	 * Fetch resiliente:
	 * - sempre manda cookie: credentials: "include"
	 * - detecta JSON vs texto
	 * - trata 401/403 e mensagens do backend
	 */
	async fetchJson(url, options = {}) {
		const opts = { ...options };

		// Headers
		opts.headers = this.baseHeaders(opts.headers || {});
		opts.credentials = 'include'; // 🔥 manda jwt_token

		// Normaliza body/Content-Type quando necessário
		if (opts.body != null) {
			// Se body é objeto (não FormData), transforma em JSON
			if (typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
				if (!opts.headers['Content-Type']) {
					opts.headers['Content-Type'] = 'application/json';
				}
				// Se já veio string, respeita; senão stringifica
				if (typeof opts.body !== 'string') {
					opts.body = JSON.stringify(opts.body);
				}
			}
		}

		const res = await fetch(url, opts);

		// 401: sessão expirada/sem cookie -> login
		if (res.status === 401) {
			// Em cookie-mode não tem token pra limpar, só redireciona
			window.location.href = "/auth/login?error=expired";
			throw new Error("Sessão expirada. Faça login novamente.");
		}

		// 403: sem permissão
		if (res.status === 403) {
			throw new Error("Acesso negado! Verifique suas permissões.");
		}

		const contentType = res.headers.get("content-type") || "";
		const isJson = contentType.includes("application/json");

		const body = isJson
			? await res.json().catch(() => ({}))
			: await res.text().catch(() => "");

		if (!res.ok) {
			// extrai mensagem do backend
			let msg = "";
			if (typeof body === "string") msg = body;
			else if (body && typeof body === "object") msg = body.error || body.message || JSON.stringify(body);

			throw new Error(`Erro ${res.status}: ${msg || res.statusText}`);
		}

		return body;
	}

	// ============================================
	// FUNÇÕES AUXILIARES DE MENSAGEM
	// =======================================r=====

	mostrarMensagemSucesso(mensagem) {
		console.log('✅ ' + mensagem);
		this.mostrarMensagemToast(mensagem, 'success');
	}

	mostrarMensagemErro(mensagem) {
		console.error('❌ ' + mensagem);
		this.mostrarMensagemToast(mensagem, 'danger');
	}

	mostrarMensagemToast(mensagem, tipo = 'info') {
		// Remove mensagens anteriores
		const mensagensAnteriores = document.querySelectorAll('.alert-toast');
		mensagensAnteriores.forEach(msg => msg.remove());

		// Cria nova mensagem
		const icon = tipo === 'success' ? 'bi-check-circle' :
			tipo === 'danger' ? 'bi-exclamation-triangle' :
				'bi-info-circle';

		const toastHTML = `
            <div class="alert-toast alert alert-${tipo} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999;">
                <i class="bi ${icon} me-2"></i>
                ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

		document.body.insertAdjacentHTML('beforeend', toastHTML);

		// Remove automaticamente após 5 segundos
		setTimeout(() => {
			const toast = document.querySelector('.alert-toast');
			if (toast) toast.remove();
		}, 5000);
	}

	// ============================================
	// CARREGAR E RENDERIZAR USUÁRIOS
	// ============================================

	loadUsuariosData() {
		console.log('📊 Carregando dados de usuários...');

		const container = document.getElementById('usuariosContainer');
		const emptyState = document.getElementById('emptyUsuarios');
		const errorState = document.getElementById('errorUsuarios');
		const errorMessage = document.getElementById('errorUsuariosMessage');

		if (container) container.innerHTML = '';
		if (emptyState) emptyState.classList.add('d-none');
		if (errorState) errorState.classList.add('d-none');

		if (window.showLoading) window.showLoading();

		this.fetchJson("/api/usuarios")
			.then(usuarios => {
				console.log(`✅ ${usuarios.length} usuários carregados`);
				if (window.hideLoading) window.hideLoading();
				this.renderUsuarios(usuarios);
			})
			.catch(err => {
				console.error('❌ Erro ao carregar usuários:', err);
				if (window.hideLoading) window.hideLoading();
				if (errorMessage) errorMessage.textContent = err.message;
				if (errorState) errorState.classList.remove('d-none');
			});
	}

	renderUsuarios(usuarios) {
		const container = document.getElementById('usuariosContainer');
		const emptyState = document.getElementById('emptyUsuarios');

		if (!container) {
			console.error('❌ Container de usuários não encontrado');
			return;
		}

		container.innerHTML = '';

		if (!usuarios || usuarios.length === 0) {
			console.log('ℹ️ Nenhum usuário encontrado');
			if (emptyState) emptyState.classList.remove('d-none');
			return;
		}

		console.log(`🎨 Renderizando ${usuarios.length} usuários...`);

		usuarios.forEach(usuario => {
			const col = document.createElement('div');
			col.className = 'col';

			const badgeClass = usuario.perfil === 'ADMIN' ? 'badge-admin' : 'badge-user';
			const borderClass = usuario.perfil === 'ADMIN' ? 'border-danger' : 'border-primary';
			const statusBadge = usuario.ativo
				? '<span class="badge bg-success ms-1">Ativo</span>'
				: '<span class="badge bg-secondary ms-1">Inativo</span>';

			col.innerHTML = `
                <div class="card h-100 user-card ${borderClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${usuario.nome || 'Sem nome'}</h5>
                            <div>
                                <span class="badge ${badgeClass}">${usuario.perfil || 'USER'}</span>
                                ${statusBadge}
                            </div>
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
                                ${window.formatDate ? window.formatDate(usuario.dataCriacao) : usuario.dataCriacao}
                            </small>
                        </p>
                        
                        <!-- BOTÕES PRINCIPAIS -->
                        <div class="d-grid gap-2 mb-3">
                            <!-- Hierarquia -->
                            <button class="btn btn-outline-primary btn-sm btn-hierarchy" data-id="${usuario.id}">
                                <i class="bi bi-diagram-3"></i> Hierarquia
                            </button>
                            
                            <!-- Detalhes -->
                            <button class="btn btn-outline-info btn-sm btn-details" data-id="${usuario.id}">
                                <i class="bi bi-info-circle"></i> Ver Detalhes
                            </button>
                        </div>
                        
                        <!-- BOTÕES DE ADMINISTRAÇÃO -->
                        <div class="border-top pt-3">
                            <h6 class="text-muted mb-2"><small><i class="bi bi-gear"></i> Administrar</small></h6>
                            <div class="d-flex flex-wrap gap-1">
                                <!-- Editar -->
                                <button class="btn btn-outline-secondary btn-sm btn-editar" 
                                        data-id="${usuario.id}"
                                        title="Editar usuário">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                
                                <!-- Desativar/Reativar -->
                                ${usuario.ativo ? `
                                    <button class="btn btn-outline-warning btn-sm btn-desativar" 
                                            data-id="${usuario.id}"
                                            title="Desativar usuário">
                                        <i class="bi bi-person-dash"></i>
                                    </button>
                                ` : `
                                    <button class="btn btn-outline-success btn-sm btn-reativar" 
                                            data-id="${usuario.id}"
                                            title="Reativar usuário">
                                        <i class="bi bi-person-check"></i>
                                    </button>
                                `}
                                
                                <!-- Excluir -->
                                <button class="btn btn-outline-danger btn-sm btn-excluir" 
                                        data-id="${usuario.id}"
                                        title="Excluir usuário">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

			container.appendChild(col);
		});

		// Adiciona eventos aos botões
		setTimeout(() => {
			this.attachEventListeners();
		}, 100);
	}

	attachEventListeners() {
		console.log('🔗 Anexando event listeners aos botões...');

		// Hierarquia
		document.querySelectorAll('.btn-hierarchy').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('📊 Ver hierarquia do usuário:', userId);
				this.verHierarquia(userId);
			});
		});

		// Detalhes
		document.querySelectorAll('.btn-details').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('📄 Ver detalhes do usuário:', userId);
				this.verDetalhesUsuario(userId);
			});
		});

		// Editar
		document.querySelectorAll('.btn-editar').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('✏️ Editar usuário:', userId);
				if (window.limparBackdropEModal) window.limparBackdropEModal();
				setTimeout(() => {
					this.abrirModalEditarUsuario(userId);
				}, 300);
			});
		});

		// Desativar
		document.querySelectorAll('.btn-desativar').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('⏸️ Desativar usuário:', userId);
				this.desativarUsuario(userId);
			});
		});

		// Reativar
		document.querySelectorAll('.btn-reativar').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('▶️ Reativar usuário:', userId);
				this.reativarUsuario(userId);
			});
		});

		// Excluir
		document.querySelectorAll('.btn-excluir').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const userId = e.target.closest('button').dataset.id;
				console.log('🗑️ Excluir usuário:', userId);
				this.excluirUsuario(userId);
			});
		});
	}

	// ============================================
	// MODAL DE DETALHES
	// ============================================

	verDetalhesUsuario(userId) {
		console.log(`📋 Buscando detalhes do usuário ${userId}...`);

		this.fetchJson(`/api/usuarios/${userId}`)
			.then(usuario => {
				console.log('✅ Detalhes carregados:', usuario);

				const modalHTML = `
            <div class="modal fade" id="detalhesUsuarioModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalhes do Usuário</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <div class="user-avatar ${usuario.perfil === 'ADMIN' ? 'admin' : 'user'} mb-3">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <h4 class="mb-1">${usuario.nome}</h4>
                                <div class="mb-3">
                                    <span class="badge ${usuario.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                                        ${usuario.perfil}
                                    </span>
                                    <span class="badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'} ms-1">
                                        ${usuario.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="list-group list-group-flush">
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi bi-envelope text-primary me-2"></i>
                                        <strong>Email:</strong>
                                    </div>
                                    <span class="text-muted">${usuario.email}</span>
                                </div>
                                
                                ${usuario.telefone ? `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi bi-telephone text-primary me-2"></i>
                                        <strong>Telefone:</strong>
                                    </div>
                                    <span class="text-muted">${usuario.telefone}</span>
                                </div>
                                ` : ''}
                                
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi bi-calendar text-primary me-2"></i>
                                        <strong>Criado em:</strong>
                                    </div>
                                    <span class="text-muted">${window.formatDate ? window.formatDate(usuario.dataCriacao) : usuario.dataCriacao}</span>
                                </div>
                                
                                ${usuario.dataAtualizacao ? `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi bi-clock-history text-primary me-2"></i>
                                        <strong>Atualizado em:</strong>
                                    </div>
                                    <span class="text-muted">${window.formatDate ? window.formatDate(usuario.dataAtualizacao) : usuario.dataAtualizacao}</span>
                                </div>
                                ` : ''}
                                
                                ${usuario.usuarioPaiId ? `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi bi-diagram-3 text-primary me-2"></i>
                                        <strong>Usuário Pai ID:</strong>
                                    </div>
                                    <span class="badge bg-info">${usuario.usuarioPaiId}</span>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="mt-4 p-3 bg-light rounded">
                                <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>Informações:</h6>
                                <small class="text-muted">
                                    Para editar este usuário, use o botão <i class="bi bi-pencil"></i> na lista principal.
                                    Para ver a hierarquia, use o botão <i class="bi bi-diagram-3"></i>.
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle"></i> Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

				const existingModal = document.getElementById('detalhesUsuarioModal');
				if (existingModal) existingModal.remove();

				document.body.insertAdjacentHTML('beforeend', modalHTML);

				const modalElement = document.getElementById('detalhesUsuarioModal');
				const modal = new bootstrap.Modal(modalElement);
				modal.show();

				modalElement.addEventListener('hidden.bs.modal', () => {
					setTimeout(() => {
						if (modalElement && document.body.contains(modalElement)) modalElement.remove();
						if (window.limparBackdropEModal) window.limparBackdropEModal();
					}, 300);
				});
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				alert('Erro ao carregar detalhes do usuário: ' + err.message);
			});
	}

	// ============================================
	// HIERARQUIA
	// ============================================

	verHierarquia(userId) {
		console.log('📊 Buscando hierarquia para ID:', userId);

		this.fetchJson(`/api/usuarios/${userId}`)
			.then(usuario => {
				const paiId = usuario.usuarioPaiId || (usuario.usuarioPai ? usuario.usuarioPai.id : null);

				const paiPromise = paiId ? this.buscarUsuario(paiId) : Promise.resolve(null);
				const filhosPromise = this.fetchJson(`/api/usuarios/${userId}/hierarquia`);

				return Promise.all([paiPromise, filhosPromise])
					.then(([pai, filhos]) => {
						this.mostrarHierarquiaCompleta(usuario, pai, filhos);
					});
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				alert('Erro ao carregar hierarquia: ' + err.message);
			});
	}

	buscarUsuario(userId) {
		return this.fetchJson(`/api/usuarios/${userId}`)
			.catch(() => null);
	}

	mostrarHierarquiaCompleta(usuario, pai, filhos) {
		console.log('🎨 Mostrando hierarquia...');

		const modalTitle = document.getElementById('hierarquiaModalLabel');
		const modalBody = document.getElementById('hierarquiaModalBody');

		if (!modalTitle || !modalBody) {
			console.error('❌ Modal de hierarquia não encontrado');
			this.mostrarAlertaHierarquia?.(usuario, pai, filhos);
			return;
		}

		modalTitle.textContent = `Hierarquia de ${usuario.nome}`;

		let html = `
    <div class="hierarchy-container">
        <div class="hierarchy-current-user">
            <div class="text-center">
                <i class="bi bi-person-circle fs-1 ${usuario.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
                <h5 class="mt-2 mb-1">${usuario.nome}</h5>
                <div class="mb-2">
                    <span class="badge ${usuario.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                        ${usuario.perfil}
                    </span>
                    <span class="badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'} ms-1">
                        ${usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                <p class="text-muted small mb-0">${usuario.email}</p>
            </div>
        </div>
        
        <div class="hierarchy-row">
            <div class="hierarchy-card border-primary">
                <div class="card-header">
                    <i class="bi bi-arrow-up"></i> Superior Imediato
                </div>
                <div class="card-body">
    `;

		if (pai) {
			html += `
                    <div class="text-center">
                        <i class="bi bi-person-fill fs-3 text-primary mb-3"></i>
                        <h6 class="mb-1">${pai.nome}</h6>
                        <p class="text-muted small mb-2">${pai.email}</p>
                        <div>
                            <span class="badge ${pai.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                                ${pai.perfil}
                            </span>
                            <span class="badge ${pai.ativo ? 'bg-success' : 'bg-secondary'} ms-1">
                                ${pai.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
        `;
		} else {
			html += `
                    <div class="hierarchy-empty-state">
                        <i class="bi bi-person-x fs-1 mb-3"></i>
                        <p class="mb-1">Nenhum superior</p>
                        <small>Usuário do primeiro nível</small>
                    </div>
        `;
		}

		html += `
                </div>
            </div>
            
            <div class="hierarchy-card border-success">
                <div class="card-header">
                    <i class="bi bi-arrow-down"></i> Subordinados
                    <span class="badge bg-light text-dark ms-2">${filhos ? filhos.length : 0}</span>
                </div>
                <div class="card-body">
    `;

		if (filhos && filhos.length > 0) {
			html += `
                    <div class="hierarchy-list">
                        <div class="list-group">
        `;
			filhos.forEach(filho => {
				html += `
                            <div class="list-group-item">
                                <div class="d-flex align-items-center">
                                    <div class="flex-shrink-0">
                                        <i class="bi bi-person-circle ${filho.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'} fs-4"></i>
                                    </div>
                                    <div class="flex-grow-1 ms-3">
                                        <h6 class="mb-0">${filho.nome}</h6>
                                        <small class="text-muted">${filho.email}</small>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <span class="badge ${filho.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                                            ${filho.perfil}
                                        </span>
                                    </div>
                                </div>
                            </div>
            `;
			});
			html += `
                        </div>
                    </div>
        `;
		} else {
			html += `
                    <div class="hierarchy-empty-state">
                        <i class="bi bi-people fs-1 mb-3"></i>
                        <p class="mb-1">Nenhum subordinado</p>
                        <small>Este usuário não tem pessoas subordinadas</small>
                    </div>
        `;
		}

		html += `
                </div>
            </div>
        </div>
        
        <div class="hierarchy-summary">
            <div class="row text-center">
                <div class="col-md-4">
                    <div class="text-muted small">Nível Hierárquico</div>
                    <div class="fw-bold">${pai ? '2º Nível' : '1º Nível'}</div>
                </div>
                <div class="col-md-4">
                    <div class="text-muted small">Tamanho da Equipe</div>
                    <div class="fw-bold">${filhos ? filhos.length : 0}</div>
                </div>
                <div class="col-md-4">
                    <div class="text-muted small">Status do Usuário</div>
                    <div>
                        <span class="badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}">
                            ${usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

		modalBody.innerHTML = html;

		const modal = new bootstrap.Modal(document.getElementById('hierarquiaModal'));
		modal.show();
	}

	// ============================================
	// MODAL NOVO USUÁRIO
	// ============================================

	abrirModalNovoUsuario() {
		console.log('➕ Abrindo modal novo usuário...');

		const existingModal = document.getElementById('novoUsuarioModal');
		if (existingModal) existingModal.remove();

		const modalHTML = `
            <div class="modal fade" id="novoUsuarioModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cadastrar Novo Usuário</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formNovoUsuario">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nome *</label>
                                        <input type="text" class="form-control" id="novoUsuarioNome" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="novoUsuarioEmail" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Telefone</label>
                                        <input type="text" class="form-control" id="novoUsuarioTelefone" 
                                               placeholder="(11)99999-9999">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Perfil *</label>
                                        <select class="form-select" id="novoUsuarioPerfil" required>
                                            <option value="USUARIO">USUÁRIO</option>
                                            <option value="ADMIN">ADMINISTRADOR</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Senha *</label>
                                        <input type="password" class="form-control" id="novoUsuarioSenha" required minlength="6">
                                        <small class="text-muted">Mínimo 6 caracteres</small>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Confirmar Senha *</label>
                                        <input type="password" class="form-control" id="novoUsuarioConfirmarSenha" required minlength="6">
                                        <small id="senhaError" class="text-danger d-none">As senhas não coincidem</small>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Usuário Pai (Opcional)</label>
                                    <select class="form-select" id="novoUsuarioPaiId">
                                        <option value="">Nenhum (Primeiro Nível)</option>
                                    </select>
                                    <small class="text-muted">Deixe em branco para ser filho do admin principal</small>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-person-plus"></i> Cadastrar Usuário
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

		document.body.insertAdjacentHTML('beforeend', modalHTML);

		const telInput = document.getElementById('novoUsuarioTelefone');
		if (window.aplicarMascaraTelefone) window.aplicarMascaraTelefone(telInput);

		const modalElement = document.getElementById('novoUsuarioModal');
		const form = document.getElementById('formNovoUsuario');

		if (form) {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				this.cadastrarNovoUsuario();
			});
		}

		const senhaInput = document.getElementById('novoUsuarioSenha');
		const confirmarInput = document.getElementById('novoUsuarioConfirmarSenha');
		const senhaError = document.getElementById('senhaError');

		if (senhaInput && confirmarInput && senhaError) {
			confirmarInput.addEventListener('input', () => {
				if (senhaInput.value !== confirmarInput.value) {
					senhaError.classList.remove('d-none');
					confirmarInput.classList.add('is-invalid');
				} else {
					senhaError.classList.add('d-none');
					confirmarInput.classList.remove('is-invalid');
				}
			});
		}

		this.carregarUsuariosParaPaiNovo();

		const modal = new bootstrap.Modal(modalElement);
		modal.show();

		modalElement.addEventListener('hidden.bs.modal', () => {
			setTimeout(() => {
				if (window.limparBackdropEModal) window.limparBackdropEModal();
				if (modalElement && document.body.contains(modalElement)) modalElement.remove();
			}, 300);
		});
	}

	carregarUsuariosParaPaiNovo() {
		this.fetchJson("/api/usuarios/ativos")
			.then(usuarios => {
				const selectPai = document.getElementById('novoUsuarioPaiId');
				if (selectPai) {
					while (selectPai.options.length > 1) selectPai.remove(1);

					usuarios.forEach(usuario => {
						if (usuario.perfil !== 'ADMIN') {
							const option = document.createElement('option');
							option.value = usuario.id;
							option.textContent = `${usuario.nome} (${usuario.email})`;
							selectPai.appendChild(option);
						}
					});

					if (selectPai.options.length === 1) {
						const option = document.createElement('option');
						option.value = "";
						option.textContent = "Nenhum usuário disponível";
						option.disabled = true;
						selectPai.appendChild(option);
					}
				}
			})
			.catch(err => {
				console.error('❌ Erro ao carregar usuários para pai:', err);
			});
	}

	cadastrarNovoUsuario() {
		console.log('📝 Cadastrando novo usuário...');

		const senha = document.getElementById('novoUsuarioSenha').value;
		const confirmarSenha = document.getElementById('novoUsuarioConfirmarSenha').value;

		if (senha !== confirmarSenha) {
			alert('❌ As senhas não coincidem!');
			return;
		}

		if (senha.length < 6) {
			alert('❌ A senha deve ter pelo menos 6 caracteres!');
			return;
		}

		const dados = {
			nome: document.getElementById('novoUsuarioNome').value.trim(),
			email: document.getElementById('novoUsuarioEmail').value.trim(),
			senha: senha,
			telefone: document.getElementById('novoUsuarioTelefone').value.trim() || null,
			perfil: document.getElementById('novoUsuarioPerfil').value,
			usuarioPaiId: document.getElementById('novoUsuarioPaiId').value || null
		};

		if (!dados.nome || !dados.email) {
			alert('❌ Nome e email são obrigatórios!');
			return;
		}

		const submitBtn = document.querySelector('#formNovoUsuario button[type="submit"]');
		const originalText = submitBtn.innerHTML;
		submitBtn.disabled = true;
		submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Cadastrando...';

		console.log('📤 Enviando dados:', dados);

		this.fetchJson("/api/usuarios", {
			method: 'POST',
			body: dados // ✅ pode mandar objeto, o fetchJson cuida do JSON
		})
			.then(() => {
				console.log('✅ Usuário cadastrado com sucesso!');
				this.mostrarMensagemSucesso('✅ Usuário cadastrado com sucesso!');

				const modalElement = document.getElementById('novoUsuarioModal');
				if (modalElement) {
					const modal = bootstrap.Modal.getInstance(modalElement);
					if (modal) modal.hide();
				}

				this.loadUsuariosData();
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				this.mostrarMensagemErro(err.message);
				alert('❌ Erro: ' + err.message);
			})
			.finally(() => {
				submitBtn.disabled = false;
				submitBtn.innerHTML = originalText;
			});
	}

	// ============================================
	// MODAL EDITAR USUÁRIO (VERSÃO SIMPLIFICADA)
	// ============================================

	abrirModalEditarUsuario(userId) {
		console.log('🔧 Abrindo modal de edição para usuário ID:', userId);

		const existingModal = document.getElementById('editarUsuarioModal');
		if (existingModal) existingModal.remove();

		this.fetchJson(`/api/usuarios/${userId}`)
			.then(usuario => {
				console.log('✅ Dados do usuário carregados:', usuario);

				const modalHTML = `
                <div class="modal fade" id="editarUsuarioModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Editar Usuário</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="formEditarUsuario">
                                    <input type="hidden" id="editarUsuarioId" value="${usuario.id}">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Nome *</label>
                                            <input type="text" class="form-control" id="editarUsuarioNome" 
                                                   value="${usuario.nome || ''}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Email *</label>
                                            <input type="email" class="form-control" id="editarUsuarioEmail" 
                                                   value="${usuario.email || ''}" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Telefone</label>
                                            <input type="text" class="form-control" id="editarUsuarioTelefone" 
                                                   value="${usuario.telefone || ''}" placeholder="(11)99999-9999">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Perfil *</label>
                                            <select class="form-select" id="editarUsuarioPerfil" required>
                                                <option value="USUARIO" ${usuario.perfil === 'USUARIO' ? 'selected' : ''}>USUÁRIO</option>
                                                <option value="ADMIN" ${usuario.perfil === 'ADMIN' ? 'selected' : ''}>ADMINISTRADOR</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Usuário Pai (Opcional)</label>
                                        <select class="form-select" id="editarUsuarioPaiId">
                                            <option value="">Nenhum (Primeiro Nível)</option>
                                        </select>
                                        <small class="text-muted">Deixe em branco para ser filho do admin principal</small>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="editarUsuarioAtivo" 
                                               ${usuario.ativo ? 'checked' : ''}>
                                        <label class="form-check-label" for="editarUsuarioAtivo">Usuário Ativo</label>
                                    </div>
                                    <div class="d-grid gap-2">
                                        <button type="submit" class="btn btn-primary" id="btnSalvarEdicao">
                                            <i class="bi bi-save"></i> Salvar Alterações
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                `;

				document.body.insertAdjacentHTML('beforeend', modalHTML);

				const form = document.getElementById('formEditarUsuario');
				if (form) {
					const newForm = form.cloneNode(true);
					form.parentNode.replaceChild(newForm, form);

					newForm.addEventListener('submit', (e) => {
						e.preventDefault();
						e.stopPropagation();
						console.log('📤 Formulário de edição submetido');
						this.salvarEdicaoUsuario();
					});
				}

				this.carregarUsuariosParaPaiEdicao(usuario.id);

				const modalElement = document.getElementById('editarUsuarioModal');
				const modal = new bootstrap.Modal(modalElement);
				modal.show();
				console.log('✅ Modal aberto');

				modalElement.addEventListener('hidden.bs.modal', () => {
					console.log('🗑️ Modal fechado, limpando...');
					setTimeout(() => {
						if (window.limparBackdropEModal) window.limparBackdropEModal();
						if (modalElement && document.body.contains(modalElement)) modalElement.remove();
					}, 300);
				});
			})
			.catch(err => {
				console.error('❌ Erro ao carregar usuário para edição:', err);
				this.mostrarMensagemErro('Erro ao carregar dados do usuário: ' + err.message);
			});
	}

	carregarUsuariosParaPaiEdicao(usuarioAtualId) {
		this.fetchJson("/api/usuarios/ativos")
			.then(usuarios => {
				const selectPai = document.getElementById('editarUsuarioPaiId');
				if (selectPai) {
					while (selectPai.options.length > 1) selectPai.remove(1);

					usuarios.forEach(usuario => {
						if (usuario.id != usuarioAtualId) {
							const option = document.createElement('option');
							option.value = usuario.id;
							option.textContent = `${usuario.nome} (${usuario.email})`;
							selectPai.appendChild(option);
						}
					});

					if (selectPai.options.length === 1) {
						const option = document.createElement('option');
						option.value = "";
						option.textContent = "Nenhum usuário disponível";
						option.disabled = true;
						selectPai.appendChild(option);
					}
				}
			})
			.catch(err => {
				console.error('❌ Erro ao carregar usuários para pai (edição):', err);
			});
	}

	salvarEdicaoUsuario() {
		console.log('💾 Iniciando salvamento das alterações...');

		const usuarioId = document.getElementById('editarUsuarioId').value;
		const nome = document.getElementById('editarUsuarioNome').value.trim();
		const email = document.getElementById('editarUsuarioEmail').value.trim();
		const telefone = document.getElementById('editarUsuarioTelefone').value.trim() || null;
		const perfil = document.getElementById('editarUsuarioPerfil').value;
		const ativo = document.getElementById('editarUsuarioAtivo').checked;
		const usuarioPaiIdSelect = document.getElementById('editarUsuarioPaiId');
		const usuarioPaiId = usuarioPaiIdSelect ? usuarioPaiIdSelect.value || null : null;

		console.log('📋 Dados coletados:', { usuarioId, nome, email, telefone, perfil, ativo, usuarioPaiId });

		if (!nome) { this.mostrarMensagemErro('❌ Nome é obrigatório!'); return; }
		if (!email) { this.mostrarMensagemErro('❌ Email é obrigatório!'); return; }

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) { this.mostrarMensagemErro('❌ Email inválido!'); return; }

		const dados = { nome, email, telefone, perfil, ativo };

		if (usuarioPaiId && usuarioPaiId !== 'null' && usuarioPaiId !== 'undefined' && usuarioPaiId !== usuarioId) {
			dados.usuarioPaiId = usuarioPaiId;
		}

		console.log('📦 Dados a serem enviados:', dados);

		const submitBtn = document.getElementById('btnSalvarEdicao');
		const originalText = submitBtn ? submitBtn.innerHTML : 'Salvar Alterações';

		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
		}

		const modalElement = document.getElementById('editarUsuarioModal');
		if (modalElement) {
			const modal = bootstrap.Modal.getInstance(modalElement);
			if (modal) modal.hide();
		}

		console.log('🌐 Enviando requisição PUT para:', `/api/usuarios/${usuarioId}`);

		this.fetchJson(`/api/usuarios/${usuarioId}`, {
			method: 'PUT',
			body: dados // ✅ objeto, fetchJson cuida do JSON
		})
			.then(data => {
				console.log('✅ Usuário atualizado com sucesso:', data);
				this.mostrarMensagemSucesso('✅ Usuário atualizado com sucesso!');

				if (window.limparBackdropEModal) window.limparBackdropEModal();

				setTimeout(() => this.loadUsuariosData(), 500);
			})
			.catch(err => {
				console.error('❌ Erro ao salvar edição:', err);
				this.mostrarMensagemErro('❌ Erro ao salvar alterações: ' + err.message);

				if (modalElement && document.body.contains(modalElement)) {
					setTimeout(() => {
						const modal = new bootstrap.Modal(modalElement);
						modal.show();
					}, 300);
				}
			})
			.finally(() => {
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.innerHTML = originalText;
				}
			});
	}

	// ============================================
	// FUNÇÕES CRUD
	// ============================================

	desativarUsuario(userId) {
		if (!confirm('Tem certeza que deseja DESATIVAR este usuário?\n\nO usuário não poderá mais fazer login no sistema.')) return;

		console.log(`⏸️ Desativando usuário ${userId}...`);

		this.fetchJson(`/api/usuarios/${userId}/desativar`, { method: 'PATCH' })
			.then(() => {
				console.log('✅ Usuário desativado com sucesso');
				this.mostrarMensagemSucesso('Usuário desativado com sucesso!');
				this.loadUsuariosData();
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				this.mostrarMensagemErro('Erro ao desativar usuário: ' + err.message);
			});
	}

	reativarUsuario(userId) {
		if (!confirm('Tem certeza que deseja REATIVAR este usuário?\n\nO usuário voltará a ter acesso ao sistema.')) return;

		console.log(`▶️ Reativando usuário ${userId}...`);

		this.fetchJson(`/api/usuarios/${userId}/reativar`, { method: 'PATCH' })
			.then(() => {
				console.log('✅ Usuário reativado com sucesso');
				this.mostrarMensagemSucesso('Usuário reativado com sucesso!');
				this.loadUsuariosData();
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				this.mostrarMensagemErro('Erro ao reativar usuário: ' + err.message);
			});
	}

	excluirUsuario(userId) {
		if (!confirm('⚠️ ATENÇÃO: Esta ação é irreversível!\n\nTem certeza que deseja EXCLUIR permanentemente este usuário?\n\nTodas as informações associadas serão perdidas.')) return;

		console.log(`🗑️ Excluindo usuário ${userId}...`);

		this.fetchJson(`/api/usuarios/${userId}`, { method: 'DELETE' })
			.then(() => {
				console.log('✅ Usuário excluído com sucesso');
				this.mostrarMensagemSucesso('✅ Usuário excluído com sucesso!');
				this.loadUsuariosData();
			})
			.catch(err => {
				console.error('❌ Erro:', err);
				this.mostrarMensagemErro('Erro ao excluir usuário: ' + err.message);
			});
	}

	// ============================================
	// GERAR RELATÓRIO COM FILTROS (NOVO)
	// ============================================

	gerarRelatorioUsuarios() {
		console.log('📊 Abrindo opções de exportação...');

		const existingModal = document.getElementById('relatorioModal');
		if (existingModal) existingModal.remove();

		const modalHTML = `
			<div class="modal fade" id="relatorioModal" tabindex="-1">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title"><i class="bi bi-download"></i> Exportar Relatório</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal"></button>
						</div>
						<div class="modal-body">
							<div class="mb-4">
								<h6 class="mb-3">Escolha o tipo de exportação:</h6>
								
								<div class="form-check mb-3">
									<input class="form-check-input" type="radio" name="exportType" 
										   id="exportAll" value="all" checked>
									<label class="form-check-label" for="exportAll">
										<strong>Todos os usuários</strong>
										<br>
										<small class="text-muted">Exporta todos os usuários do sistema</small>
									</label>
								</div>
								
								<div class="form-check mb-3">
									<input class="form-check-input" type="radio" name="exportType" 
										   id="exportSubtree" value="subtree">
									<label class="form-check-label" for="exportSubtree">
										<strong>Hierarquia específica</strong>
										<br>
										<small class="text-muted">Exporta um usuário e toda sua rede abaixo</small>
									</label>
								</div>
							</div>
							
							<div id="subtreeOptions" class="d-none">
								<div class="mb-3">
									<label class="form-label">Selecione o usuário base:</label>
									<select class="form-select" id="userSelect">
										<option value="">Selecione um usuário...</option>
									</select>
									<small class="text-muted">A exportação incluirá este usuário e todos abaixo dele na hierarquia</small>
								</div>
								
								<div class="alert alert-info">
									<i class="bi bi-info-circle"></i>
									Será exportado o usuário selecionado, seus filhos, netos, etc.
								</div>
							</div>
							
							<div class="mb-3">
								<label class="form-label">Formato:</label>
								<div>
									<div class="form-check form-check-inline">
										<input class="form-check-input" type="radio" name="exportFormat" 
											   id="formatCSV" value="csv" checked>
										<label class="form-check-label" for="formatCSV">CSV</label>
									</div>
									<div class="form-check form-check-inline">
										<input class="form-check-input" type="radio" name="exportFormat" 
											   id="formatJSON" value="json">
										<label class="form-check-label" for="formatJSON">JSON</label>
									</div>
								</div>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
								Cancelar
							</button>
							<button type="button" class="btn btn-primary" id="btnExportRelatorio">
								<i class="bi bi-download"></i> Exportar
							</button>
						</div>
					</div>
				</div>
			</div>
		`;

		document.body.insertAdjacentHTML('beforeend', modalHTML);

		const modalElement = document.getElementById('relatorioModal');
		const exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
		const subtreeOptions = document.getElementById('subtreeOptions');
		const btnExport = document.getElementById('btnExportRelatorio');

		this.carregarUsuariosParaRelatorio();

		exportTypeRadios.forEach(radio => {
			radio.addEventListener('change', () => {
				if (radio.value === 'subtree') subtreeOptions.classList.remove('d-none');
				else subtreeOptions.classList.add('d-none');
			});
		});

		btnExport.addEventListener('click', () => this.executarExportacao());

		const modal = new bootstrap.Modal(modalElement);
		modal.show();

		modalElement.addEventListener('hidden.bs.modal', () => {
			setTimeout(() => {
				if (window.limparBackdropEModal) window.limparBackdropEModal();
				if (modalElement && document.body.contains(modalElement)) modalElement.remove();
			}, 300);
		});
	}

	carregarUsuariosParaRelatorio() {
		this.fetchJson("/api/usuarios")
			.then(usuarios => {
				const userSelect = document.getElementById('userSelect');
				if (userSelect) {
					usuarios.sort((a, b) => a.nome.localeCompare(b.nome));
					usuarios.forEach(usuario => {
						const option = document.createElement('option');
						option.value = usuario.id;
						option.textContent = `${usuario.nome}${usuario.perfil === 'ADMIN' ? ' [ADMIN]' : ''} (${usuario.email})`;
						userSelect.appendChild(option);
					});
				}
			})
			.catch(err => {
				console.error('❌ Erro ao carregar usuários:', err);
				const userSelect = document.getElementById('userSelect');
				if (userSelect) {
					const option = document.createElement('option');
					option.value = "";
					option.textContent = "Erro ao carregar usuários";
					option.disabled = true;
					userSelect.appendChild(option);
				}
			});
	}

	async executarExportacao() {
		const exportType = document.querySelector('input[name="exportType"]:checked').value;
		const format = document.querySelector('input[name="exportFormat"]:checked').value;
		const userId = exportType === 'subtree' ? document.getElementById('userSelect').value : null;

		if (exportType === 'subtree' && !userId) {
			alert('❌ Por favor, selecione um usuário para exportar a hierarquia.');
			return;
		}

		const btnExport = document.getElementById('btnExportRelatorio');
		const originalText = btnExport.innerHTML;
		btnExport.disabled = true;
		btnExport.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Exportando...';

		try {
			let usuarios = [];
			if (exportType === 'all') usuarios = await this.buscarTodosUsuarios();
			else usuarios = await this.buscarHierarquiaUsuario(userId);

			if (format === 'csv') this.gerarCSV(usuarios, exportType, userId);
			else this.gerarJSON(usuarios, exportType, userId);

			const modalElement = document.getElementById('relatorioModal');
			if (modalElement) {
				const modal = bootstrap.Modal.getInstance(modalElement);
				if (modal) modal.hide();
			}

			this.mostrarMensagemSucesso(`✅ Relatório exportado com sucesso! (${usuarios.length} usuários)`);
		} catch (error) {
			console.error('❌ Erro ao exportar:', error);
			this.mostrarMensagemErro('❌ Erro ao exportar: ' + error.message);
		} finally {
			btnExport.disabled = false;
			btnExport.innerHTML = originalText;
		}
	}

	async buscarTodosUsuarios() {
		return await this.fetchJson("/api/usuarios");
	}

	async buscarHierarquiaUsuario(userId) {
		const base = await this.fetchJson(`/api/usuarios/${userId}`);
		const descendentes = await this.fetchJson(`/api/usuarios/${userId}/hierarquia`);

		const lista = [base, ...(descendentes || [])];

		const cache = new Map();
		const detalhados = [];

		for (const u of lista) {
			const id = u?.id;
			if (!id) continue;

			if (cache.has(id)) {
				detalhados.push(cache.get(id));
				continue;
			}

			const full = await this.buscarUsuarioDetalhado(id);
			cache.set(id, full);
			detalhados.push(full);
		}

		return detalhados;
	}

	async buscarUsuarioDetalhado(id) {
		try {
			return await this.fetchJson(`/api/usuarios/${id}`);
		} catch {
			return { id };
		}
	}

	// ============================================
	// EXPORTAÇÃO (CSV / JSON)
	// ============================================

	downloadArquivo(conteudo, nomeArquivo, mimeType) {
		const blob = new Blob([conteudo], { type: mimeType });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = nomeArquivo;
		document.body.appendChild(a);
		a.click();

		a.remove();
		URL.revokeObjectURL(url);
	}

	escapeCSV(valor) {
		if (valor === null || valor === undefined) return '';
		const str = String(valor);
		if (/[",\n\r;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
		return str;
	}

	gerarCSV(usuarios, exportType, userId) {
		const agora = new Date();
		const tsArquivo = agora.toISOString().slice(0, 19).replace(/[:T]/g, '-');

		const nomeArquivo =
			exportType === 'all'
				? `usuarios-${tsArquivo}.csv`
				: `usuarios-hierarquia-${userId}-${tsArquivo}.csv`;

		const formatBR = (iso) => {
			if (!iso) return '';
			const d = new Date(iso);
			if (isNaN(d.getTime())) return String(iso);
			return d.toLocaleString('pt-BR');
		};

		const getPaiId = (u) => u?.usuarioPaiId ?? u?.usuarioPai?.id ?? '';
		const getTelefone = (u) => u?.telefone ?? u?.fone ?? u?.celular ?? '';

		const map = new Map();
		(usuarios || []).forEach(u => { if (u?.id != null) map.set(String(u.id), u); });

		const getPaiNome = (u) => {
			const pid = getPaiId(u);
			if (!pid) return '';
			const pai = map.get(String(pid));
			return pai?.nome ?? '';
		};

		const calcNivel = (u) => {
			let depth = 1;
			let pid = getPaiId(u);
			const seen = new Set([String(u?.id)]);

			while (pid) {
				const spid = String(pid);
				if (seen.has(spid)) break;
				seen.add(spid);

				depth++;
				const pai = map.get(spid);
				pid = pai ? getPaiId(pai) : '';
			}
			return `Nível ${depth + 1}`;
		};

		const linhas = [];
		linhas.push(`Tipo de Exportação: ${exportType === 'all' ? 'Todos os usuários' : 'Hierarquia específica'}`);
		linhas.push(`Data da Exportação: ${agora.toLocaleString('pt-BR')}`);
		linhas.push(`Total de Registros: ${(usuarios || []).length}`);
		linhas.push('');

		const colunas = [
			'ID',
			'Nome',
			'Email',
			'Telefone',
			'Perfil',
			'Status',
			'Usuário Pai ID',
			'Usuário Pai Nome',
			'Data de Criação',
			'Nível Hierárquico'
		];

		linhas.push(colunas.join(';'));

		for (const u of (usuarios || [])) {
			const row = [
				u?.id ?? '',
				u?.nome ?? '',
				u?.email ?? '',
				getTelefone(u),
				u?.perfil ?? '',
				(u?.ativo ? 'Ativo' : 'Inativo'),
				getPaiId(u),
				getPaiNome(u),
				formatBR(u?.dataCriacao),
				calcNivel(u)
			].map(v => this.escapeCSV(v));

			linhas.push(row.join(';'));
		}

		const csv = linhas.join('\r\n');
		const csvComBOM = '\uFEFF' + csv;

		this.downloadArquivo(csvComBOM, nomeArquivo, 'text/csv;charset=utf-8;');
	}

	gerarJSON(usuarios, exportType, userId) {
		const agora = new Date();
		const tsArquivo = agora.toISOString().slice(0, 19).replace(/[:T]/g, '-');

		const nomeArquivo =
			exportType === 'all'
				? `usuarios-${tsArquivo}.json`
				: `usuarios-hierarquia-${userId}-${tsArquivo}.json`;

		const payload = {
			tipoExportacao: exportType,
			dataExportacao: agora.toISOString(),
			total: (usuarios || []).length,
			usuarios: usuarios || []
		};

		this.downloadArquivo(JSON.stringify(payload, null, 2), nomeArquivo, 'application/json;charset=utf-8;');
	}
}

// ============================================
// INICIALIZAÇÃO DO MANAGER
// ============================================

document.addEventListener("DOMContentLoaded", function() {
	try {
		if (typeof bootstrap === "undefined") {
			console.error("❌ Bootstrap não está carregado!");
			return;
		}

		// ✅ Sempre inicializa (dashboard injeta as seções depois)
		if (!window.usuariosManager) window.usuariosManager = new UsuariosManager();
		console.log("✅ UsuariosManager pronto (lazy via seção)");
	} catch (e) {
		console.error("❌ Erro ao inicializar UsuariosManager:", e);
	}
});

