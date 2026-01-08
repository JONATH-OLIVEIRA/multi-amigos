// UsuarioNodeMapper.java - CORRIGIDO
package com.multi_amigos.mapper;

import com.multi_amigos.DTO.UsuarioNodeDTO;
import com.multi_amigos.model.Usuario;

public class UsuarioNodeMapper {

    public static UsuarioNodeDTO toDTO(Usuario usuario, int nivel) {
        if (usuario == null) return null;

        UsuarioNodeDTO dto = new UsuarioNodeDTO();
        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setTelefone(usuario.getTelefone());
        dto.setPerfil(usuario.getPerfil());
        dto.setAtivo(usuario.isAtivo());
        dto.setDataCriacao(usuario.getDataCriacao());
        dto.setDataAtualizacao(usuario.getDataAtualizacao());
        dto.setNivel(nivel);

        // 🔥 NÃO seta o pai - remove referência circular
        // dto.setPai(paiDTO); // REMOVA ESTA LINHA

        return dto;
    }

    // Método recursivo para construir a árvore
    public static UsuarioNodeDTO toTreeDTO(Usuario usuario, int nivel) {
        UsuarioNodeDTO node = toDTO(usuario, nivel);

        // Processa filhos recursivamente
        if (usuario.getFilhos() != null && !usuario.getFilhos().isEmpty()) {
            for (Usuario filho : usuario.getFilhos()) {
                node.getFilhos().add(toTreeDTO(filho, nivel + 1));
            }
        }

        return node;
    }
}