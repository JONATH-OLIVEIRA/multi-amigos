(function() {
	console.log('=== INTERCEPTOR SIMPLES (JWT only) ===');

	const token = localStorage.getItem('token');
	if (!token) {
		console.warn('Token JWT não encontrado no localStorage');
		window.location.href = '/auth/login';
		return;
	}

	// Verifica se já existe um interceptor
	if (window.fetch.isIntercepted) {
		console.log('✅ Interceptor já configurado');
		return;
	}

	const originalFetch = window.fetch;
	window.fetch = function(resource, options = {}) {
		console.log(`📤 Fetch: ${options.method || 'GET'} ${resource}`);

		const newOptions = { ...options };
		newOptions.headers = { ...newOptions.headers };

		// Adiciona Authorization para todas as requisições
		if (!newOptions.headers['Authorization']) {
			newOptions.headers['Authorization'] = `Bearer ${token}`;
		}

		// Configura JSON para métodos que modificam
		const method = (newOptions.method || 'GET').toUpperCase();
		const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

		if (modifyingMethods.includes(method)) {
			if (newOptions.body && typeof newOptions.body === 'object' &&
				!(newOptions.body instanceof FormData)) {
				if (!newOptions.headers['Content-Type']) {
					newOptions.headers['Content-Type'] = 'application/json';
				}
				newOptions.body = JSON.stringify(newOptions.body);
			}
		}

		return originalFetch.call(this, resource, newOptions)
			.catch(error => {
				console.error('❌ Erro na requisição:', error);
				throw error;
			});
	};

	window.fetch.isIntercepted = true;
	console.log('✅ Interceptor configurado (JWT only)');
})();

// ============================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================

// Função para limpar backdrops e modais
window.limparBackdropEModal = function() {
	// Remove todos os backdrops
	const backdrops = document.querySelectorAll('.modal-backdrop');
	backdrops.forEach(backdrop => backdrop.remove());

	// Remove a classe modal-open do body
	document.body.classList.remove('modal-open');
	document.body.style.overflow = '';
	document.body.style.paddingRight = '';

	// Remove modais que podem ter ficado
	const modais = document.querySelectorAll('.modal.show');
	modais.forEach(modal => {
		modal.classList.remove('show');
		modal.style.display = 'none';
	});

	// Fecha todos os modais do Bootstrap
	if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
		const modaisInstances = document.querySelectorAll('.modal');
		modaisInstances.forEach(modalEl => {
			const modalInstance = bootstrap.Modal.getInstance(modalEl);
			if (modalInstance) {
				modalInstance.hide();
			}
		});
	}
};

// Função para atualizar mensagem na UI (chamada pelo manager)
window.atualizarMensagemNaUI = function(mensagemAtualizada) {
	const mensagensContainer = document.getElementById('mensagensContainer');
	if (!mensagensContainer) return;

	const cards = mensagensContainer.querySelectorAll('.mensagem-card');
	cards.forEach(card => {
		const msgId = card.querySelector('.btn-toggle-msg')?.dataset.id;
		if (msgId == mensagemAtualizada.id) {
			const statusBadge = card.querySelector('.badge.bg-success, .badge.bg-secondary');
			if (statusBadge) {
				if (mensagemAtualizada.ativo) {
					statusBadge.className = 'badge bg-success';
					statusBadge.textContent = 'Ativa';
				} else {
					statusBadge.className = 'badge bg-secondary';
					statusBadge.textContent = 'Inativa';
				}
			}

			const toggleBtn = card.querySelector('.btn-toggle-msg');
			if (toggleBtn) {
				const icon = toggleBtn.querySelector('i');
				if (mensagemAtualizada.ativo) {
					toggleBtn.className = 'btn btn-sm btn-outline-warning btn-toggle-msg';
					toggleBtn.title = 'Desativar';
					icon.className = 'bi bi-toggle-off';
				} else {
					toggleBtn.className = 'btn btn-sm btn-outline-success btn-toggle-msg';
					toggleBtn.title = 'Ativar';
					icon.className = 'bi bi-toggle-on';
				}
			}
		}
	});
};

// Funções de loading globais
window.showLoading = function() {
	const loadingArea = document.getElementById("loadingArea");
	const contentArea = document.getElementById("contentArea");

	if (loadingArea) {
		loadingArea.classList.remove('d-none');
	}
	if (contentArea) {
		contentArea.style.opacity = '0.5';
	}
};

window.hideLoading = function() {
	const loadingArea = document.getElementById("loadingArea");
	const contentArea = document.getElementById("contentArea");

	if (loadingArea) {
		loadingArea.classList.add('d-none');
	}
	if (contentArea) {
		contentArea.style.opacity = '1';
	}
};

