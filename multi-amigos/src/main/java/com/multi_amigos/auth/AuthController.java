package com.multi_amigos.auth;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    // =========================
    // LOGIN (email OU telefone)
    // =========================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            if (loginRequest == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Login inválido", "message", "Body vazio"));
            }

            String login = loginRequest.getLogin(); // ✅ suporta email legado automaticamente
            String senha = loginRequest.getSenha();

            Map<String, Object> response = authService.login(login, senha);

            String token = (String) response.get("token");

            ResponseCookie cookie = buildJwtCookie(token, request);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Falha no login");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    // =========================
    // REGISTER (gera cookie também)
    // =========================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CadastroUsuarioDTO cadastroDTO, HttpServletRequest request) {
        try {
            Map<String, Object> response = authService.register(cadastroDTO);

            String token = (String) response.get("token");
            ResponseCookie cookie = buildJwtCookie(token, request);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Falha no registro");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // =========================
    // LOGOUT (apaga cookie)
    // =========================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        ResponseCookie cookie = clearJwtCookie(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("ok", true));
    }

    // =========================
    // VALIDATE (cookie OU Authorization)
    // =========================
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(value = "jwt_token", required = false) String cookieToken
    ) {
        String token = extractToken(authHeader, cookieToken);

        if (token == null || token.isBlank() || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "email", jwtUtil.extractEmail(token),
                "nome", jwtUtil.extractNome(token),
                "role", jwtUtil.extractRole(token)
        ));
    }

    private String extractToken(String authHeader, String cookieToken) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return cookieToken;
    }

    // =========================
    // Helpers Cookie
    // =========================
    private ResponseCookie buildJwtCookie(String jwt, HttpServletRequest request) {
        boolean secure = isSecureRequest(request);

        return ResponseCookie.from("jwt_token", jwt)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(1))
                .build();
    }

    private ResponseCookie clearJwtCookie(HttpServletRequest request) {
        boolean secure = isSecureRequest(request);

        return ResponseCookie.from("jwt_token", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ZERO)
                .build();
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return forwardedProto != null && forwardedProto.equalsIgnoreCase("https");
    }
}
