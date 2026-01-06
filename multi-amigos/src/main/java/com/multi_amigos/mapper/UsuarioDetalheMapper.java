package com.multi_amigos.mapper;

import com.multi_amigos.DTO.UsuarioDetalheDTO;
import com.multi_amigos.model.Usuario;

public class UsuarioDetalheMapper {

    public static UsuarioDetalheDTO toDTO(Usuario u) {
        UsuarioDetalheDTO dto = new UsuarioDetalheDTO();
        dto.setId(u.getId());
        dto.setNome(u.getNome());
        dto.setEmail(u.getEmail());
        dto.setTelefone(u.getTelefone());
        dto.setPerfil(u.getPerfil());
        dto.setAtivo(u.isAtivo());
        dto.setUsuarioPaiId(
            u.getUsuarioPai() != null ? u.getUsuarioPai().getId() : null
        );
        return dto;
    }
}
