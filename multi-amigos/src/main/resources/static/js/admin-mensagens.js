/**
 * ADMIN MENSAGENS - Gerenciamento de Mensagens do Sistema
 * Robusto para dashboard com páginas/sections injetadas dinamicamente
 */

class MensagensManager {
	constructor() {
		this.token = localStorage.getItem('token');
		this.initialize();
	}

	initialize() {
		console.log('📝 MensagensManager inicializado');
		this.bindFormsIfExist();
	}

	// ============================================
	// HELPERS
	// ============================================

	qs(selector, root = document) {
		return root.querySelector(selector);
	}

	byId(id) {
		return document.getElementById(id);
	}

	ensureBootstrap() {
		if (typeof bootstrap === 'undefined') {
			console.error('❌ Bootstrap não está carregado!');
			return false;
		}
		return true;
	}

	// Fecha e limpa backdrops
	fecharModal(modalId) {
		if (!this.ensureBootstrap()) return;

		const modalElement = this.byId(modalId);
		if (!modalElement) return;

		const modal = bootstrap.Modal.getInstance(modalElement);
		if (modal) modal.hide();

		setTimeout(() => {
			document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
			document.body.classList.remove('modal-open');
			document.body.style.overflow = '';
			document.body.style.paddingRight = '';
		}, 150);
	}

	// Evita duplicar listeners
	bindFormsIfExist() {
		const formMensagem = this.byId('formMensagem');
		if (formMensagem && !formMensagem.dataset.bound) {
			formMensagem.addEventListener('submit', (e) => this.criarMensagem(e));
			formMensagem.dataset.bound = 'true';
			console.log('🔗 bind feito: #formMensagem');
		}

		const formEditarMensagem = this.byId('formEditarMensagem');
		if (formEditarMensagem && !formEditarMensagem.dataset.bound) {
			formEditarMensagem.addEventListener('submit', (e) => this.salvarEdicaoMensagem(e));
			formEditarMensagem.dataset.bound = 'true';
			console.log('🔗 bind feito: #formEditarMensagem');
		}
	}

	// ============================================
	// MODAIS (injeção via JS se não existirem)
	// ============================================

	ensureNovoModalExists() {
		let modal = this.byId('mensagemModal');
		if (modal) return modal;

		const html = `
<div class="modal fade" id="mensagemModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
	<div class="modal-content">
	  <div class="modal-header">
		<h5 class="modal-title"><i class="bi bi-megaphone"></i> Nova Mensagem</h5>
		<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	  </div>
	  <div class="modal-body">
		<form id="formMensagem">
		  <div class="mb-3">
			<label class="form-label">Título *</label>
			<input type="text" class="form-control" id="tituloMensagem" required>
		  </div>

		  <div class="mb-3">
			<label class="form-label">Conteúdo *</label>
			<textarea class="form-control" id="conteudoMensagem" rows="4" required></textarea>
		  </div>

		  <div class="row">
			<div class="col-md-6 mb-3">
			  <label class="form-label">Tipo *</label>
			  <select class="form-select" id="tipoMensagem" required>
				<option value="IMPORTANTE">IMPORTANTE</option>
				<option value="INFORMATIVO">INFORMATIVO</option>
				<option value="URGENTE">URGENTE</option>
			  </select>
			</div>
			<div class="col-md-6 mb-3">
			  <label class="form-label">Dias de validade (opcional)</label>
			  <input type="number" class="form-control" id="diasValidade" min="1" placeholder="Ex: 7">
			</div>
		  </div>

		  <div class="d-grid gap-2">
			<button type="submit" class="btn btn-primary">
			  <i class="bi bi-check2-circle"></i> Criar Mensagem
			</button>
			<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
		  </div>
		</form>
	  </div>
	</div>
  </div>
</div>
		`.trim();

		document.body.insertAdjacentHTML('beforeend', html);
		modal = this.byId('mensagemModal');

		// bind do form recém-criado
		this.bindFormsIfExist();
		return modal;
	}

