package com.multi_amigos.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.AtualizarUsuarioDTO;
import com.multi_amigos.DTO.CadastroPublicoDTO;
import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

	private final UsuarioService usuarioService;

	public UsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	// ==========================
	// CADASTRO ADMIN (com todos os campos)
	// ==========================
	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UsuarioDTO> cadastrar(@RequestBody @Valid CadastroUsuarioDTO dto) {
		UsuarioDTO usuarioCriado = usuarioService.cadastrarUsuario(dto);
		return ResponseEntity.status(HttpStatus.CREATED).body(usuarioCriado);
	}

	// ==========================
	// CADASTRO PÚBLICO (sem usuarioPaiId)
	// ==========================
	@PostMapping("/cadastro-publico")
	@PreAuthorize("permitAll()")
	public ResponseEntity<UsuarioDTO> cadastroPublico(@Valid @RequestBody CadastroPublicoDTO dto) {
	    UsuarioDTO usuarioCriado = usuarioService.cadastroPublico(dto);
	    return ResponseEntity.status(HttpStatus.CREATED).body(usuarioCriado);
	}
	
	// ==========================
	// CADASTRO POR LINK/REFERÊNCIA
	// ==========================
	@PostMapping("/cadastro-por-link/{referenciaId}")
	@PreAuthorize("permitAll()")
	public ResponseEntity<UsuarioDTO> cadastroPorLink(
	        @PathVariable Long referenciaId,
	        @Valid @RequestBody CadastroPublicoDTO dto) {
	    
	    UsuarioDTO usuarioCriado = usuarioService.cadastroPorReferencia(referenciaId, dto);
	    return ResponseEntity.status(HttpStatus.CREATED).body(usuarioCriado);
	}

	// ==========================
	// Atualizar usuário
	// ==========================
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UsuarioDTO> atualizar(@PathVariable Long id, @RequestBody @Valid AtualizarUsuarioDTO dto) {
		UsuarioDTO usuarioAtualizado = usuarioService.atualizarUsuario(id, dto);
		return ResponseEntity.ok(usuarioAtualizado);
	}

	// ==========================
	// Buscar usuário por ID
	// ==========================
	@GetMapping("/{id}")
	@Transactional(readOnly = true)
	public ResponseEntity<UsuarioDTO> buscarPorId(@PathVariable Long id) {
		UsuarioDTO usuario = usuarioService.buscarPorId(id);
		return ResponseEntity.ok(usuario);
	}

	// ==========================
	// Listar todos os usuários (ADMIN)
	// ==========================
	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioDTO>> listarTodos() {
		List<UsuarioDTO> usuarios = usuarioService.listarTodos();
		return ResponseEntity.ok(usuarios);
	}

	// ==========================
	// Listar usuários ativos
	// ==========================
	@GetMapping("/ativos")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioDTO>> listarAtivos() {
		List<UsuarioDTO> usuarios = usuarioService.listarAtivos();
		return ResponseEntity.ok(usuarios);
	}

	// ==========================
	// Listar usuários inativos
	// ==========================
	@GetMapping("/inativos")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioDTO>> listarInativos() {
		// Usando o método listarTodos e filtrando no controller
		List<UsuarioDTO> todosUsuarios = usuarioService.listarTodos();
		List<UsuarioDTO> inativos = todosUsuarios.stream().filter(usuario -> !usuario.isAtivo()).toList();
		return ResponseEntity.ok(inativos);
	}

	// ==========================
	// Listar por perfil
	// ==========================
	@GetMapping("/perfil/{perfil}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioDTO>> listarPorPerfil(@PathVariable String perfil) {
		List<UsuarioDTO> usuarios = usuarioService.listarPorPerfil(perfil);
		return ResponseEntity.ok(usuarios);
	}

	// ==========================
	// Buscar usuários por nome (search)
	// ==========================
	@GetMapping("/buscar")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioDTO>> buscarPorNome(@RequestParam String nome) {
		// Implementação temporária - filtrando no controller
		List<UsuarioDTO> todosUsuarios = usuarioService.listarTodos();
		List<UsuarioDTO> resultados = todosUsuarios.stream()
				.filter(usuario -> usuario.getNome().toLowerCase().contains(nome.toLowerCase())).toList();
		return ResponseEntity.ok(resultados);
	}

	// ==========================
	// Hierarquia
	// ==========================
	@GetMapping("/{id}/hierarquia")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UsuarioHierarquiaDTO>> verHierarquia(@PathVariable Long id) {
		List<UsuarioHierarquiaDTO> hierarquia = usuarioService.listarHierarquia(id);
		return ResponseEntity.ok(hierarquia);
	}

	// ==========================
	// Buscar usuário com hierarquia completa
	// ==========================
	@GetMapping("/{id}/hierarquia-completa")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UsuarioDTO> buscarComHierarquia(@PathVariable Long id) {
		UsuarioDTO usuario = usuarioService.buscarComHierarquia(id);
		return ResponseEntity.ok(usuario);
	}

	// ==========================
	// Desativar usuário
	// ==========================
	@PatchMapping("/{id}/desativar")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> desativar(@PathVariable Long id) {
		usuarioService.desativarUsuario(id);
		return ResponseEntity.noContent().build();
	}

	// ==========================
	// Reativar usuário
	// ==========================
	@PatchMapping("/{id}/reativar")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> reativar(@PathVariable Long id) {
		usuarioService.reativarUsuario(id);
		return ResponseEntity.noContent().build();
	}

	// ==========================
	// Deletar usuário (apenas se não tiver filhos)
	// ==========================
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> deletar(@PathVariable Long id) {
		// Primeiro desativa para verificar se pode ser removido
		usuarioService.desativarUsuario(id);

		// Aqui poderia ter uma lógica para deletar permanentemente
		// Mas por enquanto apenas desativa
		return ResponseEntity.noContent().build();
	}

	// ==========================
	// Estatísticas básicas
	// ==========================
	@GetMapping("/estatisticas")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Map<String, Object>> getEstatisticas() {
		List<UsuarioDTO> todos = usuarioService.listarTodos();
		List<UsuarioDTO> ativos = usuarioService.listarAtivos();

		long totalUsuarios = todos.size();
		long usuariosAtivos = ativos.size();
		long usuariosInativos = totalUsuarios - usuariosAtivos;

		// Contar por perfil
		long totalAdmins = todos.stream().filter(u -> u.getPerfil().name().equals("ADMIN")).count();
		long totalUsuariosNormais = totalUsuarios - totalAdmins;

		Map<String, Object> estatisticas = new HashMap<>();
		estatisticas.put("totalUsuarios", totalUsuarios);
		estatisticas.put("usuariosAtivos", usuariosAtivos);
		estatisticas.put("usuariosInativos", usuariosInativos);
		estatisticas.put("totalAdmins", totalAdmins);
		estatisticas.put("totalUsuariosNormais", totalUsuariosNormais);

		return ResponseEntity.ok(estatisticas);
	}
	
	// ==========================
	// Gerar link de convite
	// ==========================
	@GetMapping("/gerar-link-convite/{usuarioId}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Map<String, String>> gerarLinkConvite(@PathVariable Long usuarioId) {
		// Verifica se o usuário existe
		usuarioService.buscarPorId(usuarioId);
		
		String linkConvite = "http://localhost:8080/cadastro?ref=" + usuarioId;
		
		Map<String, String> response = new HashMap<>();
		response.put("link", linkConvite);
		response.put("mensagem", "Compartilhe este link para convidar novas pessoas");
		
		return ResponseEntity.ok(response);
	}
	
	// ==========================
	// Testar link de referência
	// ==========================
	@GetMapping("/validar-referencia/{referenciaId}")
	@PreAuthorize("permitAll()")
	public ResponseEntity<Map<String, Object>> validarReferencia(@PathVariable Long referenciaId) {
		try {
			UsuarioDTO usuario = usuarioService.buscarPorId(referenciaId);
			
			Map<String, Object> response = new HashMap<>();
			response.put("valido", usuario.isAtivo());
			response.put("nome", usuario.getNome());
			response.put("email", usuario.getEmail());
			response.put("mensagem", usuario.isAtivo() ? 
					"Link válido! Você será cadastrado na rede de " + usuario.getNome() : 
					"Usuário referência está inativo");
			
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			Map<String, Object> response = new HashMap<>();
			response.put("valido", false);
			response.put("mensagem", "Link de referência inválido");
			return ResponseEntity.ok(response);
		}
	}
}