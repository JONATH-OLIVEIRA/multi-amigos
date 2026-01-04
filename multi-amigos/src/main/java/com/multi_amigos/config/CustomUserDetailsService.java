package com.multi_amigos.config;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.multi_amigos.model.Usuario;
import com.multi_amigos.repository.UsuarioRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));

        // ✅ DEBUG - Log para verificar se está funcionando
        System.out.println("🔐 CustomUserDetailsService - Carregando usuário: " + email);
        System.out.println("🔑 Senha no BD: " + usuario.getSenha());

        return User.builder()
            .username(usuario.getEmail())
            .password(usuario.getSenha()) // Já está criptografada com BCrypt
            .roles(usuario.getPerfil().name())
            .build();
    }
}