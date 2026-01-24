// main.js - VERSÃO MELHORADA
console.log("MultiAmigos - main.js carregado");

// INTERCEPTADOR GLOBAL para token JWT
(function() {
	const originalFetch = window.fetch;

	window.fetch = function(resource, options = {}) {
		const token = localStorage.getItem("token");

		if (token && resource && typeof resource === 'string') {
			// Para todas as requisições locais
			if (resource.startsWith('/') || resource.includes('localhost:8080')) {
				options.headers = {
					...options.headers,
					"Authorization": `Bearer ${token}`
				};

				// 🔥 TAMBÉM adiciona como parâmetro para páginas HTML
				if (resource.includes('.html') ||
					resource === '/admin/dashboard' ||
					resource === '/') {

					// Adiciona token como parâmetro na URL
					const separator = resource.includes('?') ? '&' : '?';
					resource = resource + separator + 'token=' + encodeURIComponent(token);
				}
			}
		}

		console.log(`📤 Fetch: ${options.method || 'GET'} ${resource.substring(0, 100)}`);
		return originalFetch.call(this, resource, options);
	};
})();

// 🔥 NOVA FUNÇÃO: Força envio do token ao carregar páginas protegidas
function setupTokenForProtectedPages() {
	const token = localStorage.getItem("token");
	const currentPath = window.location.pathname;
	const protectedPaths = ['/admin/', '/dashboard'];

	const isProtectedPath = protectedPaths.some(path => currentPath.includes(path));

	if (token && isProtectedPath) {
		console.log('🔐 Detectada página protegida com token disponível');

		// Adiciona token à URL atual se não tiver
		const urlParams = new URLSearchParams(window.location.search);
		if (!urlParams.has('token')) {
			const newUrl = window.location.pathname + '?token=' + encodeURIComponent(token);
			window.history.replaceState({}, document.title, newUrl);
			console.log('✅ Token adicionado à URL:', newUrl.substring(0, 80));
		}

		// 🔥 FAZ UMA REQUISIÇÃO DE VALIDAÇÃO IMEDIATA
		fetch('/auth/validate', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		})
			.then(response => {
				if (response.ok) {
					console.log('✅ Token válido na carga da página');
					return response.json();
				} else {
					console.warn('⚠️ Token não validado no preload, mantendo sessão');
					return null;
				}
			})
			.then(data => {
				if (data) {
					console.log('👤 Usuário autenticado:', data.email);
				}
			})
			.catch(error => {
				console.error('❌ Erro na validação:', error.message);
			});


		// Atualiza navbar baseado no estado de login
		// Atualiza navbar baseado no estado de login
		function updateNavbarForLogin() {
			const token = localStorage.getItem("token");
			const currentPath = window.location.pathname;

			console.log("Atualizando navbar. Token:", token ? "Presente" : "Ausente");
			console.log("Path atual:", currentPath);

			// Só atualiza na home (/), login ou register
			if (currentPath !== '/' &&
				!currentPath.includes('/auth/login') &&
				!currentPath.includes('/auth/register') &&
				!currentPath.includes('/public/')) {
				console.log("❌ Não é página pública, ignorando atualização de navbar");
				return;
			}

			const navbarNav = document.querySelector(".navbar-nav");
			if (!navbarNav) {
				console.log("❌ Navbar não encontrada");
				return;
			}

			// Remove links existentes de dashboard/logout
			const existingDashboard = document.querySelector("#dashboardNavItem");
			const existingLogout = document.querySelector("#logoutNavItem");

			if (existingDashboard) existingDashboard.remove();
			if (existingLogout) existingLogout.remove();

			if (token) {
				console.log("👤 Usuário LOGADO - configurando navbar...");

				// Usuário logado - mostra Dashboard
				const dashboardItem = document.createElement("li");
				dashboardItem.className = "nav-item";
				dashboardItem.id = "dashboardNavItem";
				dashboardItem.innerHTML = `
            <a class="nav-link text-success fw-bold" href="#" onclick="goToDashboardFromHome(); return false;">
                <i class="bi bi-speedometer2"></i> Dashboard Admin
            </a>
        `;
				navbarNav.prepend(dashboardItem);

				// Substitui link de Login por Logout
				const loginLinks = document.querySelectorAll('a.nav-link');
				loginLinks.forEach(link => {
					if (link.textContent.trim() === "Login" ||
						(link.getAttribute('href') && link.getAttribute('href').includes('/auth/login'))) {

						link.textContent = "Sair";
						link.href = "#";
						link.classList.remove('active', 'text-white');
						link.classList.add('text-danger', 'fw-bold');

						// Remove eventos antigos
						link.onclick = null;

						// Adiciona novo evento de logout
						link.addEventListener('click', function(e) {
							e.preventDefault();
							if (confirm("Deseja realmente sair do sistema?")) {
								localStorage.removeItem("token");

								// Limpa sessionStorage também
								sessionStorage.removeItem('dashboard_token');
								sessionStorage.removeItem('jwt_token');
								sessionStorage.removeItem('busca_token');

								// Redireciona para home
								window.location.href = "/";
							}
						});

						console.log("✅ Link Login → Sair configurado");
					}
				});
			}
		}
		// Também atualiza botões na hero section
		const heroButtons = document.querySelectorAll('.hero-section .btn, .btn[href*="/auth/login"]');
		heroButtons.forEach(btn => {
			if (btn.textContent.includes('Login') ||
				btn.textContent.includes('Entrar') ||
				(btn.getAttribute('href') && btn.getAttribute('href').includes('/auth/login'))) {

				btn.textContent = 'Dashboard Admin';
				btn.removeAttribute('href');

				// Remove eventos antigos
				btn.onclick = null;

				// Adiciona novo evento
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					goToDashboardFromHome();
				});

				btn.classList.remove('btn-light', 'btn-outline-light');
				btn.classList.add('btn-success', 'fw-bold');

				console.log("✅ Botão Login → Dashboard configurado");
			}
		});

	} else {
		console.log("👤 Usuário NÃO LOGADO - configurando navbar...");

		// Usuário não logado - garante que Login está visível
		const navLinks = document.querySelectorAll('a.nav-link');
		navLinks.forEach(link => {
			if (link.textContent.trim() === "Sair" ||
				link.textContent.trim() === "Logout" ||
				link.classList.contains('text-danger')) {

				link.textContent = "Login";
				link.href = "/auth/login";
				link.classList.remove('text-danger', 'fw-bold');
				link.classList.add('text-white');
				link.onclick = null; // Remove o evento

				console.log("✅ Link Sair → Login configurado");
			}
		});

		// Reseta botões da hero section
		const heroButtons = document.querySelectorAll('.hero-section .btn, .btn-success[onclick*="goToDashboard"]');
		heroButtons.forEach(btn => {
			if (btn.textContent.includes('Dashboard') ||
				btn.textContent.includes('Admin')) {

				btn.textContent = 'Login / Entrar';
				btn.setAttribute('href', '/auth/login');
				btn.classList.remove('btn-success', 'fw-bold');
				btn.classList.add('btn-light');

				// Remove evento de dashboard
				btn.onclick = null;

				console.log("✅ Botão Dashboard → Login configurado");
			}
		});

		// Se estiver na página de login, destaca o item do menu
		if (currentPath.includes('/auth/login')) {
			navLinks.forEach(link => {
				if (link.textContent.trim() === "Login" ||
					link.getAttribute('href') === '/auth/login') {
					link.classList.add('active');
				}
			});
		}
	}

	console.log("✅ Navbar atualizada com sucesso");
}

// Função para ir ao dashboard COM SEGURANÇA
function goToDashboardFromHome() {
	const token = localStorage.getItem("token");
	if (!token) {
		alert("Faça login primeiro!");
		window.location.href = "/auth/login";
		return;
	}

	console.log('🚀 Navegando para dashboard com token...');

	// 🔥 Usa navegação normal com token na URL
	window.location.href = `/admin/dashboard?token=${encodeURIComponent(token)}`;
}

// Executa quando o DOM carrega
document.addEventListener('DOMContentLoaded', function() {
	console.log("DOM carregado - inicializando...");

	// 🔥 Configura token para páginas protegidas
	setupTokenForProtectedPages();

	// Atualiza navbar
	updateNavbarForLogin();

	// Botão de logout se existir na página (apenas páginas não-admin)
	const logoutBtn = document.getElementById("logoutBtn");
	if (logoutBtn && !window.location.pathname.includes('/admin/')) {
		logoutBtn.addEventListener("click", function(e) {
			e.preventDefault();
			if (confirm("Deseja realmente sair?")) {
				localStorage.removeItem("token");
				window.location.href = "/";
			}
		});
	}
});

// Atualiza navbar periodicamente
setInterval(updateNavbarForLogin, 3000);