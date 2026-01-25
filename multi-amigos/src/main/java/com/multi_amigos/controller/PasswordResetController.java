package com.multi_amigos.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.multi_amigos.DTO.ForgotPasswordRequestDTO;
import com.multi_amigos.DTO.ResetPasswordRequestDTO;
import com.multi_amigos.service.PasswordResetService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot")
    public ResponseEntity<?> forgot(@RequestBody @Valid ForgotPasswordRequestDTO dto) {
        // boa prática: sempre retornar ok mesmo se não existir, pra não vazar dados
        try {
            passwordResetService.solicitarReset(dto.getEmail());
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("message", "Se o e-mail existir, enviaremos um link de redefinição."));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reset(@RequestBody @Valid ResetPasswordRequestDTO dto) {
        passwordResetService.resetarSenha(dto.getToken(), dto.getNovaSenha());
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso."));
    }
}
