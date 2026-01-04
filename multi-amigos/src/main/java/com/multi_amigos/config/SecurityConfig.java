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

		http
				// ❌ CSRF desabilitado (JWT)
				.csrf(csrf -> csrf.disable())

				// 🌍 CORS
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))

				// 🔒 JWT = stateless
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				// 🔐 Regras de acesso
				.authorizeHttpRequests(auth -> auth

						// 🔓 Endpoints públicos
						.requestMatchers("/", "/auth/login", "/auth/register", "/auth/login-page", "/css/**", "/js/**",
								"/images/**", "/swagger-ui/**","/auth/validate", 
				                 "/auth/login-page", "/v3/api-docs/**")
						.permitAll()

						// 👑 ADMIN acessando endpoints de admin.
						.requestMatchers("/admin/dashboard", "/api/usuarios/**").hasRole("ADMIN")

						
						// 🔒 Qualquer outro endpoint
						.anyRequest().authenticated())

				// 🧩 Filtro JWT
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

}
