package com.multi_amigos.service.implemens;

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
    
    @Value("${app.reset-token.expiration-minutes:1440}") // 24 horas em minutos
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
        // Busca usuário
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

        // ✅ Verifica se usuário está ativo
        if (!usuario.isAtivo()) {
            throw new ValidacaoException("Usuário inativo. Não é possível recuperar senha.");
        }

        // ✅ CORREÇÃO 1: Invalida TODOS os tokens anteriores
        tokenRepository.invalidarTokensPorUsuario(usuario.getId());

        // ✅ CORREÇÃO 2: SEMPRE cria NOVO token
        String token = gerarTokenSeguro();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(tokenExpirationMinutes);
        
        PasswordResetToken prt = new PasswordResetToken();
        prt.setUsuario(usuario);
        prt.setToken(token);
        prt.setExpiresAt(expiresAt);
        prt.setUsed(false);

        tokenRepository.save(prt);

        // Envia email
        String link = baseUrl + "/resetar-senha?token=" + token;
        emailService.enviarResetSenha(usuario.getEmail(), usuario.getNome(), link);
    }

    @Override
    public void resetarSenha(String token, String novaSenha) {
        // Busca token
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ValidacaoException("Token inválido"));

        // ✅ Validações
        if (prt.isUsed()) {
            throw new ValidacaoException("Este token já foi utilizado");
        }
        
        if (prt.isExpired()) {
            throw new ValidacaoException("Token expirado. Solicite um novo.");
        }

        Usuario usuario = prt.getUsuario();
        
        // ✅ Verifica se usuário está ativo
        if (!usuario.isAtivo()) {
            throw new ValidacaoException("Usuário inativo. Não é possível redefinir senha.");
        }

        // ✅ Atualiza senha
        usuario.setSenha(encoder.encode(novaSenha));
        usuarioRepository.save(usuario);

        // ✅ Marca token como usado
        prt.setUsed(true);
        tokenRepository.save(prt);
        
        // ✅ Invalida qualquer outro token do mesmo usuário
        tokenRepository.invalidarTokensPorUsuario(usuario.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validarToken(String token) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ValidacaoException("Token inválido"));
        
        if (prt.isUsed()) {
            throw new ValidacaoException("Token já utilizado");
        }
        
        if (prt.isExpired()) {
            throw new ValidacaoException("Token expirado");
        }
        
        return true;
    }

    // ✅ NOVO: Limpeza automática de tokens expirados (roda todo dia às 2h)
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