	ensureEditarModalExists() {
		let modal = this.byId('editarMensagemModal');
		if (modal) return modal;

		const html = `
<div class="modal fade" id="editarMensagemModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
	<div class="modal-content">
	  <div class="modal-header">
		<h5 class="modal-title"><i class="bi bi-pencil-square"></i> Editar Mensagem</h5>
		<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	  </div>
	  <div class="modal-body">
		<form id="formEditarMensagem">
		  <input type="hidden" id="editarMensagemId">

		  <div class="mb-3">
			<label class="form-label">Título *</label>
			<input type="text" class="form-control" id="editarTituloMensagem" required>
		  </div>

		  <div class="mb-3">
			<label class="form-label">Conteúdo *</label>
			<textarea class="form-control" id="editarConteudoMensagem" rows="4" required></textarea>
		  </div>

		  <div class="row">
			<div class="col-md-6 mb-3">
			  <label class="form-label">Tipo *</label>
			  <select class="form-select" id="editarTipoMensagem" required>
				<option value="IMPORTANTE">IMPORTANTE</option>
				<option value="INFORMATIVO">INFORMATIVO</option>
				<option value="URGENTE">URGENTE</option>
			  </select>
			</div>
			<div class="col-md-6 mb-3">
			  <label class="form-label">Dias de validade (opcional)</label>
			  <input type="number" class="form-control" id="editarDiasValidade" min="1" placeholder="Ex: 7">
			</div>
		  </div>

		  <div class="d-grid gap-2">
			<button type="submit" class="btn btn-primary">
			  <i class="bi bi-save"></i> Salvar Alterações
			</button>
			<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
		  </div>
		</form>
	  </div>
	</div>
  </div>
</div>
		`.trim();

		document.body.insertAdjacentHTML('beforeend', html);
		modal = this.byId('editarMensagemModal');

		// bind do form recém-criado
		this.bindFormsIfExist();
		return modal;
	}

	// ============================================
	// CRUD
	// ============================================

