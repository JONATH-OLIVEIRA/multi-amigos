(function() {
	console.log('=== INTERCEPTOR SIMPLES ===');

	const token = localStorage.getItem('token');
	if (!token) {
		console.warn('Token JWT não encontrado no localStorage');
		return;
	}

	const originalFetch = window.fetch;
	window.fetch = function(resource, options = {}) {
		const newOptions = { ...options };
		newOptions.headers = { ...newOptions.headers };

		// Adiciona Authorization para todas as requisições
		newOptions.headers['Authorization'] = `Bearer ${token}`;

		// Configura JSON para métodos que modificam
		const method = (newOptions.method || 'GET').toUpperCase();
		const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

		if (modifyingMethods.includes(method)) {
			if (newOptions.body && typeof newOptions.body === 'object' &&
				!(newOptions.body instanceof FormData)) {
				newOptions.headers['Content-Type'] = 'application/json';
				newOptions.body = JSON.stringify(newOptions.body);
			}
		}

		return originalFetch.call(this, resource, newOptions);
	};

	console.log('✅ Interceptor configurado (JWT only)');
})();

// ============================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================

// Função para atualizar mensagem na UI (chamada pelo manager)
window.atualizarMensagemNaUI = function(mensagemAtualizada) {
	const mensagensContainer = document.getElementById('mensagensContainer');
	if (!mensagensContainer) return;

	// Encontra o card da mensagem e atualiza
	const cards = mensagensContainer.querySelectorAll('.mensagem-card');
	cards.forEach(card => {
		const msgId = card.querySelector('.btn-toggle-msg')?.dataset.id;
		if (msgId == mensagemAtualizada.id) {
			// Atualiza o status
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

			// Atualiza o botão toggle
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
function showLoading() {
	const loadingArea = document.getElementById("loadingArea");
	const contentArea = document.getElementById("contentArea");

	if (loadingArea) {
		loadingArea.classList.remove('d-none');
	}
	if (contentArea) {
		contentArea.style.opacity = '0.5';
	}
}

function hideLoading() {
	const loadingArea = document.getElementById("loadingArea");
	const contentArea = document.getElementById("contentArea");

	if (loadingArea) {
		loadingArea.classList.add('d-none');
	}
	if (contentArea) {
		contentArea.style.opacity = '1';
	}
}

// Função auxiliar para formatar datas
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

// Página de Mensagens - CHAMANDO O MANAGER CORRETO
function loadMensagensPage() {
	const contentArea = document.getElementById("contentArea");
	if (!contentArea) return;

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
                <button class="btn btn-success" onclick="abrirModalNovaMensagem()">
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
		// Fallback: mostra mensagem de erro
		const errorState = document.getElementById('errorMensagens');
		const errorMessage = document.getElementById('errorMensagensMessage');
		if (errorState && errorMessage) {
			errorMessage.textContent = 'Sistema de mensagens não carregado. Recarregue a página.';
			errorState.classList.remove('d-none');
		}
	}

	// Adiciona evento ao botão de refresh
	setTimeout(() => {
		const refreshBtn = document.getElementById('refreshMensagens');
		if (refreshBtn) {
			refreshBtn.addEventListener('click', () => {
				if (window.mensagensManager) {
					window.mensagensManager.loadMensagensData();
				}
			});
		}
	}, 100);
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================

document.addEventListener("DOMContentLoaded", () => {
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
		currentPage = page;

		// Atualiza título
		updatePageTitle(page);

		// Mostra loading
		showLoading();

		// Carrega conteúdo baseado na página
		switch (page) {
			case 'usuarios':
				loadUsuariosPage();
				break;
			case 'mensagens':
				loadMensagensPage(); // Agora a função está definida acima
				break;
			case 'dashboard':
				loadDashboardPage();
				break;
			default:
				loadUsuariosPage();
		}
	}

	// Página de Usuários - COM TODOS OS BOTÕES DIRETAMENTE
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
				addBtn.addEventListener('click', abrirModalNovoUsuario);
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
				renderUsuariosComTodosBotoes(usuarios);
			})
			.catch(err => {
				hideLoading();
				if (errorMessage) errorMessage.textContent = err.message;
				if (errorState) errorState.classList.remove('d-none');
			});
	}

	// NOVA FUNÇÃO: Renderiza usuários com TODOS os botões
	function renderUsuariosComTodosBotoes(usuarios) {
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
			// Hierarquia
			document.querySelectorAll('.btn-hierarchy').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					verHierarquia(userId);
				});
			});

			// Detalhes
			document.querySelectorAll('.btn-details').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					verDetalhesUsuario(userId);
				});
			});

			// Editar
			document.querySelectorAll('.btn-editar').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					limparBackdropEModal();
					setTimeout(() => {
						abrirModalEditarUsuario(userId);
					}, 200);
				});
			});

			// Desativar
			document.querySelectorAll('.btn-desativar').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					desativarUsuario(userId);
				});
			});

			// Reativar
			document.querySelectorAll('.btn-reativar').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					reativarUsuario(userId);
				});
			});

			// Excluir
			document.querySelectorAll('.btn-excluir').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const userId = e.target.closest('button').dataset.id;
					excluirUsuario(userId);
				});
			});
		}, 100);
	}

	// Página de Dashboard (resumo) - Versão melhorada
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
                                <button class="btn btn-outline-primary" onclick="abrirModalNovoUsuario()">
                                    <i class="bi bi-person-plus"></i> Novo Usuário
                                </button>
                                <button class="btn btn-outline-success" onclick="loadPage('mensagens')">
                                    <i class="bi bi-megaphone"></i> Criar Mensagem
                                </button>
                                <button class="btn btn-outline-info" onclick="gerarRelatorioUsuarios()">
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

		// Adiciona evento ao botão de refresh
		setTimeout(() => {
			const refreshBtn = document.getElementById('refreshDashboard');
			if (refreshBtn) {
				refreshBtn.addEventListener('click', loadDashboardData);
			}
		}, 100);
	}

	// Carrega dados do dashboard - CORRIGIDO
	function loadDashboardData() {
		// Primeiro busca estatísticas de usuários
		fetch("/api/usuarios/estatisticas")
			.then(response => {
				if (!response.ok) {
					console.warn('Erro ao buscar estatísticas de usuários');
					throw new Error('Erro nas estatísticas de usuários');
				}
				return response.json();
			})
			.then(estatisticasUsuarios => {
				document.getElementById('totalUsuarios').textContent = estatisticasUsuarios.totalUsuarios || '0';
				document.getElementById('usuariosAtivos').textContent = estatisticasUsuarios.usuariosAtivos || '0';
				document.getElementById('totalAdmins').textContent = estatisticasUsuarios.totalAdmins || '0';

				// Depois busca estatísticas de mensagens (se o endpoint existir)
				return fetch("/api/mensagens/estatisticas");
			})
			.then(response => {
				if (response.ok) {
					return response.json().then(estatisticasMensagens => {
						document.getElementById('mensagensAtivas').textContent =
							estatisticasMensagens.mensagensAtivas || '0';
					});
				} else {
					// Se o endpoint não existir, calcula manualmente
					console.warn('Endpoint de estatísticas de mensagens não encontrado, calculando manualmente...');
					return calcularMensagensAtivasManual();
				}
			})
			.then(() => {
				// Carrega atividade recente
				carregarAtividadeRecente();
			})
			.catch(err => {
				console.error('Erro ao carregar dashboard:', err);
				// Tenta cálculo manual como fallback
				calcularMensagensAtivasManual()
					.then(() => carregarAtividadeRecente())
					.catch(() => {
						document.getElementById('totalUsuarios').textContent = '--';
						document.getElementById('usuariosAtivos').textContent = '--';
						document.getElementById('mensagensAtivas').textContent = '--';
						document.getElementById('totalAdmins').textContent = '--';
					});
			});
	}

	// Função auxiliar para calcular mensagens ativas manualmente
	function calcularMensagensAtivasManual() {
		return fetch("/api/mensagens/todas")
			.then(response => {
				if (!response.ok) throw new Error('Erro ao buscar mensagens');
				return response.json();
			})
			.then(mensagens => {
				const mensagensAtivas = mensagens.filter(m => m.ativo).length || 0;
				document.getElementById('mensagensAtivas').textContent = mensagensAtivas;
			})
			.catch(err => {
				console.error('Erro ao calcular mensagens ativas:', err);
				document.getElementById('mensagensAtivas').textContent = '--';
				throw err;
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

	// ============================================
	// FUNÇÕES PARA USUÁRIOS (mantidas como estavam)
	// ============================================

	// MODAL DE DETALHES DO USUÁRIO - COM BOTÃO CANCELAR
	function verDetalhesUsuario(userId) {
		fetch(`/api/usuarios/${userId}`)
			.then(response => {
				if (!response.ok) throw new Error(`Erro ${response.status}`);
				return response.json();
			})
			.then(usuario => {
				// Cria ou obtém o modal de detalhes
				let modalDetalhes = document.getElementById('detalhesUsuarioModal');
				if (!modalDetalhes) {
					modalDetalhes = document.createElement('div');
					modalDetalhes.innerHTML = `
					<div class="modal fade" id="detalhesUsuarioModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
						<div class="modal-dialog">
							<div class="modal-content">
								<div class="modal-header">
									<h5 class="modal-title">Detalhes do Usuário</h5>
									<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
								</div>
								<div class="modal-body" id="detalhesUsuarioBody">
									<!-- Conteúdo será inserido aqui -->
								</div>
								<div class="modal-footer">
									<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
										<i class="bi bi-x-circle"></i> Fechar
									</button>
									<button type="button" class="btn btn-primary btn-editar-detalhes" data-user-id="${usuario.id}">
										<i class="bi bi-pencil"></i> Editar Usuário
									</button>
								</div>
							</div>
						</div>
					</div>
				`;
					document.body.appendChild(modalDetalhes);

					// Adiciona evento ao botão de editar
					setTimeout(() => {
						document.querySelectorAll('.btn-editar-detalhes').forEach(btn => {
							btn.addEventListener('click', function() {
								const userId = this.getAttribute('data-user-id');
								fecharModalEDetalhesEAbrirEdicao(userId);
							});
						});
					}, 100);
				} else {
					// Atualiza o conteúdo do modal existente
					const detalhesBody = document.getElementById('detalhesUsuarioBody');
					const btnEditar = document.querySelector('.btn-editar-detalhes');

					if (detalhesBody) {
						detalhesBody.innerHTML = `
						<div class="text-center mb-3">
							<i class="bi bi-person-circle fs-1 ${usuario.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
							<h5 class="mt-2">${usuario.nome}</h5>
						</div>
						<div class="mb-3">
							<strong>Email:</strong><br>
							<span class="text-muted">${usuario.email}</span>
						</div>
						${usuario.telefone ? `
							<div class="mb-3">
								<strong>Telefone:</strong><br>
								<span class="text-muted">${usuario.telefone}</span>
							</div>
						` : ''}
						<div class="row">
							<div class="col-md-6 mb-3">
								<strong>Perfil:</strong><br>
								<span class="badge ${usuario.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
									${usuario.perfil}
								</span>
							</div>
							<div class="col-md-6 mb-3">
								<strong>Status:</strong><br>
								<span class="badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}">
									${usuario.ativo ? 'Ativo' : 'Inativo'}
								</span>
							</div>
						</div>
						<div class="mb-3">
							<strong>Data de Criação:</strong><br>
							<span class="text-muted">${formatDate(usuario.dataCriacao)}</span>
						</div>
						${usuario.dataAtualizacao ? `
							<div class="mb-3">
								<strong>Última Atualização:</strong><br>
								<span class="text-muted">${formatDate(usuario.dataAtualizacao)}</span>
							</div>
						` : ''}
						${usuario.usuarioPaiId ? `
							<div class="mb-3">
								<strong>Usuário Pai ID:</strong><br>
								<span class="text-muted">${usuario.usuarioPaiId}</span>
							</div>
						` : ''}
					`;
					}

					if (btnEditar) {
						btnEditar.setAttribute('data-user-id', usuario.id);
					}
				}

				// Preenche o conteúdo do modal
				const detalhesBody = document.getElementById('detalhesUsuarioBody');
				if (detalhesBody) {
					detalhesBody.innerHTML = `
					<div class="text-center mb-3">
						<i class="bi bi-person-circle fs-1 ${usuario.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
						<h5 class="mt-2">${usuario.nome}</h5>
					</div>
					<div class="mb-3">
						<strong>Email:</strong><br>
						<span class="text-muted">${usuario.email}</span>
					</div>
					${usuario.telefone ? `
						<div class="mb-3">
							<strong>Telefone:</strong><br>
							<span class="text-muted">${usuario.telefone}</span>
						</div>
					` : ''}
					<div class="row">
						<div class="col-md-6 mb-3">
							<strong>Perfil:</strong><br>
							<span class="badge ${usuario.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
								${usuario.perfil}
							</span>
						</div>
						<div class="col-md-6 mb-3">
							<strong>Status:</strong><br>
							<span class="badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}">
								${usuario.ativo ? 'Ativo' : 'Inativo'}
							</span>
						</div>
					</div>
					<div class="mb-3">
						<strong>Data de Criação:</strong><br>
						<span class="text-muted">${formatDate(usuario.dataCriacao)}</span>
					</div>
					${usuario.dataAtualizacao ? `
						<div class="mb-3">
							<strong>Última Atualização:</strong><br>
							<span class="text-muted">${formatDate(usuario.dataAtualizacao)}</span>
						</div>
					` : ''}
					${usuario.usuarioPaiId ? `
						<div class="mb-3">
							<strong>Usuário Pai ID:</strong><br>
							<span class="text-muted">${usuario.usuarioPaiId}</span>
						</div>
					` : ''}
				`;
				}

				// Abre o modal
				const modalElement = document.getElementById('detalhesUsuarioModal');
				if (modalElement) {
					// Remove qualquer instância anterior
					const existingModal = bootstrap.Modal.getInstance(modalElement);
					if (existingModal) {
						existingModal.hide();
					}

					// Cria nova instância
					const modal = new bootstrap.Modal(modalElement);

					// Configura eventos para quando o modal for fechado
					modalElement.addEventListener('hidden.bs.modal', function() {
						// Remove o backdrop se ainda existir
						const backdrops = document.querySelectorAll('.modal-backdrop');
						backdrops.forEach(backdrop => {
							backdrop.remove();
						});

						// Remove a classe do body
						document.body.classList.remove('modal-open');
						document.body.style.overflow = '';
						document.body.style.paddingRight = '';
					});

					// Mostra o modal
					modal.show();
				}
			})
			.catch(err => {
				console.error('Erro:', err);
				alert('Erro ao carregar detalhes do usuário: ' + err.message);
			});
	}

	// FUNÇÃO AUXILIAR: Fecha modal de detalhes e abre edição
	function fecharModalEDetalhesEAbrirEdicao(userId) {
		const modalDetalhes = document.getElementById('detalhesUsuarioModal');
		if (modalDetalhes) {
			const modalInstance = bootstrap.Modal.getInstance(modalDetalhes);
			if (modalInstance) {
				modalInstance.hide();
			}

			// Aguarda o modal fechar completamente
			setTimeout(() => {
				// Remove qualquer backdrop remanescente
				const backdrops = document.querySelectorAll('.modal-backdrop');
				backdrops.forEach(backdrop => {
					backdrop.remove();
				});

				// Restaura o body
				document.body.classList.remove('modal-open');
				document.body.style.overflow = '';
				document.body.style.paddingRight = '';

				// Agora abre o modal de edição
				abrirModalEditarUsuario(userId);
			}, 300); // Tempo para o modal fechar
		} else {
			// Se não encontrar o modal, abre diretamente
			abrirModalEditarUsuario(userId);
		}
	}

	// Funções para usuários
	function verHierarquia(userId) {
		console.log('Buscando hierarquia para ID:', userId);

		// Primeiro busca os dados do usuário
		fetch(`/api/usuarios/${userId}`)
			.then(response => {
				if (!response.ok) throw new Error(`Erro ${response.status}`);
				return response.json();
			})
			.then(usuario => {
				console.log('Usuário recebido:', usuario);

				// Verifica se temos o ID do pai
				const paiId = usuario.usuarioPaiId || (usuario.usuarioPai ? usuario.usuarioPai.id : null);
				console.log('ID do pai encontrado:', paiId);

				// Busca o pai (se existir) e os filhos em paralelo
				const paiPromise = paiId ? buscarUsuario(paiId) : Promise.resolve(null);
				const filhosPromise = fetch(`/api/usuarios/${userId}/hierarquia`)
					.then(response => {
						if (!response.ok) throw new Error(`Erro ${response.status}`);
						return response.json();
					});

				// Espera ambas as promessas
				return Promise.all([paiPromise, filhosPromise])
					.then(([pai, filhos]) => {
						console.log('Pai encontrado:', pai);
						console.log('Filhos encontrados:', filhos);

						// Agora temos todos os dados, mostra a hierarquia
						mostrarHierarquiaCompleta(usuario, pai, filhos);
					});
			})
			.catch(err => {
				console.error('Erro:', err);
				alert('Erro ao carregar hierarquia: ' + err.message);
			});
	}

	// Função auxiliar para buscar usuário
	function buscarUsuario(userId) {
		return fetch(`/api/usuarios/${userId}`)
			.then(response => {
				if (!response.ok) return null;
				return response.json();
			})
			.catch(() => null); // Ignora erros, retorna null
	}

	// Função para mostrar a hierarquia completa
	// Função para mostrar a hierarquia completa - VERSÃO CORRIGIDA
	function mostrarHierarquiaCompleta(usuario, pai, filhos) {
		const modalTitle = document.getElementById('hierarquiaModalLabel');
		const modalBody = document.getElementById('hierarquiaModalBody');

		if (modalTitle && modalBody) {
			modalTitle.textContent = `Hierarquia de ${usuario.nome}`;

			let html = `
        <div class="hierarchy-container">
            <!-- CABEÇALHO DO USUÁRIO ATUAL -->
            <div class="hierarchy-current-user mb-4">
                <div class="text-center">
                    <i class="bi bi-person-circle fs-1 ${usuario.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
                    <h5 class="mt-2 mb-1">${usuario.nome}</h5>
                    <div>
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
            
            <div class="row g-3">
                <!-- COLUNA ESQUERDA: SUPERIOR -->
                <div class="col-md-6">
                    <div class="card h-100 border-primary">
                        <div class="card-header bg-primary text-white">
                            <i class="bi bi-arrow-up"></i> Superior Imediato
                        </div>
                        <div class="card-body d-flex align-items-center justify-content-center" style="min-height: 200px;">
        `;

			if (pai) {
				html += `
                            <div class="text-center">
                                <i class="bi bi-person-fill fs-3 text-primary mb-2"></i>
                                <h6 class="mb-1">${pai.nome}</h6>
                                <p class="text-muted small mb-1">${pai.email}</p>
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
                            <div class="text-center text-muted">
                                <i class="bi bi-person-x fs-3 mb-2"></i>
                                <p class="mb-1">Nenhum superior</p>
                                <small class="text-muted">Usuário do primeiro nível</small>
                            </div>
            `;
			}

			html += `
                        </div>
                    </div>
                </div>
                
                <!-- COLUNA DIREITA: SUBORDINADOS -->
                <div class="col-md-6">
                    <div class="card h-100 border-success">
                        <div class="card-header bg-success text-white">
                            <i class="bi bi-arrow-down"></i> Subordinados
                            <span class="badge bg-light text-dark ms-2">${filhos ? filhos.length : 0}</span>
                        </div>
                        <div class="card-body" style="max-height: 300px; overflow-y: auto;">
        `;

			if (filhos && filhos.length > 0) {
				html += `<div class="list-group list-group-flush">`;
				filhos.forEach(filho => {
					html += `
                            <div class="list-group-item">
                                <div class="d-flex align-items-center">
                                    <div class="flex-shrink-0">
                                        <i class="bi bi-person-circle ${filho.perfil === 'ADMIN' ? 'text-danger' : 'text-primary'}"></i>
                                    </div>
                                    <div class="flex-grow-1 ms-3">
                                        <h6 class="mb-0">${filho.nome}</h6>
                                        <p class="text-muted small mb-0">${filho.email}</p>
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
				html += `</div>`;
			} else {
				html += `
                            <div class="text-center text-muted py-4">
                                <i class="bi bi-people fs-3"></i>
                                <p class="mt-2 mb-0">Nenhum subordinado</p>
                                <small>Este usuário não tem pessoas subordinadas</small>
                            </div>
            `;
			}

			html += `
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- RESUMO -->
            <div class="mt-4 pt-3 border-top">
                <div class="row text-center">
                    <div class="col-md-4">
                        <div class="text-muted small">Nível</div>
                        <div class="fw-bold">${pai ? '2º Nível' : '1º Nível'}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-muted small">Total na Equipe</div>
                        <div class="fw-bold">${filhos ? filhos.length : 0}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-muted small">Status</div>
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

			// Mostra o modal
			const modal = new bootstrap.Modal(document.getElementById('hierarquiaModal'));
			modal.show();
		} else {
			// Fallback: mostra em alerta
			mostrarAlertaHierarquia(usuario, pai, filhos);
		}
	}

	// Função fallback com alerta
	function mostrarAlertaHierarquia(usuario, pai, filhos) {
		let mensagem = `=== HIERARQUIA ===\n\n`;

		mensagem += `👤 USUÁRIO ATUAL:\n`;
		mensagem += `• ${usuario.nome}\n`;
		mensagem += `• ${usuario.email}\n`;
		mensagem += `• ${usuario.perfil}\n\n`;

		mensagem += `⬆️ SUPERIOR:\n`;
		if (pai) {
			mensagem += `• ${pai.nome}\n`;
			mensagem += `• ${pai.email}\n`;
			mensagem += `• ${pai.perfil}\n`;
		} else {
			mensagem += `• Nenhum (primeiro nível)\n`;
		}

		mensagem += `\n⬇️ SUBORDINADOS:\n`;
		if (filhos && filhos.length > 0) {
			filhos.forEach((filho, i) => {
				mensagem += `${i + 1}. ${filho.nome} - ${filho.email} (${filho.perfil})\n`;
			});
			mensagem += `\nTotal: ${filhos.length}\n`;
		} else {
			mensagem += `• Nenhum\n`;
		}

		alert(mensagem);
	}

	// ============================================
	// FUNÇÕES PARA NOVO USUÁRIO (ADMIN)
	// ============================================

	function abrirModalNovoUsuario() {
		// Cria ou obtém o modal de NOVO usuário
		let modalNovo = document.getElementById('novoUsuarioModal');
		if (!modalNovo) {
			modalNovo = document.createElement('div');
			modalNovo.innerHTML = `
				<div class="modal fade" id="novoUsuarioModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
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
			document.body.appendChild(modalNovo);

			// Adiciona evento ao formulário
			const form = document.getElementById('formNovoUsuario');
			if (form) {
				form.addEventListener('submit', function(e) {
					e.preventDefault();
					cadastrarNovoUsuario();
				});

				// Validação de senha em tempo real
				const senhaInput = document.getElementById('novoUsuarioSenha');
				const confirmarInput = document.getElementById('novoUsuarioConfirmarSenha');
				const senhaError = document.getElementById('senhaError');

				if (senhaInput && confirmarInput && senhaError) {
					confirmarInput.addEventListener('input', function() {
						if (senhaInput.value !== confirmarInput.value) {
							senhaError.classList.remove('d-none');
							confirmarInput.classList.add('is-invalid');
						} else {
							senhaError.classList.add('d-none');
							confirmarInput.classList.remove('is-invalid');
						}
					});
				}
			}

			// Configura evento para quando o modal for fechado
			modalNovo.addEventListener('hidden.bs.modal', function() {
				limparBackdropEModal();
			});
		}

		// Carrega lista de usuários para o campo "Usuário Pai"
		carregarUsuariosParaPaiNovo();

		// Limpa o formulário
		limparFormularioNovoUsuario();

		// Abre o modal
		const modalElement = document.getElementById('novoUsuarioModal');
		if (modalElement) {
			// Remove qualquer instância anterior
			const existingModal = bootstrap.Modal.getInstance(modalElement);
			if (existingModal) {
				existingModal.hide();
			}

			// Cria nova instância
			const modal = new bootstrap.Modal(modalElement);
			modal.show();
		}
	}

	function carregarUsuariosParaPaiNovo() {
		fetch("/api/usuarios/ativos")
			.then(response => response.json())
			.then(usuarios => {
				const selectPai = document.getElementById('novoUsuarioPaiId');
				if (selectPai) {
					// Limpa opções existentes (exceto a primeira)
					while (selectPai.options.length > 1) {
						selectPai.remove(1);
					}

					// Adiciona novos usuários
					usuarios.forEach(usuario => {
						// Não inclui admins na lista de pais (opcional)
						if (usuario.perfil !== 'ADMIN') {
							const option = document.createElement('option');
							option.value = usuario.id;
							option.textContent = `${usuario.nome} (${usuario.email})`;
							selectPai.appendChild(option);
						}
					});

					// Se não houver usuários, mostra mensagem
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
				console.error('Erro ao carregar usuários para pai:', err);
			});
	}

	function limparFormularioNovoUsuario() {
		const nome = document.getElementById('novoUsuarioNome');
		const email = document.getElementById('novoUsuarioEmail');
		const telefone = document.getElementById('novoUsuarioTelefone');
		const perfil = document.getElementById('novoUsuarioPerfil');
		const senha = document.getElementById('novoUsuarioSenha');
		const confirmarSenha = document.getElementById('novoUsuarioConfirmarSenha');
		const paiId = document.getElementById('novoUsuarioPaiId');

		if (nome) nome.value = '';
		if (email) email.value = '';
		if (telefone) telefone.value = '';
		if (perfil) perfil.value = 'USUARIO';
		if (senha) senha.value = '';
		if (confirmarSenha) confirmarSenha.value = '';
		if (paiId) paiId.value = '';

		// Limpa erros de validação
		const senhaError = document.getElementById('senhaError');
		const confirmarInput = document.getElementById('novoUsuarioConfirmarSenha');
		if (senhaError) senhaError.classList.add('d-none');
		if (confirmarInput) confirmarInput.classList.remove('is-invalid');
	}

	function cadastrarNovoUsuario() {
		// Validação de senha
		const senha = document.getElementById('novoUsuarioSenha').value;
		const confirmarSenha = document.getElementById('novoUsuarioConfirmarSenha').value;

		if (senha !== confirmarSenha) {
			alert('As senhas não coincidem!');
			return;
		}

		if (senha.length < 6) {
			alert('A senha deve ter pelo menos 6 caracteres!');
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

		// Validação básica
		if (!dados.nome || !dados.email) {
			alert('Nome e email são obrigatórios!');
			return;
		}

		// Mostra loading
		const submitBtn = document.querySelector('#formNovoUsuario button[type="submit"]');
		const originalText = submitBtn.innerHTML;
		submitBtn.disabled = true;
		submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Cadastrando...';

		fetch("/api/usuarios", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dados)
		})
			.then(response => {
				if (!response.ok) {
					return response.json().then(err => {
						throw new Error(err.message || 'Erro ao cadastrar usuário');
					});
				}
				return response.json();
			})
			.then(() => {
				alert('Usuário cadastrado com sucesso!');

				// Fecha o modal
				const modalElement = document.getElementById('novoUsuarioModal');
				if (modalElement) {
					const modal = bootstrap.Modal.getInstance(modalElement);
					if (modal) modal.hide();
				}

				// Recarrega a lista de usuários
				loadUsuariosData();

				// Limpa o formulário
				limparFormularioNovoUsuario();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			})
			.finally(() => {
				// Restaura botão
				submitBtn.disabled = false;
				submitBtn.innerHTML = originalText;
			});
	}

	// ============================================
	// FUNÇÕES CRUD PARA USUÁRIOS (EDIÇÃO/EXCLUSÃO)
	// ============================================

	function abrirModalEditarUsuario(userId) {
		fetch(`/api/usuarios/${userId}`)
			.then(response => response.json())
			.then(usuario => {
				// Cria ou atualiza o modal de edição
				let modalEditar = document.getElementById('editarUsuarioModal');
				if (!modalEditar) {
					modalEditar = document.createElement('div');
					modalEditar.innerHTML = `
					<div class="modal fade" id="editarUsuarioModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
						<div class="modal-dialog modal-lg">
							<div class="modal-content">
								<div class="modal-header">
									<h5 class="modal-title">Editar Usuário</h5>
									<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
								</div>
								<div class="modal-body">
									<form id="formEditarUsuario">
										<input type="hidden" id="editarUsuarioId">
										<div class="row">
											<div class="col-md-6 mb-3">
												<label class="form-label">Nome *</label>
												<input type="text" class="form-control" id="editarUsuarioNome" required>
											</div>
											<div class="col-md-6 mb-3">
												<label class="form-label">Email *</label>
												<input type="email" class="form-control" id="editarUsuarioEmail" required>
											</div>
										</div>
										<div class="row">
											<div class="col-md-6 mb-3">
												<label class="form-label">Telefone</label>
												<input type="text" class="form-control" id="editarUsuarioTelefone" 
													   placeholder="(11)99999-9999">
											</div>
											<div class="col-md-6 mb-3">
												<label class="form-label">Perfil *</label>
												<select class="form-select" id="editarUsuarioPerfil" required>
													<option value="USUARIO">USUÁRIO</option>
													<option value="ADMIN">ADMINISTRADOR</option>
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
										<div class="d-grid gap-2">
											<button type="submit" class="btn btn-primary">
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
					document.body.appendChild(modalEditar);

					// Adiciona evento ao formulário
					const form = document.getElementById('formEditarUsuario');
					if (form) {
						form.addEventListener('submit', function(e) {
							e.preventDefault();
							salvarEdicaoUsuario();
						});
					}

					// Configura evento para quando o modal for fechado
					modalEditar.addEventListener('hidden.bs.modal', function() {
						limparBackdropEModal();
					});
				}

				// Preenche os campos do formulário
				document.getElementById('editarUsuarioId').value = usuario.id;
				document.getElementById('editarUsuarioNome').value = usuario.nome || '';
				document.getElementById('editarUsuarioEmail').value = usuario.email || '';
				document.getElementById('editarUsuarioTelefone').value = usuario.telefone || '';
				document.getElementById('editarUsuarioPerfil').value = usuario.perfil || 'USUARIO';

				// Carrega usuários para o campo pai
				carregarUsuariosParaPaiEdicao(usuario.id);

				// Abre o modal
				const modalElement = document.getElementById('editarUsuarioModal');
				if (modalElement) {
					// Remove qualquer instância anterior
					const existingModal = bootstrap.Modal.getInstance(modalElement);
					if (existingModal) {
						existingModal.hide();
					}

					// Cria nova instância
					const modal = new bootstrap.Modal(modalElement);
					modal.show();
				}
			})
			.catch(err => {
				console.error('Erro ao carregar usuário para edição:', err);
				alert('Erro ao carregar dados do usuário: ' + err.message);
			});
	}

	function carregarUsuariosParaPaiEdicao(usuarioAtualId) {
		fetch("/api/usuarios/ativos")
			.then(response => response.json())
			.then(usuarios => {
				const selectPai = document.getElementById('editarUsuarioPaiId');
				if (selectPai) {
					// Limpa opções existentes (exceto a primeira)
					while (selectPai.options.length > 1) {
						selectPai.remove(1);
					}

					// Adiciona novos usuários
					usuarios.forEach(usuario => {
						// Não inclui o próprio usuário na lista de pais
						if (usuario.id != usuarioAtualId) {
							const option = document.createElement('option');
							option.value = usuario.id;
							option.textContent = `${usuario.nome} (${usuario.email})`;

							// Marca como selecionado se for o pai atual
							const paiAtual = document.getElementById('editarUsuarioPaiId').dataset.paiAtual;
							if (paiAtual && usuario.id == paiAtual) {
								option.selected = true;
							}

							selectPai.appendChild(option);
						}
					});

					// Se não houver usuários, mostra mensagem
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
				console.error('Erro ao carregar usuários para pai (edição):', err);
			});
	}

	function salvarEdicaoUsuario() {
		const dados = {
			id: document.getElementById('editarUsuarioId').value,
			nome: document.getElementById('editarUsuarioNome').value.trim(),
			email: document.getElementById('editarUsuarioEmail').value.trim(),
			telefone: document.getElementById('editarUsuarioTelefone').value.trim() || null,
			perfil: document.getElementById('editarUsuarioPerfil').value,
			usuarioPaiId: document.getElementById('editarUsuarioPaiId').value || null
		};

		// Validação básica
		if (!dados.nome || !dados.email) {
			alert('Nome e email são obrigatórios!');
			return;
		}

		// Mostra loading
		const submitBtn = document.querySelector('#formEditarUsuario button[type="submit"]');
		const originalText = submitBtn.innerHTML;
		submitBtn.disabled = true;
		submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';

		fetch(`/api/usuarios/${dados.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dados)
		})
			.then(response => {
				if (!response.ok) {
					return response.json().then(err => {
						throw new Error(err.message || 'Erro ao atualizar usuário');
					});
				}
				return response.json();
			})
			.then(() => {
				alert('Usuário atualizado com sucesso!');

				// Fecha o modal
				const modalElement = document.getElementById('editarUsuarioModal');
				if (modalElement) {
					const modal = bootstrap.Modal.getInstance(modalElement);
					if (modal) modal.hide();
				}

				// Recarrega a lista de usuários
				loadUsuariosData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			})
			.finally(() => {
				// Restaura botão
				submitBtn.disabled = false;
				submitBtn.innerHTML = originalText;
			});
	}

	function desativarUsuario(userId) {
		if (!confirm('Tem certeza que deseja DESATIVAR este usuário?\n\nO usuário não poderá mais fazer login no sistema.')) {
			return;
		}

		fetch(`/api/usuarios/${userId}/desativar`, {
			method: 'PATCH'
		})
			.then(response => {
				if (!response.ok) throw new Error('Erro ao desativar usuário');
				loadUsuariosData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			});
	}

	function reativarUsuario(userId) {
		if (!confirm('Tem certeza que deseja REATIVAR este usuário?\n\nO usuário voltará a ter acesso ao sistema.')) {
			return;
		}

		fetch(`/api/usuarios/${userId}/reativar`, {
			method: 'PATCH'
		})
			.then(response => {
				if (!response.ok) throw new Error('Erro ao reativar usuário');
				loadUsuariosData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			});
	}

	function excluirUsuario(userId) {
		if (!confirm('⚠️ ATENÇÃO: Esta ação é irreversível!\n\nTem certeza que deseja EXCLUIR permanentemente este usuário?\n\nTodas as informações associadas serão perdidas.')) {
			return;
		}

		fetch(`/api/usuarios/${userId}`, {
			method: 'DELETE'
		})
			.then(response => {
				if (!response.ok) {
					return response.text().then(text => {
						throw new Error(text || 'Erro ao excluir usuário');
					});
				}
				alert('Usuário excluído com sucesso!');
				loadUsuariosData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			});
	}

	// ============================================
	// FUNÇÕES AUXILIARES
	// ============================================

	function logout() {
		if (confirm('Deseja realmente sair?')) {
			localStorage.removeItem('token');
			window.location.href = '/auth/login';
		}
	}

	function limparBackdropEModal() {
		// Remove todos os backdrops
		const backdrops = document.querySelectorAll('.modal-backdrop');
		backdrops.forEach(backdrop => {
			backdrop.remove();
		});

		// Remove a classe modal-open do body
		document.body.classList.remove('modal-open');

		// Restaura o overflow e padding
		document.body.style.overflow = '';
		document.body.style.paddingRight = '';
	}

	function gerarRelatorioUsuarios() {
		fetch("/api/usuarios")
			.then(response => response.json())
			.then(usuarios => {

				// BOM UTF-8 (OBRIGATÓRIO para Excel reconhecer acentos)
				const BOM = '\uFEFF';

				// CSV usando ; (padrão pt-BR)
				let csv = BOM + 'Nome;Email;Telefone;Perfil;Status;Data de Criação\r\n';

				usuarios.forEach(usuario => {
					const nome = (usuario.nome || '').replace(/"/g, '""');
					const email = (usuario.email || '').replace(/"/g, '""');
					const telefone = (usuario.telefone || '').replace(/"/g, '""');
					const perfil = (usuario.perfil || '').replace(/"/g, '""');
					const status = usuario.ativo ? 'Ativo' : 'Inativo';
					const dataCriacao = formatDate(usuario.dataCriacao);

					csv += `"${nome}";"${email}";"${telefone}";"${perfil}";"${status}";"${dataCriacao}"\r\n`;
				});

				// Criação do arquivo com charset correto
				const blob = new Blob([csv], {
					type: 'text/csv;charset=utf-8;'
				});

				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;

				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				alert('Relatório gerado com sucesso!');
			})
			.catch(err => {
				console.error('Erro ao gerar relatório:', err);
				alert('Erro ao gerar relatório: ' + err.message);
			});
	}

	// ============================================
	// EXPORTA FUNÇÕES PARA O ESCOPO GLOBAL (para uso nos botões onclick)
	// ============================================

	window.abrirModalNovoUsuario = abrirModalNovoUsuario;
	window.loadPage = loadPage;
	window.gerarRelatorioUsuarios = gerarRelatorioUsuarios;

	// ============================================
	// FUNÇÃO DE TESTE PARA DEPURAÇÃO
	// ============================================

	function testarConexao() {
		console.log('Testando conexão...');
		fetch("/api/usuarios")
			.then(response => console.log('Status:', response.status))
			.catch(err => console.error('Erro:', err));
	}

	// Executa teste de conexão ao carregar (opcional)
	// setTimeout(testarConexao, 1000);
});