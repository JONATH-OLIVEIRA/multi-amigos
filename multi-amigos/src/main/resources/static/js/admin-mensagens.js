/**
 * ADMIN MENSAGENS - Gerenciamento de Mensagens do Sistema
 * Arquivo separado para isolamento das funcionalidades
 */

class MensagensManager {
	constructor() {
		this.token = localStorage.getItem('token');
		this.initialize();
	}

	initialize() {
		console.log('📝 MensagensManager inicializado');
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Formulário de criação de mensagem
		const formMensagem = document.getElementById('formMensagem');
		if (formMensagem) {
			formMensagem.addEventListener('submit', (e) => this.criarMensagem(e));
		}

		// Formulário de edição de mensagem
		const formEditarMensagem = document.getElementById('formEditarMensagem');
		if (formEditarMensagem) {
			formEditarMensagem.addEventListener('submit', (e) => this.salvarEdicaoMensagem(e));
		}
	}

	// ============================================
	// FUNÇÕES PARA MENSAGENS (ISOLADAS)
	// ============================================

	criarMensagem(e) {
		if (e) e.preventDefault();

		const titulo = document.getElementById('tituloMensagem').value;
		const conteudo = document.getElementById('conteudoMensagem').value;
		const tipo = document.getElementById('tipoMensagem').value;
		const diasValidade = document.getElementById('diasValidade').value;

		const mensagemData = {
			titulo: titulo,
			conteudo: conteudo,
			tipo: tipo.toUpperCase(),
			diasValidade: diasValidade ? parseInt(diasValidade) : null
		};

		// VALIDAÇÕES
		if (!titulo || !conteudo || !tipo) {
			alert('Preencha todos os campos obrigatórios!');
			return;
		}

		const tiposValidos = ['IMPORTANTE', 'INFORMATIVO', 'URGENTE'];
		if (!tiposValidos.includes(tipo.toUpperCase())) {
			alert('Tipo inválido! Use: IMPORTANTE, INFORMATIVO ou URGENTE');
			return;
		}

		// Mostra loading no botão
		const submitBtn = e ? e.target.querySelector('button[type="submit"]') : null;
		const originalText = submitBtn ? submitBtn.innerHTML : '';
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Criando...';
		}

