package com.multi_amigos.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.multi_amigos.model.Perfil;
import com.multi_amigos.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // =========================
    // Busca básica com EntityGraph
    // =========================

    @EntityGraph(attributePaths = { "usuarioPai" })
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    // =========================
    // 🔥 MÉTODOS OTIMIZADOS - SEM N+1
    // =========================

    // Método OTIMIZADO para ativos com hierarquia completa
    @Query("SELECT DISTINCT u FROM Usuario u " +
           "LEFT JOIN FETCH u.usuarioPai " +
           "LEFT JOIN FETCH u.filhos " +
           "WHERE u.ativo = true")
    List<Usuario> findAllAtivosComHierarquia();

    // Método OTIMIZADO para todos os usuários com hierarquia completa
    @Query("SELECT DISTINCT u FROM Usuario u " +
           "LEFT JOIN FETCH u.usuarioPai " +
           "LEFT JOIN FETCH u.filhos")
    List<Usuario> findAllComHierarquia();

    // =========================
    // Métodos otimizados com EntityGraph para evitar N+1
    // =========================

    @EntityGraph(attributePaths = { "usuarioPai" })
    @Override
    List<Usuario> findAll();

    @EntityGraph(attributePaths = { "usuarioPai" })
    @Query("SELECT u FROM Usuario u")
    List<Usuario> findAllComPai();

    @EntityGraph(attributePaths = { "usuarioPai", "filhos", "filhos.filhos", // Netos
            "filhos.filhos.filhos" // Bisnetos
    })
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findComHierarquiaCompletaById(@Param("id") Long id);

    // Mantém o antigo se for usado em outro lugar (SÓ CARREGA PAI)
    @EntityGraph(attributePaths = { "usuarioPai" })
    @Query("SELECT u FROM Usuario u WHERE u.ativo = true")
    List<Usuario> findAllAtivosComPai();

    @EntityGraph(attributePaths = { "usuarioPai" })
    @Query("SELECT u FROM Usuario u WHERE u.perfil = :perfil")
    List<Usuario> findByPerfilComPai(@Param("perfil") Perfil perfil);

    // =========================
    // Hierarquia
    // =========================

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByUsuarioPaiId(Long usuarioPaiId);

    // Usuários com um determinado pai
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByUsuarioPaiIdAndAtivoTrue(Long usuarioPaiId);

    // Verifica se um usuário tem filhos
    boolean existsByUsuarioPaiId(Long usuarioPaiId);

    // Verifica se um usuário tem filhos ativos
    boolean existsByUsuarioPaiIdAndAtivoTrue(Long usuarioPaiId);

    // Usuários sem pai (primeiro nível)
    @EntityGraph(attributePaths = { "filhos" })
    List<Usuario> findByUsuarioPaiIsNull();

    // Usuários sem pai e ativos
    @EntityGraph(attributePaths = { "filhos" })
    List<Usuario> findByUsuarioPaiIsNullAndAtivoTrue();

    // Conta usuários sem pai
    long countByUsuarioPaiIsNull();

    // =========================
    // Status (ativo/inativo) com EntityGraph
    // =========================

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByAtivoTrue();

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByAtivoFalse();

    long countByAtivoTrue();

    long countByAtivoFalse();

    // =========================
    // Perfil com EntityGraph
    // =========================

    long countByPerfil(Perfil perfil);

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfil(Perfil perfil);

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilAndAtivoTrue(Perfil perfil);

    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilAndAtivoFalse(Perfil perfil);

    // =========================
    // Buscas combinadas com EntityGraph
    // =========================

    // Busca os últimos N usuários cadastrados (para atividade recente)
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findTop5ByOrderByDataCriacaoDesc();

    // Busca por nome (para busca/filtro)
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByNomeContainingIgnoreCase(String nome);

    // Busca por nome e ativo
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByNomeContainingIgnoreCaseAndAtivoTrue(String nome);

    // Busca por email (case insensitive)
    @EntityGraph(attributePaths = { "usuarioPai" })
    Optional<Usuario> findByEmailIgnoreCase(String email);

    // Verifica existência por email (case insensitive)
    boolean existsByEmailIgnoreCase(String email);

    // =========================
    // Hierarquia avançada
    // =========================
    
    // NOTA: Este método já existe e é similar ao findAllComHierarquia()
    // Pode considerar removê-lo ou mantê-lo por compatibilidade
    @Query("SELECT DISTINCT u FROM Usuario u " + 
           "LEFT JOIN FETCH u.usuarioPai " + 
           "LEFT JOIN FETCH u.filhos")
    List<Usuario> findAllComHierarquiaCompleta();

    // Busca por perfil e hierarquia
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilAndUsuarioPaiId(Perfil perfil, Long usuarioPaiId);

    // =========================
    // 🔥 NOVOS MÉTODOS PARA A LÓGICA DE CADASTRO com EntityGraph
    // =========================

    // 1. Busca o primeiro ADMIN criado (para ser o pai padrão)
    @EntityGraph(attributePaths = { "usuarioPai" })
    Optional<Usuario> findFirstByPerfilOrderByDataCriacaoAsc(Perfil perfil);

    // 2. Busca o primeiro ADMIN ativo criado
    @EntityGraph(attributePaths = { "usuarioPai" })
    Optional<Usuario> findFirstByPerfilAndAtivoTrueOrderByDataCriacaoAsc(Perfil perfil);

    // 3. Busca ADMINs ativos ordenados por criação (mais antigo primeiro)
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilAndAtivoTrueOrderByDataCriacaoAsc(Perfil perfil);

    // 4. Busca todos os usuários ativos ordenados por criação
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByAtivoTrueOrderByDataCriacaoAsc();

    // 5. Busca o primeiro usuário ativo criado (fallback)
    @EntityGraph(attributePaths = { "usuarioPai" })
    Optional<Usuario> findFirstByAtivoTrueOrderByDataCriacaoAsc();

    // 6. Busca usuários por perfil com ordenação
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilOrderByDataCriacaoAsc(Perfil perfil);

    // 7. Busca usuários sem pai e ativos (usuários de primeiro nível)
    @EntityGraph(attributePaths = { "filhos" })
    List<Usuario> findByUsuarioPaiIsNullAndAtivoTrueOrderByDataCriacaoAsc();

    // 8. Conta ADMINs ativos
    long countByPerfilAndAtivoTrue(Perfil perfil);

    // 9. Verifica se um usuário específico está ativo
    boolean existsByIdAndAtivoTrue(Long id);

    // 10. Busca usuários por perfil e que não tenham um determinado pai
    @EntityGraph(attributePaths = { "usuarioPai" })
    List<Usuario> findByPerfilAndUsuarioPaiIsNot(Perfil perfil, Usuario usuarioPai);

    // =========================
    // 🔥 MÉTODOS ESPECIAIS PARA DETALHES COMPLETOS
    // =========================

    @EntityGraph(attributePaths = { "usuarioPai", "filhos", "mensagensCriadas" })
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findComTudoById(@Param("id") Long id);

    @EntityGraph(attributePaths = { "filhos" })
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findComFilhosById(@Param("id") Long id);

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
           "SELECT * FROM descendentes WHERE id != ?1", nativeQuery = true)
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
           "SELECT MAX(nivel) FROM ancestrais", nativeQuery = true)
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
           ") as usuarios_com_profundidade", nativeQuery = true)
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
           "ORDER BY dia", nativeQuery = true)
    List<Object[]> findUsuariosPorDia(@Param("dataInicio") LocalDate dataInicio);

    // Busca distribuição por perfil
    @Query(value = "SELECT perfil, COUNT(*) as quantidade " + 
           "FROM usuarios " + 
           "WHERE ativo = true " +
           "GROUP BY perfil", nativeQuery = true)
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
           "SELECT COUNT(*) > 0 FROM ancestrais WHERE id = ?2", nativeQuery = true)
    boolean isAncestral(Long usuarioId, Long possivelAncestralId);

    // Verifica se pode definir usuário B como pai de usuário A (evita ciclos)
    default boolean podeDefinirComoPai(Long usuarioId, Long novoPaiId) {
        if (usuarioId.equals(novoPaiId)) {
            return false; // Não pode ser pai de si mesmo
        }
        return !isAncestral(novoPaiId, usuarioId); // Não pode se tornar pai de um ancestral
    }

    // =========================
    // 🔥 MÉTODOS ESPECIAIS PARA PERFORMANCE
    // =========================

    // Busca apenas dados básicos (para listagens rápidas)
    @Query("SELECT u.id, u.nome, u.email, u.perfil, u.ativo, " +
           "(SELECT COUNT(f) FROM Usuario f WHERE f.usuarioPai.id = u.id AND f.ativo = true) as totalFilhosAtivos " +
           "FROM Usuario u")
    List<Object[]> findAllBasico();

    // Busca usuários com contagem de filhos (para hierarquia)
    @Query("SELECT u, COUNT(f) as totalFilhos " + 
           "FROM Usuario u LEFT JOIN u.filhos f " +
           "WHERE f.ativo = true OR f IS NULL " + 
           "GROUP BY u.id")
    List<Object[]> findAllComContagemFilhos();
}