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

    public JwtAuthenticationFilter() {}

    // =========================
    // CACHE para usuários
    // =========================
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
    private static final long CACHE_DURATION_MS = 5 * 60 * 1000;     // 5 min
    private static final long CLEANUP_INTERVAL_MS = 10 * 60 * 1000;  // 10 min
    private volatile long lastCleanup = System.currentTimeMillis();

    // =========================
    // ROTAS QUE NÃO DEVEM PASSAR PELO JWT FILTER
    // =========================
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        // ---- Estáticos
        if (path.startsWith("/css/")
                || path.startsWith("/js/")
                || path.startsWith("/images/")
                || path.startsWith("/webjars/")
                || path.equals("/favicon.ico")) {
            return true;
        }

        // ---- Páginas públicas
        if (path.equals("/") || path.equals("/home")
                || path.equals("/auth/login")
                || path.equals("/auth/register")
                || path.equals("/auth/forgot")
                || path.equals("/auth/resetar-senha")
                || path.startsWith("/cadastro")) {
            return true;
        }

        // ---- Endpoints públicos (auth) - Controller está em /auth/**
        if (path.startsWith("/auth/")) {
            return true;
        }

        // ---- APIs públicas específicas
        if (path.equals("/api/usuarios/cadastro-publico")
                || path.startsWith("/api/usuarios/cadastro-por-link/")
                || path.startsWith("/api/usuarios/validar-referencia/")) {
            return true;
        }

        // Se chegou aqui: deve filtrar
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // ====================================================
        // 1) EXTRAÇÃO DO TOKEN (SOMENTE HEADER OU COOKIE)
        // ====================================================
        String token = null;

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // ❌ REMOVIDO: token via query param (?token=...)
        // Isso permitia "login por link" e vazamento de conta

        // Opcional: cookie (se você decidir padronizar JWT em cookie HttpOnly)
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // ====================================================
        // 2) PROCESSAMENTO DO TOKEN
        // ====================================================
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                if (!jwtUtil.validateToken(token)) {
                    cleanupCache();
                    filterChain.doFilter(request, response);
                    return;
                }

                final String email = jwtUtil.extractEmail(token);

                if (email == null || email.isBlank()) {
                    cleanupCache();
                    filterChain.doFilter(request, response);
                    return;
                }

                Usuario usuario = getUsuarioFromCache(email);

                if (usuario == null) {
                    usuario = usuarioRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + email));
                    cacheUsuario(email, usuario);
                }

                if (!usuario.isAtivo()) {
                    cleanupCache();
                    filterChain.doFilter(request, response);
                    return;
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

            } catch (Exception e) {
                // Falhou em autenticar -> segue sem auth
            } finally {
                cleanupCache();
            }
        } else {
            cleanupCache();
        }

        filterChain.doFilter(request, response);
    }

    // =========================
    // CACHE
    // =========================
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
            userCache.entrySet().removeIf(
                    entry -> !entry.getValue().isValid(CACHE_DURATION_MS)
            );
            lastCleanup = now;
        }
    }

    // =========================
    // USER DETAILS
    // =========================
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
