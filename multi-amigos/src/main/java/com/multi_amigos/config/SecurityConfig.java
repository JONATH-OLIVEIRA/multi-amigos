package com.multi_amigos.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

	    http.csrf(csrf -> csrf.disable())
	            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
	            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
	            
	            .exceptionHandling(exception -> exception
	                .authenticationEntryPoint((request, response, authException) -> {
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
	                })
	                .accessDeniedHandler((request, response, accessDeniedException) -> {
	                    if (request.getRequestURI().startsWith("/api/")) {
	                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
	                        response.setContentType("application/json;charset=UTF-8");
	                        response.getWriter().write("{\"error\":\"Forbidden\"}");
	                    } else {
	                        response.sendRedirect("/auth/login?error=denied");
	                    }
	                }))

	            .authorizeHttpRequests(auth -> auth
	                    // 🔓 Recursos totalmente públicos (Adicionado favicon e webjars)
	                    .requestMatchers(
	                        "/", "/home", "/auth/**", 
	                        "/css/**", "/js/**", "/images/**", 
	                        "/favicon.ico", "/webjars/**"
	                    ).permitAll()

	                    // 🔓 Documentação
	                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

	                    // ⚠️ Específicos antes do genérico
	                    .requestMatchers("/admin/busca").authenticated()
	                    .requestMatchers("/dashboard/**").authenticated()

	                    // 🔒 Bloqueio por Role para o restante do admin
	                    .requestMatchers("/admin/**").hasRole("ADMIN")

	                    // 🔒 APIs
	                    .requestMatchers("/api/**").authenticated()

	                    .anyRequest().authenticated())

	            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

	    return http.build();
	}
}
