package com.multi_amigos.model;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "mensagens")
public class Mensagem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 500)
	private String titulo;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String conteudo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TipoMensagem tipo; // IMPORTANTE, INFORMATIVO, URGENTE

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "autor_id", nullable = false)
	private Usuario autor;

	@Column(nullable = false)
	private boolean ativo = true;

	@Column(name = "data_criacao", nullable = false, updatable = false)
	private LocalDateTime dataCriacao;

	@Column(name = "data_expiracao")
	private LocalDateTime dataExpiracao;

	// Construtores
	public Mensagem() {
	}

	public Mensagem(String titulo, String conteudo, TipoMensagem tipo, Usuario autor) {
		this.titulo = titulo;
		this.conteudo = conteudo;
		this.tipo = tipo;
		this.autor = autor;
		this.dataCriacao = LocalDateTime.now();
	}

	// Getters e Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitulo() {
		return titulo;
	}

	public void setTitulo(String titulo) {
		this.titulo = titulo;
	}

	public String getConteudo() {
		return conteudo;
	}

	public void setConteudo(String conteudo) {
		this.conteudo = conteudo;
	}

	public TipoMensagem getTipo() {
		return tipo;
	}

	public void setTipo(TipoMensagem tipo) {
		this.tipo = tipo;
	}

	public Usuario getAutor() {
		return autor;
	}

	public void setAutor(Usuario autor) {
		this.autor = autor;
	}

	public boolean isAtivo() {
		return ativo;
	}

	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}

	public LocalDateTime getDataCriacao() {
		return dataCriacao;
	}

	public void setDataCriacao(LocalDateTime dataCriacao) {
		this.dataCriacao = dataCriacao;
	}

	public LocalDateTime getDataExpiracao() {
		return dataExpiracao;
	}

	public void setDataExpiracao(LocalDateTime dataExpiracao) {
		this.dataExpiracao = dataExpiracao;
	}

	// Métodos de negócio
	@PrePersist
	protected void onCreate() {
		dataCriacao = LocalDateTime.now();
	}

	public boolean isExpirada() {
		return dataExpiracao != null && LocalDateTime.now().isAfter(dataExpiracao);
	}

	public boolean isVisivel() {
		return ativo && !isExpirada();
	}

	@Override
	public String toString() {
		return "Mensagem [id=" + id + ", titulo=" + titulo + ", conteudo=" + conteudo + ", tipo=" + tipo + ", autor="
				+ autor + ", ativo=" + ativo + ", dataCriacao=" + dataCriacao + ", dataExpiracao=" + dataExpiracao
				+ "]";
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Mensagem other = (Mensagem) obj;
		return Objects.equals(id, other.id);
	}

}
