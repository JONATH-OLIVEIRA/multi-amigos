package com.multi_amigos.service;

import java.util.List;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.model.Usuario;

public interface UsuarioService {

    // Cadastrar usuário (recebendo a senha)
    UsuarioDTO cadastrarUsuario(CadastroUsuarioDTO dto);

    // Buscar usuário por ID
    UsuarioDTO buscarPorId(Long id);

    // Buscar usuário por email (retorna a entidade)
    Usuario buscarPorEmail(String email);

    // Desativar usuário
    void desativarUsuario(Long id);
    
    List<UsuarioDTO> listarTodos();
    
    List<UsuarioHierarquiaDTO> listarHierarquia(Long usuarioId);
}
