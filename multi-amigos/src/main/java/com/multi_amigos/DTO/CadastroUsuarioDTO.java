package com.multi_amigos.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CadastroUsuarioDTO {

    @NotBlank
    private String nome;

    @NotBlank
    @Email
    private String email;

    @Pattern(
        regexp = "^(\\(\\d{2}\\)\\d{4,5}-\\d{4})?$",
        message = "Telefone deve estar no formato (DD)XXXXX-XXXX ou (DD)XXXX-XXXX"
    )
    private String telefone;

    @NotBlank
    private String senha;

    @NotNull
    private Long usuarioPaiId; // pode ser null SOMENTE para o primeiro admin

    // ===== Construtores =====
    public CadastroUsuarioDTO() {}

    // ===== Getters e Setters =====

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

