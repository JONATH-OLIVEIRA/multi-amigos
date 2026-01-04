package com.multi_amigos.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.model.Usuario;

public class UsuarioMapper {

    private UsuarioMapper() {
        // evita instanciação
    }

    // =========================
    // CadastroUsuarioDTO -> Usuario
    // =========================
    public static Usuario toEntity(CadastroUsuarioDTO dto) {
        if (dto == null) {
            return null;
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefone(dto.getTelefone());
        usuario.setSenha(dto.getSenha()); // senha ainda SEM hash (service faz isso)
        
        return usuario;
    }

    // =========================
    // Usuario -> UsuarioDTO
    // =========================
    public static UsuarioDTO toDTO(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setTelefone(usuario.getTelefone());
        dto.setPerfil(usuario.getPerfil());
        dto.setAtivo(usuario.isAtivo());

        // usuário pai (apenas ID)
        if (usuario.getUsuarioPai() != null) {
            dto.setUsuarioPaiId(usuario.getUsuarioPai().getId());
        }

        // filhos (somente IDs)
        if (usuario.getFilhos() != null) {
            List<Long> filhosIds = usuario.getFilhos()
                    .stream()
                    .map(Usuario::getId)
                    .collect(Collectors.toList());
            dto.setFilhosIds(filhosIds);
        }

        dto.setDataCriacao(usuario.getDataCriacao());
        dto.setDataAtualizacao(usuario.getDataAtualizacao());

        return dto;
    }
}
