// register.js - VERSÃO FINAL PARA CADASTRO INDEPENDENTE E POR LINK
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Limpa erros anteriores
            clearFormErrors();
            
            // Obter valores dos campos
            const nome = document.getElementById("nome").value.trim();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;
            const confirmarSenha = document.getElementById("confirmarSenha").value;
            const telefone = document.getElementById("telefone") ? document.getElementById("telefone").value.trim() : "";
            
            // Validações
            let isValid = true;
            
            if (!nome) {
                showFieldError("nome", "O nome é obrigatório");
                isValid = false;
            } else if (nome.length < 3) {
                showFieldError("nome", "O nome deve ter pelo menos 3 caracteres");
                isValid = false;
            }
            
            if (!email) {
                showFieldError("email", "O email é obrigatório");
                isValid = false;
            } else if (!isValidEmail(email)) {
                showFieldError("email", "Email inválido");
                isValid = false;
            }
            
            if (!senha) {
                showFieldError("senha", "A senha é obrigatória");
                isValid = false;
            } else if (senha.length < 6) {
                showFieldError("senha", "A senha deve ter pelo menos 6 caracteres");
                isValid = false;
            }
            
            if (!confirmarSenha) {
                showFieldError("confirmarSenha", "Confirme sua senha");
                isValid = false;
            } else if (senha !== confirmarSenha) {
                showFieldError("confirmarSenha", "As senhas não coincidem");
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Desabilita botão e mostra loading
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Cadastrando...';
            
            try {
                // Dados para enviar
                const userData = {
                    nome: nome,
                    email: email,
                    senha: senha,
                    telefone: telefone || null
                };
                
                console.log("📤 Enviando dados para cadastro:", userData);
                
                // 🔥 DETECTA TIPO DE CADASTRO:
                const urlParams = new URLSearchParams(window.location.search);
                const referenciaId = urlParams.get('ref');
                const token = localStorage.getItem('token');
                
                let endpoint, mensagemTipo;
                
                // 🚫 IMPEDE CADASTRO DE ADMIN AQUI (esta página é só para público)
                if (token) {
                    console.warn("⚠️ Admin tentando cadastrar na página pública. Redirecionando...");
                    alert("Administradores devem usar o painel de controle para cadastrar usuários.");
                    window.location.href = "/admin/dashboard";
                    return;
                }
                
                if (referenciaId) {
                    // CASO 1: CADASTRO POR LINK DE INDICAÇÃO
                    console.log("🔗 Tipo: Cadastro por link de indicação");
                    
                    // Primeiro valida a referência
                    console.log("🔍 Validando referência:", referenciaId);
                    
                    try {
                        const validacaoResponse = await fetch(`/api/usuarios/validar-referencia/${referenciaId}`);
                        const validacaoData = await validacaoResponse.json();
                        
                        if (!validacaoData.valido) {
                            throw new Error(validacaoData.mensagem || "Link de referência inválido");
                        }
                        
                        console.log("✅ Referência válida:", validacaoData.nome);
                        
                        // Adiciona mensagem informativa
                        showInfoMessage(`Você está se cadastrando na rede de <strong>${validacaoData.nome}</strong>.`);
                        
                        // Usa endpoint de cadastro por link
                        endpoint = `/api/usuarios/cadastro-por-link/${referenciaId}`;
                        mensagemTipo = `na rede de ${validacaoData.nome}`;
                        
                    } catch (validacaoError) {
                        console.error("❌ Erro na validação da referência:", validacaoError);
                        
                        // Se a referência for inválida, cai para cadastro público
                        showInfoMessage("Link de convite inválido. Você será cadastrado na rede principal.");
                        endpoint = "/api/usuarios/cadastro-publico";
                        mensagemTipo = "na rede principal";
                    }
                } else {
                    // CASO 2: CADASTRO INDEPENDENTE (PÚBLICO)
                    console.log("🌐 Tipo: Cadastro independente (público)");
                    
                    // Mostra mensagem informativa
                    showInfoMessage("Você será cadastrado na rede principal como novo membro.");
                    
                    endpoint = "/api/usuarios/cadastro-publico";
                    mensagemTipo = "na rede principal";
                }
                
                console.log("📡 Usando endpoint:", endpoint);
                console.log("🎯 Tipo de cadastro:", mensagemTipo);
                
                // 🔥 ADICIONA LOG PARA DEBUG
                console.log("🔍 Verificando backend...");
                console.log("👉 Endpoint:", endpoint);
                console.log("👉 Dados:", userData);
                
                // Faz a requisição
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(userData)
                });
                
                // Verifica a resposta
                if (!response.ok) {
                    let errorMessage = `Erro ${response.status}`;
                    
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                        
                        // Mensagens específicas para erros comuns
                        if (errorMessage.includes("Email já cadastrado")) {
                            errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
                        } else if (errorMessage.includes("Não há usuários ativos no sistema")) {
                            errorMessage = "Sistema em manutenção. Tente novamente mais tarde.";
                        } else if (errorMessage.includes("Nenhum admin disponível")) {
                            errorMessage = "Sistema temporariamente indisponível. Contate o suporte.";
                        }
                        
                    } catch (parseError) {
                        errorMessage = `${errorMessage}: ${response.statusText}`;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                // Sucesso!
                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    result = { message: "Cadastro realizado com sucesso!" };
                }
                
                console.log("✅ Cadastro bem-sucedido:", result);
                console.log("🎉 Usuário cadastrado", mensagemTipo);
                
                // 🔥 ADICIONA LOG ESPECÍFICO PARA CADASTRO INDEPENDENTE
                if (!referenciaId) {
                    console.log("🏆 CADASTRO INDEPENDENTE REALIZADO!");
                    console.log("👉 O admin padrão foi automaticamente definido como pai.");
                    console.log("👉 Novo usuário pode fazer login normalmente.");
                }
                
                // Mostra mensagem de sucesso
                const mensagemSucesso = referenciaId 
                    ? `✅ Cadastro realizado com sucesso! Você agora faz parte da rede de ${mensagemTipo.split('de ')[1]}. Redirecionando para login...`
                    : `✅ Cadastro realizado com sucesso! Você agora faz parte ${mensagemTipo}. Redirecionando para login...`;
                
                showSuccessMessage(mensagemSucesso);
                
                // Redireciona para login após 3 segundos
                setTimeout(() => {
                    window.location.href = "/auth/login?cadastro=success";
                }, 3000);
                
            } catch (error) {
                console.error("❌ Erro no cadastro:", error);
                
                // Mostra erro no formulário
                showFormError(error.message || "Erro ao realizar cadastro. Tente novamente.");
                
                // Restaura botão
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // 🔥 FUNÇÃO MELHORADA: Mostrar mensagem informativa
    function showInfoMessage(message) {
        // Remove mensagem anterior se existir
        const oldInfo = document.getElementById("infoMessage");
        if (oldInfo) oldInfo.remove();
        
        // Cria nova mensagem
        const infoDiv = document.createElement("div");
        infoDiv.id = "infoMessage";
        infoDiv.className = "alert alert-info mb-3";
        infoDiv.innerHTML = `<i class="bi bi-info-circle me-2"></i> ${message}`;
        
        // Insere no início do formulário
        const form = document.getElementById("registerForm");
        if (form) {
            const firstChild = form.firstChild;
            if (firstChild) {
                form.insertBefore(infoDiv, firstChild);
            } else {
                form.appendChild(infoDiv);
            }
        }
    }
    
    // Função para mostrar erro em campo específico
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add("is-invalid");
            
            let errorDiv = field.nextElementSibling;
            if (!errorDiv || !errorDiv.classList.contains("invalid-feedback")) {
                errorDiv = document.createElement("div");
                errorDiv.className = "invalid-feedback";
                field.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
        }
    }
    
    // Função para mostrar erro geral no formulário
    function showFormError(message) {
        const errorDiv = document.getElementById("formErrors");
        const errorMessage = document.getElementById("errorMessage");
        
        if (errorDiv && errorMessage) {
            errorMessage.textContent = message;
            errorDiv.classList.remove("d-none");
        } else {
            // Fallback: cria elemento se não existir
            let formErrorDiv = document.getElementById("formErrors");
            if (!formErrorDiv) {
                formErrorDiv = document.createElement("div");
                formErrorDiv.id = "formErrors";
                formErrorDiv.className = "alert alert-danger";
                
                const errorSpan = document.createElement("span");
                errorSpan.id = "errorMessage";
                formErrorDiv.appendChild(errorSpan);
                
                const form = document.getElementById("registerForm");
                if (form) {
                    form.insertBefore(formErrorDiv, form.firstChild);
                }
            }
            document.getElementById("errorMessage").textContent = message;
            formErrorDiv.classList.remove("d-none");
        }
    }
    
    // Função para mostrar mensagem de sucesso
    function showSuccessMessage(message) {
        // Remove qualquer erro
        clearFormErrors();
        
        // Remove mensagem de informação se existir
        const infoDiv = document.getElementById("infoMessage");
        if (infoDiv) infoDiv.remove();
        
        // Cria elemento de sucesso se não existir
        let successDiv = document.getElementById("successMessage");
        if (!successDiv) {
            successDiv = document.createElement("div");
            successDiv.id = "successMessage";
            successDiv.className = "alert alert-success";
            
            const form = document.getElementById("registerForm");
            if (form) {
                form.insertBefore(successDiv, form.firstChild);
            }
        }
        
        successDiv.innerHTML = `<i class="bi bi-check-circle me-2"></i> ${message}`;
        successDiv.classList.remove("d-none");
        
        // Desabilita todos os campos do formulário
        document.querySelectorAll('#registerForm input, #registerForm button').forEach(el => {
            if (el.type !== 'button') {
                el.disabled = true;
            }
        });
    }
    
    // Função para limpar todos os erros
    function clearFormErrors() {
        // Limpa erros de campos
        document.querySelectorAll(".is-invalid").forEach(el => {
            el.classList.remove("is-invalid");
        });
        
        // Remove mensagens de erro
        document.querySelectorAll(".invalid-feedback").forEach(el => {
            el.textContent = "";
        });
        
        // Esconde mensagem geral de erro
        const errorDiv = document.getElementById("formErrors");
        if (errorDiv) {
            errorDiv.classList.add("d-none");
        }
    }
    
    // Função para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 🔥 FUNÇÃO MELHORADA: Verificar link de referência ao carregar a página
    function verificarReferenciaAoCarregar() {
        const urlParams = new URLSearchParams(window.location.search);
        const referenciaId = urlParams.get('ref');
        const token = localStorage.getItem('token');
        
        // Se estiver logado como admin, redireciona
        if (token) {
            console.log("🔐 Admin detectado na página de cadastro público. Redirecionando...");
            setTimeout(() => {
                window.location.href = "/admin/dashboard";
            }, 1000);
            return;
        }
        
        if (referenciaId) {
            console.log("🔍 Verificando referência ao carregar:", referenciaId);
            
            // Valida a referência
            fetch(`/api/usuarios/validar-referencia/${referenciaId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.valido) {
                        showInfoMessage(`Você foi convidado por <strong>${data.nome}</strong>. Complete seu cadastro para fazer parte da rede!`);
                        
                        // Atualiza título da página
                        const titulo = document.querySelector('h2, .card-title');
                        if (titulo && !titulo.innerHTML.includes("Convidado")) {
                            titulo.innerHTML = `<i class="bi bi-gift"></i> Cadastro por Convite`;
                        }
                    } else {
                        showInfoMessage(`Link de convite inválido. Você será cadastrado na rede principal.`);
                        console.warn("Link de referência inválido:", data.mensagem);
                    }
                })
                .catch(err => {
                    console.error("Erro ao validar referência:", err);
                    showInfoMessage("Erro ao validar convite. Você será cadastrado na rede principal.");
                });
        } else {
            // CADASTRO INDEPENDENTE - Mostra mensagem padrão
            showInfoMessage("Cadastre-se para fazer parte da nossa rede. O administrador principal será definido como seu superior.");
        }
    }
    
    // Validação em tempo real
    function setupRealTimeValidation() {
        // Validação do email
        const emailInput = document.getElementById("email");
        if (emailInput) {
            emailInput.addEventListener("blur", () => {
                const email = emailInput.value.trim();
                if (email && !isValidEmail(email)) {
                    showFieldError("email", "Email inválido");
                } else {
                    clearFieldError("email");
                }
            });
        }
        
        // Validação da senha
        const senhaInput = document.getElementById("senha");
        if (senhaInput) {
            senhaInput.addEventListener("input", () => {
                if (senhaInput.value.length > 0 && senhaInput.value.length < 6) {
                    showFieldError("senha", "A senha deve ter pelo menos 6 caracteres");
                } else {
                    clearFieldError("senha");
                }
            });
        }
        
        // Validação da confirmação de senha
        const confirmarSenhaInput = document.getElementById("confirmarSenha");
        if (confirmarSenhaInput && senhaInput) {
            confirmarSenhaInput.addEventListener("input", () => {
                if (confirmarSenhaInput.value && confirmarSenhaInput.value !== senhaInput.value) {
                    showFieldError("confirmarSenha", "As senhas não coincidem");
                } else {
                    clearFieldError("confirmarSenha");
                }
            });
        }
        
        // Validação do nome
        const nomeInput = document.getElementById("nome");
        if (nomeInput) {
            nomeInput.addEventListener("blur", () => {
                const nome = nomeInput.value.trim();
                if (nome && nome.length < 3) {
                    showFieldError("nome", "O nome deve ter pelo menos 3 caracteres");
                } else {
                    clearFieldError("nome");
                }
            });
        }
    }
    
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove("is-invalid");
        }
    }
    
    // Inicialização
    setupRealTimeValidation();
    verificarReferenciaAoCarregar();
    
    // 🔥 FUNÇÃO NOVA: Adiciona máscara ao telefone se o campo existir
    const telefoneInput = document.getElementById("telefone");
    if (telefoneInput) {
        telefoneInput.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = `(${value}`;
                } else if (value.length <= 7) {
                    value = `(${value.substring(0,2)}) ${value.substring(2)}`;
                } else {
                    value = `(${value.substring(0,2)}) ${value.substring(2,7)}-${value.substring(7,11)}`;
                }
            }
            
            e.target.value = value;
        });
    }
    
    // 🔥 ADICIONA: Verifica se veio de redirecionamento com sucesso
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('cadastro') && urlParams.get('cadastro') === 'success') {
        showSuccessMessage("Cadastro realizado com sucesso! Faça login para acessar sua conta.");
        
        // Remove o parâmetro da URL sem recarregar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
});