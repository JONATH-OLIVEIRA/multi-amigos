// login.js - VERSÃO FINAL COM DETECÇÃO DE PERFIL
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const token = localStorage.getItem("token");

    // Se já tem token e está na página de login
    if (token && window.location.pathname === "/auth/login") {
        console.log("🔄 Usuário já logado, validando token...");
        
        // Primeiro valida token para saber perfil
        fetch('/auth/validate', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Token inválido');
        })
        .then(userData => {
            console.log("✅ Token válido! Perfil:", userData.isAdmin ? 'ADMIN' : 'USUARIO');
            
            // Decide dashboard baseado no perfil
            const dashboardUrl = userData.isAdmin ? '/admin/dashboard' : '/usuario/dashboard';
            console.log(`📍 Redirecionando para: ${dashboardUrl}`);
            
            // Carrega dashboard correto
            return fetch(dashboardUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        })
        .then(response => {
            if (!response.ok) throw new Error(`Erro ${response.status}`);
            return response.text();
        })
        .then(html => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(() => {
            localStorage.removeItem('token');
            showLoggedInOptions();
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;

            if (!email || !senha) {
                alert("Por favor, preencha todos os campos!");
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Entrando...';

            try {
                console.log("📤 Enviando credenciais...");
                
                // 1. Faz login
                const res = await fetch("/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha })
                });

                if (!res.ok) {
                    throw new Error("Login falhou! Verifique email e senha.");
                }

                const data = await res.json();
                const token = data.token;
                const perfil = data.perfil; // 🔥 AGORA TEM PERFIL!
                
                console.log("✅ Login bem-sucedido!");
                console.log("📊 Dados recebidos:", data);
                console.log("🎭 Perfil detectado:", perfil);
                
                localStorage.setItem("token", token);
                localStorage.setItem("perfil", perfil); // Salva perfil também

                // 2. Decide para qual dashboard redirecionar
                let dashboardUrl;
                if (perfil === 'ADMIN') {
                    dashboardUrl = '/admin/dashboard';
                    console.log("👑 Redirecionando ADMIN para:", dashboardUrl);
                } else {
                    dashboardUrl = '/usuario/dashboard';
                    console.log("👤 Redirecionando USUÁRIO para:", dashboardUrl);
                }

                // 3. Carrega dashboard correto
                console.log(`🚀 Carregando: ${dashboardUrl}`);
                
                const dashboardRes = await fetch(dashboardUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log(`📊 Status do dashboard: ${dashboardRes.status}`);
                
                if (!dashboardRes.ok) {
                    if (dashboardRes.status === 404) {
                        throw new Error(`Página ${dashboardUrl} não encontrada!`);
                    }
                    throw new Error(`Erro ${dashboardRes.status} ao acessar dashboard`);
                }

                const html = await dashboardRes.text();
                
                // Substitui TODO o conteúdo da página atual
                document.open();
                document.write(html);
                document.close();
                
                // Atualiza a URL no histórico
                window.history.pushState({}, '', dashboardUrl);
                
                console.log(`✅ Dashboard ${dashboardUrl} carregado com sucesso!`);

            } catch (err) {
                console.error("❌ Erro no login:", err);
                alert("Erro: " + err.message);
                submitBtn.disabled = false;
                submitBtn.textContent = "Entrar";
            }
        });
    }

    function showLoggedInOptions() {
        const container = document.querySelector('.card');
        if (container && !document.querySelector('#loggedInMsg')) {
            const div = document.createElement('div');
            div.id = 'loggedInMsg';
            div.className = 'alert alert-info mt-3';
            div.innerHTML = `
                <p><strong>Sessão expirada ou inválida</strong></p>
                <p>Faça login novamente.</p>
            `;
            container.appendChild(div);
        }
    }
});

// Funções globais
async function goToDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Faça login primeiro!");
        window.location.href = "/auth/login";
        return;
    }

    try {
        // Valida token para saber perfil
        const validateRes = await fetch('/auth/validate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!validateRes.ok) {
            throw new Error('Token inválido ou expirado');
        }

        const userData = await validateRes.json();
        const dashboardUrl = userData.isAdmin ? '/admin/dashboard' : '/usuario/dashboard';
        
        console.log(`📍 Indo para dashboard: ${dashboardUrl}`);

        // Carrega dashboard
        const response = await fetch(dashboardUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        document.open();
        document.write(html);
        document.close();
        window.history.pushState({}, '', dashboardUrl);

    } catch (err) {
        console.error("❌ Erro ao ir para dashboard:", err);
        alert("Erro: " + err.message);
        localStorage.removeItem('token');
        window.location.href = "/auth/login";
    }
}

function logout() {
    if (confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('perfil');
        window.location.href = "/";
    }
}