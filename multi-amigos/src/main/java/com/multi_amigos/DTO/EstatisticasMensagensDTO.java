package com.multi_amigos.DTO;

public class EstatisticasMensagensDTO {
	private long totalMensagens;
	private long mensagensAtivas;
	private long mensagensVisiveis;
	private long urgentes;
	private long importantes;
	private long informativos;

	// Construtores
	public EstatisticasMensagensDTO() {
	}

	public EstatisticasMensagensDTO(long totalMensagens, long mensagensAtivas, long mensagensVisiveis, long urgentes,
			long importantes, long informativos) {
		this.totalMensagens = totalMensagens;
		this.mensagensAtivas = mensagensAtivas;
		this.mensagensVisiveis = mensagensVisiveis;
		this.urgentes = urgentes;
		this.importantes = importantes;
		this.informativos = informativos;
	}

	// Getters e Setters
	public long getTotalMensagens() {
		return totalMensagens;
	}

	public void setTotalMensagens(long totalMensagens) {
		this.totalMensagens = totalMensagens;
	}

	public long getMensagensAtivas() {
		return mensagensAtivas;
	}

	public void setMensagensAtivas(long mensagensAtivas) {
		this.mensagensAtivas = mensagensAtivas;
	}

	public long getMensagensVisiveis() {
		return mensagensVisiveis;
	}

	public void setMensagensVisiveis(long mensagensVisiveis) {
		this.mensagensVisiveis = mensagensVisiveis;
	}

	public long getUrgentes() {
		return urgentes;
	}

	public void setUrgentes(long urgentes) {
		this.urgentes = urgentes;
	}

	public long getImportantes() {
		return importantes;
	}

	public void setImportantes(long importantes) {
		this.importantes = importantes;
	}

	public long getInformativos() {
		return informativos;
	}

	public void setInformativos(long informativos) {
		this.informativos = informativos;
	}
}