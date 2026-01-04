package com.multi_amigos.auth;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.util.JwtAuthenticationFilter;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String token = authService.login(loginRequest.getEmail(), loginRequest.getSenha());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CadastroUsuarioDTO cadastroDTO) {
        Map<String, Object> response = authService.register(cadastroDTO);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(Authentication authentication) {
        System.out.println("=== VALIDATE TOKEN ENDPOINT ===");
        System.out.println("Authentication: " + authentication);
        
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("Não autenticado - retornando 401");
            return ResponseEntity.status(401).body(Map.of(
                "error", "Não autenticado",
                "timestamp", LocalDateTime.now()
            ));
        }
        
        System.out.println("Usuário autenticado: " + authentication.getName());
        System.out.println("Authorities: " + authentication.getAuthorities());
        
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("username", authentication.getName());
        response.put("timestamp", LocalDateTime.now());
        
        // Obtém authorities/roles
        List<String> authorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());
        response.put("authorities", authorities);
        
        // Verifica se tem role ADMIN
        boolean isAdmin = authorities.stream()
            .anyMatch(auth -> auth.equals("ROLE_ADMIN"));
        response.put("isAdmin", isAdmin);
        response.put("role", isAdmin ? "ADMIN" : "USER");
        
        // Se for seu JwtUserDetails, pega mais informações
        if (authentication.getPrincipal() instanceof JwtAuthenticationFilter.JwtUserDetails) {
            JwtAuthenticationFilter.JwtUserDetails userDetails = 
                (JwtAuthenticationFilter.JwtUserDetails) authentication.getPrincipal();
            response.put("email", userDetails.getEmail());
            response.put("nome", userDetails.getNome());
            response.put("role", userDetails.getRole());
            System.out.println("Detalhes JWT: " + userDetails);
        }
        
        System.out.println("Resposta: " + response);
        return ResponseEntity.ok(response);
    }
}
