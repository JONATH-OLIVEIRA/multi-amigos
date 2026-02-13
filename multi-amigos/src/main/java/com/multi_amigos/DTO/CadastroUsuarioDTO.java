package com.multi_amigos.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CadastroUsuarioDTO {

	@NotBlank(message = "Nome é obrigatório")
	private String nome;

	@NotBlank(message = "Email é obrigatório")
	@Email(message = "Email inválido")
	private String email;

	/**
	 * Mesma regra do cadastro público, pra não ficar inconsistente. Se preenchido,
	 * precisa ter 10 a 13 dígitos no total.
	 */
	@Pattern(regexp = "^(\\D*\\d\\D*){10,13}$|^$", message = "Telefone inválido. Informe com DDD (10/11 dígitos) ou com DDI+DDD (12/13 dígitos).")
	private String telefone;

	@NotBlank(message = "Senha é obrigatória")
	private String senha;

	/**
	 * Pode ser null SOMENTE para o primeiro admin (como você já trata no service).
	 */
	private Long usuarioPaiId;

	public CadastroUsuarioDTO() {
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

	public String getSenha() {
		return senha;
	}

	public void setSenha(String senha) {
		this.senha = senha;
	}

	public Long getUsuarioPaiId() {
		return usuarioPaiId;
	}

	public void setUsuarioPaiId(Long usuarioPaiId) {
		this.usuarioPaiId = usuarioPaiId;
	}
}
