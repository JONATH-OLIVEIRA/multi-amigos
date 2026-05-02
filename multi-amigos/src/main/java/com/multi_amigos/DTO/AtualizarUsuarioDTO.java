package com.multi_amigos.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public class AtualizarUsuarioDTO {
    
    private String nome;
    
    @Email(message = "Email inválido")
    private String email;
    
    // 🔥 ALTERADO: Aceita apenas números (10 ou 11 dígitos) ou vazio
    @Pattern(
        regexp = "^(\\d{10,11})?$",
        message = "Telefone deve conter 10 ou 11 dígitos numéricos"
    )
    private String telefone;
    
    private String senha; // Opcional - se fornecido, atualiza a senha
    
    private Long usuarioPaiId; // Opcional - se fornecido, muda o pai
    
    private Boolean ativo; // Opcional - para ativar/desativar

    // Construtores
    public AtualizarUsuarioDTO() {}
    
    public AtualizarUsuarioDTO(String nome, String email, String telefone, String senha, Long usuarioPaiId, Boolean ativo) {
        this.nome = nome;
        this.email = email;
        setTelefone(telefone); // Usa o setter para normalizar
        this.senha = senha;
        this.usuarioPaiId = usuarioPaiId;
        this.ativo = ativo;
    }
    
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
    
    // 🔥 Setter com normalização: remove qualquer caractere não numérico
    public void setTelefone(String telefone) {
        if (telefone != null && !telefone.trim().isEmpty()) {
            // Remove tudo que não for dígito (parênteses, espaços, hífens, etc)
            this.telefone = telefone.replaceAll("\\D", "");
            
            // Se após a limpeza ficar vazio, define como null
            if (this.telefone.isEmpty()) {
                this.telefone = null;
            }
        } else {
            this.telefone = null;
        }
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
    
    // 🔥 Método utilitário para verificar se o telefone é válido
    public boolean isTelefoneValido() {
        return telefone != null && (telefone.length() == 10 || telefone.length() == 11);
    }
    
    // 🔥 Método utilitário para formatar o telefone para exibição (se necessário)
    public String getTelefoneFormatado() {
        if (telefone == null || telefone.isEmpty()) {
            return "";
        }
        
        if (telefone.length() == 10) {
            // Formato: (DD)XXXX-XXXX
            return String.format("(%s)%s-%s",
                telefone.substring(0, 2),
                telefone.substring(2, 6),
                telefone.substring(6, 10));
        } else if (telefone.length() == 11) {
            // Formato: (DD)XXXXX-XXXX
            return String.format("(%s)%s-%s",
                telefone.substring(0, 2),
                telefone.substring(2, 7),
                telefone.substring(7, 11));
        }
        
        return telefone;
    }
    
    @Override
    public String toString() {
        return "AtualizarUsuarioDTO{" +
                "nome='" + nome + '\'' +
                ", email='" + email + '\'' +
                ", telefone='" + telefone + '\'' +
                ", usuarioPaiId=" + usuarioPaiId +
                ", ativo=" + ativo +
                '}';
    }
}