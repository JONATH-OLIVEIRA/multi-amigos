package com.multi_amigos.service.implemens;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.multi_amigos.exceptions.UsuarioNaoEncontradoException;
import com.multi_amigos.exceptions.ValidacaoException;
import com.multi_amigos.model.PasswordResetToken;
import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.PasswordResetTokenRepository;
import com.multi_amigos.repository.UsuarioRepository;
import com.multi_amigos.service.EmailService;
import com.multi_amigos.service.PasswordResetService;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${app.frontend.base-url:http://localhost:8080}")
    private String baseUrl;

    public PasswordResetServiceImpl(
            UsuarioRepository usuarioRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Override
    public void solicitarReset(String email) {
        // internamente ok lançar; no controller você já "engole" pra não vazar info
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

        // ✅ 1 token por usuário: UPDATE se existir, CREATE se não existir
        PasswordResetToken prt = tokenRepository.findByUsuarioId(usuario.getId())
                .orElseGet(PasswordResetToken::new);

        String token = gerarTokenSeguro();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        prt.setUsuario(usuario);
        prt.setToken(token);
        prt.setExpiresAt(expiresAt);
        prt.setUsed(false);

        tokenRepository.save(prt);

        String link = baseUrl + "/auth/resetar-senha?token=" + token;
        emailService.enviarResetSenha(usuario.getEmail(), usuario.getNome(), link);
    }

    @Override
    public void resetarSenha(String token, String novaSenha) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ValidacaoException("Token inválido"));

        if (prt.isUsed()) throw new ValidacaoException("Token já utilizado");
        if (prt.isExpired()) throw new ValidacaoException("Token expirado");

        Usuario usuario = prt.getUsuario();
        usuario.setSenha(encoder.encode(novaSenha));
        usuarioRepository.save(usuario);

        prt.setUsed(true);
        tokenRepository.save(prt);
    }

    private String gerarTokenSeguro() {
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
