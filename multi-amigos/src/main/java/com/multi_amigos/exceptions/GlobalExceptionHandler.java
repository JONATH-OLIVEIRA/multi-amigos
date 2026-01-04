package com.multi_amigos.exceptions;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

	// =========================
	// Erro genérico
	// =========================
	@ExceptionHandler(Exception.class)
	public ResponseEntity<?> handleException(Exception ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
		body.put("error", "Erro interno do servidor");
		body.put("message", ex.getMessage());
		return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	// =========================
	// Usuário não encontrado
	// =========================
	@ExceptionHandler(UsuarioNaoEncontradoException.class)
	public ResponseEntity<?> handleUsuarioNaoEncontrado(UsuarioNaoEncontradoException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", HttpStatus.NOT_FOUND.value());
		body.put("error", "Usuário não encontrado");
		body.put("message", ex.getMessage());
		return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
	}

	// =========================
	// Validação de DTO
	// =========================
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<?> handleValidacao(MethodArgumentNotValidException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", HttpStatus.BAD_REQUEST.value());
		body.put("error", "Erro de validação");

		// Mensagens de cada campo inválido
		Map<String, String> errors = new HashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(error -> {
			errors.put(error.getField(), error.getDefaultMessage());
		});

		body.put("message", errors);
		return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
	}

	// =========================
	// Validação customizada
	// =========================
	@ExceptionHandler(ValidacaoException.class)
	public ResponseEntity<?> handleValidacaoCustom(ValidacaoException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", HttpStatus.BAD_REQUEST.value());
		body.put("error", "Erro de negócio");
		body.put("message", ex.getMessage());
		return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(LoginInvalidoException.class)
	public ResponseEntity<?> handleLoginInvalido(LoginInvalidoException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now());
		body.put("status", HttpStatus.UNAUTHORIZED.value());
		body.put("error", "Login inválido");
		body.put("message", ex.getMessage());
		return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
	}

}
