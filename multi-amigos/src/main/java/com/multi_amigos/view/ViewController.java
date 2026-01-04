package com.multi_amigos.view;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

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
	public String dashboard(Model model, Authentication authentication) {
		if (authentication != null && authentication.isAuthenticated()) {
			model.addAttribute("username", authentication.getName());
			model.addAttribute("isAuthenticated", true);

			// Verifica se é ADMIN
			boolean isAdmin = authentication.getAuthorities().stream()
					.anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
			model.addAttribute("isAdmin", isAdmin);
		}
		return "admin/dashboard";
	}
}
