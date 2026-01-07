// busca.js - Lógica principal da página de busca

(function() {
	'use strict';

	// Variáveis globais
	let dataTable = null;
	let isLoading = false;

	/**
	 * Inicializa a página de busca avançada
	 */
	function initBuscaAvancada() {
		console.log('🚀 [Busca] Inicializando busca avançada...');

		try {
			// 1. Inicializa DataTable
			inicializarDataTable();

			// 2. Configura eventos
			configurarEventos();

			// 3. Verifica permissões
			verificarPermissoes();

			// 4. Aplica estilos iniciais
			aplicarEstilosIniciais();

			console.log('✅ [Busca] Busca avançada inicializada com sucesso');

		} catch (error) {
			console.error('❌ [Busca] Erro ao inicializar:', error);
			mostrarNotificacao('Erro ao inicializar busca avançada', 'error');
		}
	}

	/**
	 * Inicializa a DataTable
	 */
	function inicializarDataTable() {
		// 1. Busca o token para enviar no Header e para validar permissões
		const token = localStorage.getItem('token');

		// 2. Lógica interna para verificar se o usuário logado é ADMIN
		let usuarioLogadoIsAdmin = false;
		try {
			if (token) {
				const payload = JSON.parse(atob(token.split('.')[1]));
				usuarioLogadoIsAdmin = (payload.role === 'ADMIN' || payload.perfil === 'ADMIN');
			}
		} catch (e) {
			console.error("Erro ao decodificar permissões do token", e);
		}

		dataTable = $('#tabelaUsuarios').DataTable({
			ajax: {
				url: '/api/usuarios',
				dataSrc: '',
				headers: {
					'Authorization': token ? `Bearer ${token}` : ''
				},
				// Esta função envia TODOS os parâmetros para o backend
				data: function(d) {
					const filtros = {};

					// Nome
					const nome = $('#filtroNome').val();
					if (nome && nome.trim() !== '') {
						filtros.nome = nome;
					}

					// Email
					const email = $('#filtroEmail').val();
					if (email && email.trim() !== '') {
						filtros.email = email;
					}

					// Perfil
					const perfil = $('#filtroPerfil').val();
					if (perfil && perfil.trim() !== '') {
						filtros.perfil = perfil;
					}

					// Status/Ativo
					const status = $('#filtroStatus').val();
					if (status === "true" || status === "false") {
						filtros.ativo = (status === "true");
					}

					// Data Início (formato yyyy-MM-dd)
					const dataInicio = $('#filtroDataInicio').val();
					if (dataInicio && dataInicio.trim() !== '') {
						// Formata para o padrão que o backend espera
						filtros.dataInicio = dataInicio;
					}

					// Data Fim (formato yyyy-MM-dd)
					const dataFim = $('#filtroDataFim').val();
					if (dataFim && dataFim.trim() !== '') {
						filtros.dataFim = dataFim;
					}

					console.log('🔍 [Busca] Enviando filtros para backend:', filtros);
					return filtros;
				},
				error: handleDataTableError,
				complete: function() {
					if (typeof esconderLoading === 'function') esconderLoading();
				}
			},
			columns: [
				{
					data: null,
					render: function(data) {
						const iniciais = data.nome ?
							data.nome.split(' ')
								.map(n => n[0])
								.join('')
								.toUpperCase()
								.slice(0, 2) : '??';

						return `
                        <div class="avatar-circle" title="${data.nome || 'Usuário'}">
                            ${iniciais}
                        </div>
                    `;
					}
				},
				{
					data: 'nome',
					render: function(data) {
						return `<strong>${data || 'Sem nome'}</strong>`;
					}
				},
				{
					data: 'email',
					render: function(data) {
						return `<a href="mailto:${data}" class="text-decoration-none">${data || 'Não informado'}</a>`;
					}
				},
				{
					data: 'perfil',
					render: function(data) {
						const badgeClass = data === 'ADMIN' ? 'badge-admin' : 'badge-user';
						const icon = data === 'ADMIN' ? 'fa-crown' : 'fa-user';
						return `
                        <span class="badge ${badgeClass}">
                            <i class="fas ${icon}"></i>
                            ${data}
                        </span>
                    `;
					}
				},
				{
					data: 'ativo',
					render: function(data) {
						const statusClass = data ? 'status-active' : 'status-inactive';
						const statusText = data ? 'Ativo' : 'Inativo';
						const icon = data ? 'fa-check' : 'fa-times';
						return `
                        <span class="status ${statusClass}">
                            <i class="fas ${icon}"></i>
                            ${statusText}
                        </span>
                    `;
					}
				},
				{
					data: 'dataCriacao',
					render: function(data) {
						if (!data) return '-';
						const date = new Date(data);
						const options = {
							day: '2-digit', month: '2-digit', year: 'numeric',
							hour: '2-digit', minute: '2-digit'
						};
						return date.toLocaleDateString('pt-BR', options);
					}
				},
				{
					data: null,
					render: function(data) {
						const isAdminNaLinha = data.perfil === 'ADMIN';

						return `
                        <div class="table-actions">
                            <button class="action-btn view" 
                                    title="Ver Detalhes" 
                                    data-id="${data.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn ${data.ativo ? 'delete' : 'edit'}" 
                                    title="${data.ativo ? 'Desativar' : 'Reativar'}" 
                                    data-id="${data.id}" 
                                    data-ativo="${data.ativo}"
                                    ${!usuarioLogadoIsAdmin ? 'disabled' : ''}>
                                <i class="fas ${data.ativo ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            </button>
                        </div>
                    `;
					}
				}
			],
			language: {
				url: 'https://cdn.datatables.net/plug-ins/1.13.4/i18n/pt-BR.json'
			},
			pageLength: 10,
			lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Todos"]],
			responsive: true,
			order: [[1, 'asc']],
			dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>><"row"<"col-sm-12"tr>><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
			initComplete: function() {
				if (typeof atualizarContadorResultados === 'function') {
					atualizarContadorResultados();
				}
				atualizarTagsFiltro(); // Atualiza tags inicialmente
			},
			drawCallback: function() {
				if (typeof atualizarContadorResultados === 'function') {
					atualizarContadorResultados();
				}
			}
		});
	}

	/**
	 * Configura todos os eventos da página
	 */
	function configurarEventos() {
		// Eventos de filtro - agora recarregam os dados do backend
		$('#filtroNome').on('input', debounce(function() {
			atualizarTagsFiltro();
			recarregarDadosComDelay();
		}, 500));

		$('#filtroEmail').on('input', debounce(function() {
			atualizarTagsFiltro();
			recarregarDadosComDelay();
		}, 500));

		$('#filtroPerfil').on('change', function() {
			atualizarTagsFiltro();
			recarregarDados();
		});

		$('#filtroStatus').on('change', function() {
			atualizarTagsFiltro();
			recarregarDados();
		});

		$('#filtroDataInicio, #filtroDataFim').on('change', function() {
			atualizarTagsFiltro();
			recarregarDados();
		});

		// Eventos dos botões
		$('#btnAplicarFiltros').on('click', function() {
			recarregarDados();
			mostrarNotificacao('Filtros aplicados com sucesso', 'success');
		});

		$('#btnLimpar').on('click', limparFiltros);
		$('#btnRecarregar').on('click', recarregarDados);

		// Eventos de ações na tabela
		$(document).on('click', '.action-btn.view', function() {
			if (!$(this).is(':disabled')) {
				const id = $(this).data('id');
				carregarDetalhesUsuario(id);
			}
		});

		$(document).on('click', '.action-btn.edit, .action-btn.delete', function() {
			if (!$(this).is(':disabled')) {
				const id = $(this).data('id');
				const ativo = $(this).data('ativo');
				toggleStatusUsuario(id, ativo);
			}
		});

		// Evento para remover tags de filtro
		$(document).on('click', '.tag-remove', function() {
			const filtro = $(this).data('filtro');
			removerFiltro(filtro);
		});

		// Eventos do modal
		$('#modalDetalhes').on('click', function(e) {
			if (e.target === this) {
				fecharModal();
			}
		});

		// Atalhos de teclado
		$(document).on('keydown', function(e) {
			// ESC fecha modal
			if (e.key === 'Escape' && $('#modalDetalhes').hasClass('active')) {
				fecharModal();
			}

			// Ctrl + F foca no primeiro filtro
			if (e.ctrlKey && e.key === 'f') {
				e.preventDefault();
				$('#filtroNome').focus();
			}
		});
	}

	/**
	 * Remove um filtro específico
	 */
	function removerFiltro(tipo) {
		// Limpa o campo correspondente
		switch (tipo) {
			case 'nome':
				$('#filtroNome').val('');
				break;
			case 'email':
				$('#filtroEmail').val('');
				break;
			case 'perfil':
				$('#filtroPerfil').val('');
				break;
			case 'status':
				$('#filtroStatus').val('');
				break;
			case 'dataInicio':
				$('#filtroDataInicio').val('');
				break;
			case 'dataFim':
				$('#filtroDataFim').val('');
				break;
		}

		atualizarTagsFiltro();
		recarregarDados();
	}

	/**
	 * Limpa todos os filtros
	 */
	function limparFiltros() {
		// Limpa campos
		$('#filtroNome, #filtroEmail, #filtroDataInicio, #filtroDataFim').val('');
		$('#filtroPerfil, #filtroStatus').val('');

		// Atualiza interface
		atualizarTagsFiltro();

		// Recarrega dados sem filtros
		recarregarDados();

		mostrarNotificacao('Filtros limpos com sucesso', 'info');
	}

	/**
	 * Atualiza as tags de filtro na interface
	 */
	function atualizarTagsFiltro() {
		const container = $('#filterTags');
		const countEl = $('#filterCount');

		container.empty();

		let count = 0;

		// Pega valores direto dos campos
		const filtros = {
			nome: $('#filtroNome').val(),
			email: $('#filtroEmail').val(),
			perfil: $('#filtroPerfil').val(),
			status: $('#filtroStatus').val(),
			dataInicio: $('#filtroDataInicio').val(),
			dataFim: $('#filtroDataFim').val()
		};

		// Filtro de Nome
		if (filtros.nome && filtros.nome.trim() !== '') {
			container.append(`
				<div class="filter-tag">
					<i class="fas fa-user"></i>
					<span>Nome: ${filtros.nome}</span>
					<i class="fas fa-times tag-remove" data-filtro="nome"></i>
				</div>
			`);
			count++;
		}

		// Filtro de Email
		if (filtros.email && filtros.email.trim() !== '') {
			container.append(`
				<div class="filter-tag">
					<i class="fas fa-envelope"></i>
					<span>Email: ${filtros.email}</span>
					<i class="fas fa-times tag-remove" data-filtro="email"></i>
				</div>
			`);
			count++;
		}

		// Filtro de Perfil
		if (filtros.perfil && filtros.perfil.trim() !== '') {
			const textoPerfil = filtros.perfil === 'ADMIN' ? 'Administrador' : 'Usuário';
			container.append(`
				<div class="filter-tag">
					<i class="fas fa-user-tag"></i>
					<span>Perfil: ${textoPerfil}</span>
					<i class="fas fa-times tag-remove" data-filtro="perfil"></i>
				</div>
			`);
			count++;
		}

		// Filtro de Status
		if (filtros.status && filtros.status.trim() !== '') {
			const textoStatus = filtros.status === 'true' ? 'Ativo' : 'Inativo';
			container.append(`
				<div class="filter-tag">
					<i class="fas fa-circle"></i>
					<span>Status: ${textoStatus}</span>
					<i class="fas fa-times tag-remove" data-filtro="status"></i>
				</div>
			`);
			count++;
		}

		// Filtro de Data
		if (filtros.dataInicio || filtros.dataFim) {
			if (filtros.dataInicio && filtros.dataFim) {
				const dataInicioFormatada = formatarData(filtros.dataInicio);
				const dataFimFormatada = formatarData(filtros.dataFim);
				container.append(`
					<div class="filter-tag">
						<i class="fas fa-calendar"></i>
						<span>Data: ${dataInicioFormatada} a ${dataFimFormatada}</span>
						<i class="fas fa-times tag-remove" data-filtro="dataInicio"></i>
					</div>
				`);
			} else if (filtros.dataInicio) {
				container.append(`
					<div class="filter-tag">
						<i class="fas fa-calendar"></i>
						<span>Data a partir de: ${formatarData(filtros.dataInicio)}</span>
						<i class="fas fa-times tag-remove" data-filtro="dataInicio"></i>
					</div>
				`);
			} else if (filtros.dataFim) {
				container.append(`
					<div class="filter-tag">
						<i class="fas fa-calendar"></i>
						<span>Data até: ${formatarData(filtros.dataFim)}</span>
						<i class="fas fa-times tag-remove" data-filtro="dataFim"></i>
					</div>
				`);
			}
			count++;
		}

		countEl.text(`${count} filtro${count !== 1 ? 's' : ''} ativo${count !== 1 ? 's' : ''}`);
	}

	/**
	 * Recarrega os dados da tabela com delay (para inputs)
	 */
	function recarregarDadosComDelay() {
		if (dataTable) {
			clearTimeout(window.recarregarTimeout);
			window.recarregarTimeout = setTimeout(function() {
				dataTable.ajax.reload();
			}, 300);
		}
	}

	/**
	 * Recarrega os dados da tabela
	 */
	function recarregarDados() {
		if (dataTable) {
			dataTable.ajax.reload();
		}
	}

	/**
	 * Atualiza o contador de resultados
	 */
	function atualizarContadorResultados() {
		if (!dataTable) return;

		const total = dataTable.page.info().recordsDisplay;
		const element = $('#totalResults');

		if (element.length) {
			element.html(`<strong>${total}</strong> usuário${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`);
		}
	}

	/**
	 * Carrega detalhes de um usuário
	 */
	async function carregarDetalhesUsuario(id) {
		if (!id) return;

		mostrarLoading();

		try {
			const response = await fetch(`/api/usuarios/${id}`);

			if (response.ok) {
				const usuario = await response.json();
				mostrarModalDetalhes(usuario);
			} else {
				throw new Error('Usuário não encontrado');
			}
		} catch (error) {
			console.error('❌ [Busca] Erro ao carregar detalhes:', error);
			mostrarNotificacao('Erro ao carregar detalhes do usuário', 'error');
		} finally {
			esconderLoading();
		}
	}

	/**
	 * Mostra modal com detalhes do usuário
	 */
	/**
 * Mostra modal com detalhes do usuário usando Bootstrap
 */
	function mostrarModalDetalhes(usuario) {
		const grid = $('#userDetailsGrid');

		// Limpa conteúdo anterior
		grid.empty();

		const detalhes = [
			{
				label: 'Nome Completo',
				value: usuario.nome || 'Não informado',
				icon: 'user',
				colClass: 'col-md-12'
			},
			{
				label: 'Email',
				value: usuario.email || 'Não informado',
				icon: 'envelope',
				colClass: 'col-md-6'
			},
			{
				label: 'Telefone',
				value: usuario.telefone || 'Não informado',
				icon: 'phone',
				colClass: 'col-md-6'
			},
			{
				label: 'Perfil',
				value: usuario.perfil || 'Não informado',
				icon: 'user-tag',
				colClass: 'col-md-6'
			},
			{
				label: 'Status',
				value: usuario.ativo ?
					'<span class="badge bg-success">Ativo</span>' :
					'<span class="badge bg-danger">Inativo</span>',
				icon: 'circle',
				colClass: 'col-md-6'
			},
			{
				label: 'Data de Cadastro',
				value: usuario.dataCriacao ?
					formatarDataHora(usuario.dataCriacao) : 'Não informado',
				icon: 'calendar-plus',
				colClass: 'col-md-6'
			},
			{
				label: 'Última Atualização',
				value: usuario.dataAtualizacao ?
					formatarDataHora(usuario.dataAtualizacao) : 'Não informado',
				icon: 'calendar-check',
				colClass: 'col-md-6'
			}
		];

		// Cria as linhas com os detalhes
		detalhes.forEach((detalhe) => {
			grid.append(`
            <div class="${detalhe.colClass} mb-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <div class="icon-circle bg-primary me-3">
                                <i class="fas fa-${detalhe.icon} text-white"></i>
                            </div>
                            <h6 class="card-title mb-0 text-muted">${detalhe.label}</h6>
                        </div>
                        <p class="card-text fs-5 fw-semibold">${detalhe.value}</p>
                    </div>
                </div>
            </div>
        `);
		});

		// Atualiza o título do modal
		$('#modalDetalhesLabel').html(`
        <i class="fas fa-user-circle me-2"></i>
        ${usuario.nome || 'Detalhes do Usuário'}
    `);

		// Mostra o modal usando Bootstrap
		const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
		modal.show();
	}

	/**
	 * Alterna status de um usuário
	 */
	async function toggleStatusUsuario(id, ativoAtual) {
		if (!id) return;

		const confirmacao = confirm(
			`Deseja realmente ${ativoAtual ? 'desativar' : 'reativar'} este usuário?`
		);

		if (!confirmacao) return;

		mostrarLoading();

		try {
			const endpoint = `/api/usuarios/${id}/${ativoAtual ? 'desativar' : 'reativar'}`;
			const response = await fetch(endpoint, { method: 'PATCH' });

			if (response.ok) {
				dataTable.ajax.reload();
				mostrarNotificacao(
					`Usuário ${ativoAtual ? 'desativado' : 'reativado'} com sucesso!`,
					'success'
				);
			} else {
				throw new Error('Erro ao atualizar usuário');
			}
		} catch (error) {
			console.error('❌ [Busca] Erro ao atualizar status:', error);
			mostrarNotificacao('Erro ao atualizar usuário', 'error');
		} finally {
			esconderLoading();
		}
	}

	/**
	 * Verifica permissões do usuário
	 */
	function verificarPermissoes() {
		const isAdmin = window.isAdmin ? window.isAdmin() : false;

		if (!isAdmin) {
			$('.btn-success').prop('disabled', true)
				.attr('title', 'Apenas administradores podem criar usuários');
		}
	}

	/**
	 * Aplica estilos iniciais
	 */
	function aplicarEstilosIniciais() {
		setTimeout(() => {
			$('.main-card').addClass('loaded');
		}, 100);
	}

	/**
	 * Funções auxiliares
	 */
	function mostrarLoading() {
		if (!isLoading) {
			isLoading = true;
			$('#loadingOverlay').addClass('active');
		}
	}

	function esconderLoading() {
		isLoading = false;
		$('#loadingOverlay').removeClass('active');
	}

	function mostrarNotificacao(mensagem, tipo = 'info') {
		const tipos = {
			success: { class: 'alert-success', icon: 'check-circle' },
			error: { class: 'alert-danger', icon: 'exclamation-circle' },
			info: { class: 'alert-info', icon: 'info-circle' },
			warning: { class: 'alert-warning', icon: 'exclamation-triangle' }
		};

		const config = tipos[tipo] || tipos.info;

		$('.alert-notification').remove();

		const notificacao = $(`
            <div class="alert ${config.class} alert-notification alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 1000; min-width: 300px;">
                <i class="fas fa-${config.icon} me-2"></i>
                ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

		$('body').append(notificacao);

		setTimeout(() => {
			notificacao.alert('close');
		}, 5000);
	}

	function formatarData(dataString) {
		if (!dataString) return '';
		// Se já for uma data no formato yyyy-MM-dd
		if (dataString.includes('-')) {
			const [ano, mes, dia] = dataString.split('-');
			return `${dia}/${mes}/${ano}`;
		}
		return new Date(dataString).toLocaleDateString('pt-BR');
	}

	function formatarDataHora(dataString) {
		if (!dataString) return '';
		return new Date(dataString).toLocaleString('pt-BR');
	}

	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	function handleDataTableError(xhr, error, thrown) {
		console.error('❌ [Busca] Erro no DataTable:', error, thrown);

		if (xhr.status === 401) {
			mostrarNotificacao('Sessão expirada. Redirecionando...', 'error');
			setTimeout(() => {
				window.location.href = '/admin/dashboard';
			}, 2000);
		} else {
			mostrarNotificacao('Erro ao carregar dados dos usuários', 'error');
		}
	}

	// Fechar modal (função global)
	window.fecharModal = function() {
		$('#modalDetalhes').removeClass('active');
		$('body').css('overflow', 'auto');
	};

	// Exportar para uso global
	window.initBuscaAvancada = initBuscaAvancada;

	console.log('✅ [Busca] Módulo de busca carregado');

})();