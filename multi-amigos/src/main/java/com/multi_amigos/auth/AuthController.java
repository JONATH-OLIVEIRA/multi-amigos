package com.multi_amigos.auth;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.util.JwtUtil;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;    
    
    @Autowired
    private JwtUtil jwtUtil;
    
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("=== LOGIN REQUEST ===");
            System.out.println("Email: " + loginRequest.getEmail());
            
            // ✅ AGORA: Uma única chamada que faz tudo
            Map<String, Object> response = authService.login(loginRequest.getEmail(), loginRequest.getSenha());
            
            System.out.println("✅ Usuário autenticado: " + response.get("email"));
            System.out.println("✅ Perfil: " + response.get("perfil"));
            System.out.println("✅ Resposta do login: " + response);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erro no login: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Falha no login");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CadastroUsuarioDTO cadastroDTO) {
        try {
            Map<String, Object> response = authService.register(cadastroDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erro no registro: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Falha no registro");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        System.out.println("=== VALIDATE TOKEN ENDPOINT ===");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("authenticated", false)
            );
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("authenticated", false)
            );
        }

        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "email", jwtUtil.extractEmail(token),
            "nome", jwtUtil.extractNome(token),
            "role", jwtUtil.extractRole(token)
        ));
    }


}