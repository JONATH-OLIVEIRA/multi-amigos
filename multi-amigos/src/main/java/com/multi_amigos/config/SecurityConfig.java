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

        // Em produção: substitua "*" pelo(s) domínio(s) do front.
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

            // ✅ APIs retornam JSON; páginas redirecionam
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    String uri = request.getRequestURI();

                    // APIs retornam JSON (não redireciona)
                    if (uri.startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"Unauthorized\"}");
                        return;
                    }

                    // Recursos estáticos não devem redirecionar
                    if (uri.startsWith("/css/") || uri.startsWith("/js/") || uri.startsWith("/images/")
                        || uri.startsWith("/webjars/") || uri.equals("/favicon.ico")) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        return;
                    }

                    // Páginas privadas -> login
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

                    // Páginas de autenticação (views)
                    "/auth/login", "/auth/register", "/auth/forgot", "/auth/resetar-senha","/resetar-senha",

                    // Endpoints do AuthController (login/register/validate)
                    "/auth/**",

                    // Estáticos
                    "/css/**", "/js/**", "/images/**", "/favicon.ico", "/webjars/**",

                    // Cadastro por link (página)
                    "/cadastro", "/cadastro/**"
                ).permitAll()

                // Swagger (se estiver usando)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ==================== 🔓 APIs PÚBLICAS ESPECÍFICAS ====================
                // Cadastro público e por link (API)
                .requestMatchers(HttpMethod.POST,
                    "/api/usuarios/cadastro-publico",
                    "/api/usuarios/cadastro-por-link/**"
                ).permitAll()

                // Validar referência (API)
                .requestMatchers(HttpMethod.GET,
                    "/api/usuarios/validar-referencia/**"
                ).permitAll()

                // ==================== 🔐 PÁGINAS PROTEGIDAS ====================
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/usuario/**").authenticated()

                // ==================== 🔐 APIs PROTEGIDAS ====================
                .requestMatchers("/api/**").authenticated()

                // Qualquer outra rota não prevista -> bloqueia (evita “rota esquecida” ficar pública)
                .anyRequest().denyAll()
            )

            // JWT filter antes do auth padrão
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
