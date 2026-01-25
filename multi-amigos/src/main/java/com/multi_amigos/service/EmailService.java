package com.multi_amigos.service;

public interface EmailService {
    void enviarResetSenha(String para, String nome, String link);
}
