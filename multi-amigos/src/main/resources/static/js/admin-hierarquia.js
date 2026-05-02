// admin-hierarquia.js MODERNIZADO COM SUPORTE MOBILE
class AdminHierarquia {
    constructor() {
        this.container = null;
        this.usuarios = [];
        this.usuarioSelecionado = null;
        this.arvoreAtual = null;
        this.svg = null;
        
        // 🔥 DIMENSÕES RESPONSIVAS
        this.updateDimensions();
        
        this.margin = { top: 50, right: 120, bottom: 50, left: 120 };
        this.nodeRadius = this.isMobile() ? 35 : 45;
        this.zoom = null;
        this.tooltip = null;
        this.touchStart = null; // Para detectar toque vs clique
    }

    // 🔥 DETECTA SE É MOBILE
    isMobile() {
        return window.innerWidth <= 768;
    }

    // 🔥 ATUALIZA DIMENSÕES BASEADO NA TELA
    updateDimensions() {
        const container = document.getElementById('arvoreContainer');
        const width = container ? container.clientWidth : window.innerWidth;
        
        this.width = Math.min(width - 40, 1400); // Máximo 1400, mas respeita largura da tela
        this.height = this.isMobile() ? 500 : 800;
        
        // Ajusta raio do nó para mobile
        this.nodeRadius = this.isMobile() ? 30 : 45;
    }

    // ============================================
    // HTTP HELPERS (COOKIE + JSON + ERROS) ✅
    // ============================================

    authHeaders(extra = {}) {
        return {
            'Accept': 'application/json',
            ...extra
        };
    }

    async fetchJson(url, options = {}) {
        const opts = { ...options };
        opts.headers = this.authHeaders(opts.headers || {});

        if (!opts.credentials) opts.credentials = 'same-origin';

        if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
            if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
        }

        const res = await fetch(url, opts);

        if (res.status === 401) {
            window.location.href = '/auth/login';
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        const body = isJson
            ? await res.json().catch(() => ({}))
            : await res.text().catch(() => '');

        if (!res.ok) {
            if (res.status === 403) throw new Error('Acesso negado! Verifique suas permissões.');

            let msg = '';
            if (typeof body === 'string') msg = body;
            else if (body && typeof body === 'object') msg = body.error || body.message || JSON.stringify(body);

            throw new Error(`Erro ${res.status}: ${msg || res.statusText}`);
        }

        return body;
    }

    init(containerId) {
        console.log('🌳 Inicializando Admin Hierarquia Moderna...');
        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error('❌ Container não encontrado:', containerId);
            return;
        }

        // 🔥 ESCUTA MUDANÇA DE ORIENTAÇÃO
        window.addEventListener('resize', () => this.handleResize());
        
