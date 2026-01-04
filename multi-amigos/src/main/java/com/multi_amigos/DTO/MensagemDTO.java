package com.multi_amigos.DTO;

import java.time.LocalDateTime;

public class MensagemDTO {
	private Long id;
	private String titulo;
	private String conteudo;
	private String tipo;
	private String tipoClasse; // para CSS
	private Long autorId;
	private String autorNome;
	private boolean ativo;
	private LocalDateTime dataCriacao;
	private LocalDateTime dataExpiracao;
	private boolean expirada;
	private boolean visivel;

	// Construtores
	public MensagemDTO() {
	}

	public MensagemDTO(Long id, String titulo, String conteudo, String tipo, Long autorId, String autorNome,
			LocalDateTime dataCriacao) {
		this.id = id;
		this.titulo = titulo;
		this.conteudo = conteudo;
		this.tipo = tipo;
		this.autorId = autorId;
		this.autorNome = autorNome;
		this.dataCriacao = dataCriacao;
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

	public String getTipo() {
		return tipo;
	}

	public void setTipo(String tipo) {
		this.tipo = tipo;
	}

	public String getTipoClasse() {
		return tipoClasse;
	}

	public void setTipoClasse(String tipoClasse) {
		this.tipoClasse = tipoClasse;
	}

	public Long getAutorId() {
		return autorId;
	}

	public void setAutorId(Long autorId) {
		this.autorId = autorId;
	}

	public String getAutorNome() {
		return autorNome;
	}

	public void setAutorNome(String autorNome) {
		this.autorNome = autorNome;
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

	public boolean isExpirada() {
		return expirada;
	}

	public void setExpirada(boolean expirada) {
		this.expirada = expirada;
	}

	public boolean isVisivel() {
		return visivel;
	}

	public void setVisivel(boolean visivel) {
		this.visivel = visivel;
	}
}
