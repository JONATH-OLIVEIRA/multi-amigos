package com.multi_amigos.model;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

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

	// Construtores
	public PasswordResetToken() {
	}

	public PasswordResetToken(String token, Usuario usuario, LocalDateTime expiresAt) {
		this.token = token;
		this.usuario = usuario;
		this.expiresAt = expiresAt;

	}

	// Getters e Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public Usuario getUsuario() {
		return usuario;
	}

	public void setUsuario(Usuario usuario) {
		this.usuario = usuario;
	}

	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}

	// ✅ Método corrigido para verificar expiração
	public boolean isExpired() {
		return expiresAt == null || expiresAt.isBefore(LocalDateTime.now());
	}

	// ✅ Método útil para debug
	public long getMinutosRestantes() {
		if (expiresAt == null)
			return 0;
		return ChronoUnit.MINUTES.between(LocalDateTime.now(), expiresAt);
	}

	// ✅ Método para reutilização segura
	public void renovar(String novoToken, int minutosValidade) {
		this.token = novoToken;
		this.expiresAt = LocalDateTime.now().plusMinutes(minutosValidade);

	}
}