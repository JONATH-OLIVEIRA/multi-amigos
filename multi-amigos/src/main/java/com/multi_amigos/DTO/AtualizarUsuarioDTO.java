package com.multi_amigos.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public class AtualizarUsuarioDTO {
    
    private String nome;
    
    @Email(message = "Email inválido")
    private String email;
    
    @Pattern(
        regexp = "^(\\(\\d{2}\\)\\d{4,5}-\\d{4})?$",
        message = "Telefone deve estar no formato (DD)XXXXX-XXXX ou (DD)XXXX-XXXX"
    )
    private String telefone;
    
    private String senha; // Opcional - se fornecido, atualiza a senha
    
    private Long usuarioPaiId; // Opcional - se fornecido, muda o pai
    
    private Boolean ativo; // Opcional - para ativar/desativar

    // Construtores
    public AtualizarUsuarioDTO() {}
    
    // Getters e Setters
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
    
    public Boolean getAtivo() {
        return ativo;
    }
    
    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
