package com.multi_amigos.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Telefone armazenado SEMPRE normalizado (somente dígitos).
     * Ex.: "85999998888" (10-11 dígitos BR sem DDI) ou "5585999998888" (com DDI).
     *
     * Se você não usa DDI, pode manter só 10-11.
     */
    @Column(name = "telefone", unique = true, length = 20)
    private String telefone;

    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Perfil perfil;

    @Column(nullable = false)
    private boolean ativo = true;

    // =========================
    // Relacionamentos
    // =========================

    @OneToMany(mappedBy = "autor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Mensagem> mensagensCriadas = new ArrayList<>();

    @JsonIgnoreProperties({ "filhos", "mensagensCriadas", "usuarioPai" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_pai_id")
    private Usuario usuarioPai;

    @JsonIgnoreProperties({ "filhos", "mensagensCriadas", "usuarioPai" })
    @OneToMany(mappedBy = "usuarioPai", fetch = FetchType.LAZY)
    private List<Usuario> filhos = new ArrayList<>();

    // =========================
    // Auditoria
    // =========================

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    private LocalDateTime dataAtualizacao;

    // ======================
    // Callbacks JPA
    // ======================

    @PrePersist
    protected void onCreate() {
        this.telefone = normalizarTelefone(this.telefone);
        this.dataCriacao = LocalDateTime.now();
        this.dataAtualizacao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.telefone = normalizarTelefone(this.telefone);
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ======================
    // Construtores
    // ======================

    public Usuario() {}

    public Usuario(String nome, String email, String telefone, String senha, Perfil perfil) {
        this.nome = nome;
        this.email = email;
        this.telefone = normalizarTelefone(telefone);
        this.senha = senha;
        this.perfil = perfil;
    }

    // ======================
    // Normalização
    // ======================

    private static String normalizarTelefone(String telefone) {
        if (telefone == null) return null;

        String digits = telefone.replaceAll("\\D", "");

        // se veio vazio, salva null (assim unique não briga por "")
        if (digits.isBlank()) return null;

        // (Opcional) validação simples: BR 10-11, com DDI 12-13 (55 + 10/11)
        // Ajuste se seu sistema aceitar outros formatos.
        if (!(digits.length() == 10 || digits.length() == 11 || digits.length() == 12 || digits.length() == 13)) {
            throw new IllegalArgumentException("Telefone inválido. Informe com DDD (10/11 dígitos) ou com DDI + DDD.");
        }

        return digits;
    }

    // ======================
    // Getters/Setters
    // ======================

    public List<Mensagem> getMensagensCriadas() { return mensagensCriadas; }

    public void setMensagensCriadas(List<Mensagem> mensagensCriadas) { this.mensagensCriadas = mensagensCriadas; }

    public void adicionarMensagem(Mensagem mensagem) {
        this.mensagensCriadas.add(mensagem);
        mensagem.setAutor(this);
    }

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }

    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }

    public String getTelefone() { return telefone; }

    public void setTelefone(String telefone) {
        this.telefone = normalizarTelefone(telefone);
    }

    public String getSenha() { return senha; }

    public void setSenha(String senha) { this.senha = senha; }

    public Perfil getPerfil() { return perfil; }

    public void setPerfil(Perfil perfil) { this.perfil = perfil; }

    public boolean isAtivo() { return ativo; }

    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public Usuario getUsuarioPai() { return usuarioPai; }

    public void setUsuarioPai(Usuario usuarioPai) { this.usuarioPai = usuarioPai; }

    public List<Usuario> getFilhos() { return filhos; }

    public void setFilhos(List<Usuario> filhos) { this.filhos = filhos; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }

    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public LocalDateTime getDataAtualizacao() { return dataAtualizacao; }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) { this.dataAtualizacao = dataAtualizacao; }

    @Override
    public String toString() {
        return "Usuario [id=" + id + ", nome=" + nome + ", email=" + email + ", telefone=" + telefone + ", perfil="
                + perfil + ", ativo=" + ativo + ", usuarioPaiId=" + (usuarioPai != null ? usuarioPai.getId() : null)
                + ", dataCriacao=" + dataCriacao + "]";
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null) return false;
        if (getClass() != obj.getClass()) return false;
        Usuario other = (Usuario) obj;
        return Objects.equals(id, other.id);
    }
}
