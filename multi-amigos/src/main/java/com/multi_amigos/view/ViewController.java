package com.multi_amigos.view;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class ViewController {

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
}
