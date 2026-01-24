package com.multi_amigos.view;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.service.UsuarioService;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class ViewController {

	@Autowired
	UsuarioService usuarioService;

	// =========================
	// Página inicial
	// =========================
	@GetMapping("/")
	public String index() {
		return "index"; // Thymeleaf vai buscar "index.html" em templates/
	}

	// =========================
	// Login
	// =========================
	@GetMapping("/auth/login")
	public String login() {
		return "login"; // templates/login.html
	}

	// =========================
	// Cadastro
	// =========================
	@GetMapping("/auth/register")
	public String register() {
		return "register"; // templates/register.html
	}

	// =========================
	// Dashboard Admin
	// =========================
	@GetMapping("/admin/dashboard")
	public String dashboard(Model model, Authentication authentication, HttpServletRequest request) {

		System.out.println("=== /admin/dashboard ACESSADO ===");
		System.out.println("URL completa: " + request.getRequestURL());
		System.out.println("Query string: " + request.getQueryString());

		if (authentication != null && authentication.isAuthenticated()) {
			System.out.println("Usuário autenticado: " + authentication.getName());
			System.out.println("Roles: " + authentication.getAuthorities());

			model.addAttribute("username", authentication.getName());
			model.addAttribute("isAuthenticated", true);

			// Verifica se é ADMIN
			boolean isAdmin = authentication.getAuthorities().stream()
					.anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
			model.addAttribute("isAdmin", isAdmin);

		} else {
			System.out.println("Usuário NÃO autenticado - redirecionando para login");
		}

		return "admin/dashboard";
	}

	@GetMapping("/admin/busca")
	public String busca(Model model, HttpServletRequest request, Authentication auth) {
		System.out.println("🚨🚨🚨 /admin/busca FOI CHAMADO 🚨🚨🚨");
		System.out.println("URL: " + request.getRequestURL());
		System.out.println("Token param: " + request.getParameter("token"));

		if (auth != null) {
			System.out.println("✅ Autenticação: " + auth.getName());
			System.out.println("✅ Roles: " + auth.getAuthorities());
		} else {
			System.out.println("❌ Autenticação NULA!");
		}

		return "busca";
	}

	@GetMapping("/usuario/dashboard")
	public String usuarioDashboard(Model model, Authentication authentication) {

		// Se tiver auth (ex.: se um dia você migrar p/ cookie), aproveita
		if (authentication != null && authentication.isAuthenticated()) {
			model.addAttribute("username", authentication.getName());
			model.addAttribute("isAuthenticated", true);
		} else {
			// Sem auth no refresh (localStorage não chega no server)
			model.addAttribute("username", null);
			model.addAttribute("isAuthenticated", false);
		}

		model.addAttribute("isAdmin", false);
		return "usuario/dashboard";
	}

	// No ViewController.java - ADICIONAR:
	@GetMapping("/cadastro")
	public String cadastroPorLink(@RequestParam(value = "ref", required = false) Long referenciaId, Model model,
			HttpServletRequest request) {

		System.out.println("=== /cadastro ACESSADO ===");
		System.out.println("Referência ID: " + referenciaId);

		if (referenciaId != null) {
			try {
				UsuarioDTO usuarioReferencia = usuarioService.buscarPorId(referenciaId);

				// VERIFICAÇÃO DETALHADA
				System.out.println("=== VERIFICAÇÃO DA REFERÊNCIA ===");
				System.out.println("ID: " + usuarioReferencia.getId());
				System.out.println("Nome: " + usuarioReferencia.getNome());
				System.out.println("Email: " + usuarioReferencia.getEmail());
				System.out.println("Ativo (boolean): " + usuarioReferencia.isAtivo());

				System.out.println("===============================");

				// Tente diferentes abordagens
				boolean referenciaValida = usuarioReferencia.isAtivo();
				System.out.println("referenciaValida (boolean): " + referenciaValida);

				// Adiciona atributos - TESTE com diferentes nomes
				model.addAttribute("referenciaId", referenciaId);
				model.addAttribute("referenciaNome", usuarioReferencia.getNome());
				model.addAttribute("referenciaEmail", usuarioReferencia.getEmail());
				model.addAttribute("referenciaValida", referenciaValida);
				model.addAttribute("valido", referenciaValida); // Nome alternativo
				model.addAttribute("ativo", usuarioReferencia.isAtivo()); // Outro nome

				System.out.println(
						"✅ Referência válida: " + usuarioReferencia.getNome() + " | Ativo: " + referenciaValida);

			} catch (Exception e) {
				System.err.println("❌ Referência inválida: " + e.getMessage());
				model.addAttribute("referenciaValida", false);
				model.addAttribute("valido", false);
				model.addAttribute("erroMensagem", "Link de referência inválido ou usuário não encontrado.");
			}
		} else {
			System.out.println("⚠️ Cadastro sem referência (público)");
			model.addAttribute("referenciaValida", true);
			model.addAttribute("valido", true);
		}

		return "cadastro-por-link";
	}
}
