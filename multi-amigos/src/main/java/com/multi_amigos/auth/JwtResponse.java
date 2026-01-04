package com.multi_amigos.auth;

public class JwtResponse {

    private String token;
    private String type = "Bearer";

    private String email;
    private String nome;
    private String perfil;

    public JwtResponse(String token, String email, String nome, String perfil) {
        this.token = token;
        this.email = email;
        this.nome = nome;
        this.perfil = perfil;
    }

    public String getToken() {
        return token;
    }

    public String getType() {
        return type;
    }

    public String getEmail() {
        return email;
    }

    public String getNome() {
        return nome;
    }

    public String getPerfil() {
        return perfil;
    }
}