	criarMensagem(e) {
		if (e) e.preventDefault();

		this.bindFormsIfExist();

		const tituloEl = this.byId('tituloMensagem');
		const conteudoEl = this.byId('conteudoMensagem');
		const tipoEl = this.byId('tipoMensagem');
		const diasEl = this.byId('diasValidade');

		if (!tituloEl || !conteudoEl || !tipoEl) {
			alert('Erro: formulário de criação não carregou. Clique em "Nova Mensagem" novamente.');
			return;
		}

		const titulo = tituloEl.value;
		const conteudo = conteudoEl.value;
		const tipo = tipoEl.value;
		const diasValidade = diasEl ? diasEl.value : null;

		const mensagemData = {
			titulo,
			conteudo,
			tipo: String(tipo || '').toUpperCase(),
			diasValidade: diasValidade ? parseInt(diasValidade) : null
		};

		if (!mensagemData.titulo || !mensagemData.conteudo || !mensagemData.tipo) {
			alert('Preencha todos os campos obrigatórios!');
			return;
		}

		const tiposValidos = ['IMPORTANTE', 'INFORMATIVO', 'URGENTE'];
		if (!tiposValidos.includes(mensagemData.tipo)) {
			alert('Tipo inválido! Use: IMPORTANTE, INFORMATIVO ou URGENTE');
			return;
		}

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
				if (response.status === 403) throw new Error('Apenas administradores podem criar mensagens');
				if (!response.ok) {
					return response.json().then(err => {
						throw new Error(err.message || 'Erro ao criar mensagem');
					});
				}
				return response.json();
			})
			.then(() => {
				alert('Mensagem criada com sucesso!');

				const form = this.byId('formMensagem');
				if (form) form.reset();

				this.fecharModal('mensagemModal');
				this.loadMensagensData();
			})
			.catch(err => alert('Erro: ' + err.message))
			.finally(() => {
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.innerHTML = originalText;
				}
			});
	}

	abrirModalNovaMensagem() {
		if (!this.ensureBootstrap()) return;

		// garante que o modal existe
		const modalElement = this.ensureNovoModalExists();

		// reseta form
		const form = this.byId('formMensagem');
		if (form) form.reset();

		const existingModal = bootstrap.Modal.getInstance(modalElement);
		if (existingModal) existingModal.dispose();

		const modal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
		modal.show();
	}

	editarMensagem(id) {
		fetch(`/api/mensagens/${id}`, {
			method: 'GET',
			headers: { 'Authorization': `Bearer ${this.token}` }
		})
			.then(response => {
				if (!response.ok) return this.buscarMensagemDaListaGeral(id);
				return response.json();
			})
			.then(mensagem => {
				if (!mensagem) throw new Error('Mensagem não encontrada');
				this.abrirModalEditarMensagem(mensagem);
			})
			.catch(err => {
				console.error('Erro ao buscar mensagem:', err);
				alert('Erro ao carregar mensagem para edição: ' + err.message);
			});
	}

	buscarMensagemDaListaGeral(id) {
		return fetch("/api/mensagens/todas", {
			headers: { 'Authorization': `Bearer ${this.token}` }
		})
			.then(r => {
				if (!r.ok) throw new Error('Erro ao buscar mensagens');
				return r.json();
			})
			.then(mensagens => {
				const mensagem = mensagens.find(m => m.id == id);
				if (!mensagem) throw new Error('Mensagem não encontrada');
				return mensagem;
			});
	}

	abrirModalEditarMensagem(mensagem) {
		if (!this.ensureBootstrap()) return;

		// garante que o modal existe
		const modalElement = this.ensureEditarModalExists();

		// preenche campos (agora eles SEMPRE existem porque o JS cria)
		this.byId('editarMensagemId').value = mensagem.id ?? '';
		this.byId('editarTituloMensagem').value = mensagem.titulo ?? '';
		this.byId('editarConteudoMensagem').value = mensagem.conteudo ?? '';
		this.byId('editarTipoMensagem').value = mensagem.tipo ?? 'INFORMATIVO';

		const diasValidadeInput = this.byId('editarDiasValidade');
		if (diasValidadeInput) {
			diasValidadeInput.value = '';
			if (mensagem.dataExpiracao) {
				const hoje = new Date();
				const expiracao = new Date(mensagem.dataExpiracao);
				const diffTime = expiracao.getTime() - hoje.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				if (diffDays > 0) diasValidadeInput.value = diffDays;
			}
		}

		const existingModal = bootstrap.Modal.getInstance(modalElement);
		if (existingModal) existingModal.dispose();

		const modal = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
		modal.show();
	}

	salvarEdicaoMensagem(event) {
		console.log('🔄 ATUALIZANDO MENSAGEM');

		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		const id = this.byId('editarMensagemId')?.value;
		if (!id) {
			alert('Erro: ID da mensagem não encontrado.');
			return false;
		}

		const dados = {
			titulo: this.byId('editarTituloMensagem')?.value ?? '',
			conteudo: this.byId('editarConteudoMensagem')?.value ?? '',
			tipo: this.byId('editarTipoMensagem')?.value ?? 'INFORMATIVO',
			diasValidade: this.byId('editarDiasValidade')?.value || null
		};

		const submitBtn = event?.target?.querySelector('button[type="submit"]');
		const originalText = submitBtn ? submitBtn.innerHTML : '';

		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
		}

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
				if (!response.ok) {
					return response.text().then(t => {
						throw new Error(`HTTP ${response.status}: ${t.substring(0, 200)}`);
					});
				}
				return response.json();
			})
			.then(data => {
				alert('✅ Mensagem atualizada com sucesso!');
				this.fecharModal('editarMensagemModal');

				if (typeof window.atualizarMensagemNaUI === 'function') {
					window.atualizarMensagemNaUI(data);
				}

				setTimeout(() => this.loadMensagensData(), 300);
			})
			.catch(err => {
				console.error('❌ Erro ao atualizar:', err);
				alert('❌ Erro ao atualizar: ' + err.message);
			})
			.finally(() => {
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
			headers: { 'Authorization': `Bearer ${this.token}` }
		})
			.then(r => {
				if (!r.ok) throw new Error('Erro ao excluir mensagem');
				this.loadMensagensData();
			})
			.catch(err => alert('Erro: ' + err.message));
	}

	toggleMensagemAtivo(id) {
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

				if (!response.ok) throw new Error(`Erro ${response.status}`);
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

	// ============================================
	// UI
	// ============================================

	renderMensagens(mensagens, containerId = 'mensagensContainer') {
		const container = this.byId(containerId);
		if (!container) return;

		container.innerHTML = '';

		if (!mensagens || mensagens.length === 0) {
			const emptyState = this.byId('emptyMensagens');
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
      
      <div class="mensagem-header-text">
        <strong>${msg.titulo}</strong>
        <span class="badge ${badgeClass} ms-2">${msg.tipo}</span>
        ${statusBadge}
      </div>

      <div class="mensagem-header-actions">
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
        <i class="bi bi-person"></i> ${msg.autorNome ?? 'N/A'}
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

		this.setupMensagemButtons();
	}

	setupMensagemButtons() {
		document.querySelectorAll('.btn-toggle-msg').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const msgId = e.target.closest('button').dataset.id;
				if (confirm('Deseja alterar o status desta mensagem?')) {
					this.toggleMensagemAtivo(msgId);
				}
			});
		});

		document.querySelectorAll('.btn-edit-msg').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const msgId = e.target.closest('button').dataset.id;
				this.editarMensagem(msgId);
			});
		});

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
			return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch (e) {
			return dateString;
		}
	}

	loadMensagensData() {
		const container = this.byId('mensagensContainer');
		const emptyState = this.byId('emptyMensagens');
		const errorState = this.byId('errorMensagens');
		const errorMessage = this.byId('errorMensagensMessage');

		if (container) container.innerHTML = '';
		if (emptyState) emptyState.classList.add('d-none');
		if (errorState) errorState.classList.add('d-none');

		if (typeof window.showLoading === 'function') window.showLoading();

		fetch("/api/mensagens/todas", {
			headers: { 'Authorization': `Bearer ${this.token}` }
		})
			.then(r => {
				if (!r.ok) throw new Error(`Erro ${r.status}`);
				return r.json();
			})
			.then(mensagens => {
				if (typeof window.hideLoading === 'function') window.hideLoading();
				this.renderMensagens(mensagens);
				this.bindFormsIfExist();
			})
			.catch(err => {
				if (typeof window.hideLoading === 'function') window.hideLoading();
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