		fetch('/api/mensagens', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.token}`
			},
			body: JSON.stringify(mensagemData)
		})
			.then(response => {
				if (response.status === 403) {
					throw new Error('Apenas administradores podem criar mensagens');
				}
				if (!response.ok) {
					return response.json().then(err => {
						throw new Error(err.message || 'Erro ao criar mensagem');
					});
				}
				return response.json();
			})
			.then(data => {
				alert('Mensagem criada com sucesso!');
				
				// Limpa o formulário
				const form = document.getElementById('formMensagem');
				if (form) form.reset();

				// Fecha o modal corretamente
				this.fecharModal('mensagemModal');

				// Recarrega as mensagens
				this.loadMensagensData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			})
			.finally(() => {
				// Restaura botão
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.innerHTML = originalText;
				}
			});
	}

	// Função auxiliar para fechar modal
	fecharModal(modalId) {
		const modalElement = document.getElementById(modalId);
		if (modalElement) {
			const modal = bootstrap.Modal.getInstance(modalElement);
			if (modal) {
				modal.hide();
				
				// Limpa backdrop após um tempo
				setTimeout(() => {
					const backdrops = document.querySelectorAll('.modal-backdrop');
					backdrops.forEach(backdrop => backdrop.remove());
					document.body.classList.remove('modal-open');
					document.body.style.overflow = '';
					document.body.style.paddingRight = '';
				}, 100);
			}
		}
	}

	// Função para abrir modal de nova mensagem
	abrirModalNovaMensagem() {
		// Fecha modais abertos
		const modaisAbertos = document.querySelectorAll('.modal.show');
		modaisAbertos.forEach(modal => {
			const bsModal = bootstrap.Modal.getInstance(modal);
			if (bsModal) bsModal.hide();
		});

		// Limpa o formulário após um tempo
		setTimeout(() => {
			const form = document.getElementById('formMensagem');
			if (form) {
				form.reset();
			}

			// Abre o modal
			const modalElement = document.getElementById('mensagemModal');
			if (modalElement) {
				// Remove instância existente
				const existingModal = bootstrap.Modal.getInstance(modalElement);
				if (existingModal) existingModal.dispose();
				
				// Cria nova instância
				const modal = new bootstrap.Modal(modalElement, {
					backdrop: 'static',
					keyboard: false
				});
				modal.show();
			}
		}, 100);
	}

	editarMensagem(id) {
		fetch(`/api/mensagens/${id}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${this.token}`
			}
		})
			.then(response => {
				if (!response.ok) {
					// fallback: tenta buscar da lista já carregada no front-end
					return this.buscarMensagemDaListaGeral(id);
				}
				return response.json();
			})
			.then(mensagem => {
				if (!mensagem) {
					throw new Error('Mensagem não encontrada');
				}

				// Preenche o modal com os dados da mensagem
				this.abrirModalEditarMensagem(mensagem);
			})
			.catch(err => {
				console.error('Erro ao buscar mensagem:', err);
				alert('Erro ao carregar mensagem para edição: ' + err.message);
			});
	}

	// Função auxiliar para buscar mensagem da lista geral
	buscarMensagemDaListaGeral(id) {
		return fetch("/api/mensagens/todas", {
			headers: {
				'Authorization': `Bearer ${this.token}`
			}
		})
			.then(response => {
				if (!response.ok) throw new Error('Erro ao buscar mensagens');
				return response.json();
			})
			.then(mensagens => {
				const mensagem = mensagens.find(m => m.id == id);
				if (mensagem) {
					return mensagem;
				} else {
					throw new Error('Mensagem não encontrada');
				}
			});
	}

	abrirModalEditarMensagem(mensagem) {
		// Fecha qualquer modal aberto primeiro
		const modaisAbertos = document.querySelectorAll('.modal.show');
		modaisAbertos.forEach(modal => {
			const bsModal = bootstrap.Modal.getInstance(modal);
			if (bsModal) {
				bsModal.hide();
			}
		});

		// Aguarda um pouco para garantir que o modal anterior fechou
		setTimeout(() => {
			// Preenche os campos
			document.getElementById('editarMensagemId').value = mensagem.id;
			document.getElementById('editarTituloMensagem').value = mensagem.titulo;
			document.getElementById('editarConteudoMensagem').value = mensagem.conteudo;
			document.getElementById('editarTipoMensagem').value = mensagem.tipo;

			const diasValidadeInput = document.getElementById('editarDiasValidade');
			diasValidadeInput.value = '';

			if (mensagem.dataExpiracao) {
				const hoje = new Date();
				const expiracao = new Date(mensagem.dataExpiracao);
				const diffTime = expiracao.getTime() - hoje.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				if (diffDays > 0) {
					diasValidadeInput.value = diffDays;
				}
			}

			// Abre o modal
			const modalElement = document.getElementById('editarMensagemModal');
			if (modalElement) {
				// Destrói qualquer instância anterior
				const existingModal = bootstrap.Modal.getInstance(modalElement);
				if (existingModal) {
					existingModal.dispose();
				}

				// Cria nova instância
				const modal = new bootstrap.Modal(modalElement, {
					backdrop: 'static',
					keyboard: false
				});
				modal.show();
			}
		}, 100);
	}

	salvarEdicaoMensagem(event) {
		console.log('🔄 ATUALIZANDO MENSAGEM');

		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		const id = document.getElementById('editarMensagemId').value;

		if (!this.token) {
			alert('Faça login novamente!');
			window.location.href = '/auth/login';
			return false;
		}

		const dados = {
			titulo: document.getElementById('editarTituloMensagem').value,
			conteudo: document.getElementById('editarConteudoMensagem').value,
			tipo: document.getElementById('editarTipoMensagem').value,
			diasValidade: document.getElementById('editarDiasValidade').value || null
		};

		// Mostra loading no botão
		const submitBtn = event.target.querySelector('button[type="submit"]');
		const originalText = submitBtn ? submitBtn.innerHTML : '';

		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
		}

		// FAZ O FETCH ESPECÍFICO PARA MENSAGENS
		fetch(`/api/mensagens/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.token}`
			},
			body: JSON.stringify(dados),
			credentials: 'omit'
		})
			.then(response => {
				console.log('📨 Resposta:', {
					status: response.status,
					ok: response.ok,
					redirected: response.redirected,
					url: response.url
				});

				if (response.redirected) {
					console.error('🚨 REDIRECT DETECTADO! Para:', response.url);
					alert('Erro: O servidor está redirecionando. Verifique autenticação.');
					throw new Error('Redirect detected');
				}

				if (!response.ok) {
					return response.text().then(text => {
						throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
					});
				}

				return response.json();
			})
			.then(data => {
				console.log('✅ Sucesso:', data);
				alert('✅ Mensagem atualizada com sucesso!');

				// FECHA O MODAL CORRETAMENTE
				this.fecharModal('editarMensagemModal');

				// ATUALIZA A UI
				if (typeof window.atualizarMensagemNaUI === 'function') {
					window.atualizarMensagemNaUI(data);
				}

				// Recarrega as mensagens
				setTimeout(() => {
					this.loadMensagensData();
				}, 500);
			})
			.catch(error => {
				console.error('❌ Erro:', error);
				alert('❌ Erro ao atualizar: ' + error.message);
			})
			.finally(() => {
				// Restaura o botão
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.innerHTML = originalText;
				}
			});

		return false;
	}

	excluirMensagem(id) {
		if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

		fetch(`/api/mensagens/${id}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${this.token}`
			}
		})
			.then(response => {
				if (!response.ok) throw new Error('Erro ao excluir mensagem');

				// Recarrega as mensagens
				this.loadMensagensData();
			})
			.catch(err => {
				alert('Erro: ' + err.message);
			});
	}

	toggleMensagemAtivo(id) {
		// Remove o confirm daqui - já está sendo chamado pelo evento de click
		console.log(`Alternando status da mensagem ${id}`);

		fetch(`/api/mensagens/${id}/toggle`, {
			method: 'PATCH',
			headers: {
				'Authorization': `Bearer ${this.token}`,
				'Content-Type': 'application/json'
			},
			credentials: 'omit'
		})
			.then(response => {
				console.log('Resposta do toggle:', response.status);

				if (response.status === 401 || response.status === 403) {
					localStorage.removeItem('token');
					window.location.href = '/auth/login';
					throw new Error('Sessão expirada');
				}

				if (!response.ok) {
					throw new Error(`Erro ${response.status}`);
				}
				return response.json();
			})
			.then(mensagemAtualizada => {
				if (typeof window.atualizarMensagemNaUI === 'function') {
					window.atualizarMensagemNaUI(mensagemAtualizada);
				}

				console.log('✅ Status alterado com sucesso');
			})
			.catch(err => {
				console.error('Erro no toggle:', err);
				alert('Erro ao alterar status: ' + err.message);
			});
	}

	// Função para renderizar mensagens (pode ser chamada do arquivo principal)
	renderMensagens(mensagens, containerId = 'mensagensContainer') {
		const container = document.getElementById(containerId);
		if (!container) return;

		container.innerHTML = '';

		if (!mensagens || mensagens.length === 0) {
			const emptyState = document.getElementById('emptyMensagens');
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

			const statusBadge = msg.ativo ?
				'<span class="badge bg-success">Ativa</span>' :
				'<span class="badge bg-secondary">Inativa</span>';

			const toggleIcon = msg.ativo ? 'bi-toggle-off' : 'bi-toggle-on';
			const toggleTitle = msg.ativo ? 'Desativar' : 'Ativar';
			const toggleClass = msg.ativo ? 'btn-outline-warning' : 'btn-outline-success';

			col.innerHTML = `
                <div class="card mensagem-card ${tipoClasse}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${msg.titulo}</strong>
                            <span class="badge ${badgeClass} ms-2">${msg.tipo}</span>
                            ${statusBadge}
                        </div>
                        <div>
                            <button class="btn btn-sm ${toggleClass} btn-toggle-msg" 
                                    data-id="${msg.id}" title="${toggleTitle}">
                                <i class="bi ${toggleIcon}"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary btn-edit-msg ms-1" 
                                    data-id="${msg.id}" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger ms-1 btn-delete-msg" 
                                    data-id="${msg.id}" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${msg.conteudo}</p>
                        <div class="text-muted small">
                            <i class="bi bi-person"></i> ${msg.autorNome} 
                            <i class="bi bi-calendar ms-2"></i> ${this.formatDate(msg.dataCriacao)}
                            ${msg.dataExpiracao ? `
                                <br><i class="bi bi-clock"></i> Expira em: ${this.formatDate(msg.dataExpiracao)}
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

			container.appendChild(col);
		});

		// Adiciona eventos aos botões
		this.setupMensagemButtons();
	}

	setupMensagemButtons() {
		// Toggle ativo/inativo - COM CONFIRMAÇÃO APENAS AQUI
		document.querySelectorAll('.btn-toggle-msg').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const msgId = e.target.closest('button').dataset.id;
				if (confirm('Deseja alterar o status desta mensagem?')) {
					this.toggleMensagemAtivo(msgId);
				}
			});
		});

		// Editar
		document.querySelectorAll('.btn-edit-msg').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const msgId = e.target.closest('button').dataset.id;
				this.editarMensagem(msgId);
			});
		});

		// Excluir
		document.querySelectorAll('.btn-delete-msg').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const msgId = e.target.closest('button').dataset.id;
				this.excluirMensagem(msgId);
			});
		});
	}

	formatDate(dateString) {
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

	// Função para carregar dados das mensagens
	loadMensagensData() {
		const container = document.getElementById('mensagensContainer');
		const emptyState = document.getElementById('emptyMensagens');
		const errorState = document.getElementById('errorMensagens');
		const errorMessage = document.getElementById('errorMensagensMessage');

		if (container) container.innerHTML = '';
		if (emptyState) emptyState.classList.add('d-none');
		if (errorState) errorState.classList.add('d-none');

		// Mostra loading (se a função existir)
		if (typeof window.showLoading === 'function') {
			window.showLoading();
		}

		fetch("/api/mensagens/todas", {
			headers: {
				'Authorization': `Bearer ${this.token}`
			}
		})
			.then(response => {
				if (!response.ok) throw new Error(`Erro ${response.status}`);
				return response.json();
			})
			.then(mensagens => {
				// Esconde loading (se a função existir)
				if (typeof window.hideLoading === 'function') {
					window.hideLoading();
				}
				this.renderMensagens(mensagens);
			})
			.catch(err => {
				// Esconde loading (se a função existir)
				if (typeof window.hideLoading === 'function') {
					window.hideLoading();
				}
				if (errorMessage) errorMessage.textContent = err.message;
				if (errorState) errorState.classList.remove('d-none');
			});
	}
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
	window.mensagensManager = new MensagensManager();

	// Exporta funções para uso global
	window.abrirModalNovaMensagem = () => window.mensagensManager.abrirModalNovaMensagem();
	window.editarMensagem = (id) => window.mensagensManager.editarMensagem(id);
	window.excluirMensagem = (id) => window.mensagensManager.excluirMensagem(id);
	window.toggleMensagemAtivo = (id) => window.mensagensManager.toggleMensagemAtivo(id);
	window.criarMensagem = (e) => window.mensagensManager.criarMensagem(e);
	window.salvarEdicaoMensagem = (e) => window.mensagensManager.salvarEdicaoMensagem(e);
});