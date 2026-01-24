package com.multi_amigos.DTO;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.multi_amigos.model.Perfil;

public class UsuarioHierarquiaDTO {

    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private Perfil perfil;
    private boolean ativo;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dataCriacao;

    private List<UsuarioHierarquiaDTO> filhos;

    public UsuarioHierarquiaDTO() {}

    public UsuarioHierarquiaDTO(
            Long id,
            String nome,
            String email,
            String telefone,
            Perfil perfil,
            boolean ativo,
            LocalDateTime dataCriacao,
            List<UsuarioHierarquiaDTO> filhos
    ) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.perfil = perfil;
        this.ativo = ativo;
        this.dataCriacao = dataCriacao;
        this.filhos = filhos;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public Perfil getPerfil() { return perfil; }
    public boolean isAtivo() { return ativo; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public List<UsuarioHierarquiaDTO> getFilhos() { return filhos; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setEmail(String email) { this.email = email; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public void setPerfil(Perfil perfil) { this.perfil = perfil; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    public void setFilhos(List<UsuarioHierarquiaDTO> filhos) { this.filhos = filhos; }
}
