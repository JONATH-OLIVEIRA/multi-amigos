// usuario-perfil.js - Gerencia perfil do usuário comum
// RESPONSABILIDADE: SOMENTE classe + métodos (sem auto init)
// COOKIE HttpOnly (jwt_token) + window.Api.fetchJson

class UsuarioPerfilManager {

	constructor() {
		console.log('👤 UsuarioPerfilManager inicializado');

		this.perfilContainer = document.getElementById('perfilContainer');

		this._loading = false;
		this._abortController = null;
	}

	async carregarMeuPerfil() {
		if (!this.perfilContainer) {
			this.perfilContainer = document.getElementById('perfilContainer');
		}

		if (!this.perfilContainer) {
			console.warn('⚠️ Container de perfil não encontrado');
			return;
		}

		if (this._loading) {
			console.warn('⏳ carregarMeuPerfil já está rodando, ignorando chamada.');
			return;
		}

		this._loading = true;
		this.mostrarLoading();

		if (this._abortController) {
			try { this._abortController.abort(); } catch (_) { }
		}
		this._abortController = new AbortController();
		const signal = this._abortController.signal;

		try {
			const [dados, estatisticas, hierarquia] = await Promise.all([
				window.Api.fetchJson('/api/me', { method: 'GET', signal }),
				window.Api.fetchJson('/api/me/estatisticas', { method: 'GET', signal }),
				// hierarquia pode não existir/retornar 204 etc — tratamos
				window.Api.fetchJson('/api/me/hierarquia', { method: 'GET', signal }).catch(() => [])
			]);

			this.renderizarPerfil(dados, estatisticas, Array.isArray(hierarquia) ? hierarquia : []);
			this.configurarEventos();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error('❌ Erro ao carregar perfil:', err);
			this.mostrarErro('Não foi possível carregar seus dados.');
		} finally {
			this._loading = false;
		}
	}

	mostrarLoading() {
		this.perfilContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-muted">Carregando seus dados...</p>
            </div>
        `;
	}

	mostrarErro(mensagem) {
		this.perfilContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Erro!</strong> ${this.escapeHtml(mensagem)}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
	}

	renderizarPerfil(dados, estatisticas, hierarquia) {
		if (!this.perfilContainer) return;

		const statusBadge = dados?.ativo
			? '<span class="badge bg-success">Ativo</span>'
			: '<span class="badge bg-secondary">Inativo</span>';

		const perfilBadge = dados?.perfil === 'ADMIN'
			? '<span class="badge bg-danger">ADMIN</span>'
			: '<span class="badge bg-primary">USUÁRIO</span>';

		let html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="bi bi-person-badge"></i> Dados Pessoais</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <label class="form-label"><strong>Nome Completo</strong></label>
                                <input type="text" class="form-control" id="inputNome" value="${this.escapeHtml(dados?.nome || '')}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label"><strong>Email</strong></label>
                                <input type="email" class="form-control" id="inputEmail" value="${this.escapeHtml(dados?.email || '')}">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label"><strong>Telefone</strong></label>
                                <input type="text" class="form-control" id="inputTelefone" value="${this.escapeHtml(dados?.telefone || '')}" placeholder="(11) 99999-9999">
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
                            ${this.formatarData(dados?.dataCriacao)}
                        </div>

                        <div class="mb-3">
                            <strong>Quem me indicou:</strong><br>
                            ${this.escapeHtml(estatisticas?.pai || 'Nenhum')}
                        </div>

                        <div class="mb-3">
                            <strong>Total na minha rede:</strong><br>
                            <span class="badge bg-success fs-6">${estatisticas?.totalFilhos || 0} pessoa${(estatisticas?.totalFilhos || 0) !== 1 ? 's' : ''}</span>
                        </div>

                        <div class="mb-3">
                            <strong>Ações da conta:</strong>
                            <div class="d-grid gap-2 mt-2">
                                <button class="btn btn-outline-danger" onclick="window.usuarioPerfilManager.solicitarDesativacao()">
                                    <i class="bi bi-power"></i> Solicitar Desativação
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Minhas Estatísticas</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 text-center mb-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h2 class="text-primary">${estatisticas?.totalFilhos || 0}</h2>
                                <p class="mb-0">Filhos Diretos</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 text-center mb-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h2 class="text-success">${dados?.ativo ? 'Ativo' : 'Inativo'}</h2>
                                <p class="mb-0">Status</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 text-center mb-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h2 class="text-info">${this.formatarDataCurta(dados?.dataCriacao)}</h2>
                                <p class="mb-0">Membro desde</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 text-center mb-3">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h2 class="text-warning">${estatisticas?.pai ? 'Sim' : 'Não'}</h2>
                                <p class="mb-0">Tem indicador</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

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
				const filhoStatus = filho.ativo
					? '<span class="badge bg-success">Ativo</span>'
					: '<span class="badge bg-secondary">Inativo</span>';

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

	configurarEventos() {
		// evita acumular listeners
		const btnSalvar = document.getElementById('btnSalvarPerfil');
		if (btnSalvar) btnSalvar.onclick = () => this.atualizarPerfil();
	}

	async atualizarPerfil() {
		const nome = document.getElementById('inputNome')?.value.trim();
		const email = document.getElementById('inputEmail')?.value.trim();
		const telefone = document.getElementById('inputTelefone')?.value.trim();
		const senha = document.getElementById('inputSenha')?.value;
		const confirmarSenha = document.getElementById('inputConfirmarSenha')?.value;

		if (!nome) return alert('Nome é obrigatório');
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Email inválido');
		if (senha && senha.length < 6) return alert('Senha mínimo 6');
		if (senha && senha !== confirmarSenha) return alert('Senhas não coincidem');

		const payload = { nome, email, telefone: telefone || null };
		if (senha) payload.senha = senha;

		try {
			await window.Api.fetchJson('/api/me', { method: 'PUT', body: payload });
			this.carregarMeuPerfil();
		} catch (err) {
			console.error(err);
			alert(err.message || 'Erro ao atualizar perfil');
		}
	}

	async solicitarDesativacao() {
		if (!confirm('Deseja desativar sua conta?')) return;

		try {
			await window.Api.fetchJson('/api/me/desativar', { method: 'PATCH' });

			// encerra sessão (cookie)
			await window.Api.fetchRaw('/auth/logout', { method: 'POST' }).catch(() => null);
			window.location.href = '/auth/login';
		} catch (err) {
			console.error(err);
			alert(err.message || 'Erro ao desativar conta');
		}
	}

	formatarData(dataString) {
		if (!dataString) return 'Data não informada';
		try {
			const data = new Date(dataString);
			return data.toLocaleDateString('pt-BR', {
				day: '2-digit', month: '2-digit', year: 'numeric',
				hour: '2-digit', minute: '2-digit'
			});
		} catch {
			return String(dataString);
		}
	}

	formatarDataCurta(dataString) {
		if (!dataString) return '—';
		try {
			const data = new Date(dataString);
			return data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
		} catch {
			return '—';
		}
	}

	escapeHtml(text) {
		if (text === null || text === undefined) return '';
		const div = document.createElement('div');
		div.textContent = String(text);
		return div.innerHTML;
	}
}

window.UsuarioPerfilManager = UsuarioPerfilManager;
