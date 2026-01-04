package com.multi_amigos.DTO;

public class CriarMensagemDTO {
	private String titulo;
	private String conteudo;
	private String tipo;
	private Integer diasValidade; // opcional

// Construtores
	public CriarMensagemDTO() {
	}

	public CriarMensagemDTO(String titulo, String conteudo, String tipo) {
		this.titulo = titulo;
		this.conteudo = conteudo;
		this.tipo = tipo;
	}

// Getters e Setters
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

	public Integer getDiasValidade() {
		return diasValidade;
	}

	public void setDiasValidade(Integer diasValidade) {
		this.diasValidade = diasValidade;
	}
}