package com.multi_amigos.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.multi_amigos.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);
    
    Optional<PasswordResetToken> findByUsuarioId(Long usuarioId);
    
    // ✅ NOVO: Busca tokens não usados por usuário
    List<PasswordResetToken> findByUsuarioIdAndUsedFalse(Long usuarioId);
    
    // ✅ NOVO: Busca tokens expirados
    List<PasswordResetToken> findByExpiresAtBefore(LocalDateTime date);
    
    // ✅ NOVO: Invalida todos os tokens de um usuário
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.usuario.id = :usuarioId AND t.used = false")
    int invalidarTokensPorUsuario(@Param("usuarioId") Long usuarioId);
    
    // ✅ NOVO: Deleta tokens expirados
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    int deleteAllExpiredSince(@Param("now") LocalDateTime now);
}