package com.multi_amigos.DTO;

public class EstatisticasDTO {
	private long totalUsuarios;
	private long usuariosAtivos;
	private long usuariosInativos;
	private long totalAdmins;
	private long totalUsuariosNormais;

	// Construtores
	public EstatisticasDTO() {
	}

	public EstatisticasDTO(long totalUsuarios, long usuariosAtivos, long usuariosInativos, long totalAdmins,
			long totalUsuariosNormais) {
		this.totalUsuarios = totalUsuarios;
		this.usuariosAtivos = usuariosAtivos;
		this.usuariosInativos = usuariosInativos;
		this.totalAdmins = totalAdmins;
		this.totalUsuariosNormais = totalUsuariosNormais;
	}

	public long getTotalUsuarios() {
		return totalUsuarios;
	}

	public void setTotalUsuarios(long totalUsuarios) {
		this.totalUsuarios = totalUsuarios;
	}

	public long getUsuariosAtivos() {
		return usuariosAtivos;
	}

	public void setUsuariosAtivos(long usuariosAtivos) {
		this.usuariosAtivos = usuariosAtivos;
	}

	public long getUsuariosInativos() {
		return usuariosInativos;
	}

	public void setUsuariosInativos(long usuariosInativos) {
		this.usuariosInativos = usuariosInativos;
	}

	public long getTotalAdmins() {
		return totalAdmins;
	}

	public void setTotalAdmins(long totalAdmins) {
		this.totalAdmins = totalAdmins;
	}

	public long getTotalUsuariosNormais() {
		return totalUsuariosNormais;
	}

	public void setTotalUsuariosNormais(long totalUsuariosNormais) {
		this.totalUsuariosNormais = totalUsuariosNormais;
	}

}
