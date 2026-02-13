package com.multi_amigos.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.model.Usuario;

public class UsuarioMapper {

	private UsuarioMapper() {
	}

	// =========================
	// CadastroUsuarioDTO -> Usuario
	// =========================
	public static Usuario toEntity(CadastroUsuarioDTO dto) {
		if (dto == null)
			return null;

		Usuario usuario = new Usuario();

		usuario.setNome(dto.getNome());
		usuario.setEmail(dto.getEmail());

		// ✅ normaliza antes de setar
		usuario.setTelefone(dto.getTelefone());

		// senha ainda SEM hash (service faz isso)
		usuario.setSenha(dto.getSenha());

		return usuario;
	}

	// =========================
	// Usuario -> UsuarioDTO
	// =========================
	public static UsuarioDTO toDTO(Usuario usuario) {
		if (usuario == null)
			return null;

		UsuarioDTO dto = new UsuarioDTO();
		dto.setId(usuario.getId());
		dto.setNome(usuario.getNome());
		dto.setEmail(usuario.getEmail());
		dto.setTelefone(usuario.getTelefone());
		dto.setPerfil(usuario.getPerfil());
		dto.setAtivo(usuario.isAtivo());

		if (usuario.getUsuarioPai() != null) {
			dto.setUsuarioPaiId(usuario.getUsuarioPai().getId());
		}

		if (usuario.getFilhos() != null) {
			List<Long> filhosIds = usuario.getFilhos().stream().map(Usuario::getId).collect(Collectors.toList());
			dto.setFilhosIds(filhosIds);
		}

		dto.setDataCriacao(usuario.getDataCriacao());
		dto.setDataAtualizacao(usuario.getDataAtualizacao());

		return dto;
	}
}
