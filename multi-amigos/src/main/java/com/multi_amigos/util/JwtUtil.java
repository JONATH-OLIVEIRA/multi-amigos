package com.multi_amigos.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.multi_amigos.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // ✅ ideal: configure isso no application.properties / env
    // app.jwt.secret=... (mínimo 32 bytes para HS256)
    @Value("${app.jwt.secret:minha-chave-secreta-muito-mais-longa-agora-para-seguranca-256-bits}")
    private String secret;

    @Value("${app.jwt.issuer:multi-amigos}")
    private String issuer;

    @Value("${app.jwt.audience:web}")
    private String audience;

    // 1 dia (alinha com cookie maxAge=1 dia)
    private static final long EXPIRATION_MS = 86_400_000L;

    private SecretKey getSecretKey() {
        // garante charset
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Usuario usuario) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + EXPIRATION_MS);

        return Jwts.builder()
                .setIssuer(issuer)
                .setAudience(audience)
                .setSubject(usuario.getEmail())
                .claim("role", usuario.getPerfil().name())
                .claim("nome", usuario.getNome())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(getSecretKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractNome(String token) {
        return extractAllClaims(token).get("nome", String.class);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSecretKey())
                // opcional: 60s tolerância
                .setAllowedClockSkewSeconds(60)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
