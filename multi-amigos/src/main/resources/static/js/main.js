// main.js - VERSÃO FINAL CORRIGIDA
console.log("MultiAmigos - main.js carregado");

// INTERCEPTADOR GLOBAL para token JWT
(function() {
    const originalFetch = window.fetch;
    
    window.fetch = function(resource, options = {}) {
        const token = localStorage.getItem("token");
        
        if (token && resource && typeof resource === 'string') {
            if (resource.startsWith('/') || resource.includes('localhost:8080')) {
                options.headers = {
                    ...options.headers,
                    "Authorization": `Bearer ${token}`
                };
            }
        }
        
        return originalFetch.call(this, resource, options);
    };
})();

// Atualiza navbar baseado no estado de login
function updateNavbarForLogin() {
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
    
    console.log("Atualizando navbar. Token:", token ? "Presente" : "Ausente");
    console.log("Path atual:", currentPath);
    
    // Só atualiza na home (/) ou login page
    if (!currentPath.includes('/') && !currentPath.includes('/auth/login')) {
        return;
    }
    
    const navbarNav = document.querySelector(".navbar-nav");
    if (!navbarNav) return;
    
    // Remove links existentes de dashboard/logout
    const existingDashboard = document.querySelector("#dashboardNavItem");
    const existingLogout = document.querySelector("#logoutNavItem");
    
    if (existingDashboard) existingDashboard.remove();
    if (existingLogout) existingLogout.remove();
    
    if (token) {
        // Usuário logado - mostra Dashboard
        const dashboardItem = document.createElement("li");
        dashboardItem.className = "nav-item";
        dashboardItem.id = "dashboardNavItem";
        dashboardItem.innerHTML = `
            <a class="nav-link text-success fw-bold" href="#" onclick="goToDashboardFromHome()">
                <i class="bi bi-speedometer2"></i> Dashboard
            </a>
        `;
        navbarNav.prepend(dashboardItem);
        
        // Substitui link de Login por Logout
        const loginLinks = document.querySelectorAll('a.nav-link[href*="/auth/login"]');
        loginLinks.forEach(link => {
            if (!link.onclick) { // Evita adicionar múltiplas vezes
                link.textContent = "Logout";
                link.href = "#";
                link.classList.remove('active');
                link.classList.add('text-danger');
                link.onclick = function(e) {
                    e.preventDefault();
                    if (confirm("Deseja realmente sair?")) {
                        localStorage.removeItem("token");
                        window.location.href = "/";
                    }
                };
            }
        });
        
        // Também atualiza botões na hero section
        const heroButtons = document.querySelectorAll('.hero-section .btn');
        heroButtons.forEach(btn => {
            if (btn.textContent.includes('Login') || (btn.getAttribute('href') && btn.getAttribute('href').includes('login'))) {
                btn.textContent = 'Dashboard';
                btn.setAttribute('onclick', 'goToDashboardFromHome(); return false;');
                btn.classList.remove('btn-light');
                btn.classList.add('btn-success');
            }
        });
        
    } else {
        // Usuário não logado - garante que Login está visível
        const loginLinks = document.querySelectorAll('a.nav-link[href*="#"]');
        loginLinks.forEach(link => {
            if (link.textContent === "Logout") {
                link.textContent = "Login";
                link.href = "/auth/login";
                link.classList.remove('text-danger');
                link.classList.add('text-white');
                link.onclick = null; // Remove o evento
            }
        });
        
        // Reseta botões da hero section
        const heroButtons = document.querySelectorAll('.hero-section .btn');
        heroButtons.forEach(btn => {
            if (btn.textContent === 'Dashboard') {
                btn.textContent = 'Login';
                btn.setAttribute('href', '/auth/login');
                btn.classList.remove('btn-success');
                btn.classList.add('btn-light');
                btn.onclick = null;
            }
        });
    }
}

// Função específica para ir para dashboard da home page
function goToDashboardFromHome() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Faça login primeiro!");
        window.location.href = "/auth/login";
        return;
    }
    
    // Carrega dashboard via AJAX
    fetch('/admin/dashboard', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error(`Erro ${response.status}`);
    })
    .then(html => {
        document.open();
        document.write(html);
        document.close();
        window.history.pushState({}, '', '/admin/dashboard');
    })
    .catch(err => {
        alert("Erro: " + err.message);
    });
}

// Executa quando o DOM carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - inicializando...");
    
    // Atualiza navbar
    updateNavbarForLogin();
    
    // Verifica se está tentando acessar página protegida sem token
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
    const protectedPaths = ['/admin/', '/dashboard'];
    
    const isProtectedPath = protectedPaths.some(path => currentPath.includes(path));
    
    // Apenas se estiver em página protegida e não tiver token
    if (!token && isProtectedPath && !currentPath.includes('/auth/login')) {
        console.log("Acesso negado: página protegida sem token");
        window.location.href = "/auth/login?error=no_token&redirect=" + encodeURIComponent(currentPath);
    }
    
    // Botão de logout se existir na página
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm("Deseja realmente sair?")) {
                localStorage.removeItem("token");
                window.location.href = "/";
            }
        });
    }
    
    // Verifica se veio de redirecionamento com erro
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error') && urlParams.get('error') === 'no_token') {
        const redirectUrl = urlParams.get('redirect');
        const message = redirectUrl ? 
            `Faça login para acessar: ${decodeURIComponent(redirectUrl)}` :
            'Faça login para continuar';
        
        // Mostra alerta temporário
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '500px';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        // Remove após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
});

// Atualiza navbar periodicamente (para caso de múltiplas abas)
setInterval(updateNavbarForLogin, 3000);