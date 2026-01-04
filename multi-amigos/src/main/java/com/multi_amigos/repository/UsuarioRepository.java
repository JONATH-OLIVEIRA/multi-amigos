package com.multi_amigos.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.multi_amigos.model.Perfil;
import com.multi_amigos.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	// =========================
	// Busca básica
	// =========================

	Optional<Usuario> findByEmail(String email);

	boolean existsByEmail(String email);

	// =========================
	// Hierarquia
	// =========================

	List<Usuario> findByUsuarioPaiId(Long usuarioPaiId);

	boolean existsByUsuarioPaiId(Long usuarioPaiId);

	// =========================
	// Admin / controle
	// =========================

	long countByPerfil(Perfil perfil);
}
