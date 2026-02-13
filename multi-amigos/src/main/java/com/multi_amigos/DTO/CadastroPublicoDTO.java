package com.multi_amigos.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CadastroPublicoDTO {

	@NotBlank(message = "Nome é obrigatório")
	@Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
	private String nome;

	@NotBlank(message = "Email é obrigatório")
	@Email(message = "Email inválido")
	private String email;

	@NotBlank(message = "Senha é obrigatória")
	@Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
	private String senha;

	/**
	 * Aceita: - vazio / null (opcional) - com máscara: (85)99999-8888, 85
	 * 99999-8888, etc - só dígitos: 85999998888 - com DDI: 5585999998888
	 *
	 * Regra: se preenchido, precisa ter 10 a 13 dígitos no total.
	 */
	@Pattern(regexp = "^(\\D*\\d\\D*){10,13}$|^$", message = "Telefone inválido. Informe com DDD (10/11 dígitos) ou com DDI+DDD (12/13 dígitos).")
	private String telefone;

	public CadastroPublicoDTO() {
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

	public String getSenha() {
		return senha;
	}

	public void setSenha(String senha) {
		this.senha = senha;
	}

	public String getTelefone() {
		return telefone;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}
}