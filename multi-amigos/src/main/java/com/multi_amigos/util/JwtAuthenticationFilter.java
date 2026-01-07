package com.multi_amigos.util;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	@Autowired
	private JwtUtil jwtUtil;

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		
		// ⚠️ NÃO inclua /admin/ ou /dashboard/ aqui! O filtro DEVE processar estas rotas
		return path.startsWith("/auth/") 
				|| path.equals("/") 
				|| path.startsWith("/css/") 
				|| path.startsWith("/js/")
				|| path.equals("/favicon.ico")
				|| path.startsWith("/images/") 
				|| path.startsWith("/webjars/") 
				|| path.startsWith("/swagger-ui/")
				|| path.startsWith("/v3/api-docs/");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		
		String path = request.getServletPath();
		System.out.println("🔍 JwtFilter - PATH: " + path);
		
		// ====================================================
		// 1. TENTA EXTRAIR TOKEN DE DIFERENTES FONTES
		// ====================================================
		String token = null;
		String email = null;
		
		// 🔍 1A. Tenta do HEADER Authorization (para APIs)
		String authHeader = request.getHeader("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
			System.out.println("🔑 JwtFilter: Token extraído do HEADER");
		}
		
		// 🔍 1B. Se não tem no header, tenta do PARÂMETRO da URL (para navegação)
		if (token == null) {
			token = request.getParameter("token");
			if (token != null && !token.trim().isEmpty()) {
				System.out.println("🔑 JwtFilter: Token extraído do PARÂMETRO da URL");
			}
		}
		
		// 🔍 1C. Se não tem no parâmetro, tenta do COOKIE (fallback)
		if (token == null && request.getCookies() != null) {
			for (Cookie cookie : request.getCookies()) {
				if ("jwt_token".equals(cookie.getName())) {
					token = cookie.getValue();
					System.out.println("🔑 JwtFilter: Token extraído do COOKIE");
					break;
				}
			}
		}
		
		// ====================================================
		// 2. VALIDA E PROCESSO O TOKEN
		// ====================================================
		if (token != null) {
			try {
				// Extrai email do token
				email = jwtUtil.extractEmail(token);
				System.out.println("👤 JwtFilter: Email extraído: " + email);
				
				// Verifica se já está autenticado
				if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
					
					// Valida token
					if (jwtUtil.validateToken(token)) {
						System.out.println("✅ JwtFilter: Token VÁLIDO");
						
						// Extrai dados do token
						String role = jwtUtil.extractRole(token);
						String nome = jwtUtil.extractNome(token);
						
						// Cria authorities
						var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
						
						// Cria UserDetails customizado
						JwtUserDetails userDetails = new JwtUserDetails(email, nome, role);
						
						// Cria objeto de autenticação
						UsernamePasswordAuthenticationToken authToken = 
							new UsernamePasswordAuthenticationToken(
								userDetails, 
								null, 
								authorities
							);
						
						// Adiciona detalhes da requisição
						authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
						
						// Configura no SecurityContext
						SecurityContextHolder.getContext().setAuthentication(authToken);
						
						System.out.println("✅ JwtFilter: Usuário AUTENTICADO - " + email + " | Role: " + role);
						System.out.println("✅ JwtFilter: Authorities: " + authorities);
						
					} else {
						System.out.println("❌ JwtFilter: Token INVÁLIDO (validação falhou)");
					}
				} else if (email == null) {
					System.out.println("⚠️ JwtFilter: Não conseguiu extrair email do token");
				} else {
					System.out.println("ℹ️ JwtFilter: Usuário já autenticado: " + email);
				}
				
			} catch (Exception e) {
				System.out.println("❌ JwtFilter: ERRO ao processar token: " + e.getMessage());
				e.printStackTrace();
			}
		} else {
			System.out.println("ℹ️ JwtFilter: Nenhum token encontrado na requisição");
		}
		
		// ====================================================
		// 3. CONTINUA A CADEIA DE FILTROS
		// ====================================================
		filterChain.doFilter(request, response);
	}

	/**
	 * 🔧 Classe interna para representar os detalhes do usuário do JWT
	 */
	public static class JwtUserDetails implements UserDetails {

		private final String email;
		private final String nome;
		private final String role;

		public JwtUserDetails(String email, String nome, String role) {
			this.email = email;
			this.nome = nome;
			this.role = role;
		}

		@Override
		public Collection<? extends GrantedAuthority> getAuthorities() {
			return List.of(new SimpleGrantedAuthority("ROLE_" + role));
		}

		@Override
		public String getPassword() {
			return null; // JWT não usa senha aqui
		}

		@Override
		public String getUsername() {
			return email;
		}

		@Override
		public boolean isAccountNonExpired() {
			return true;
		}

		@Override
		public boolean isAccountNonLocked() {
			return true;
		}

		@Override
		public boolean isCredentialsNonExpired() {
			return true;
		}

		@Override
		public boolean isEnabled() {
			return true;
		}

		// getters úteis no projeto
		public String getEmail() {
			return email;
		}

		public String getNome() {
			return nome;
		}

		public String getRole() {
			return role;
		}

		@Override
		public String toString() {
			return "JwtUserDetails{email='" + email + "', nome='" + nome + "', role='" + role + "'}";
		}
	}
}