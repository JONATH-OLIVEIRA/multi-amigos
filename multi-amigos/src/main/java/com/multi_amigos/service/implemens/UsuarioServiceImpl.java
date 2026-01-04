package com.multi_amigos.service.implemens;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.exceptions.UsuarioNaoEncontradoException;
import com.multi_amigos.exceptions.ValidacaoException;
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
			usuario.setPerfil(Perfil.ADMIN);
			usuario.setUsuarioPai(null); // Primeiro admin
		} else {
			usuario.setPerfil(Perfil.USUARIO);

			if (dto.getUsuarioPaiId() == null) {
				throw new ValidacaoException("Usuário pai é obrigatório");
			}

			Usuario usuarioPai = usuarioRepository.findById(dto.getUsuarioPaiId())
					.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário pai não encontrado"));
			usuario.setUsuarioPai(usuarioPai);
		}

		Usuario salvo = usuarioRepository.save(usuario);
		return UsuarioMapper.toDTO(salvo);
	}

	// =========================
	// Buscar por ID
	// =========================
	@Override
	@Transactional(readOnly = true)
	public UsuarioDTO buscarPorId(Long id) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
		return UsuarioMapper.toDTO(usuario);
	}

	// =========================
	// Buscar por email
	// =========================
	@Override
	@Transactional(readOnly = true)
	public Usuario buscarPorEmail(String email) {
		return usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
	}

	// =========================
	// Desativar usuário
	// =========================
	@Override
	public void desativarUsuario(Long id) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

		boolean possuiFilhos = usuarioRepository.existsByUsuarioPaiId(usuario.getId());
		if (possuiFilhos) {
			throw new ValidacaoException("Usuário possui filhos ativos e não pode ser removido");
		}

		usuario.setAtivo(false);
		usuarioRepository.save(usuario);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UsuarioDTO> listarTodos() {
		return usuarioRepository.findAll().stream().map(UsuarioMapper::toDTO).toList();
	}
	
	public List<UsuarioHierarquiaDTO> listarHierarquia(Long usuarioId) {
	    Usuario usuario = usuarioRepository.findById(usuarioId)
	            .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));

	    // lista todos os filhos recursivamente
	    return usuario.getFilhos() == null
	            ? List.of()
	            : usuario.getFilhos().stream()
	                .map(UsuarioHierarquiaMapper::toDTO)
	                .collect(Collectors.toList());
	}
}
