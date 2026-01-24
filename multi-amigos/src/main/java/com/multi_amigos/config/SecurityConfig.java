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

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    String uri = request.getRequestURI();

                    // 1) APIs retornam JSON (não redireciona)
                    if (uri.startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"Unauthorized\"}");
                        return;
                    }

                    // 2) Recursos estáticos não devem redirecionar
                    if (uri.contains(".") && !uri.endsWith(".html")) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        return;
                    }

                    // 3) Páginas: redireciona pro login (se realmente precisar)
                    response.sendRedirect("/auth/login?error=expired");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"Forbidden\"}");
                    } else {
                        response.sendRedirect("/auth/login?error=denied");
                    }
                })
            )

            .authorizeHttpRequests(auth -> auth

                // ==================== 🔓 PÚBLICO (PÁGINAS E RECURSOS) ====================
                .requestMatchers(
                    "/", "/home",
                    "/auth/**",
                    "/css/**", "/js/**", "/images/**", "/favicon.ico", "/webjars/**",
                    "/cadastro", "/cadastro/**",

                    // ✅ IMPORTANTE: libera as páginas do admin para não cair no login no refresh
                    // (a segurança real fica nas APIs /api/**)
                    "/admin/**",
                    "/usuario/**",
                    "/dashboard/**"
                ).permitAll()

                // Swagger
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ==================== 🔓 APIs PÚBLICAS ESPECÍFICAS ====================
                .requestMatchers(HttpMethod.POST,
                    "/api/usuarios/cadastro-publico",
                    "/api/usuarios/cadastro-por-link/**"
                ).permitAll()

                // ==================== 🌐 APIs PROTEGIDAS ====================
                // Tudo que é /api/ precisa de token
                .requestMatchers("/api/**").authenticated()

                // Qualquer outra requisição (se existir)
                .anyRequest().permitAll()
            )

            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
