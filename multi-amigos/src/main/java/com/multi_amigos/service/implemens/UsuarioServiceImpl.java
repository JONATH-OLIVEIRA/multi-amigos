package com.multi_amigos.service.implemens;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;

import com.multi_amigos.DTO.AtualizarUsuarioDTO;
import com.multi_amigos.DTO.CadastroPublicoDTO;
import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioArvoreDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioDetalheDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.DTO.UsuarioNodeDTO;
import com.multi_amigos.exceptions.UsuarioNaoEncontradoException;
import com.multi_amigos.exceptions.ValidacaoException;
import com.multi_amigos.mapper.UsuarioDetalheMapper;
import com.multi_amigos.mapper.UsuarioHierarquiaMapper;
import com.multi_amigos.mapper.UsuarioMapper;
import com.multi_amigos.mapper.UsuarioNodeMapper;
import com.multi_amigos.model.Perfil;
import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.UsuarioRepository;
import com.multi_amigos.service.UsuarioService;

@Service
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

	private final UsuarioRepository usuarioRepository;
	private final BCryptPasswordEncoder passwordEncoder;

	public UsuarioServiceImpl(UsuarioRepository usuarioRepository) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = new BCryptPasswordEncoder();
	}

	public Usuario buscarPorTelefone(String telefone) {
		String normalizado = (telefone == null) ? null : telefone.replaceAll("\\D", "");

		if (normalizado == null || normalizado.isBlank()) {
			throw new RuntimeException("Telefone inválido.");
		}

		return usuarioRepository.findByTelefone(normalizado)
				.orElseThrow(() -> new RuntimeException("Usuário não encontrado para o telefone informado."));
	}

	@Override
	public UsuarioDTO cadastrarUsuario(CadastroUsuarioDTO dto) {

		// Email único
		if (usuarioRepository.existsByEmail(dto.getEmail())) {
			throw new ValidacaoException("Email já cadastrado");
		}

		// Converte DTO -> Entity
		Usuario usuario = UsuarioMapper.toEntity(dto);

		// Criptografa senha
		usuario.setSenha(passwordEncoder.encode(dto.getSenha()));

		// Define perfil
		long totalAdmins = usuarioRepository.countByPerfil(Perfil.ADMIN);

		if (totalAdmins == 0) {
			// Primeiro usuário do sistema será ADMIN
			usuario.setPerfil(Perfil.ADMIN);
			usuario.setUsuarioPai(null); // Primeiro admin não tem pai
		} else {
			// Usuários subsequentes são USUARIO
			usuario.setPerfil(Perfil.USUARIO);

			// 🔥 NOVA LÓGICA: Verifica se veio por convite/link
			if (dto.getUsuarioPaiId() != null) {
				// CADASTRO POR LINK: Usa o usuário que compartilhou o link como pai
				Usuario usuarioPai = usuarioRepository.findById(dto.getUsuarioPaiId())
						.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário referência não encontrado"));

				// Verifica se o usuário pai está ativo
				if (!usuarioPai.isAtivo()) {
					throw new ValidacaoException("O usuário referência está inativo");
				}

				usuario.setUsuarioPai(usuarioPai);

			} else {
				// CADASTRO DIRETO (SEM LINK): Atribui o ADMIN master como pai padrão
				List<Usuario> adminsAtivos = usuarioRepository
						.findByPerfilAndAtivoTrueOrderByDataCriacaoAsc(Perfil.ADMIN);

				if (!adminsAtivos.isEmpty()) {
					// Pega o primeiro ADMIN criado (master)
					usuario.setUsuarioPai(adminsAtivos.get(0));
				} else {
					// Fallback: pega qualquer usuário ativo
					List<Usuario> usuariosAtivos = usuarioRepository.findByAtivoTrueOrderByDataCriacaoAsc();
					if (!usuariosAtivos.isEmpty()) {
						usuario.setUsuarioPai(usuariosAtivos.get(0));
					} else {
						throw new ValidacaoException("Não há usuários ativos no sistema");
					}
				}
			}
		}

		// Salva o usuário
		Usuario salvo = usuarioRepository.save(usuario);
		return UsuarioMapper.toDTO(salvo);
	}

	@Override
	public UsuarioDTO cadastroPublico(CadastroPublicoDTO dto) {
		CadastroUsuarioDTO usuarioDTO = new CadastroUsuarioDTO();
		usuarioDTO.setNome(dto.getNome());
		usuarioDTO.setEmail(dto.getEmail());
		usuarioDTO.setSenha(dto.getSenha());
		usuarioDTO.setTelefone(dto.getTelefone());
		// Não seta usuarioPaiId - será atribuído automaticamente pelo método acima

		return cadastrarUsuario(usuarioDTO);
	}

	// Método para cadastro por link/referência
	@Override
	public UsuarioDTO cadastroPorReferencia(Long referenciaId, CadastroPublicoDTO dto) {
		// Valida a referência
		if (!usuarioRepository.existsByIdAndAtivoTrue(referenciaId)) {
			throw new ValidacaoException("Link de referência inválido ou usuário inativo");
		}

		CadastroUsuarioDTO usuarioDTO = new CadastroUsuarioDTO();
		usuarioDTO.setNome(dto.getNome());
		usuarioDTO.setEmail(dto.getEmail());
		usuarioDTO.setSenha(dto.getSenha());
		usuarioDTO.setTelefone(dto.getTelefone());
		usuarioDTO.setUsuarioPaiId(referenciaId); // 🔥 Define o pai como a referência

		return cadastrarUsuario(usuarioDTO);
	}

	// =========================
	// Atualizar usuário
	// =========================
	@Override
	public UsuarioDTO atualizarUsuario(Long id, AtualizarUsuarioDTO dto) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		// Atualiza apenas os campos fornecidos
		if (dto.getNome() != null && !dto.getNome().trim().isEmpty()) {
			usuario.setNome(dto.getNome());
		}

		if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
			// Verifica se o email já existe (exceto para o próprio usuário)
			if (!usuario.getEmail().equals(dto.getEmail()) && usuarioRepository.existsByEmail(dto.getEmail())) {
				throw new ValidacaoException("Email já cadastrado por outro usuário");
			}
			usuario.setEmail(dto.getEmail());
		}

		if (dto.getTelefone() != null) {
			usuario.setTelefone(dto.getTelefone());
		}

		if (dto.getSenha() != null && !dto.getSenha().trim().isEmpty()) {
			usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
		}

		if (dto.getUsuarioPaiId() != null) {
			if (dto.getUsuarioPaiId().equals(id)) {
				throw new ValidacaoException("Um usuário não pode ser pai de si mesmo");
			}

			Usuario novoPai = usuarioRepository.findById(dto.getUsuarioPaiId())
					.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário pai não encontrado"));

			// Verifica se não está criando um ciclo (o novo pai não pode ser filho do
			// usuário atual)
			if (ehDescendente(novoPai, usuario)) {
				throw new ValidacaoException("Não é possível definir um descendente como pai");
			}

			usuario.setUsuarioPai(novoPai);
		}

		if (dto.getAtivo() != null) {
			// Se está tentando desativar, verifica se não tem filhos ativos
			if (!dto.getAtivo() && usuario.isAtivo()) {
				boolean possuiFilhosAtivos = usuarioRepository.existsByUsuarioPaiIdAndAtivoTrue(id);
				if (possuiFilhosAtivos) {
					throw new ValidacaoException("Usuário possui filhos ativos e não pode ser desativado");
				}
			}
			usuario.setAtivo(dto.getAtivo());
		}

		Usuario atualizado = usuarioRepository.save(usuario);
		return UsuarioMapper.toDTO(atualizado);
	}

	// Método auxiliar para verificar se um usuário é descendente de outro
	private boolean ehDescendente(Usuario possivelDescendente, Usuario ancestral) {
		if (possivelDescendente == null || ancestral == null) {
			return false;
		}

		Usuario atual = possivelDescendente;
		while (atual.getUsuarioPai() != null) {
			if (atual.getUsuarioPai().getId().equals(ancestral.getId())) {
				return true;
			}
			atual = atual.getUsuarioPai();
		}
		return false;
	}

	@Override
	@Transactional(readOnly = true)
	public Usuario buscarPorEmail(String email) {
		return usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
	}

	// =========================
	// Desativar usuário (método específico)
	// =========================
	@Override
	public void desativarUsuario(Long id) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		boolean possuiFilhosAtivos = usuarioRepository.existsByUsuarioPaiIdAndAtivoTrue(id);
		if (possuiFilhosAtivos) {
			throw new ValidacaoException("Usuário possui filhos ativos e não pode ser desativado");
		}

		usuario.setAtivo(false);
		usuarioRepository.save(usuario);
	}

	// =========================
	// Reativar usuário
	// =========================
	@Override
	public void reativarUsuario(Long id) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		// Verifica se o pai está ativo (se tiver pai)
		if (usuario.getUsuarioPai() != null && !usuario.getUsuarioPai().isAtivo()) {
			throw new ValidacaoException("Não é possível reativar usuário com pai inativo");
		}

		usuario.setAtivo(true);
		usuarioRepository.save(usuario);
	}

	@Override
	@Transactional(readOnly = true)
	public UsuarioDTO buscarComHierarquia(Long id) {
		// Use o MESMO método otimizado!
		return buscarPorId(id);
	}

	@Override
	@Transactional(readOnly = true)
	public UsuarioDTO buscarPorId(Long id) {
		// Use o método com EntityGraph
		Usuario usuario = usuarioRepository.findComHierarquiaCompletaById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
		return UsuarioMapper.toDTO(usuario);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarTodos() {
		// 🔥 OTIMIZADO: Use o novo método que carrega toda hierarquia
		List<Usuario> usuarios = usuarioRepository.findAllComHierarquia(); // ← MUDOU AQUI
		return usuarios.stream().map(UsuarioMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarTodosAtivos(String nome, Boolean ativo) {
		// 🔥 OTIMIZADO: Use o novo método para ativos com hierarquia
		List<Usuario> usuarios = usuarioRepository.findAllAtivosComHierarquia(); // ← MUDOU AQUI

		// Aplica os filtros via Stream
		return usuarios.stream()
				.filter(u -> (nome == null || nome.isBlank() || u.getNome().toLowerCase().contains(nome.toLowerCase())))
				.filter(u -> (ativo == null || u.isAtivo() == ativo)).map(UsuarioMapper::toDTO)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarAtivos() {
		// 🔥 OTIMIZADO: Use o novo método otimizado
		return usuarioRepository.findAllAtivosComHierarquia() // ← MUDOU AQUI
				.stream().map(UsuarioMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarPorPerfil(String perfil) {
		Perfil perfilEnum;
		try {
			perfilEnum = Perfil.valueOf(perfil.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new ValidacaoException("Perfil inválido: " + perfil);
		}

		// Use o método existente (não precisa de otimização específica)
		return usuarioRepository.findByPerfilComPai(perfilEnum).stream().map(UsuarioMapper::toDTO)
				.collect(Collectors.toList());
	}

	@Override
	public List<UsuarioHierarquiaDTO> listarHierarquia(Long usuarioId) {
		// Use o método com filhos
		Usuario usuario = usuarioRepository.findComFilhosById(usuarioId)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		return usuario.getFilhos() == null ? List.of()
				: usuario.getFilhos().stream().map(UsuarioHierarquiaMapper::toDTO).collect(Collectors.toList());
	}

	public UsuarioDetalheDTO buscarDetalhe(@PathVariable Long id) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
		return UsuarioDetalheMapper.toDTO(usuario);
	}

	@Override
	@Transactional(readOnly = true)
	public UsuarioDTO buscarPorEmailDTO(String email) {
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
		return UsuarioMapper.toDTO(usuario);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarComFiltros(String nome, String email, String perfil, Boolean ativo,
			LocalDate dataInicio, LocalDate dataFim) {

		// 🔥 OTIMIZADO: Use o método que carrega toda hierarquia
		List<Usuario> usuarios = usuarioRepository.findAllComHierarquia(); // ← MUDOU AQUI

		// Aplica filtros via stream
		return usuarios.stream()
				.filter(u -> nome == null || nome.isBlank() || u.getNome().toLowerCase().contains(nome.toLowerCase()))
				.filter(u -> email == null || email.isBlank()
						|| u.getEmail().toLowerCase().contains(email.toLowerCase()))
				.filter(u -> perfil == null || perfil.isBlank() || u.getPerfil().name().equalsIgnoreCase(perfil))
				.filter(u -> ativo == null || u.isAtivo() == ativo).filter(u -> {
					if (dataInicio == null && dataFim == null)
						return true;

					if (u.getDataCriacao() == null)
						return false;

					LocalDate dataUsuario = u.getDataCriacao().toLocalDate();

					if (dataInicio != null && dataFim != null) {
						return !dataUsuario.isBefore(dataInicio) && !dataUsuario.isAfter(dataFim);
					} else if (dataInicio != null) {
						return !dataUsuario.isBefore(dataInicio);
					} else {
						return !dataUsuario.isAfter(dataFim);
					}
				}).map(UsuarioMapper::toDTO).collect(Collectors.toList());
	}

	// Adicione este método ao UsuarioServiceImpl
	// No UsuarioServiceImpl.java - ATUALIZE o método obterArvoreGenealogica
	@Override
	@Transactional(readOnly = true)
	public UsuarioArvoreDTO obterArvoreGenealogica(Long id) {
		Usuario usuario = usuarioRepository.findComHierarquiaCompletaById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		// 🔥 Use o novo mapper SEM o parâmetro pai
		UsuarioNodeDTO raiz = UsuarioNodeMapper.toTreeDTO(usuario, 0);

		// Calcula estatísticas
		Map<String, Object> estatisticas = calcularEstatisticasArvore(raiz);

		UsuarioArvoreDTO arvore = new UsuarioArvoreDTO();
		arvore.setRaiz(raiz);
		arvore.setTotalNiveis((int) estatisticas.get("totalNiveis"));
		arvore.setTotalMembros((int) estatisticas.get("totalMembros"));
		arvore.setDistribuicaoPorNivel((Map<Integer, Integer>) estatisticas.get("distribuicaoPorNivel"));

		// DEBUG: Log do tamanho da árvore
		System.out.println("🌳 Árvore gerada para usuário ID: " + id);
		System.out.println("🌳 Total de membros: " + arvore.getTotalMembros());
		System.out.println("🌳 Total de níveis: " + arvore.getTotalNiveis());

		return arvore;
	}

	private Map<String, Object> calcularEstatisticasArvore(UsuarioNodeDTO node) {
		Map<String, Object> estatisticas = new HashMap<>();
		Map<Integer, Integer> distribuicao = new HashMap<>();

		int[] contadores = new int[2]; // [0] = totalMembros, [1] = totalNiveis

		calcularEstatisticasRecursivo(node, distribuicao, contadores, 0);

		estatisticas.put("totalMembros", contadores[0]);
		estatisticas.put("totalNiveis", contadores[1] + 1); // +1 porque começa em 0
		estatisticas.put("distribuicaoPorNivel", distribuicao);

		return estatisticas;
	}

	private void calcularEstatisticasRecursivo(UsuarioNodeDTO node, Map<Integer, Integer> distribuicao,
			int[] contadores, int nivelAtual) {
		if (node == null)
			return;

		// Conta este nó
		contadores[0]++;

		// Atualiza maior nível
		if (nivelAtual > contadores[1]) {
			contadores[1] = nivelAtual;
		}

		// Atualiza distribuição por nível
		distribuicao.put(nivelAtual, distribuicao.getOrDefault(nivelAtual, 0) + 1);

		// Processa filhos
		if (node.getFilhos() != null) {
			for (UsuarioNodeDTO filho : node.getFilhos()) {
				calcularEstatisticasRecursivo(filho, distribuicao, contadores, nivelAtual + 1);
			}
		}
	}
}