package com.multi_amigos.service.implemens;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;

import com.multi_amigos.DTO.AtualizarUsuarioDTO;
import com.multi_amigos.DTO.CadastroPublicoDTO;
import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioDetalheDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.exceptions.UsuarioNaoEncontradoException;
import com.multi_amigos.exceptions.ValidacaoException;
import com.multi_amigos.mapper.UsuarioDetalheMapper;
import com.multi_amigos.mapper.UsuarioHierarquiaMapper;
import com.multi_amigos.mapper.UsuarioMapper;
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

	// =========================
	// Cadastrar usuário
	// =========================
	// UsuarioServiceImpl.java
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
		// Use o método otimizado
		List<Usuario> usuarios = usuarioRepository.findAllComHierarquiaCompleta();
		return usuarios.stream().map(UsuarioMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarTodosAtivos(String nome, Boolean ativo) {
		// 1. Busca todos com a hierarquia otimizada que você já tem
		List<Usuario> usuarios = usuarioRepository.findAllComHierarquiaCompleta();

		// 2. Aplica os filtros via Stream (mais rápido que mudar todas as queries do
		// Repository agora)
		return usuarios.stream()
				.filter(u -> (nome == null || nome.isBlank() || u.getNome().toLowerCase().contains(nome.toLowerCase())))
				.filter(u -> (ativo == null || u.isAtivo() == ativo)).map(UsuarioMapper::toDTO)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarAtivos() {
		// Use o método com EntityGraph
		return usuarioRepository.findAllAtivosComPai().stream().map(UsuarioMapper::toDTO).collect(Collectors.toList());
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

		// Use o método com EntityGraph
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

		// Busca todos os usuários
		List<Usuario> usuarios = usuarioRepository.findAllComHierarquiaCompleta();

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

}