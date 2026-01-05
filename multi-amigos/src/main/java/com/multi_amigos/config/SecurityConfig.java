package com.multi_amigos.config;

import java.util.Arrays;
import jakarta.servlet.http.HttpServletResponse;

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

		http.csrf(csrf -> csrf.disable()
				)
					
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))

				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				.exceptionHandling(
						exception -> exception.authenticationEntryPoint((request, response, authException) -> {
							if (request.getRequestURI().startsWith("/api/")) {
								response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
								response.setContentType("application/json;charset=UTF-8");
								response.getWriter().write("{\"error\":\"Unauthorized\"}");
							} else {
								response.sendRedirect("/auth/login");
							}
						}).accessDeniedHandler((request, response, accessDeniedException) -> {
							if (request.getRequestURI().startsWith("/api/")) {
								response.setStatus(HttpServletResponse.SC_FORBIDDEN);
								response.setContentType("application/json;charset=UTF-8");
								response.getWriter().write("{\"error\":\"Forbidden\"}");
							} else {
								response.sendRedirect("/auth/login");
							}
						}))

				.authorizeHttpRequests(auth -> auth

						// 🔓 públicos
						.requestMatchers("/", "/home", "/auth/login", "/auth/login-page", "/auth/register", "/css/**",
								"/js/**", "/images/**")
						.permitAll()

						// 🔓 swagger
						.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

						// 🔒 dashboard
						.requestMatchers("/dashboard/**").authenticated().requestMatchers("/admin/**").hasRole("ADMIN")

						// 🔒 APIs
						.requestMatchers("/api/**").authenticated()

						.anyRequest().authenticated())

				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
