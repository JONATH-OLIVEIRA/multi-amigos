package com.multi_amigos.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.model.Usuario;

public class UsuarioHierarquiaMapper {

	public static UsuarioHierarquiaDTO toDTO(Usuario usuario) {
		if (usuario == null)
			return null;

		UsuarioHierarquiaDTO dto = new UsuarioHierarquiaDTO();
		dto.setId(usuario.getId());
		dto.setNome(usuario.getNome());
		dto.setEmail(usuario.getEmail());
		dto.setPerfil(usuario.getPerfil());
		dto.setAtivo(usuario.isAtivo());

		// filhos recursivamente
		List<UsuarioHierarquiaDTO> filhosDTO = usuario.getFilhos() == null ? List.of()
				: usuario.getFilhos().stream().map(UsuarioHierarquiaMapper::toDTO).collect(Collectors.toList());

		dto.setFilhos(filhosDTO);
		return dto;
	}
}
