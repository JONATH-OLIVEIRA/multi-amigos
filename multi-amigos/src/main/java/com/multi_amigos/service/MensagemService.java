package com.multi_amigos.service;

import java.util.List;

import com.multi_amigos.DTO.CriarMensagemDTO;
import com.multi_amigos.DTO.MensagemDTO;

public interface MensagemService {
    MensagemDTO criarMensagem(CriarMensagemDTO dto, Long autorId);
    List<MensagemDTO> listarMensagensVisiveis();
    List<MensagemDTO> listarTodasMensagens();
    MensagemDTO atualizarMensagem(Long id, CriarMensagemDTO dto);
    void toggleAtivo(Long id);
    void excluirMensagem(Long id);
}
