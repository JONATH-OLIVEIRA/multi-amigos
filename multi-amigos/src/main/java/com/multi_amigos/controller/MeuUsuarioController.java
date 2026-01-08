package com.multi_amigos.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.AtualizarUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioDetalheDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/me")
@PreAuthorize("isAuthenticated()")
public class MeuUsuarioController {

	private final UsuarioService usuarioService;

	public MeuUsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	// ==========================
	// 1. OBTER MEUS DADOS BÁSICOS
	// ==========================
	@GetMapping
	public ResponseEntity<UsuarioDTO> meusDados(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);
		return ResponseEntity.ok(usuario);
	}

	// ==========================
	// 2. ATUALIZAR MEUS DADOS
	// ==========================
	@PutMapping
	public ResponseEntity<UsuarioDTO> atualizarMeusDados(Authentication authentication,
			@RequestBody @Valid AtualizarUsuarioDTO dto) {

		String email = authentication.getName();
		UsuarioDTO usuarioLogado = usuarioService.buscarPorEmailDTO(email);

		// SIMPLIFICAÇÃO: O Service já valida o que pode ser alterado
		// O usuário só pode passar: nome, email, telefone, senha
		// Se tentar passar perfil, usuarioPaiId, ativo -> Service ignora ou valida
		UsuarioDTO atualizado = usuarioService.atualizarUsuario(usuarioLogado.getId(), dto);
		return ResponseEntity.ok(atualizado);
	}

	// ==========================
	// 3. VER MEUS FILHOS DIRETOS
	// ==========================
	@GetMapping("/hierarquia")
	public ResponseEntity<List<UsuarioHierarquiaDTO>> minhaHierarquia(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		List<UsuarioHierarquiaDTO> hierarquia = usuarioService.listarHierarquia(usuario.getId());
		return ResponseEntity.ok(hierarquia);
	}

	// ==========================
	// 4. VER MEUS DETALHES COMPLETOS
	// ==========================
	@GetMapping("/detalhe")
	public ResponseEntity<UsuarioDetalheDTO> meuDetalhe(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		UsuarioDetalheDTO detalhe = usuarioService.buscarDetalhe(usuario.getId());
		return ResponseEntity.ok(detalhe);
	}

	// ==========================
	// 5. VER QUEM ME INDICOU (MEU PAI)
	// ==========================
	@GetMapping("/pai")
	public ResponseEntity<UsuarioDTO> meuPai(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		if (usuario.getUsuarioPaiId() == null) {
			return ResponseEntity.noContent().build();
		}

		UsuarioDTO pai = usuarioService.buscarPorId(usuario.getUsuarioPaiId());
		return ResponseEntity.ok(pai);
	}

	// ==========================
	// 6. DESATIVAR MINHA CONTA
	// ==========================
	@PatchMapping("/desativar")
	public ResponseEntity<Map<String, String>> desativarMinhaConta(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		try {
			usuarioService.desativarUsuario(usuario.getId());

			Map<String, String> response = new HashMap<>();
			response.put("mensagem", "Conta desativada com sucesso");
			response.put("aviso", "Entre em contato com o administrador para reativar sua conta");

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			Map<String, String> response = new HashMap<>();
			response.put("erro", "Não foi possível desativar sua conta");
			response.put("detalhe", e.getMessage());

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
		}
	}

	// ==========================
	// 7. GERAR MEU LINK DE CONVITE
	// ==========================
	@GetMapping("/link-convite")
	public ResponseEntity<Map<String, String>> gerarMeuLinkConvite(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		String linkConvite = "http://localhost:8080/cadastro?ref=" + usuario.getId();

		Map<String, String> response = new HashMap<>();
		response.put("link", linkConvite);
		response.put("mensagem", "Compartilhe este link para convidar novas pessoas para sua rede");
		response.put("seuNome", usuario.getNome());
		response.put("instrucoes", "Cada pessoa que se cadastrar por este link será seu filho na rede");

		return ResponseEntity.ok(response);
	}

	// ==========================
	// 8. MINHAS ESTATÍSTICAS BÁSICAS
	// ==========================
	@GetMapping("/estatisticas")
	public ResponseEntity<Map<String, Object>> minhasEstatisticas(Authentication authentication) {
		String email = authentication.getName();
		UsuarioDTO usuario = usuarioService.buscarPorEmailDTO(email);

		List<UsuarioHierarquiaDTO> filhos = usuarioService.listarHierarquia(usuario.getId());

		Map<String, Object> estatisticas = new HashMap<>();
		estatisticas.put("nome", usuario.getNome());
		estatisticas.put("email", usuario.getEmail());
		estatisticas.put("dataCadastro", usuario.getDataCriacao());
		estatisticas.put("perfil", usuario.getPerfil());
		estatisticas.put("ativo", usuario.isAtivo());
		estatisticas.put("totalFilhos", filhos.size());
		estatisticas.put("telefone", usuario.getTelefone());

		// Pai
		if (usuario.getUsuarioPaiId() != null) {
			try {
				UsuarioDTO pai = usuarioService.buscarPorId(usuario.getUsuarioPaiId());
				estatisticas.put("pai", pai.getNome());
			} catch (Exception e) {
				estatisticas.put("pai", "ID: " + usuario.getUsuarioPaiId());
			}
			estatisticas.put("paiId", usuario.getUsuarioPaiId());
		} else {
			estatisticas.put("pai", "Nenhum");
			estatisticas.put("paiId", null);
		}

		// Nomes dos filhos
		if (!filhos.isEmpty()) {
			List<String> nomesFilhos = filhos.stream().map(UsuarioHierarquiaDTO::getNome).toList();
			estatisticas.put("nomesFilhos", nomesFilhos);
		}

		return ResponseEntity.ok(estatisticas);
	}

}