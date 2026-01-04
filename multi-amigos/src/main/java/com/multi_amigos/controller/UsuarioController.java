package com.multi_amigos.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
	// Cadastro de usuário
	// ==========================
	@PostMapping
	public ResponseEntity<UsuarioDTO> cadastrar(@RequestBody @Valid CadastroUsuarioDTO dto) {
		UsuarioDTO usuarioCriado = usuarioService.cadastrarUsuario(dto);
		return ResponseEntity.status(HttpStatus.CREATED).body(usuarioCriado);
	}

	// ==========================
	// Buscar usuário por ID
	// ==========================
	@GetMapping("/{id}")
	public ResponseEntity<UsuarioDTO> buscarPorId(@PathVariable Long id) {
		UsuarioDTO usuario = usuarioService.buscarPorId(id);
		return ResponseEntity.ok(usuario);
	}

	// ==========================
	// Listar todos os usuários (ADMIN)
	// ==========================
	@GetMapping
	public ResponseEntity<List<UsuarioDTO>> listarTodos() {
		List<UsuarioDTO> usuarios = usuarioService.listarTodos();
		return ResponseEntity.ok(usuarios);
	}
	
	@GetMapping("/{id}/hierarquia")
	@PreAuthorize("hasRole('ADMIN')") 
	public ResponseEntity<List<UsuarioHierarquiaDTO>> verHierarquia(@PathVariable Long id) {
	    List<UsuarioHierarquiaDTO> hierarquia = usuarioService.listarHierarquia(id);
	    return ResponseEntity.ok(hierarquia);
	}


}
