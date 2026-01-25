package com.multi_amigos.service;

public interface PasswordResetService {
    void solicitarReset(String email);
    void resetarSenha(String token, String novaSenha);
}
