package com.multi_amigos.model;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private boolean used = false;
    
    // Construtores
    public PasswordResetToken() {}
    
    public PasswordResetToken(String token, Usuario usuario, LocalDateTime expiresAt) {
        this.token = token;
        this.usuario = usuario;
        this.expiresAt = expiresAt;
        this.used = false;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    
    // ✅ Método corrigido para verificar expiração
    public boolean isExpired() {
        return expiresAt == null || expiresAt.isBefore(LocalDateTime.now());
    }
    
    // ✅ Método útil para debug
    public long getMinutosRestantes() {
        if (expiresAt == null) return 0;
        return ChronoUnit.MINUTES.between(LocalDateTime.now(), expiresAt);
    }
    
    // ✅ Método para reutilização segura
    public void renovar(String novoToken, int minutosValidade) {
        this.token = novoToken;
        this.expiresAt = LocalDateTime.now().plusMinutes(minutosValidade);
        this.used = false;
    }
}