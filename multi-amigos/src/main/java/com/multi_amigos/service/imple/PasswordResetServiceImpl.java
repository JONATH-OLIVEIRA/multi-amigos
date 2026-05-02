package com.multi_amigos.service.imple;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
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
    
    @Value("${app.reset-token.expiration-minutes:1440}")
    private int tokenExpirationMinutes;

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
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

        if (!usuario.isAtivo()) {
            throw new ValidacaoException("Usuário inativo");
        }

        // ✅ 1. DELETE qualquer token existente para este usuário
        tokenRepository.deleteByUsuarioId(usuario.getId());

        // ✅ 2. CRIA novo token
        String token = gerarTokenSeguro();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(tokenExpirationMinutes);
        
        PasswordResetToken prt = new PasswordResetToken(token, usuario, expiresAt);
        tokenRepository.save(prt);  // ✅ INSERT funciona! Não há conflito de unique

        // ✅ 3. Envia email
        String link = baseUrl + "/auth/resetar-senha?token=" + token;
        emailService.enviarResetSenha(usuario.getEmail(), usuario.getNome(), link);
    }

    @Override
    public void resetarSenha(String token, String novaSenha) {
        // ✅ 1. Busca o token
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ValidacaoException("Token inválido ou expirado"));

        // ✅ 2. Verifica se expirou
        if (prt.isExpired()) {
            tokenRepository.delete(prt);  // Remove token expirado
            throw new ValidacaoException("Token expirado");
        }

        Usuario usuario = prt.getUsuario();
        
        if (!usuario.isAtivo()) {
            throw new ValidacaoException("Usuário inativo");
        }

        // ✅ 3. Atualiza senha
        usuario.setSenha(encoder.encode(novaSenha));
        usuarioRepository.save(usuario);

        // ✅ 4. DELETE o token (já foi usado)
        tokenRepository.delete(prt);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validarToken(String token) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ValidacaoException("Token inválido ou expirado"));
        
        if (prt.isExpired()) {
            tokenRepository.delete(prt);
            throw new ValidacaoException("Token expirado");
        }
        
        return true;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void limparTokensExpirados() {
        int removidos = tokenRepository.deleteAllExpiredSince(LocalDateTime.now());
        if (removidos > 0) {
            System.out.println("🗑️ " + removidos + " tokens expirados removidos");
        }
    }

    private String gerarTokenSeguro() {
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}