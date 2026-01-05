// login.js - VERSÃO FINAL CORRIGIDA
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const token = localStorage.getItem("token");

    // Se já tem token e está na página de login
    if (token && window.location.pathname === "/auth/login") {
        console.log("Usuário já logado, testando token...");

        // Testa se o token ainda é válido
        fetch('/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.ok) {
                    // Token válido - Carrega dashboard via AJAX com token
                    console.log("✅ Token válido, carregando dashboard...");
                    return response.text();
                } else {
                    // Token inválido - remove e mostra opção de login
                    throw new Error('Token inválido');
                }
            })
            .then(html => {
                // Substitui o conteúdo da página com o dashboard
                document.open();
                document.write(html);
                document.close();
                // Atualiza URL no histórico
                window.history.pushState({}, '', '/admin/dashboard');
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
                const res = await fetch("/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha })
                });

                if (!res.ok) {
                    throw new Error("Login falhou!");
                }

                const data = await res.json();
                localStorage.setItem("token", data.token);

                console.log("✅ Login bem-sucedido! Carregando dashboard...");
                
                // 🔥 CORREÇÃO: Carrega dashboard VIA AJAX com token
                fetch('/admin/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                })
                .then(response => {
                    console.log("Dashboard response status:", response.status);
                    
                    if (response.status === 403) {
                        throw new Error('403 - Acesso negado! Verifique se você é ADMIN.');
                    }
                    if (response.status === 401) {
                        throw new Error('401 - Token inválido ou expirado.');
                    }
                    if (!response.ok) {
                        throw new Error(`Erro ${response.status}: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(html => {
                    // Substitui TODO o conteúdo da página atual
                    document.open();
                    document.write(html);
                    document.close();
                    
                    // Atualiza a URL no histórico do navegador
                    window.history.pushState({}, '', '/admin/dashboard');
                    
                    console.log("✅ Dashboard carregado com sucesso!");
                })
                .catch(err => {
                    console.error("❌ Erro ao carregar dashboard:", err);
                    alert("Erro: " + err.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Entrar";
                });

            } catch (err) {
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
function goToDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Faça login primeiro!");
        window.location.href = "/auth/login";
        return;
    }

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

function logout() {
    if (confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        window.location.href = "/";
    }
}