// Função auxiliar para formatar datas
window.formatDate = function(dateString) {
	if (!dateString) return 'N/A';
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch (e) {
		return dateString;
	}
};

// ============================================
// INICIALIZAÇÃO PRINCIPAL DO DASHBOARD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
	console.log('=== DASHBOARD INICIALIZADO ===');

	// Verifica token
	const token = localStorage.getItem('token');
	if (!token) {
		console.warn('Token JWT não encontrado');
		window.location.href = '/auth/login';
		return;
	}

	console.log('✅ Token JWT presente');

	// Elementos DOM
	const contentArea = document.getElementById("contentArea");
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
		console.log(`📄 Carregando página: ${page}`);
		currentPage = page;

		// Atualiza título
		updatePageTitle(page);

		// Mostra loading
		showLoading();

		// Carrega conteúdo baseado na página
		setTimeout(() => {
			switch (page) {
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
		}, 100);
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
                    <button id="btnGerarRelatorio" class="btn btn-info ms-2">
                        <i class="bi bi-download"></i> Exportar
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
            
            <!-- Modal de Hierarquia -->
            <div class="modal fade" id="hierarquiaModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="hierarquiaModalLabel">Hierarquia do Usuário</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="hierarquiaModalBody">
                            <!-- Conteúdo será carregado aqui -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

		contentArea.innerHTML = html;
		hideLoading();

		// Carrega dados usando o UsuariosManager
		if (window.usuariosManager) {
			window.usuariosManager.loadUsuariosData();
		} else {
			// Carregar dados manualmente se o manager não estiver disponível
			carregarUsuariosManual();
		}

		// Adiciona eventos aos novos botões
		setTimeout(() => {
			const refreshBtn = document.getElementById('refreshUsuarios');
			const addBtn = document.getElementById('addUserBtn');
			const relatorioBtn = document.getElementById('btnGerarRelatorio');

			if (refreshBtn) {
				refreshBtn.addEventListener('click', () => {
					if (window.usuariosManager) {
						window.usuariosManager.loadUsuariosData();
					} else {
						carregarUsuariosManual();
					}
				});
			}

			if (addBtn) {
				addBtn.addEventListener('click', () => {
					if (window.usuariosManager && window.usuariosManager.abrirModalNovoUsuario) {
						window.usuariosManager.abrirModalNovoUsuario();
					}
				});
			}

			if (relatorioBtn) {
				relatorioBtn.addEventListener('click', () => {
					if (window.usuariosManager && window.usuariosManager.gerarRelatorioUsuarios) {
						window.usuariosManager.gerarRelatorioUsuarios();
					}
				});
			}
		}, 100);
	}

	// Função fallback para carregar usuários
	function carregarUsuariosManual() {
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
				if (usuarios && usuarios.length > 0) {
					renderizarUsuariosSimples(usuarios);
				} else {
					if (emptyState) emptyState.classList.remove('d-none');
				}
			})
			.catch(err => {
				hideLoading();
				console.error('Erro ao carregar usuários:', err);
				if (errorMessage) errorMessage.textContent = err.message;
				if (errorState) errorState.classList.remove('d-none');
			});
	}

	function renderizarUsuariosSimples(usuarios) {
		const container = document.getElementById('usuariosContainer');
		if (!container) return;

		container.innerHTML = '';

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
                                ${formatDate(usuario.dataCriacao)}
                            </small>
                        </p>
                        <div class="alert alert-warning p-2 small">
                            <i class="bi bi-exclamation-triangle"></i>
                            Gerenciador de usuários não carregado. Recarregue a página.
                        </div>
                    </div>
                </div>
            `;

			container.appendChild(col);
		});
	}

	// Página de Mensagens
	function loadMensagensPage() {
		const html = `
            <div class="row mb-4">
                <div class="col">
                    <h2><i class="bi bi-megaphone"></i> Mensagens do Sistema</h2>
                    <p class="text-muted">Gerencie as mensagens que aparecem para os usuários</p>
                </div>
                <div class="col-auto">
                    <button id="refreshMensagens" class="btn btn-primary">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                    <button id="btnNovaMensagem" class="btn btn-success ms-2">
                        <i class="bi bi-plus-circle"></i> Nova Mensagem
                    </button>
                </div>
            </div>
            
            <div id="mensagensContainer" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 fade-in">
                <!-- Mensagens serão carregadas aqui -->
            </div>
            
            <div id="emptyMensagens" class="text-center py-5 d-none">
                <i class="bi bi-megaphone display-1 text-muted"></i>
                <h4 class="mt-3">Nenhuma mensagem encontrada</h4>
                <p class="text-muted">Não há mensagens cadastradas no sistema.</p>
            </div>
            
            <div id="errorMensagens" class="alert alert-danger d-none">
                <i class="bi bi-exclamation-triangle"></i>
                <span id="errorMensagensMessage">Erro ao carregar mensagens</span>
            </div>
        `;

		contentArea.innerHTML = html;
		hideLoading();

		// Usa o manager para carregar os dados
		if (window.mensagensManager) {
			window.mensagensManager.loadMensagensData();
		} else {
			console.error('MensagensManager não está disponível');
			const errorState = document.getElementById('errorMensagens');
			const errorMessage = document.getElementById('errorMensagensMessage');
			if (errorState && errorMessage) {
				errorMessage.textContent = 'Sistema de mensagens não carregado. Recarregue a página.';
				errorState.classList.remove('d-none');
			}
		}

		// Adiciona evento aos botões
		setTimeout(() => {
			const refreshBtn = document.getElementById('refreshMensagens');
			const novaMensagemBtn = document.getElementById('btnNovaMensagem');

			if (refreshBtn) {
				refreshBtn.addEventListener('click', () => {
					if (window.mensagensManager) {
						window.mensagensManager.loadMensagensData();
					}
				});
			}

			if (novaMensagemBtn) {
				novaMensagemBtn.addEventListener('click', () => {
					if (window.mensagensManager && window.mensagensManager.abrirModalNovaMensagem) {
						window.mensagensManager.abrirModalNovaMensagem();
					}
				});
			}
		}, 100);
	}

	// Página de Dashboard
	function loadDashboardPage() {
		const html = `
            <div class="row mb-4">
                <div class="col">
                    <h2><i class="bi bi-speedometer2"></i> Dashboard Resumo</h2>
                    <p class="text-muted">Visão geral do sistema</p>
                </div>
                <div class="col-auto">
                    <button id="refreshDashboard" class="btn btn-primary">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
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
                            <p class="card-text mt-2">Ativos</p>
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
                            <h5 class="card-title">Administradores</h5>
                            <h2 id="totalAdmins" class="mb-0">0</h2>
                            <p class="card-text mt-2">Com perfil ADMIN</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-activity"></i> Últimos Usuários</h5>
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
                            <h5 class="mb-0"><i class="bi bi-bell"></i> Ações Rápidas</h5>
                        </div>
                        <div class="card-body">
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
        `;

		contentArea.innerHTML = html;
		hideLoading();

		// Carrega dados do dashboard
		loadDashboardData();

		// Adiciona eventos aos botões do dashboard
		setTimeout(() => {
			const refreshBtn = document.getElementById('refreshDashboard');
			const novoUsuarioDashBtn = document.getElementById('btnNovoUsuarioDash');
			const criarMensagemDashBtn = document.getElementById('btnCriarMensagemDash');
			const exportarRelatorioDashBtn = document.getElementById('btnExportarRelatorioDash');

			if (refreshBtn) {
				refreshBtn.addEventListener('click', loadDashboardData);
			}

			if (novoUsuarioDashBtn) {
				novoUsuarioDashBtn.addEventListener('click', () => {
					if (window.usuariosManager && window.usuariosManager.abrirModalNovoUsuario) {
						window.usuariosManager.abrirModalNovoUsuario();
					}
				});
			}

			if (criarMensagemDashBtn) {
				criarMensagemDashBtn.addEventListener('click', () => {
					loadPage('mensagens');
				});
			}

			if (exportarRelatorioDashBtn) {
				exportarRelatorioDashBtn.addEventListener('click', () => {
					if (window.usuariosManager && window.usuariosManager.gerarRelatorioUsuarios) {
						window.usuariosManager.gerarRelatorioUsuarios();
					}
				});
			}
		}, 100);
	}

	// Carrega dados do dashboard
	function loadDashboardData() {
		// Busca estatísticas de usuários
		fetch("/api/usuarios/estatisticas")
			.then(response => {
				if (!response.ok) {
					console.warn('Erro ao buscar estatísticas de usuários');
					// Tenta alternativa
					return fetch("/api/usuarios")
						.then(response => response.json())
						.then(usuarios => {
							const total = usuarios.length;
							const ativos = usuarios.filter(u => u.ativo).length;
							const admins = usuarios.filter(u => u.perfil === 'ADMIN').length;
							return {
								totalUsuarios: total,
								usuariosAtivos: ativos,
								totalAdmins: admins
							};
						});
				}
				return response.json();
			})
			.then(estatisticasUsuarios => {
				document.getElementById('totalUsuarios').textContent = estatisticasUsuarios.totalUsuarios || '0';
				document.getElementById('usuariosAtivos').textContent = estatisticasUsuarios.usuariosAtivos || '0';
				document.getElementById('totalAdmins').textContent = estatisticasUsuarios.totalAdmins || '0';

				// Busca estatísticas de mensagens
				return fetch("/api/mensagens/estatisticas");
			})
			.then(response => {
				if (response.ok) {
					return response.json().then(estatisticasMensagens => {
						document.getElementById('mensagensAtivas').textContent =
							estatisticasMensagens.mensagensAtivas || '0';
					});
				} else {
					// Se o endpoint não existir, tenta alternativo
					return fetch("/api/mensagens/todas")
						.then(response => response.json())
						.then(mensagens => {
							const ativas = mensagens.filter(m => m.ativo).length;
							document.getElementById('mensagensAtivas').textContent = ativas;
						})
						.catch(() => {
							document.getElementById('mensagensAtivas').textContent = '0';
						});
				}
			})
			.then(() => {
				// Carrega atividade recente
				carregarAtividadeRecente();
			})
			.catch(err => {
				console.error('Erro ao carregar dashboard:', err);
				document.getElementById('totalUsuarios').textContent = '--';
				document.getElementById('usuariosAtivos').textContent = '--';
				document.getElementById('mensagensAtivas').textContent = '--';
				document.getElementById('totalAdmins').textContent = '--';
			});
	}

	// Carrega atividade recente
	function carregarAtividadeRecente() {
		const atividadeList = document.getElementById('atividadeList');
		if (!atividadeList) return;

		atividadeList.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div><p class="mt-2 mb-0">Carregando...</p></div>';

		fetch("/api/usuarios")
			.then(response => {
				if (!response.ok) throw new Error(`Erro ${response.status}`);
				return response.json();
			})
			.then(usuarios => {
				// Ordena por data de criação (mais recentes primeiro)
				const usuariosRecentes = usuarios
					.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
					.slice(0, 5);

				if (usuariosRecentes.length === 0) {
					atividadeList.innerHTML = '<div class="text-center py-3"><i class="bi bi-people display-6 text-muted"></i><p class="mt-2 mb-0">Nenhum usuário</p></div>';
					return;
				}

				let html = '';
				usuariosRecentes.forEach((usuario, index) => {
					const statusBadge = usuario.ativo
						? '<span class="badge bg-success">Ativo</span>'
						: '<span class="badge bg-secondary">Inativo</span>';

					const perfilBadge = usuario.perfil === 'ADMIN'
						? '<span class="badge bg-danger">ADMIN</span>'
						: '<span class="badge bg-primary">USUÁRIO</span>';

					html += `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="d-flex align-items-center">
                                        <div class="flex-shrink-0">
                                            <i class="bi bi-person-circle ${usuario.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
                                        </div>
                                        <div class="flex-grow-1 ms-2">
                                            <h6 class="mb-0">${usuario.nome}</h6>
                                            <small class="text-muted">${usuario.email}</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-end">
                                    ${statusBadge}
                                    ${perfilBadge}
                                    <br>
                                    <small class="text-muted">${formatDate(usuario.dataCriacao)}</small>
                                </div>
                            </div>
                        </div>
                    `;
				});

				atividadeList.innerHTML = html;
			})
			.catch(err => {
				console.error('Erro ao carregar atividade:', err);
				atividadeList.innerHTML = '<div class="alert alert-danger m-2"><i class="bi bi-exclamation-triangle"></i> Erro ao carregar</div>';
			});
	}

	// Funções auxiliares do menu
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

	// NO dashboard.js - CORRIJA ISSO:
	// NO dashboard.js, na função que navega para busca:

	function navegarParaBusca() {
		const token = localStorage.getItem('token');
		console.log('🔑 Token que será passado:', token);
		console.log('🔗 URL gerada:', `/admin/busca?token=${token}`);

		window.location.href = `/admin/busca?token=${token}`;
	}

	// Função de logout
	function logout() {
		if (confirm('Deseja realmente sair?')) {
			localStorage.removeItem('token');
			window.location.href = '/auth/login';
		}
	}

	console.log('✅ Dashboard inicializado com sucesso');
});

// ===================================================
// ✅ MOBILE SIDEBAR (DRAWER) - SEM MEXER NA LÓGICA
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleSidebarBtn");
  const overlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  overlay?.addEventListener("click", closeSidebar);

  // Fecha menu ao clicar em qualquer link (no mobile)
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) closeSidebar();
    });
  });

  // Ao redimensionar para desktop, garante menu fechado
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) closeSidebar();
  });

  // ESC fecha também (boa UX)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });
});
