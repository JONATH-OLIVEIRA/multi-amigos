package com.multi_amigos.mapper;

import java.util.List;

import com.multi_amigos.DTO.EstatisticasMensagensDTO;
import com.multi_amigos.DTO.MensagemDTO;

public class EstatisticasMapper {

	public static EstatisticasMensagensDTO toEstatisticasMensagensDTO(List<MensagemDTO> todasMensagens,
			List<MensagemDTO> mensagensVisiveis) {

		long totalMensagens = todasMensagens.size();
		long mensagensAtivas = todasMensagens.stream().filter(MensagemDTO::isAtivo).count();
		long mensagensVisiveisCount = mensagensVisiveis.size();

		// Estatísticas por tipo
		long urgentes = todasMensagens.stream().filter(m -> "URGENTE".equals(m.getTipo())).count();

		long importantes = todasMensagens.stream().filter(m -> "IMPORTANTE".equals(m.getTipo())).count();

		long informativos = todasMensagens.stream().filter(m -> "INFORMATIVO".equals(m.getTipo())).count();

		return new EstatisticasMensagensDTO(totalMensagens, mensagensAtivas, mensagensVisiveisCount, urgentes,
				importantes, informativos);
	}
}