package com.multi_amigos.DTO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.multi_amigos.model.Perfil;

public class UsuarioNodeDTO {
	private Long id;
	private String nome;
	private String email;
	private String telefone;
	private Perfil perfil;
	private boolean ativo;
	private LocalDateTime dataCriacao;
	private LocalDateTime dataAtualizacao;
	private int nivel;

	private UsuarioNodeDTO pai; // Referência ao pai (opcional)
	private List<UsuarioNodeDTO> filhos = new ArrayList<>();

	// Getters e Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getTelefone() {
		return telefone;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}

	public Perfil getPerfil() {
		return perfil;
	}

	public void setPerfil(Perfil perfil) {
		this.perfil = perfil;
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

	public LocalDateTime getDataAtualizacao() {
		return dataAtualizacao;
	}

	public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
		this.dataAtualizacao = dataAtualizacao;
	}

	public int getNivel() {
		return nivel;
	}

	public void setNivel(int nivel) {
		this.nivel = nivel;
	}

	public UsuarioNodeDTO getPai() {
		return pai;
	}

	public void setPai(UsuarioNodeDTO pai) {
		this.pai = pai;
	}

	public List<UsuarioNodeDTO> getFilhos() {
		return filhos;
	}

	public void setFilhos(List<UsuarioNodeDTO> filhos) {
		this.filhos = filhos;
	}
}