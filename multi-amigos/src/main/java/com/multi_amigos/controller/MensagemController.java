package com.multi_amigos.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.CriarMensagemDTO;
import com.multi_amigos.DTO.EstatisticasMensagensDTO;
import com.multi_amigos.DTO.MensagemDTO;
import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.UsuarioRepository;
import com.multi_amigos.service.MensagemService;

@RestController
@RequestMapping("/api/mensagens")
public class MensagemController {

	private final MensagemService mensagemService;
	private final UsuarioRepository usuarioRepository;

	public MensagemController(MensagemService mensagemService, UsuarioRepository usuarioRepository) {
		this.mensagemService = mensagemService;
		this.usuarioRepository = usuarioRepository;
	}

	// Criar mensagem (apenas ADMIN)
	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> criarMensagem(@RequestBody CriarMensagemDTO dto, Authentication authentication) {
		// Busca o usuário/autor pelo email (do authentication)
		String email = authentication.getName();
		Usuario autor = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

		MensagemDTO mensagem = mensagemService.criarMensagem(dto, autor.getId());

		Map<String, Object> response = new HashMap<>();
		response.put("message", "Mensagem criada com sucesso");
		response.put("mensagem", mensagem);

		return ResponseEntity.ok(response);
	}

	// Listar mensagens visíveis (todos usuários autenticados)
	@GetMapping("/visiveis")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<MensagemDTO>> listarMensagensVisiveis() {
		List<MensagemDTO> mensagens = mensagemService.listarMensagensVisiveis();
		return ResponseEntity.ok(mensagens);
	}

	// Listar todas mensagens (apenas ADMIN - para gerenciamento)
	@GetMapping("/todas")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<MensagemDTO>> listarTodasMensagens() {
		List<MensagemDTO> mensagens = mensagemService.listarTodasMensagens();
		return ResponseEntity.ok(mensagens);
	}

	// Listar minhas mensagens (mensagens que eu criei) - APENAS ADMIN
	@GetMapping("/minhas")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<MensagemDTO>> listarMinhasMensagens(Authentication authentication) {
		String email = authentication.getName();
		Usuario autor = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

		// CORREÇÃO AQUI: Usar o método correto
		List<MensagemDTO> mensagens = mensagemService.listarMensagensPorAutor(autor.getId());

		return ResponseEntity.ok(mensagens);
	}

	// Atualizar mensagem (apenas ADMIN)
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<MensagemDTO> atualizarMensagem(@PathVariable Long id, @RequestBody CriarMensagemDTO dto) {
		MensagemDTO mensagem = mensagemService.atualizarMensagem(id, dto);
		return ResponseEntity.ok(mensagem);
	}

	// Ativar/Desativar mensagem (apenas ADMIN)
	@PatchMapping("/{id}/toggle")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> toggleAtivo(@PathVariable Long id) {
		mensagemService.toggleAtivo(id);

		Map<String, String> response = new HashMap<>();
		response.put("message", "Status da mensagem alterado com sucesso");

		return ResponseEntity.ok(response);
	}

	// Excluir mensagem (apenas ADMIN)
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> excluirMensagem(@PathVariable Long id) {
		mensagemService.excluirMensagem(id);

		Map<String, String> response = new HashMap<>();
		response.put("message", "Mensagem excluída com sucesso");

		return ResponseEntity.ok(response);
	}

	// Endpoint para teste rápido
	@GetMapping("/teste")
	public ResponseEntity<?> teste() {
		Map<String, String> response = new HashMap<>();
		response.put("status", "OK");
		response.put("message", "Endpoint de mensagens funcionando");

		return ResponseEntity.ok(response);
	}

	@GetMapping("/estatisticas")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<EstatisticasMensagensDTO> getEstatisticas() {
		EstatisticasMensagensDTO estatisticas = mensagemService.getEstatisticasMensagens();
		return ResponseEntity.ok(estatisticas);
	}

	// Buscar mensagem por ID (apenas ADMIN)
	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<MensagemDTO> buscarMensagemPorId(@PathVariable Long id) {
		MensagemDTO mensagem = mensagemService.buscarMensagemPorId(id);
		return ResponseEntity.ok(mensagem);
	}

}