package com.multi_amigos.auth;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.exceptions.LoginInvalidoException;
import com.multi_amigos.model.Usuario;
import com.multi_amigos.service.UsuarioService;
import com.multi_amigos.util.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // ========================
    // LOGIN OTIMIZADO - EVITA CONSULTA REDUNDANTE
    // ========================
    public Map<String, Object> login(String email, String senha) {
        // ✅ Busca o usuário UMA ÚNICA VEZ
        Usuario usuario = usuarioService.buscarPorEmail(email);

        // ✅ Valida a senha
        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new LoginInvalidoException("Senha inválida para o usuário: " + email);
        }

        // ✅ Gera o token
        String token = jwtUtil.generateToken(usuario);

        // ✅ Retorna resposta completa em UM único método
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");
        response.put("perfil", usuario.getPerfil().name());
        response.put("nome", usuario.getNome());
        response.put("email", usuario.getEmail());
        response.put("id", usuario.getId());
        response.put("ativo", usuario.isAtivo());

        return response;
    }

    // ========================
    // REGISTER
    // ========================
    public Map<String, Object> register(CadastroUsuarioDTO cadastroDTO) {
        // ⚡ Usa apenas o DTO de cadastro
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(cadastroDTO);

        // Busca a entidade completa para gerar o token
        Usuario usuario = usuarioService.buscarPorEmail(usuarioDTO.getEmail());

        String token = jwtUtil.generateToken(usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuário registrado com sucesso");
        response.put("token", token);
        response.put("type", "Bearer"); // Adicionar type
        response.put("perfil", usuario.getPerfil().name());
        response.put("email", usuario.getEmail());
        response.put("nome", usuario.getNome());
        response.put("id", usuario.getId()); // Adicionar ID
        response.put("ativo", usuario.isAtivo()); // Adicionar status

        return response;
    }
}