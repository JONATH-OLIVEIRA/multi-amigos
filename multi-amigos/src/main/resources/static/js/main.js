// main.js - Versão corrigida
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

// VERIFICAÇÃO DE TOKEN (apenas para páginas protegidas)
const token = localStorage.getItem("token");
const currentPath = window.location.pathname;

console.log("Path atual:", currentPath);
console.log("Token no localStorage:", token ? "Presente" : "Ausente");

// Se está em página protegida SEM token, redireciona para login
const protectedPaths = ['/admin/', '/dashboard', '/dashboard-loader.html'];
const isProtectedPath = protectedPaths.some(path => currentPath.includes(path));

if (!token && isProtectedPath) {
    console.log("Acesso negado: página protegida sem token");
    window.location.href = "/auth/login";
    // Opcional: adicionar mensagem na URL
    // window.location.href = "/auth/login?error=no_token";
}

// NÃO redireciona automaticamente se tiver token e estiver na página de login
// Deixa o usuário decidir se quer fazer logout ou não

// Botão de logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("Logout realizado com sucesso!");
            window.location.href = "/";
        });
    }
    
    // Atualiza navbar se usuário estiver logado
    if (token) {
        // Adiciona link para dashboard no navbar
        const navbarNav = document.querySelector(".navbar-nav");
        if (navbarNav && !document.querySelector("#dashboardNavItem")) {
            const dashboardItem = document.createElement("li");
            dashboardItem.className = "nav-item";
            dashboardItem.id = "dashboardNavItem";
            dashboardItem.innerHTML = `
                <a class="nav-link" href="/dashboard-loader.html" style="color: #90ee90;">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            `;
            navbarNav.prepend(dashboardItem);
            
            // Substitui login por logout
            const loginLink = document.querySelector('a[href*="/auth/login"]');
            if (loginLink) {
                loginLink.textContent = "Logout";
                loginLink.href = "#";
                loginLink.onclick = function(e) {
                    e.preventDefault();
                    localStorage.removeItem("token");
                    window.location.href = "/";
                };
            }
        }
    }
});