package com.multi_amigos.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.multi_amigos.model.Mensagem;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    
    // Mensagens visíveis (ativas e não expiradas)
    @Query("SELECT m FROM Mensagem m WHERE m.ativo = true " +
           "AND (m.dataExpiracao IS NULL OR m.dataExpiracao > :agora) " +
           "ORDER BY m.tipo, m.dataCriacao DESC")
    List<Mensagem> findMensagensVisiveis(@Param("agora") LocalDateTime agora);
    
    // Todas mensagens (para admin)
    List<Mensagem> findAllByOrderByDataCriacaoDesc();
    
    // Mensagens por autor
    List<Mensagem> findByAutorIdOrderByDataCriacaoDesc(Long autorId);
    
    // Mensagens expiradas
    @Query("SELECT m FROM Mensagem m WHERE m.dataExpiracao IS NOT NULL " +
           "AND m.dataExpiracao <= :agora AND m.ativo = true")
    List<Mensagem> findMensagensExpiradas(@Param("agora") LocalDateTime agora);
}