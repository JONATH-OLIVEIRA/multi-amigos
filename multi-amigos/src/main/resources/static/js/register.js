// register.js - CADASTRO INDEPENDENTE E POR LINK (cookie mode, sem localStorage token)

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  // ==============================
  // Helper cookie fetch
  // ==============================
  async function apiFetch(url, options = {}) {
    const opts = {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    };
    return fetch(url, opts);
  }

  async function getSession() {
    try {
      const res = await apiFetch("/auth/validate");
      if (!res.ok) return { authenticated: false };
      return await res.json(); // { authenticated, role, ... }
    } catch {
      return { authenticated: false };
    }
  }

  // ==============================
  // UI helpers
  // ==============================
  function showInfoMessage(message) {
    const oldInfo = document.getElementById("infoMessage");
    if (oldInfo) oldInfo.remove();

    const infoDiv = document.createElement("div");
    infoDiv.id = "infoMessage";
    infoDiv.className = "alert alert-info mb-3";
    infoDiv.innerHTML = `<i class="bi bi-info-circle me-2"></i> ${message}`;

    const form = document.getElementById("registerForm");
    if (form) {
      form.insertBefore(infoDiv, form.firstChild);
    }
  }

  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add("is-invalid");

    let errorDiv = field.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains("invalid-feedback")) {
      errorDiv = document.createElement("div");
      errorDiv.className = "invalid-feedback";
      field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.remove("is-invalid");
  }

  function showFormError(message) {
    let errorDiv = document.getElementById("formErrors");
    let errorMessage = document.getElementById("errorMessage");

    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.id = "formErrors";
      errorDiv.className = "alert alert-danger";

      errorMessage = document.createElement("span");
      errorMessage.id = "errorMessage";
      errorDiv.appendChild(errorMessage);

      const form = document.getElementById("registerForm");
      if (form) form.insertBefore(errorDiv, form.firstChild);
    }

    errorMessage.textContent = message;
    errorDiv.classList.remove("d-none");
  }

  function showSuccessMessage(message) {
    clearFormErrors();
    document.getElementById("infoMessage")?.remove();

    let successDiv = document.getElementById("successMessage");
    if (!successDiv) {
      successDiv = document.createElement("div");
      successDiv.id = "successMessage";
      successDiv.className = "alert alert-success";
      const form = document.getElementById("registerForm");
      if (form) form.insertBefore(successDiv, form.firstChild);
    }

    successDiv.innerHTML = `<i class="bi bi-check-circle me-2"></i> ${message}`;
    successDiv.classList.remove("d-none");

    document.querySelectorAll("#registerForm input, #registerForm button").forEach((el) => {
      if (el.type !== "button") el.disabled = true;
    });
  }

  function clearFormErrors() {
    document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    document.querySelectorAll(".invalid-feedback").forEach((el) => (el.textContent = ""));
    document.getElementById("formErrors")?.classList.add("d-none");
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 🔥 FUNÇÃO PARA NORMALIZAR TELEFONE (APENAS NÚMEROS)
  function normalizeTelefone(telefone) {
    if (!telefone) return "";
    // Remove todos os caracteres não numéricos
    return telefone.replace(/\D/g, "");
  }

  // 🔥 FUNÇÃO PARA APLICAR MÁSCARA DE TELEFONE
  function aplicarMascaraTelefone(valor) {
    let numbers = valor.replace(/\D/g, "");
    let formatted = "";

    if (numbers.length > 0) {
      // DDD
      if (numbers.length <= 2) {
        formatted = `(${numbers}`;
      } 
      // DDD + primeiros dígitos
      else if (numbers.length <= 7) {
        formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
      } 
      // DDD + 8 ou 9 dígitos + traço
      else {
        if (numbers.length <= 10) {
          // Telefone fixo: (11) 9999-9999
          formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6, 10)}`;
        } else {
          // Celular: (11) 99999-9999
          formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
        }
      }
    }

    return formatted;
  }

  // ==============================
  // Checa referência e sessão (admin)
  // ==============================
  async function verificarReferenciaAoCarregar() {
    const urlParams = new URLSearchParams(window.location.search);
    const referenciaId = urlParams.get("ref");

    // 🚫 IMPEDE ADMIN logado de usar cadastro público
    const session = await getSession();
    if (session?.authenticated && session.role === "ADMIN") {
      console.log("🔐 Admin detectado na página de cadastro público. Redirecionando...");
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 300);
      return;
    }

    if (referenciaId) {
      console.log("🔍 Verificando referência ao carregar:", referenciaId);

      try {
        const r = await apiFetch(`/api/usuarios/validar-referencia/${referenciaId}`, { method: "GET" });
        const data = await r.json();

        if (data?.valido) {
          showInfoMessage(
            `Você foi convidado por <strong>${data.nome}</strong>. Complete seu cadastro para fazer parte da rede!`
          );

          const titulo = document.querySelector("h2, .card-title");
          if (titulo && !titulo.innerHTML.includes("Convite")) {
            titulo.innerHTML = `<i class="bi bi-gift"></i> Cadastro por Convite`;
          }
        } else {
          showInfoMessage("Link de convite inválido. Você será cadastrado na rede principal.");
          console.warn("Link inválido:", data?.mensagem);
        }
      } catch (err) {
        console.error("Erro ao validar referência:", err);
        showInfoMessage("Erro ao validar convite. Você será cadastrado na rede principal.");
      }
    } else {
      showInfoMessage("Cadastre-se para fazer parte da nossa rede. O administrador principal será definido como seu superior.");
    }
  }

  // ==============================
  // Submit cadastro
  // ==============================
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFormErrors();

      const nome = document.getElementById("nome")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const senha = document.getElementById("senha")?.value;
      const confirmarSenha = document.getElementById("confirmarSenha")?.value;
      const telefoneRaw = document.getElementById("telefone")?.value.trim() || "";
      
      // 🔥 NORMALIZA O TELEFONE (remove máscara, mantém apenas números)
      const telefone = normalizeTelefone(telefoneRaw);

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

      // 🔥 VALIDAÇÃO DO TELEFONE (se foi preenchido)
      if (telefone && telefone.length > 0) {
        if (telefone.length < 10) {
          showFieldError("telefone", "Telefone inválido. Deve conter DDD + número (mínimo 10 dígitos)");
          isValid = false;
        } else if (telefone.length > 11) {
          showFieldError("telefone", "Telefone inválido. Máximo 11 dígitos");
          isValid = false;
        }
      }

      if (!isValid) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.innerHTML || "Cadastrar";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Cadastrando...';
      }

      try {
        // 🚫 se admin estiver logado, bloqueia (double-check)
        const session = await getSession();
        if (session?.authenticated && session.role === "ADMIN") {
          alert("Administradores devem usar o painel para cadastrar usuários.");
          window.location.href = "/admin/dashboard";
          return;
        }

        const userData = {
          nome,
          email,
          senha,
          telefone: telefone || null,  // 🔥 ENVIA O TELEFONE NORMALIZADO (APENAS NÚMEROS)
        };

        const urlParams = new URLSearchParams(window.location.search);
        const referenciaId = urlParams.get("ref");

        let endpoint = "/api/usuarios/cadastro-publico";
        let mensagemTipo = "na rede principal";

        if (referenciaId) {
          try {
            const validacaoResponse = await apiFetch(`/api/usuarios/validar-referencia/${referenciaId}`);
            const validacaoData = await validacaoResponse.json();

            if (!validacaoData?.valido) {
              throw new Error(validacaoData?.mensagem || "Link de referência inválido");
            }

            showInfoMessage(`Você está se cadastrando na rede de <strong>${validacaoData.nome}</strong>.`);

            endpoint = `/api/usuarios/cadastro-por-link/${referenciaId}`;
            mensagemTipo = `na rede de ${validacaoData.nome}`;
          } catch (err) {
            console.warn("Convite inválido, caindo para cadastro público:", err?.message);
            showInfoMessage("Link de convite inválido. Você será cadastrado na rede principal.");
            endpoint = "/api/usuarios/cadastro-publico";
            mensagemTipo = "na rede principal";
          }
        } else {
          showInfoMessage("Você será cadastrado na rede principal como novo membro.");
        }

        const response = await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          let errorMessage = `Erro ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorData?.error || errorMessage;

            if (String(errorMessage).includes("Email já cadastrado")) {
              errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
            }
            
            if (String(errorMessage).includes("Telefone")) {
              errorMessage = "Este telefone já está cadastrado ou é inválido.";
            }
          } catch (_) {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        await response.json().catch(() => ({}));

        showSuccessMessage(`✅ Cadastro realizado com sucesso! Você agora faz parte ${mensagemTipo}. Redirecionando para login...`);

        setTimeout(() => {
          window.location.href = "/auth/login?cadastro=success";
        }, 2500);
      } catch (error) {
        console.error("❌ Erro no cadastro:", error);
        showFormError(error.message || "Erro ao realizar cadastro. Tente novamente.");

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  // ==============================
  // Validação em tempo real
  // ==============================
  function setupRealTimeValidation() {
    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.addEventListener("blur", () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) showFieldError("email", "Email inválido");
        else clearFieldError("email");
      });
    }

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

    const nomeInput = document.getElementById("nome");
    if (nomeInput) {
      nomeInput.addEventListener("blur", () => {
        const nome = nomeInput.value.trim();
        if (nome && nome.length < 3) showFieldError("nome", "O nome deve ter pelo menos 3 caracteres");
        else clearFieldError("nome");
      });
    }

    // 🔥 VALIDAÇÃO DO TELEFONE EM TEMPO REAL
    const telefoneInput = document.getElementById("telefone");
    if (telefoneInput) {
      telefoneInput.addEventListener("blur", () => {
        const telefoneRaw = telefoneInput.value;
        const apenasNumeros = normalizeTelefone(telefoneRaw);
        
        if (telefoneRaw && apenasNumeros.length > 0) {
          if (apenasNumeros.length < 10) {
            showFieldError("telefone", "Telefone inválido. Deve conter DDD + número (mínimo 10 dígitos)");
          } else if (apenasNumeros.length > 11) {
            showFieldError("telefone", "Telefone inválido. Máximo 11 dígitos");
          } else {
            clearFieldError("telefone");
          }
        } else {
          clearFieldError("telefone");
        }
      });
    }
  }

  // 🔥 CONFIGURA MÁSCARA DE TELEFONE (com jQuery Mask Plugin ou vanilla JS)
  const telefoneInput = document.getElementById("telefone");
  if (telefoneInput) {
    // Verifica se jQuery está disponível
    if (typeof $ !== 'undefined' && $.fn && $.fn.mask) {
      // Usa jQuery Mask Plugin se disponível
      $(telefoneInput).mask('(00) 00000-0000', {
        placeholder: '(00) 00000-0000',
        onKeyPress: function(telefone, event, currentField, options) {
          const digits = telefone.replace(/\D/g, '').length;
          if (digits <= 10) {
            $(this).mask('(00) 0000-00009', options);
          } else {
            $(this).mask('(00) 00000-0000', options);
          }
        }
      });
    } else {
      // Fallback: máscara manual com vanilla JS
      telefoneInput.addEventListener("input", function (e) {
        let value = e.target.value;
        let numbers = value.replace(/\D/g, "");
        let formatted = aplicarMascaraTelefone(numbers);
        
        // Evita loop infinito
        if (formatted !== value) {
          e.target.value = formatted;
        }
      });
    }
  }

  // flag cadastro success
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cadastro") === "success") {
    showSuccessMessage("Cadastro realizado com sucesso! Faça login para acessar sua conta.");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // boot
  setupRealTimeValidation();
  verificarReferenciaAoCarregar();
});