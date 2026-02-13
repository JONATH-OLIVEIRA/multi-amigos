package com.multi_amigos.auth;

public class LoginRequest {

    // ✅ novo campo (preferido)
    private String login;

    // ✅ legado (mantém compatibilidade)
    private String email;

    private String senha;

    public LoginRequest() {}

    public LoginRequest(String login, String senha) {
        this.login = login;
        this.senha = senha;
    }

    // ✅ preferido pelo AuthController/AuthService
    public String getLogin() {
        // se vier só email (legado), usa ele como login
        if ((login == null || login.isBlank()) && email != null && !email.isBlank()) {
            return email;
        }
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    // compat legado
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}
