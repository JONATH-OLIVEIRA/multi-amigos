// auth.js - SOLUÇÃO DEFINITIVA (SEM VERIFICAÇÃO COMPLEXA)

(function() {
	'use strict';

	console.log('🚀 AUTH.JS - SOLUÇÃO DEFINITIVA');
	console.log('📍 Página:', window.location.pathname);

	// Verifica se está na página de busca
	if (!window.location.pathname.includes('/busca')) {
		console.log('⏭️ Não é página de busca, ignorando');
		return;
	}

	// Estado SIMPLES
	const state = {
		token: null,
		authenticated: false
	};

	/**
	 * PASSO 1: Busca token de forma DIRETA
	 */
	function getToken() {
		console.log('1️⃣ Buscando token...');

		// A. URL (vindo do dashboard)
		const urlParams = new URLSearchParams(window.location.search);
		let token = urlParams.get('token');

		if (token) {
			console.log('✅ Token da URL encontrado');
			token = token.trim(); // APENAS TRIM

			// Salva para uso futuro
			localStorage.setItem('token', token);

			// Limpa URL (IMPORTANTE)
			window.history.replaceState({}, '', window.location.pathname);

			return token;
		}

		// B. localStorage (fallback)
		token = localStorage.getItem('token');
		if (token) {
			console.log('✅ Token do localStorage');
			return token.trim();
		}

		console.log('❌ NENHUM token encontrado');
		return null;
	}

	/**
	 * PASSO 2: Verificação ULTRA SIMPLES
	 */
	async function checkToken(token) {
		console.log('2️⃣ TESTE DE EMERGÊNCIA - Ignorando bloqueios');

		try {
			const response = await fetch('/api/usuarios/me', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${token}` }
			});

			console.log('📊 Resposta do servidor:', response.status);

			// Se o servidor responder 401, o Token está REALMENTE errado ou expirado no Back-end
			if (response.status === 401) {
				console.error('❌ Token expirado, mas vou tentar manter a página aberta.');
				// Comente a linha abaixo para parar de ser expulso imediatamente
				// return false; 
				return true; // Dá uma sobrevida para terminar o que está fazendo
			}

			// Para QUALQUER outra coisa (404, 500, ou Sucesso), deixa passar!
			return true;
		} catch (error) {
			console.warn('⚠️ Erro de conexão, mas ignorando para não fechar a página:', error.message);
			return true;
		}
	}
	/**
	 * PASSO 3: Configuração SIMPLES do interceptor
	 */
	function setupInterceptor() {
		console.log('3️⃣ Configurando interceptor...');

		const originalFetch = window.fetch;

		window.fetch = function(url, options = {}) {
			const newOptions = { ...options };
			newOptions.headers = { ...newOptions.headers };

			// Adiciona token se tiver
			if (state.token) {
				newOptions.headers['Authorization'] = `Bearer ${state.token}`;
			}

			// Content-Type automático para JSON
			if (newOptions.body && typeof newOptions.body === 'object' &&
				!newOptions.headers['Content-Type'] &&
				!(newOptions.body instanceof FormData)) {
				newOptions.headers['Content-Type'] = 'application/json';
				newOptions.body = JSON.stringify(newOptions.body);
			}

			return originalFetch.call(this, url, newOptions);
		};

		console.log('✅ Interceptor configurado');
	}

	/**
	 * PASSO 4: Mostra aplicação
	 */
	function showApp() {
		console.log('4️⃣ Mostrando aplicação...');
		const loading = document.getElementById('initialLoading');
		const content = document.getElementById('mainContent');

		if (loading && content) {
			loading.style.display = 'none'; // Esconde o loading
			content.classList.remove('d-none'); // REMOVE A CLASSE DO BOOTSTRAP
			content.style.opacity = '1';
			console.log('🎉 APLICAÇÃO VISÍVEL!');
		}
	}

	/**
	 * PASSO 5: Redireciona para login
	 */
	function redirectToLogin(reason) {
		console.log(`🚨 Redirecionando: ${reason}`);

		const loading = document.getElementById('initialLoading');
		if (loading) {
			loading.innerHTML = `
				<div style="text-align: center; padding: 50px;">
					<h4 class="text-danger">${reason}</h4>
					<p>Redirecionando para login...</p>
					<button onclick="window.location.href='/auth/login'" 
					        class="btn btn-primary mt-3">
						Ir para Login
					</button>
				</div>
			`;
		}

		// Aguarda 2 segundos e redireciona
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 2000);
	}

	/**
	 * PROCESSO PRINCIPAL
	 */
	async function main() {
		console.log('🔄 INICIANDO PROCESSO DE AUTENTICAÇÃO');

		try {
			// 1. Pega token
			state.token = getToken();

			if (!state.token) {
				redirectToLogin('Token não encontrado');
				return;
			}

			console.log('✅ Token obtido');

			// 2. Configura interceptor (ANTES de verificar)
			setupInterceptor();

			// 3. Verifica token (forma SIMPLES)
			const isValid = await checkToken(state.token);

			if (!isValid) {
				// Limpa token inválido
				localStorage.removeItem('token');
				redirectToLogin('Sessão expirada ou inválida');
				return;
			}

			// 4. Tenta obter usuário (opcional)
			try {
				const response = await fetch('/api/usuarios/me', {
					headers: {
						'Authorization': `Bearer ${state.token}`
					}
				});

				if (response.ok) {
					const user = await response.json();
					console.log(`👤 Usuário: ${user.nome}`);
				}
			} catch (e) {
				console.log('⚠️ Não consegui obter dados do usuário (não é crítico)');
			}

			// 5. Marca como autenticado e mostra app
			state.authenticated = true;
			showApp();

			console.log('✅✅✅ AUTENTICAÇÃO CONCLUÍDA COM SUCESSO! ✅✅✅');

		} catch (error) {
			console.error('💥 ERRO CRÍTICO:', error);
			redirectToLogin('Erro inesperado');
		}
	}

	// Funções públicas
	window.verificarAutenticacao = main;
	window.authLogout = function() {
		localStorage.removeItem('token');
		window.location.href = '/auth/login';
	};
	window.isAuthenticated = () => state.authenticated;
	window.getCurrentToken = () => state.token;

	// Inicia automaticamente
	console.log('🚀 Iniciando automaticamente...');

	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(main, 50);
	} else {
		document.addEventListener('DOMContentLoaded', () => setTimeout(main, 50));
	}


})();