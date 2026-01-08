package com.multi_amigos.DTO;

import java.util.Map;

public class UsuarioArvoreDTO {
	private UsuarioNodeDTO raiz;
	private int totalNiveis;
	private int totalMembros;
	private Map<Integer, Integer> distribuicaoPorNivel;

	// Getters e Setters
	public UsuarioNodeDTO getRaiz() {
		return raiz;
	}

	public void setRaiz(UsuarioNodeDTO raiz) {
		this.raiz = raiz;
	}

	public int getTotalNiveis() {
		return totalNiveis;
	}

	public void setTotalNiveis(int totalNiveis) {
		this.totalNiveis = totalNiveis;
	}

	public int getTotalMembros() {
		return totalMembros;
	}

	public void setTotalMembros(int totalMembros) {
		this.totalMembros = totalMembros;
	}

	public Map<Integer, Integer> getDistribuicaoPorNivel() {
		return distribuicaoPorNivel;
	}

	public void setDistribuicaoPorNivel(Map<Integer, Integer> distribuicaoPorNivel) {
		this.distribuicaoPorNivel = distribuicaoPorNivel;
	}
}