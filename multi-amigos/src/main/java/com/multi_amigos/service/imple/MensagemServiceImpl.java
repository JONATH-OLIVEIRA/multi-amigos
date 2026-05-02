package com.multi_amigos.service.imple;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.multi_amigos.DTO.CriarMensagemDTO;
import com.multi_amigos.DTO.EstatisticasMensagensDTO;
import com.multi_amigos.DTO.MensagemDTO;
import com.multi_amigos.exceptions.ValidacaoException;
import com.multi_amigos.mapper.EstatisticasMapper;
import com.multi_amigos.mapper.MensagemMapper;
import com.multi_amigos.model.Mensagem;
import com.multi_amigos.model.TipoMensagem;
import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.MensagemRepository;
import com.multi_amigos.repository.UsuarioRepository;
import com.multi_amigos.service.MensagemService;

@Service
@Transactional
public class MensagemServiceImpl implements MensagemService {

	private final MensagemRepository mensagemRepository;
	private final UsuarioRepository usuarioRepository;

	public MensagemServiceImpl(MensagemRepository mensagemRepository, UsuarioRepository usuarioRepository) {
		this.mensagemRepository = mensagemRepository;
		this.usuarioRepository = usuarioRepository;
	}

	@Override
	public MensagemDTO criarMensagem(CriarMensagemDTO dto, Long autorId) {
		// Validações
		validarDTO(dto);

		// Busca autor
		Usuario autor = usuarioRepository.findById(autorId)
				.orElseThrow(() -> new ValidacaoException("Autor não encontrado"));

		// Verifica se autor é ADMIN (apenas admins podem criar mensagens)
		if (!autor.getPerfil().name().equals("ADMIN")) {
			throw new ValidacaoException("Apenas administradores podem criar mensagens");
		}

		// Converte DTO para Entity usando o Mapper
		Mensagem mensagem = MensagemMapper.toEntity(dto, autor);
		mensagem.setDataCriacao(LocalDateTime.now());

		// Define data de expiração se informada
		if (dto.getDiasValidade() != null && dto.getDiasValidade() > 0) {
			LocalDateTime expiracao = LocalDateTime.now().plusDays(dto.getDiasValidade());
			mensagem.setDataExpiracao(expiracao);
		}

		Mensagem salva = mensagemRepository.save(mensagem);
		return MensagemMapper.toDTO(salva);
	}

	@Override
	@Transactional(readOnly = true)
	public List<MensagemDTO> listarMensagensVisiveis() {
		List<Mensagem> mensagens = mensagemRepository.findMensagensVisiveis(LocalDateTime.now());
		return mensagens.stream().map(MensagemMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<MensagemDTO> listarTodasMensagens() {
		List<Mensagem> mensagens = mensagemRepository.findAllByOrderByDataCriacaoDesc();
		return mensagens.stream().map(MensagemMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	public MensagemDTO atualizarMensagem(Long id, CriarMensagemDTO dto) {
		// Validações
		validarDTO(dto);

		Mensagem mensagem = mensagemRepository.findById(id)
				.orElseThrow(() -> new ValidacaoException("Mensagem não encontrada"));

		// Atualiza a entidade usando o Mapper
		MensagemMapper.updateEntity(mensagem, dto);

		// Atualiza expiração
		if (dto.getDiasValidade() != null && dto.getDiasValidade() > 0) {
			mensagem.setDataExpiracao(LocalDateTime.now().plusDays(dto.getDiasValidade()));
		} else {
			mensagem.setDataExpiracao(null);
		}

		Mensagem atualizada = mensagemRepository.save(mensagem);
		return MensagemMapper.toDTO(atualizada);
	}

	@Override
	public void toggleAtivo(Long id) {
		Mensagem mensagem = mensagemRepository.findById(id)
				.orElseThrow(() -> new ValidacaoException("Mensagem não encontrada"));

		mensagem.setAtivo(!mensagem.isAtivo());
		mensagemRepository.save(mensagem);
	}

	@Override
	public void excluirMensagem(Long id) {
		if (!mensagemRepository.existsById(id)) {
			throw new ValidacaoException("Mensagem não encontrada");
		}

		mensagemRepository.deleteById(id);
	}

	// Método auxiliar para validar DTO
	private void validarDTO(CriarMensagemDTO dto) {
		if (dto.getTitulo() == null || dto.getTitulo().trim().isEmpty()) {
			throw new ValidacaoException("Título é obrigatório");
		}

		if (dto.getConteudo() == null || dto.getConteudo().trim().isEmpty()) {
			throw new ValidacaoException("Conteúdo é obrigatório");
		}

		if (dto.getTipo() == null || dto.getTipo().trim().isEmpty()) {
			throw new ValidacaoException("Tipo é obrigatório");
		}

		// Valida se o tipo é válido
		try {
			TipoMensagem.valueOf(dto.getTipo().toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new ValidacaoException("Tipo de mensagem inválido. Use: IMPORTANTE, INFORMATIVO ou URGENTE");
		}
	}

	// Método adicional: desativar mensagens expiradas automaticamente
	@Transactional
	public void desativarMensagensExpiradas() {
		List<Mensagem> expiradas = mensagemRepository.findMensagensExpiradas(LocalDateTime.now());

		for (Mensagem mensagem : expiradas) {
			mensagem.setAtivo(false);
		}

		mensagemRepository.saveAll(expiradas);
	}

	@Override // ADICIONAR ESTA ANOTAÇÃO
	@Transactional(readOnly = true)
	public List<MensagemDTO> listarMensagensPorAutor(Long autorId) {
		List<Mensagem> mensagens = mensagemRepository.findByAutorIdOrderByDataCriacaoDesc(autorId);
		return mensagens.stream().map(MensagemMapper::toDTO).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public MensagemDTO buscarMensagemPorId(Long id) {
		Mensagem mensagem = mensagemRepository.findById(id)
				.orElseThrow(() -> new ValidacaoException("Mensagem não encontrada"));
		return MensagemMapper.toDTO(mensagem);
	}

	@Override
	@Transactional(readOnly = true)
	public EstatisticasMensagensDTO getEstatisticasMensagens() {
		List<MensagemDTO> todas = listarTodasMensagens();
		List<MensagemDTO> visiveis = listarMensagensVisiveis();

		return EstatisticasMapper.toEstatisticasMensagensDTO(todas, visiveis);
	}
	
}
