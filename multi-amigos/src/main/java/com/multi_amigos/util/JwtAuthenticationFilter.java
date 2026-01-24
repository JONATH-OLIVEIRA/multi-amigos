package com.multi_amigos.util;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private UsuarioRepository usuarioRepository;

	public JwtAuthenticationFilter() {
	}

	// 🔥 CACHE para usuários
	private static class CachedUser {
		final Usuario usuario;
		final long timestamp;

		CachedUser(Usuario usuario) {
			this.usuario = usuario;
			this.timestamp = System.currentTimeMillis();
		}

		boolean isValid(long cacheDurationMs) {
			return System.currentTimeMillis() - timestamp < cacheDurationMs;
		}
	}

	private final Map<String, CachedUser> userCache = new ConcurrentHashMap<>();
	private static final long CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
	private static final long CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
	private volatile long lastCleanup = System.currentTimeMillis();

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();

		return path.startsWith("/auth/") 
				|| path.equals("/auth/validate")
	            || path.equals("/") 
	            || path.equals("/index.html")
	            || path.equals("/login.html")
	            || path.startsWith("/public/")
	            || path.startsWith("/css/") 
	            || path.startsWith("/js/")
	            || path.startsWith("/images/")
	            || path.endsWith(".ico")
	            || path.endsWith(".css")
	            || path.endsWith(".js")
	            || path.endsWith(".png")
	            || path.endsWith(".jpg")
	            || path.endsWith(".jpeg")
	            || path.endsWith(".gif")
	            || path.startsWith("/webjars/") 
	            || path.startsWith("/swagger-ui/")
	            || path.startsWith("/swagger-ui/")
	            || path.startsWith("/v3/api-docs/");
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain
	) throws ServletException, IOException {

		String path = request.getServletPath();
		System.out.println("🔍 JwtFilter - PATH: " + path);

		// ====================================================
		// 1. EXTRAÇÃO DO TOKEN
		// ====================================================
		String token = null;

		String authHeader = request.getHeader("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
			System.out.println("🔑 JwtFilter: Token extraído do HEADER");
		}

		if (token == null) {
			token = request.getParameter("token");
			if (token != null && !token.trim().isEmpty()) {
				System.out.println("🔑 JwtFilter: Token extraído do PARÂMETRO");
			}
		}

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
		// 2. PROCESSAMENTO DO TOKEN
		// ====================================================
		if (token != null) {
			Exception authenticationException = null;

			try {
				// 🔥 SOLUÇÃO 2 APLICADA AQUI
				final String email = jwtUtil.extractEmail(token);
				System.out.println("👤 JwtFilter: Email extraído: " + email);

				if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

					if (jwtUtil.validateToken(token)) {
						System.out.println("✅ JwtFilter: Token VÁLIDO");

						Usuario usuario = getUsuarioFromCache(email);

						if (usuario == null) {
							System.out.println("📥 JwtFilter: Buscando usuário do banco: " + email);

							usuario = usuarioRepository.findByEmail(email)
									.orElseThrow(() ->
											new RuntimeException("Usuário não encontrado: " + email)
									);

							cacheUsuario(email, usuario);
							System.out.println("💾 JwtFilter: Usuário armazenado em cache: " + email);
						} else {
							System.out.println("⚡ JwtFilter: Usuário carregado do cache: " + email);
						}

						if (!usuario.isAtivo()) {
							System.out.println("❌ JwtFilter: Usuário INATIVO: " + email);
							throw new RuntimeException("Usuário inativo");
						}

						String role = usuario.getPerfil().name();
						String nome = usuario.getNome();

						var authorities = Collections.singletonList(
								new SimpleGrantedAuthority("ROLE_" + role)
						);

						JwtUserDetails userDetails = new JwtUserDetails(
								usuario.getId(),
								email,
								nome,
								role
						);

						UsernamePasswordAuthenticationToken authToken =
								new UsernamePasswordAuthenticationToken(
										userDetails,
										null,
										authorities
								);

						authToken.setDetails(
								new WebAuthenticationDetailsSource().buildDetails(request)
						);

						SecurityContextHolder.getContext().setAuthentication(authToken);

						System.out.println("✅ JwtFilter: Usuário AUTENTICADO - " + email);
						System.out.println("✅ JwtFilter: Authorities: " + authorities);

					} else {
						System.out.println("❌ JwtFilter: Token INVÁLIDO");
					}
				}

			} catch (Exception e) {
				authenticationException = e;
				System.out.println("❌ JwtFilter: ERRO ao processar token: " + e.getMessage());
			}

			cleanupCache();
		} else {
			System.out.println("ℹ️ JwtFilter: Nenhum token encontrado");
		}

		filterChain.doFilter(request, response);
	}

	// ====================================================
	// CACHE
	// ====================================================
	private Usuario getUsuarioFromCache(String email) {
		CachedUser cached = userCache.get(email);
		if (cached != null && cached.isValid(CACHE_DURATION_MS)) {
			return cached.usuario;
		}
		if (cached != null) {
			userCache.remove(email);
		}
		return null;
	}

	private void cacheUsuario(String email, Usuario usuario) {
		userCache.put(email, new CachedUser(usuario));
	}

	private void cleanupCache() {
		long now = System.currentTimeMillis();
		if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
			System.out.println("🧹 JwtFilter: Limpando cache...");
			userCache.entrySet().removeIf(
					entry -> !entry.getValue().isValid(CACHE_DURATION_MS)
			);
			lastCleanup = now;
		}
	}

	// ====================================================
	// USER DETAILS
	// ====================================================
	public static class JwtUserDetails implements UserDetails {

		private final Long id;
		private final String email;
		private final String nome;
		private final String role;

		public JwtUserDetails(Long id, String email, String nome, String role) {
			this.id = id;
			this.email = email;
			this.nome = nome;
			this.role = role;
		}

		public JwtUserDetails(String email, String nome, String role) {
			this(null, email, nome, role);
		}

		@Override
		public Collection<? extends GrantedAuthority> getAuthorities() {
			return List.of(new SimpleGrantedAuthority("ROLE_" + role));
		}

		@Override public String getPassword() { return null; }
		@Override public String getUsername() { return email; }
		@Override public boolean isAccountNonExpired() { return true; }
		@Override public boolean isAccountNonLocked() { return true; }
		@Override public boolean isCredentialsNonExpired() { return true; }
		@Override public boolean isEnabled() { return true; }

		public Long getId() { return id; }
		public String getEmail() { return email; }
		public String getNome() { return nome; }
		public String getRole() { return role; }

		@Override
		public String toString() {
			return "JwtUserDetails{id=" + id +
					", email='" + email + '\'' +
					", nome='" + nome + '\'' +
					", role='" + role + '\'' +
					'}';
		}
	}
}
