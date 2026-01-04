// login.js - SOLUÇÃO FINAL (use este código EXATO)
document.addEventListener("DOMContentLoaded", () => {
    
    const loginForm = document.getElementById("loginForm");
    const token = localStorage.getItem("token");
    
    // Se já tem token, vai direto para o dashboard
    if (token && window.location.pathname === "/auth/login") {
        console.log("Já logado, redirecionando para dashboard...");
        // ENVIA O TOKEN VIA AJAX PRIMEIRO
        fetch('/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                // Se deu certo, carrega a página
                return response.text();
            }
            throw new Error(`Erro ${response.status}`);
        })
        .then(html => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(err => {
            console.error("Erro:", err);
            // Se deu erro, mostra opção de logout
            showLoggedInOptions();
        });
    } else if (token) {
        // Se está em outra página e tem token, mostra opções
        showLoggedInOptions();
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
                
                // 🔥 SOLUÇÃO: Carrega o dashboard VIA AJAX com token
                fetch('/admin/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
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
                })
                .catch(err => {
                    alert("Erro ao carregar dashboard: " + err.message);
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
                <p><strong>Você já está logado!</strong></p>
                <button onclick="goToDashboard()" class="btn btn-success btn-sm">
                    Ir para Dashboard
                </button>
                <button onclick="logout()" class="btn btn-outline-danger btn-sm ms-2">
                    Sair
                </button>
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
    })
    .catch(err => {
        alert("Erro: " + err.message);
    });
}

function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}