        this.render();
        this.carregarUsuarios();
    }

    // 🔥 LIDA COM REDIMENSIONAMENTO
    handleResize() {
        if (!this.arvoreAtual) return;
        
        // Atualiza dimensões
        this.updateDimensions();
        
        // Re-renderiza a árvore com novas dimensões
        setTimeout(() => {
            this.inicializarSVG();
            this.renderizarArvore(this.arvoreAtual);
        }, 300);
    }

    render() {
        this.container.innerHTML = '';

        // 🔥 VERSÃO MOBILE-FIRST DO HTML (mantendo o mesmo estilo)
        const html = `
            <div class="hierarquia-container">
                <div class="hierarquia-card">
                    <div class="hierarquia-header">
                        <div class="d-flex justify-content-between align-items-center flex-wrap ${this.isMobile() ? 'flex-column gap-2' : ''}">
                            <div>
                                <h4 class="mb-1">
                                    <i class="bi bi-diagram-3 me-2"></i>Árvore Genealógica
                                </h4>
                                <p class="text-light mb-0">Visualize a hierarquia completa da rede</p>
                            </div>
                            <button id="btnAtualizarArvore" class="btn-moderno btn-moderno-primary">
                                <i class="bi bi-arrow-clockwise me-2"></i>Atualizar
                            </button>
                        </div>
                    </div>

                    <div class="controles-modernos">
                        <div class="row g-4">
                            <div class="col-lg-5 col-md-12">
                                <label class="form-label-moderno">
                                    <i class="bi bi-person-fill me-2"></i>Visualizar rede de:
                                </label>
                                <div class="input-group ${this.isMobile() ? 'flex-column gap-2' : ''}">
                                    <select id="selectUsuarioRaiz" class="form-select-moderno">
                                        <option value="">Carregando usuários...</option>
                                    </select>
                                    <button id="btnCarregarArvore" class="btn-moderno btn-moderno-primary ${this.isMobile() ? 'w-100' : ''}" disabled>
                                        <i class="bi bi-eye me-2"></i>Carregar
                                    </button>
                                </div>
                            </div>

                            <div class="col-lg-3 col-md-6">
                                <label class="form-label-moderno">
                                    <i class="bi bi-arrow-down-up me-2"></i>Profundidade:
                                </label>
                                <select id="selectProfundidade" class="form-select-moderno">
                                    <option value="2">2 níveis</option>
                                    <option value="3" selected>3 níveis</option>
                                    <option value="4">4 níveis</option>
                                    <option value="5">5 níveis</option>
                                    <option value="10">Toda hierarquia</option>
                                </select>
                            </div>

                            <div class="col-lg-2 col-md-6">
                                <label class="form-label-moderno">
                                    <i class="bi bi-layout-split me-2"></i>Layout:
                                </label>
                                <select id="selectLayout" class="form-select-moderno">
                                    <option value="vertical" selected>Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                    <option value="radial">Radial</option>
                                </select>
                            </div>

                            <div class="col-lg-2 col-md-6">
                                <label class="form-label-moderno">
                                    <i class="bi bi-filter me-2"></i>Filtrar:
                                </label>
                                <select id="selectFiltro" class="form-select-moderno">
                                    <option value="todos">Todos</option>
                                    <option value="ativos">Somente ativos</option>
                                    <option value="admins">Apenas admins</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="estatisticas-modernas" id="estatisticasArvore">
                        <div class="estatistica-card-moderno">
                            <h6>Total</h6>
                            <h2 id="totalMembros">0</h2>
                            <p class="text-muted mb-0">Membros</p>
                        </div>

                        <div class="estatistica-card-moderno">
                            <h6>Níveis</h6>
                            <h2 id="totalNiveis">0</h2>
                            <p class="text-muted mb-0">Profundidade</p>
                        </div>

                        <div class="estatistica-card-moderno">
                            <h6>Ativos</h6>
                            <h2 id="usuariosAtivos">0</h2>
                            <p class="text-muted mb-0">Ativos</p>
                        </div>

                        <div class="estatistica-card-moderno">
                            <h6>Admins</h6>
                            <h2 id="totalAdmins">0</h2>
                            <p class="text-muted mb-0">Admins</p>
                        </div>
                    </div>

                    <div class="arvore-area-moderna">
                        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <h5 class="mb-0">
                                <i class="bi bi-graph-up me-2"></i>Visualização da Rede
                            </h5>
                            <span class="badge bg-primary" id="arvoreStatus">
                                Selecione um usuário
                            </span>
                        </div>

                        <div class="arvore-svg-container" id="arvoreContainer" style="min-height: ${this.isMobile() ? '500px' : '700px'}; overflow: auto;">
                            <svg id="arvoreSvg" width="100%" height="100%"></svg>

                            <div class="zoom-controls-modernos">
                                <button class="btn-zoom-moderno" id="btnZoomIn" title="Ampliar">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                                <button class="btn-zoom-moderno" id="btnZoomOut" title="Reduzir">
                                    <i class="bi bi-dash-lg"></i>
                                </button>
                                <button class="btn-zoom-moderno" id="btnResetZoom" title="Resetar Zoom">
                                    <i class="bi bi-fullscreen"></i>
                                </button>
                            </div>
                        </div>

                        <div class="legenda-moderna mt-4 flex-wrap">
                            <div class="legenda-item-moderno">
                                <div class="legenda-icon admin">
                                    <i class="bi bi-shield-fill-check"></i>
                                </div>
                                <span class="legenda-text">Admin</span>
                            </div>

                            <div class="legenda-item-moderno">
                                <div class="legenda-icon usuario">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <span class="legenda-text">Usuário</span>
                            </div>

                            <div class="legenda-item-moderno">
                                <div class="legenda-icon inativo">
                                    <i class="bi bi-x-circle-fill"></i>
                                </div>
                                <span class="legenda-text">Inativo</span>
                            </div>

                            <div class="legenda-item-moderno">
                                <div class="legenda-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                    <i class="bi bi-people-fill"></i>
                                </div>
                                <span class="legenda-text">Tem Filhos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="modalDetalhesUsuario" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered ${this.isMobile() ? 'm-2' : ''}">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header" style="background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);">
                            <h5 class="modal-title text-white">
                                <i class="bi bi-person-badge me-2"></i>Detalhes
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0" id="detalhesUsuarioContent"></div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;

        this.inicializarSVG();
        this.criarTooltip();
        this.configurarEventos();

        document.getElementById('estatisticasArvore').style.display = 'none';
    }

    criarTooltip() {
        const oldTooltip = document.querySelector('.tooltip-moderno');
        if (oldTooltip) oldTooltip.remove();

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip-moderno';
        this.tooltip.style.display = 'none';
        document.getElementById('arvoreContainer').appendChild(this.tooltip);
    }

    configurarEventos() {
        document.getElementById('btnCarregarArvore').addEventListener('click', () => this.carregarArvore());
        document.getElementById('btnAtualizarArvore').addEventListener('click', () => this.carregarArvore());

        document.getElementById('btnZoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('btnZoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('btnResetZoom').addEventListener('click', () => this.resetZoom());

        document.getElementById('selectUsuarioRaiz').addEventListener('change', (e) => {
            document.getElementById('btnCarregarArvore').disabled = !e.target.value;
        });

        document.getElementById('selectLayout').addEventListener('change', () => {
            if (this.arvoreAtual) this.renderizarArvore(this.arvoreAtual);
        });

        document.getElementById('selectFiltro').addEventListener('change', () => {
            if (this.arvoreAtual) this.renderizarArvore(this.arvoreAtual);
        });

        // 🔥 SUPORTE A TOQUE PARA DISPOSITIVOS MÓVEIS
        const container = document.getElementById('arvoreContainer');
        if (container) {
            container.addEventListener('touchstart', (e) => {
                this.touchStart = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now()
                };
            }, { passive: true });
        }
    }

    inicializarSVG() {
        const svgElement = document.getElementById('arvoreSvg');
        if (!svgElement) return;

        d3.select('#arvoreSvg').selectAll('*').remove();

        const svg = d3.select('#arvoreSvg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const defs = svg.append('defs');

        const gradienteAdmin = defs.append('linearGradient')
            .attr('id', 'gradiente-admin')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradienteAdmin.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444');
        gradienteAdmin.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626');

        const gradienteUsuario = defs.append('linearGradient')
            .attr('id', 'gradiente-usuario')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradienteUsuario.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
        gradienteUsuario.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb');

        const gradienteInativo = defs.append('linearGradient')
            .attr('id', 'gradiente-inativo')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradienteInativo.append('stop').attr('offset', '0%').attr('stop-color', '#64748b');
        gradienteInativo.append('stop').attr('offset', '100%').attr('stop-color', '#475569');

        const g = svg.append('g').attr('class', 'arvore-container');

        this.zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(this.zoom);

        this.svg = { svg, g, defs };
    }

    async carregarUsuarios() {
        try {
            const select = document.getElementById('selectUsuarioRaiz');
            select.innerHTML = '<option value="">Carregando usuários...</option>';

            const usuarios = await this.fetchJson('/api/usuarios/ativos');
            this.usuarios = Array.isArray(usuarios) ? usuarios : [];

            this.usuarios.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

            select.innerHTML = `
                <option value="">Selecione um usuário...</option>
                <optgroup label="Administradores">
                    ${this.usuarios.filter(u => u.perfil === 'ADMIN').map(u => `
                        <option value="${u.id}" data-perfil="${u.perfil}">
                            👑 ${u.nome}
                        </option>
                    `).join('')}
                </optgroup>
                <optgroup label="Usuários">
                    ${this.usuarios.filter(u => u.perfil !== 'ADMIN').map(u => `
                        <option value="${u.id}" data-perfil="${u.perfil}">
                            👤 ${u.nome}
                        </option>
                    `).join('')}
                </optgroup>
            `;

            console.log(`✅ ${this.usuarios.length} usuários carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            document.getElementById('selectUsuarioRaiz').innerHTML = `<option value="">Erro ao carregar usuários</option>`;
        }
    }

    async carregarArvore() {
        const select = document.getElementById('selectUsuarioRaiz');
        const usuarioId = select.value;

        if (!usuarioId) {
            this.mostrarNotificacao('⚠️ Selecione um usuário primeiro!', 'warning');
            return;
        }

        try {
            this.mostrarLoading(true);

            const profundidade = document.getElementById('selectProfundidade').value;
            this.arvoreAtual = await this.fetchJson(`/api/usuarios/${usuarioId}/arvore?profundidade=${profundidade}`);

            this.usuarioSelecionado = this.usuarios.find(u => String(u.id) === String(usuarioId));

            this.atualizarEstatisticas();
            this.renderizarArvore(this.arvoreAtual);

            this.mostrarLoading(false);
            this.mostrarNotificacao(`✅ Árvore carregada com sucesso!`, 'success');
        } catch (error) {
            console.error('❌ Erro ao carregar árvore:', error);
            this.mostrarLoading(false);
            this.mostrarNotificacao(`❌ Erro ao carregar árvore: ${error.message}`, 'danger');
        }
    }

    atualizarEstatisticas() {
        const statsDiv = document.getElementById('estatisticasArvore');
        if (!this.arvoreAtual) {
            statsDiv.style.display = 'none';
            return;
        }

        statsDiv.style.display = 'grid';

        let usuariosAtivos = 0;
        let totalAdmins = 0;

        const contar = (node) => {
            if (!node) return;
            if (node.ativo) usuariosAtivos++;
            if (node.perfil === 'ADMIN') totalAdmins++;
            (node.filhos || []).forEach(contar);
        };

        contar(this.arvoreAtual.raiz);

        document.getElementById('totalMembros').textContent = this.arvoreAtual.totalMembros ?? 0;
        document.getElementById('totalNiveis').textContent = this.arvoreAtual.totalNiveis ?? 0;
        document.getElementById('usuariosAtivos').textContent = usuariosAtivos;
        document.getElementById('totalAdmins').textContent = totalAdmins;

        const nome = this.usuarioSelecionado?.nome ?? 'Usuário';
        document.getElementById('arvoreStatus').textContent =
            `Exibindo rede de ${nome} • ${this.arvoreAtual.totalMembros} membros • ${this.arvoreAtual.totalNiveis} níveis`;
    }

    renderizarArvore(arvoreDTO) {
        if (!arvoreDTO || !arvoreDTO.raiz) return;

        this.svg.g.selectAll('*').remove();

        const layout = document.getElementById('selectLayout').value;
        const filtro = document.getElementById('selectFiltro').value;

        const raizFiltrada = this.aplicarFiltro(arvoreDTO.raiz, filtro);

        if (!raizFiltrada) {
            this.svg.g.append('text')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .attr('class', 'node-text')
                .text('Nenhum usuário encontrado com o filtro aplicado');
            return;
        }

        let treeLayout;
        switch (layout) {
            case 'horizontal':
                treeLayout = d3.tree().size([this.height - 150, this.width - 300]);
                break;
            case 'radial':
                treeLayout = d3.tree().size([2 * Math.PI, Math.min(this.width, this.height) / 2 - 100])
                    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
                break;
            case 'vertical':
            default:
                treeLayout = d3.tree().size([this.width - 300, this.height - 150]);
                break;
        }

        const root = d3.hierarchy(raizFiltrada, d => d.filhos);
        treeLayout(root);

        let linkGenerator, nodeTransform;

        if (layout === 'radial') {
            linkGenerator = d3.linkRadial().angle(d => d.x).radius(d => d.y);
            nodeTransform = d => {
                const angle = d.x - Math.PI / 2;
                return `translate(${d.y * Math.cos(angle)},${d.y * Math.sin(angle)})`;
            };
        } else {
            linkGenerator = d3.linkHorizontal().x(d => d.y).y(d => d.x);
            nodeTransform = d => `translate(${d.y},${d.x})`;
        }

        this.svg.g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(root.links())
            .enter()
            .append('path')
            .attr('d', linkGenerator)
            .attr('class', 'link-arvore');

        const nodes = this.svg.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', nodeTransform)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.mostrarDetalhesUsuario(d.data))
            .on('mouseover', (event, d) => this.mostrarTooltipModerno(event, d.data))
            .on('mouseout', () => this.esconderTooltip());

        nodes.append('circle')
            .attr('r', this.nodeRadius)
            .attr('class', d => this.getClasseNode(d.data))
            .style('filter', d =>
                d.data.perfil === 'ADMIN'
                    ? 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
                    : d.data.ativo
                        ? 'drop-shadow(0 4px 8px rgba(37, 99, 235, 0.3))'
                        : 'drop-shadow(0 4px 8px rgba(100, 116, 139, 0.3))'
            );

        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', 'white')
            .attr('font-size', this.isMobile() ? '20px' : '24px')
            .attr('font-weight', 'bold')
            .text(d => this.getIconeNode(d.data));

        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', this.nodeRadius + (this.isMobile() ? 15 : 20))
            .attr('class', 'node-text')
            .text(d => this.truncarTexto((d.data.nome || '').split(' ')[0] || '', this.isMobile() ? 8 : 10));

        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', this.nodeRadius + (this.isMobile() ? 30 : 40))
            .attr('class', 'node-subtext')
            .text(d => `${d.data.perfil === 'ADMIN' ? '👑 ' : ''}Nível ${d.data.nivel} • ${d.data.ativo ? '✅' : '⏸️'}`);

        nodes.filter(d => d.children && d.children.length > 0)
            .append('circle')
            .attr('cx', this.nodeRadius - (this.isMobile() ? 10 : 12))
            .attr('cy', -this.nodeRadius + (this.isMobile() ? 10 : 12))
            .attr('r', this.isMobile() ? 8 : 10)
            .attr('fill', '#10b981')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))');

        nodes.filter(d => d.children && d.children.length > 0)
            .append('text')
            .attr('x', this.nodeRadius - (this.isMobile() ? 10 : 12))
            .attr('y', -this.nodeRadius + (this.isMobile() ? 13 : 15))
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', this.isMobile() ? '8px' : '10px')
            .attr('font-weight', 'bold')
            .text(d => d.children.length);

        setTimeout(() => this.centralizarArvore(), 100);
    }

    aplicarFiltro(node, filtro) {
        if (!node) return null;
        const nodeClone = { ...node };

        if (nodeClone.filhos && nodeClone.filhos.length > 0) {
            nodeClone.filhos = nodeClone.filhos
                .map(filho => this.aplicarFiltro(filho, filtro))
                .filter(Boolean);
        }

        let passaFiltro = true;
        switch (filtro) {
            case 'ativos':
                passaFiltro = !!nodeClone.ativo;
                break;
            case 'admins':
                passaFiltro = nodeClone.perfil === 'ADMIN';
                break;
            default:
                passaFiltro = true;
        }

        if (!passaFiltro && nodeClone.filhos && nodeClone.filhos.length > 0) return nodeClone;
        if (passaFiltro) return nodeClone;
        return null;
    }

    getClasseNode(usuario) {
        if (usuario?.perfil === 'ADMIN') return 'node-admin';
        if (!usuario?.ativo) return 'node-inativo';
        return 'node-usuario';
    }

    getIconeNode(usuario) {
        return usuario?.perfil === 'ADMIN' ? '👑' : '👤';
    }

    truncarTexto(texto, maxLength) {
        const t = texto || '';
        if (t.length <= maxLength) return t;
        return t.substring(0, maxLength - 3) + '...';
    }

    mostrarTooltipModerno(event, usuario) {
        if (!this.tooltip || this.isMobile()) return; // Desativa tooltip em mobile

        const containerRect = document.getElementById('arvoreContainer').getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-avatar ${usuario.perfil === 'ADMIN' ? 'admin' : 'usuario'}">
                    ${this.getIconeNode(usuario)}
                </div>
                <div class="tooltip-info">
                    <h6 class="mb-1">${usuario.nome}</h6>
                    <small class="text-muted">${usuario.email}</small>
                </div>
            </div>
            <div class="tooltip-stats">
                <div class="tooltip-stat"><span>Perfil</span><span>${usuario.perfil}</span></div>
                <div class="tooltip-stat"><span>Status</span><span>${usuario.ativo ? 'Ativo' : 'Inativo'}</span></div>
                <div class="tooltip-stat"><span>Nível</span><span>${usuario.nivel}</span></div>
                <div class="tooltip-stat"><span>Filhos</span><span>${usuario.filhos ? usuario.filhos.length : 0}</span></div>
            </div>
            <div class="mt-3 text-center"><small class="text-muted">Clique para ver detalhes</small></div>
        `;

        this.tooltip.style.display = 'block';
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let left = x + 10;
        let top = y + 10;

        if (left + tooltipRect.width > containerRect.width) left = x - tooltipRect.width - 10;
        if (top + tooltipRect.height > containerRect.height) top = y - tooltipRect.height - 10;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    esconderTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }

    async mostrarDetalhesUsuario(usuario) {
        try {
            const usuarioDetalhado = await this.fetchJson(`/api/usuarios/${usuario.id}`);

            const modalContent = document.getElementById('detalhesUsuarioContent');
            modalContent.innerHTML = `
                <div class="p-4">
                    <div class="row">
                        <div class="col-md-4 text-center border-end">
                            <div class="mb-4">
                                <div class="mx-auto tooltip-avatar ${usuarioDetalhado.perfil === 'ADMIN' ? 'admin' : 'usuario'}"
                                     style="width: 80px; height: 80px; font-size: 32px;">
                                    ${usuarioDetalhado.perfil === 'ADMIN' ? '👑' : '👤'}
                                </div>
                            </div>
                            <h4 class="mb-2">${usuarioDetalhado.nome}</h4>
                            <p class="text-muted mb-3">${usuarioDetalhado.email}</p>

                            <div class="d-grid gap-2">
                                <button class="btn-moderno btn-moderno-primary"
                                        onclick="hierarquia.verArvoreUsuario(${usuarioDetalhado.id})">
                                    <i class="bi bi-diagram-3 me-2"></i>Ver Árvore
                                </button>
                                <button class="btn-moderno btn-moderno-warning"
                                        onclick="hierarquia.editarUsuario(${usuarioDetalhado.id})">
                                    <i class="bi bi-pencil me-2"></i>Editar
                                </button>
                                <button class="btn-moderno ${usuarioDetalhado.ativo ? 'btn-moderno-danger' : 'btn-moderno-success'}"
                                        onclick="hierarquia.${usuarioDetalhado.ativo ? 'desativar' : 'ativar'}Usuario(${usuarioDetalhado.id})">
                                    <i class="bi bi-${usuarioDetalhado.ativo ? 'x-circle' : 'check-circle'} me-2"></i>
                                    ${usuarioDetalhado.ativo ? 'Desativar' : 'Ativar'}
                                </button>
                            </div>
                        </div>

                        <div class="col-md-8">
                            <div class="row g-3">
                                <div class="col-6">
                                    <div class="estatistica-card-moderno h-100">
                                        <h6>Telefone</h6>
                                        <h2 class="fs-5">${usuarioDetalhado.telefone || 'Não informado'}</h2>
                                    </div>
                                </div>

                                <div class="col-6">
                                    <div class="estatistica-card-moderno h-100">
                                        <h6>Perfil</h6>
                                        <h2 class="fs-5">
                                            <span class="badge ${usuarioDetalhado.perfil === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                                                ${usuarioDetalhado.perfil}
                                            </span>
                                        </h2>
                                    </div>
                                </div>

                                <div class="col-6">
                                    <div class="estatistica-card-moderno h-100">
                                        <h6>Status</h6>
                                        <h2 class="fs-5">
                                            <span class="badge ${usuarioDetalhado.ativo ? 'bg-success' : 'bg-secondary'}">
                                                ${usuarioDetalhado.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </h2>
                                    </div>
                                </div>

                                <div class="col-6">
                                    <div class="estatistica-card-moderno h-100">
                                        <h6>Filhos Diretos</h6>
                                        <h2 class="fs-5">${usuarioDetalhado.filhosIds ? usuarioDetalhado.filhosIds.length : 0}</h2>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="estatistica-card-moderno">
                                        <h6>Data de Cadastro</h6>
                                        <p class="mb-2">${usuarioDetalhado.dataCriacao ? new Date(usuarioDetalhado.dataCriacao).toLocaleString('pt-BR') : 'N/A'}</p>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="estatistica-card-moderno">
                                        <h6>Última Atualização</h6>
                                        <p class="mb-2">${usuarioDetalhado.dataAtualizacao ? new Date(usuarioDetalhado.dataAtualizacao).toLocaleString('pt-BR') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const modal = new bootstrap.Modal(document.getElementById('modalDetalhesUsuario'));
            modal.show();
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            this.mostrarNotificacao('❌ Erro ao carregar detalhes do usuário', 'danger');
        }
    }

    verArvoreUsuario(usuarioId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhesUsuario'));
        if (modal) modal.hide();

        const select = document.getElementById('selectUsuarioRaiz');
        select.value = usuarioId;
        document.getElementById('btnCarregarArvore').disabled = false;
        this.carregarArvore();
    }

    editarUsuario(usuarioId) {
        console.log('Editar usuário:', usuarioId);
        this.mostrarNotificacao('Funcionalidade de edição em desenvolvimento', 'info');
    }

    async desativarUsuario(usuarioId) {
        if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

        try {
            await this.fetchJson(`/api/usuarios/${usuarioId}/desativar`, { method: 'PATCH' });
            this.mostrarNotificacao('✅ Usuário desativado com sucesso!', 'success');
            this.carregarUsuarios();
            if (this.arvoreAtual) this.carregarArvore();
        } catch (error) {
            console.error('❌ Erro ao desativar usuário:', error);
            this.mostrarNotificacao('❌ Erro ao desativar usuário', 'danger');
        }
    }

    async ativarUsuario(usuarioId) {
        try {
            await this.fetchJson(`/api/usuarios/${usuarioId}/reativar`, { method: 'PATCH' });
            this.mostrarNotificacao('✅ Usuário ativado com sucesso!', 'success');
            this.carregarUsuarios();
            if (this.arvoreAtual) this.carregarArvore();
        } catch (error) {
            console.error('❌ Erro ao ativar usuário:', error);
            this.mostrarNotificacao('❌ Erro ao ativar usuário', 'danger');
        }
    }

    // 🔥 MÉTODO PARA CENTRALIZAR COM ANIMAÇÃO SUAVE EM MOBILE
    centralizarArvore() {
        if (!this.svg || !this.svg.svg) return;

        const gElement = this.svg.g.node();
        if (!gElement || !gElement.getBBox) return;

        const bbox = gElement.getBBox();
        const scale = Math.min(this.width / bbox.width, this.height / bbox.height, 0.85);

        const translate = [
            this.width / 2 - (bbox.x + bbox.width / 2) * scale,
            this.height / 2 - (bbox.y + bbox.height / 2) * scale
        ];

        this.svg.svg.transition()
            .duration(this.isMobile() ? 500 : 1000)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    zoomIn() { 
        if (this.svg?.svg && this.zoom) 
            this.svg.svg.transition().call(this.zoom.scaleBy, 1.5); 
    }
    
    zoomOut() { 
        if (this.svg?.svg && this.zoom) 
            this.svg.svg.transition().call(this.zoom.scaleBy, 0.67); 
    }

    resetZoom() {
        if (!this.svg?.svg || !this.zoom) return;
        this.svg.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
        setTimeout(() => this.centralizarArvore(), 750);
    }

    mostrarLoading(mostrar) {
        const btn = document.getElementById('btnCarregarArvore');
        const status = document.getElementById('arvoreStatus');

        if (mostrar) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando...';
            btn.disabled = true;
            status.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando árvore...';
        } else {
            btn.innerHTML = '<i class="bi bi-eye me-2"></i>Carregar';
            btn.disabled = !document.getElementById('selectUsuarioRaiz').value;
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        const notificacaoAnterior = document.querySelector('.notificacao-hierarquia');
        if (notificacaoAnterior) notificacaoAnterior.remove();

        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-hierarquia alert alert-${tipo} alert-dismissible fade show`;
        notificacao.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            min-width: 300px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border: none; border-radius: 12px;
        `;

        notificacao.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${tipo === 'success' ? 'bi-check-circle' : tipo === 'danger' ? 'bi-exclamation-circle' : tipo === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2 fs-4"></i>
                <div class="flex-grow-1">${mensagem}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(notificacao);
        setTimeout(() => { if (notificacao.parentNode) notificacao.remove(); }, 5000);
    }
}

// Instância global
const hierarquia = new AdminHierarquia();

document.addEventListener('DOMContentLoaded', function() {
    hierarquia.init('contentArea');
});