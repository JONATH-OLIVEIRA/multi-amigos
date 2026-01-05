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
import jakarta.validation.constraints.Pattern;

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

	@Pattern(regexp = "^(\\(\\d{2}\\)\\d{4,5}-\\d{4})?$", message = "Telefone deve estar no formato (DD)XXXXX-XXXX ou (DD)XXXX-XXXX")
	@Column(length = 15)
	private String telefone;

	@Column(nullable = false)
	private String senha;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Perfil perfil;

	@Column(nullable = false)
	private boolean ativo = true;

	// 🔗 Hierarquia

	@OneToMany(mappedBy = "autor", fetch = FetchType.LAZY)
	@JsonIgnore // Para evitar loops infinitos no JSON
	private List<Mensagem> mensagensCriadas = new ArrayList<>();

	@JsonIgnoreProperties({ "filhos", "mensagensCriadas", "usuarioPai" })
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "usuario_pai_id")
	private Usuario usuarioPai;

	@JsonIgnoreProperties({ "filhos", "mensagensCriadas", "usuarioPai" })
	@OneToMany(mappedBy = "usuarioPai", fetch = FetchType.LAZY)
	private List<Usuario> filhos = new ArrayList<>();

	// 📅 Auditoria
	@Column(nullable = false, updatable = false)
	private LocalDateTime dataCriacao;

	private LocalDateTime dataAtualizacao;

	// ======================
	// Callbacks JPA
	// ======================

	@PrePersist
	protected void onCreate() {
		this.dataCriacao = LocalDateTime.now();
		this.dataAtualizacao = LocalDateTime.now();
	}

	@PreUpdate
	protected void onUpdate() {
		this.dataAtualizacao = LocalDateTime.now();
	}

	// ======================
	// Construtores
	// ======================

	public Usuario() {
	}

	public Usuario(String nome, String email,
			@Pattern(regexp = "^(\\(\\d{2}\\)\\d{4,5}-\\d{4})?$", message = "Telefone deve estar no formato (DD)XXXXX-XXXX ou (DD)XXXX-XXXX") String telefone,
			String senha, Perfil perfil) {
		super();

		this.nome = nome;
		this.email = email;
		this.telefone = telefone;
		this.senha = senha;
		this.perfil = perfil;

	}

	public List<Mensagem> getMensagensCriadas() {
		return mensagensCriadas;
	}

	public void setMensagensCriadas(List<Mensagem> mensagensCriadas) {
		this.mensagensCriadas = mensagensCriadas;
	}

	public void adicionarMensagem(Mensagem mensagem) {
		this.mensagensCriadas.add(mensagem);
		mensagem.setAutor(this);
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

	public Usuario getUsuarioPai() {
		return usuarioPai;
	}

	public void setUsuarioPai(Usuario usuarioPai) {
		this.usuarioPai = usuarioPai;
	}

	public List<Usuario> getFilhos() {
		return filhos;
	}

	public void setFilhos(List<Usuario> filhos) {
		this.filhos = filhos;
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

	@Override
	public String toString() {
		return "Usuario [id=" + id + ", nome=" + nome + ", email=" + email + ", telefone=" + telefone + ", perfil="
				+ perfil + ", ativo=" + ativo + ", usuarioPaiId=" + (usuarioPai != null ? usuarioPai.getId() : null)
				+ ", dataCriacao=" + dataCriacao + "]";
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Usuario other = (Usuario) obj;
		return Objects.equals(id, other.id);
	}

}