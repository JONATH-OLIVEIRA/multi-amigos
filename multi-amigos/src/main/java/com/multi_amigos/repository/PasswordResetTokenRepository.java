package com.multi_amigos.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.multi_amigos.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUsuarioId(Long usuarioId);
}
