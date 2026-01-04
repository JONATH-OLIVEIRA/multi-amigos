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
    // LOGIN
    // ========================
    public String login(String email, String senha) {

        Usuario usuario = usuarioService.buscarPorEmail(email);

        // ✅ Usa LoginInvalidoException para tratar senha incorreta
        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new LoginInvalidoException("Senha inválida para o usuário: " + email);
        }

        return jwtUtil.generateToken(usuario);
    }

    // ========================
    // REGISTER
    // ========================
    public Map<String, Object> register(CadastroUsuarioDTO cadastroDTO) {

        // ⚡ Usa apenas o DTO de cadastro, que contém a senha
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(cadastroDTO);

        // Busca a entidade completa para gerar o token
        Usuario usuario = usuarioService.buscarPorEmail(usuarioDTO.getEmail());

        String token = jwtUtil.generateToken(usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuário registrado com sucesso");
        response.put("token", token);
        response.put("perfil", usuario.getPerfil().name());
        response.put("email", usuario.getEmail());
        response.put("nome", usuario.getNome());

        return response;
    }
}
