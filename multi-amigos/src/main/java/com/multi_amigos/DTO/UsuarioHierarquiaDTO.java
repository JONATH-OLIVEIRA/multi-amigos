package com.multi_amigos.DTO;

import java.util.List;

import com.multi_amigos.model.Perfil;

public class UsuarioHierarquiaDTO {

	private Long id;
	private String nome;
	private String email;
	private Perfil perfil;
	private boolean ativo;
	private List<UsuarioHierarquiaDTO> filhos;

	public UsuarioHierarquiaDTO() {
	}

	public UsuarioHierarquiaDTO(Long id, String nome, String email, Perfil perfil, boolean ativo,
			List<UsuarioHierarquiaDTO> filhos) {
		super();
		this.id = id;
		this.nome = nome;
		this.email = email;
		this.perfil = perfil;
		this.ativo = ativo;
		this.filhos = filhos;
	}

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

	public List<UsuarioHierarquiaDTO> getFilhos() {
		return filhos;
	}

	public void setFilhos(List<UsuarioHierarquiaDTO> filhos) {
		this.filhos = filhos;
	}

}
