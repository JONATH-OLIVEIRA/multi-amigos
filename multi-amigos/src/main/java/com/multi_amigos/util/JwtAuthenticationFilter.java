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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/auth/")
            || path.equals("/")
            || path.startsWith("/css/")
            || path.startsWith("/js/")
            || path.startsWith("/images/")
            || path.startsWith("/webjars/")
            || path.startsWith("/swagger-ui/")
            || path.startsWith("/v3/api-docs/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        // 🔍 Extrair token do header Authorization
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            
            try {
                email = jwtUtil.extractEmail(token);
            } catch (Exception e) {
                // Token inválido, continuar sem autenticação
                logger.warn("Token JWT inválido: " + e.getMessage());
            }
        }

        // 🔐 Validar token e configurar autenticação no SecurityContext
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(token)) {
                try {
                    // ✅ Extrai role e nome do token usando seu JwtUtil
                    String role = jwtUtil.extractRole(token);
                    String nome = jwtUtil.extractNome(token);
                    
                    // 🏷️ Cria authorities baseado na role
                    var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
                    
                    // 👤 Cria UserDetails customizado
                    JwtUserDetails userDetails = new JwtUserDetails(email, nome, role);
                    
                    // 🔐 Cria objeto de autenticação
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, // Passa o UserDetails customizado
                            null, 
                            authorities
                        );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.debug("Usuário autenticado via JWT: " + email + " Role: " + role);
                    
                } catch (Exception e) {
                    logger.error("Erro ao processar token JWT: " + e.getMessage());
                }
            }
        }

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

        @Override public boolean isAccountNonExpired() { return true; }
        @Override public boolean isAccountNonLocked() { return true; }
        @Override public boolean isCredentialsNonExpired() { return true; }
        @Override public boolean isEnabled() { return true; }

        // getters úteis no projeto
        public String getEmail() { return email; }
        public String getNome() { return nome; }
        public String getRole() { return role; }

        @Override
        public String toString() {
            return "JwtUserDetails{email='" + email + "', nome='" + nome + "', role='" + role + "'}";
        }
    }
}