package com.multi_amigos.DTO;

import com.multi_amigos.model.Perfil;

public class UsuarioDetalheDTO {

    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private Perfil perfil;
    private boolean ativo;
    private Long usuarioPaiId;
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
	public Long getUsuarioPaiId() {
		return usuarioPaiId;
	}
	public void setUsuarioPaiId(Long usuarioPaiId) {
		this.usuarioPaiId = usuarioPaiId;
	}


}
