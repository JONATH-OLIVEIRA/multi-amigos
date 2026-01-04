package com.multi_amigos.mapper;

import com.multi_amigos.DTO.CriarMensagemDTO;
import com.multi_amigos.DTO.MensagemDTO;
import com.multi_amigos.model.Mensagem;
import com.multi_amigos.model.TipoMensagem;
import com.multi_amigos.model.Usuario;

public class MensagemMapper {
    
    // Converte Entity para DTO
    public static MensagemDTO toDTO(Mensagem mensagem) {
        if (mensagem == null) {
            return null;
        }
        
        MensagemDTO dto = new MensagemDTO();
        dto.setId(mensagem.getId());
        dto.setTitulo(mensagem.getTitulo());
        dto.setConteudo(mensagem.getConteudo());
        dto.setTipo(mensagem.getTipo().name());
        dto.setTipoClasse(mensagem.getTipo().getClasseCss());
        dto.setAtivo(mensagem.isAtivo());
        dto.setDataCriacao(mensagem.getDataCriacao());
        dto.setDataExpiracao(mensagem.getDataExpiracao());
        dto.setExpirada(mensagem.isExpirada());
        dto.setVisivel(mensagem.isVisivel());
        
        // Informações do autor
        if (mensagem.getAutor() != null) {
            dto.setAutorId(mensagem.getAutor().getId());
            dto.setAutorNome(mensagem.getAutor().getNome());
        }
        
        return dto;
    }
    
    // Converte CriarMensagemDTO para Entity (para criação)
    public static Mensagem toEntity(CriarMensagemDTO dto, Usuario autor) {
        if (dto == null || autor == null) {
            return null;
        }
        
        Mensagem mensagem = new Mensagem();
        mensagem.setTitulo(dto.getTitulo());
        mensagem.setConteudo(dto.getConteudo());
        
        try {
            TipoMensagem tipo = TipoMensagem.valueOf(dto.getTipo().toUpperCase());
            mensagem.setTipo(tipo);
        } catch (IllegalArgumentException e) {
            // Define um padrão se o tipo for inválido
            mensagem.setTipo(TipoMensagem.INFORMATIVO);
        }
        
        mensagem.setAutor(autor);
        mensagem.setAtivo(true);
        
        return mensagem;
    }
    
    // Atualiza uma Entity existente com dados do DTO
    public static void updateEntity(Mensagem mensagem, CriarMensagemDTO dto) {
        if (mensagem == null || dto == null) {
            return;
        }
        
        mensagem.setTitulo(dto.getTitulo());
        mensagem.setConteudo(dto.getConteudo());
        
        try {
            TipoMensagem tipo = TipoMensagem.valueOf(dto.getTipo().toUpperCase());
            mensagem.setTipo(tipo);
        } catch (IllegalArgumentException e) {
            // Mantém o tipo atual se o novo for inválido
        }
    }
    
    // Converte DTO simples para Entity (para atualização)
    public static Mensagem toEntity(MensagemDTO dto, Usuario autor) {
        if (dto == null) {
            return null;
        }
        
        Mensagem mensagem = new Mensagem();
        mensagem.setId(dto.getId());
        mensagem.setTitulo(dto.getTitulo());
        mensagem.setConteudo(dto.getConteudo());
        
        try {
            TipoMensagem tipo = TipoMensagem.valueOf(dto.getTipo().toUpperCase());
            mensagem.setTipo(tipo);
        } catch (IllegalArgumentException e) {
            mensagem.setTipo(TipoMensagem.INFORMATIVO);
        }
        
        mensagem.setAutor(autor);
        mensagem.setAtivo(dto.isAtivo());
        mensagem.setDataCriacao(dto.getDataCriacao());
        mensagem.setDataExpiracao(dto.getDataExpiracao());
        
        return mensagem;
    }
}
