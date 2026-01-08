package com.multi_amigos.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.multi_amigos.util.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(Arrays.asList("*"));
		config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
		config.setAllowedHeaders(Arrays.asList("*"));
		config.setAllowCredentials(false);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable()).cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				.exceptionHandling(
						exception -> exception.authenticationEntryPoint((request, response, authException) -> {
							String uri = request.getRequestURI();

							// 1. Erros em APIs retornam JSON
							if (uri.startsWith("/api/")) {
								response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
								response.setContentType("application/json;charset=UTF-8");
								response.getWriter().write("{\"error\":\"Unauthorized\"}");
							}
							// 2. Erros em recursos estáticos (favicon, css) NÃO redirecionam para login
							else if (uri.contains(".") && !uri.endsWith(".html")) {
								response.setStatus(HttpServletResponse.SC_NOT_FOUND);
							}
							// 3. Somente páginas reais redirecionam para o login
							else {
								response.sendRedirect("/auth/login?error=expired");
							}
						}).accessDeniedHandler((request, response, accessDeniedException) -> {
							if (request.getRequestURI().startsWith("/api/")) {
								response.setStatus(HttpServletResponse.SC_FORBIDDEN);
								response.setContentType("application/json;charset=UTF-8");
								response.getWriter().write("{\"error\":\"Forbidden\"}");
							} else {
								response.sendRedirect("/auth/login?error=denied");
							}
						}))

				.authorizeHttpRequests(auth -> auth
						// ==================== 🔓 ENDPOINTS PÚBLICOS ====================

						// 1. Páginas públicas e recursos estáticos
						.requestMatchers("/", "/home", "/auth/**", // Login, registro, etc.
								"/css/**", "/js/**", "/images/**", "/favicon.ico", "/webjars/**", "/cadastro",
								"/cadastro/**" // Página de cadastro por link
						).permitAll()

						// 2. Documentação da API
						.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

						// 3. APIs públicas de cadastro (MUST COME BEFORE /api/** !!!)
						.requestMatchers(HttpMethod.POST, "/api/usuarios/cadastro-publico",
								"/api/usuarios/cadastro-por-link/**")
						.permitAll()

						// 4. Preflight CORS requests (OPTIONS)
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

						// ==================== 🔐 ENDPOINTS AUTENTICADOS ====================

						// 1. Dashboard do usuário comum (qualquer usuário autenticado)
						.requestMatchers("/usuario/dashboard").authenticated()

						// 2. Dashboard geral
						.requestMatchers("/dashboard/**").authenticated()

						// 3. Admin busca (autenticado mas não precisa de role específica)
						.requestMatchers("/admin/busca").authenticated()

						// ==================== 🔒 ENDPOINTS COM ROLES ESPECÍFICAS ====================

						// 1. Admin (apenas ROLE_ADMIN)
						.requestMatchers("/admin/**").hasRole("ADMIN")

						// ==================== 🌐 APIs PROTEGIDAS ====================

						// APIs em geral (exceções já foram tratadas acima)
						// IMPORTANTE: Esta regra DEVE vir por último!
						.requestMatchers("/api/**").authenticated()

						// Qualquer outra requisição
						.anyRequest().authenticated())

				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
