package com.multi_amigos.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.multi_amigos.model.Perfil;
import com.multi_amigos.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // =========================
    // Busca básica
    // =========================

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    // =========================
    // Hierarquia
    // =========================

    List<Usuario> findByUsuarioPaiId(Long usuarioPaiId);
    
    // Usuários com um determinado pai
    List<Usuario> findByUsuarioPaiIdAndAtivoTrue(Long usuarioPaiId);
    
    // Verifica se um usuário tem filhos
    boolean existsByUsuarioPaiId(Long usuarioPaiId);
    
    // Verifica se um usuário tem filhos ativos
    boolean existsByUsuarioPaiIdAndAtivoTrue(Long usuarioPaiId);
    
    // Usuários sem pai (primeiro nível)
    List<Usuario> findByUsuarioPaiIsNull();
    
    // Usuários sem pai e ativos
    List<Usuario> findByUsuarioPaiIsNullAndAtivoTrue();
    
    // Conta usuários sem pai
    long countByUsuarioPaiIsNull();

    // =========================
    // Status (ativo/inativo)
    // =========================
    
    List<Usuario> findByAtivoTrue();
    
    List<Usuario> findByAtivoFalse();
    
    long countByAtivoTrue();
    
    long countByAtivoFalse();

    // =========================
    // Perfil
    // =========================

    long countByPerfil(Perfil perfil);
    
    List<Usuario> findByPerfil(Perfil perfil);
    
    List<Usuario> findByPerfilAndAtivoTrue(Perfil perfil);
    
    List<Usuario> findByPerfilAndAtivoFalse(Perfil perfil);
    
    // =========================
    // Buscas combinadas
    // =========================
    
    // Busca os últimos N usuários cadastrados (para atividade recente)
    List<Usuario> findTop5ByOrderByDataCriacaoDesc();
    
    // Busca por nome (para busca/filtro)
    List<Usuario> findByNomeContainingIgnoreCase(String nome);
    
    // Busca por nome e ativo
    List<Usuario> findByNomeContainingIgnoreCaseAndAtivoTrue(String nome);
    
    // Busca por email (case insensitive)
    Optional<Usuario> findByEmailIgnoreCase(String email);
    
    // Verifica existência por email (case insensitive)
    boolean existsByEmailIgnoreCase(String email);
    
    // =========================
    // Hierarquia avançada
    // =========================
        
    // Busca todos os ancestrais de um usuário (pai, avô, etc)
    // Nota: Esta é uma consulta mais complexa que pode precisar de @Query
    // @Query("SELECT u FROM Usuario u WHERE u.id IN (SELECT ...)")
    // List<Usuario> findAncestors(Long usuarioId);
    
    // Busca por perfil e hierarquia
    List<Usuario> findByPerfilAndUsuarioPaiId(Perfil perfil, Long usuarioPaiId);
    
    // =========================
    // 🔥 NOVOS MÉTODOS PARA A LÓGICA DE CADASTRO
    // =========================
    
    // 1. Busca o primeiro ADMIN criado (para ser o pai padrão)
    Optional<Usuario> findFirstByPerfilOrderByDataCriacaoAsc(Perfil perfil);
    
    // 2. Busca o primeiro ADMIN ativo criado
    Optional<Usuario> findFirstByPerfilAndAtivoTrueOrderByDataCriacaoAsc(Perfil perfil);
    
    // 3. Busca ADMINs ativos ordenados por criação (mais antigo primeiro)
    List<Usuario> findByPerfilAndAtivoTrueOrderByDataCriacaoAsc(Perfil perfil);
    
    // 4. Busca todos os usuários ativos ordenados por criação
    List<Usuario> findByAtivoTrueOrderByDataCriacaoAsc();
    
    // 5. Busca o primeiro usuário ativo criado (fallback)
    Optional<Usuario> findFirstByAtivoTrueOrderByDataCriacaoAsc();
    
    // 6. Busca usuários por perfil com ordenação
    List<Usuario> findByPerfilOrderByDataCriacaoAsc(Perfil perfil);
    
    // 7. Busca usuários sem pai e ativos (usuários de primeiro nível)
    List<Usuario> findByUsuarioPaiIsNullAndAtivoTrueOrderByDataCriacaoAsc();
    
    // 8. Conta ADMINs ativos
    long countByPerfilAndAtivoTrue(Perfil perfil);
    
    // 9. Verifica se um usuário específico está ativo
    boolean existsByIdAndAtivoTrue(Long id);
    
    // 10. Busca usuários por perfil e que não tenham um determinado pai
    List<Usuario> findByPerfilAndUsuarioPaiIsNot(Perfil perfil, Usuario usuarioPai);
    
    // =========================
    // 🔥 MÉTODOS COM @Query PARA CONSULTAS COMPLEXAS
    // =========================
    
    // Busca todos os descendentes de um usuário (filhos, netos, etc)
    @Query(value = "WITH RECURSIVE descendentes AS (" +
                   "  SELECT id, nome, email, usuario_pai_id, ativo, perfil " +
                   "  FROM usuarios WHERE id = ?1 " +
                   "  UNION ALL " +
                   "  SELECT u.id, u.nome, u.email, u.usuario_pai_id, u.ativo, u.perfil " +
                   "  FROM usuarios u " +
                   "  INNER JOIN descendentes d ON u.usuario_pai_id = d.id" +
                   ") " +
                   "SELECT * FROM descendentes WHERE id != ?1", 
           nativeQuery = true)
    List<Usuario> findAllDescendentes(Long usuarioId);
    
    // Busca a profundidade de um usuário na hierarquia
    @Query(value = "WITH RECURSIVE ancestrais AS (" +
                   "  SELECT id, usuario_pai_id, 1 as nivel " +
                   "  FROM usuarios WHERE id = ?1 " +
                   "  UNION ALL " +
                   "  SELECT u.id, u.usuario_pai_id, a.nivel + 1 " +
                   "  FROM usuarios u " +
                   "  INNER JOIN ancestrais a ON u.id = a.usuario_pai_id" +
                   ") " +
                   "SELECT MAX(nivel) FROM ancestrais", 
           nativeQuery = true)
    Integer findProfundidadeHierarquica(Long usuarioId);
    
    // Busca estatísticas da rede
    @Query(value = "SELECT " +
                   "  COUNT(*) as total_usuarios, " +
                   "  SUM(CASE WHEN ativo = true THEN 1 ELSE 0 END) as usuarios_ativos, " +
                   "  SUM(CASE WHEN perfil = 'ADMIN' THEN 1 ELSE 0 END) as total_admins, " +
                   "  SUM(CASE WHEN usuario_pai_id IS NULL THEN 1 ELSE 0 END) as usuarios_raiz, " +
                   "  MAX(profundidade) as maior_profundidade " +
                   "FROM (" +
                   "  SELECT *, " +
                   "  (WITH RECURSIVE profundidade AS (" +
                   "    SELECT id, usuario_pai_id, 1 as nivel " +
                   "    FROM usuarios WHERE id = u.id " +
                   "    UNION ALL " +
                   "    SELECT u2.id, u2.usuario_pai_id, p.nivel + 1 " +
                   "    FROM usuarios u2 " +
                   "    INNER JOIN profundidade p ON u2.id = p.usuario_pai_id" +
                   "  ) " +
                   "  SELECT MAX(nivel) FROM profundidade) as profundidade " +
                   "  FROM usuarios u" +
                   ") as usuarios_com_profundidade",
           nativeQuery = true)
    Object[] findEstatisticasRede();
    
    // =========================
    // 🔥 MÉTODOS PARA RELATÓRIOS E DASHBOARD
    // =========================
    
    // Conta novos usuários por período
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.dataCriacao BETWEEN :inicio AND :fim")
    long countNovosUsuariosPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
    
    // Busca usuários cadastrados por dia (para gráfico)
    @Query(value = "SELECT DATE(data_criacao) as dia, COUNT(*) as quantidade " +
                   "FROM usuarios " +
                   "WHERE data_criacao >= :dataInicio " +
                   "GROUP BY DATE(data_criacao) " +
                   "ORDER BY dia",
           nativeQuery = true)
    List<Object[]> findUsuariosPorDia(@Param("dataInicio") LocalDate dataInicio);
    
    // Busca distribuição por perfil
    @Query(value = "SELECT perfil, COUNT(*) as quantidade " +
                   "FROM usuarios " +
                   "WHERE ativo = true " +
                   "GROUP BY perfil",
           nativeQuery = true)
    List<Object[]> findDistribuicaoPorPerfil();
    
    // =========================
    // 🔥 MÉTODOS PARA VALIDAÇÃO DE HIERARQUIA
    // =========================
    
    // Verifica se usuário B é ancestral de usuário A
    @Query(value = "WITH RECURSIVE ancestrais AS (" +
                   "  SELECT id, usuario_pai_id " +
                   "  FROM usuarios WHERE id = ?1 " +
                   "  UNION ALL " +
                   "  SELECT u.id, u.usuario_pai_id " +
                   "  FROM usuarios u " +
                   "  INNER JOIN ancestrais a ON u.id = a.usuario_pai_id" +
                   ") " +
                   "SELECT COUNT(*) > 0 FROM ancestrais WHERE id = ?2",
           nativeQuery = true)
    boolean isAncestral(Long usuarioId, Long possivelAncestralId);
    
    // Verifica se pode definir usuário B como pai de usuário A (evita ciclos)
    default boolean podeDefinirComoPai(Long usuarioId, Long novoPaiId) {
        if (usuarioId.equals(novoPaiId)) {
            return false; // Não pode ser pai de si mesmo
        }
        return !isAncestral(novoPaiId, usuarioId); // Não pode se tornar pai de um ancestral
    }
      
    
}