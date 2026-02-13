package com.multi_amigos.auth;

import java.util.HashMap;
import java.util.Map;

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

    private final UsuarioService usuarioService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UsuarioService usuarioService, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder) {
        this.usuarioService = usuarioService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // ========================
    // LOGIN (email OU telefone)
    // ========================
    public Map<String, Object> login(String login, String senha) {
        if (login == null || login.isBlank()) {
            throw new LoginInvalidoException("Informe email ou telefone.");
        }
        if (senha == null || senha.isBlank()) {
            throw new LoginInvalidoException("Informe a senha.");
        }

        Usuario usuario;
        try {
            usuario = buscarPorLogin(login);
        } catch (Exception e) {
            // não vaza se existe/ não existe
            throw new LoginInvalidoException("Credenciais inválidas.");
        }

        if (!usuario.isAtivo()) {
            throw new LoginInvalidoException("Credenciais inválidas.");
        }

        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new LoginInvalidoException("Credenciais inválidas.");
        }

        String token = jwtUtil.generateToken(usuario);

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

    private Usuario buscarPorLogin(String loginRaw) {
        String login = loginRaw.trim();

        // Email
        if (login.contains("@")) {
            return usuarioService.buscarPorEmail(login);
        }

        // Telefone
        String digits = normalizarTelefone(login);

        // tentativa 1: como veio (pode estar com 55 ou sem)
        try {
            return usuarioService.buscarPorTelefone(digits);
        } catch (Exception ignored) {
            // tentativa 2: fallback removendo/colocando 55
        }

        // se vier com 55, tenta sem 55
        if (digits.startsWith("55") && (digits.length() == 12 || digits.length() == 13)) {
            String semDdi = digits.substring(2);
            return usuarioService.buscarPorTelefone(semDdi);
        }

        // se vier sem 55 (10/11), tenta com 55
        if (digits.length() == 10 || digits.length() == 11) {
            String comDdi = "55" + digits;
            return usuarioService.buscarPorTelefone(comDdi);
        }

        // se não bateu em nenhuma regra acima, já é inválido
        throw new LoginInvalidoException("Credenciais inválidas.");
    }

    private String normalizarTelefone(String value) {
        String digits = value.replaceAll("\\D", "");
        if (digits.isBlank()) {
            throw new LoginInvalidoException("Credenciais inválidas.");
        }
        return digits;
    }

    // ========================
    // REGISTER
    // ========================
    public Map<String, Object> register(CadastroUsuarioDTO cadastroDTO) {
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(cadastroDTO);

        Usuario usuario = usuarioService.buscarPorEmail(usuarioDTO.getEmail());

        String token = jwtUtil.generateToken(usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuário registrado com sucesso");
        response.put("token", token);
        response.put("type", "Bearer");
        response.put("perfil", usuario.getPerfil().name());
        response.put("email", usuario.getEmail());
        response.put("nome", usuario.getNome());
        response.put("id", usuario.getId());
        response.put("ativo", usuario.isAtivo());

        return response;
    }
}
