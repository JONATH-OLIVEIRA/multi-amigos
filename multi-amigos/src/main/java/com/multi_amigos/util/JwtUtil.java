package com.multi_amigos.util;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.multi_amigos.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final String SECRET_STRING = "minha-chave-secreta-muito-mais-longa-agora-para-seguranca-256-bits";
    private final SecretKey SECRET_KEY;
    private final long EXPIRATION = 86400000; // 1 dia

    public JwtUtil() {
        this.SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    }

    // ✅ Gera token COM role
    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getEmail())
                .claim("role", usuario.getPerfil().name()) // ✅ Adiciona role no token
                .claim("nome", usuario.getNome()) // ✅ Adiciona nome
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SECRET_KEY)
                .compact();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ✅ Extrai role do token
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // ✅ Extrai nome do token
    public String extractNome(String token) {
        return extractAllClaims(token).get("nome", String.class);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}