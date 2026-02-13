package com.multi_amigos.service;

import java.time.LocalDate;
import java.util.List;

import com.multi_amigos.DTO.AtualizarUsuarioDTO;
import com.multi_amigos.DTO.CadastroPublicoDTO;
import com.multi_amigos.DTO.CadastroUsuarioDTO;
import com.multi_amigos.DTO.UsuarioArvoreDTO;
import com.multi_amigos.DTO.UsuarioDTO;
import com.multi_amigos.DTO.UsuarioDetalheDTO;
import com.multi_amigos.DTO.UsuarioHierarquiaDTO;
import com.multi_amigos.model.Usuario;

public interface UsuarioService {

	// Cadastrar usuário (recebendo a senha)
	UsuarioDTO cadastrarUsuario(CadastroUsuarioDTO dto);

	// Cadastro público (sem usuarioPaiId)
	UsuarioDTO cadastroPublico(CadastroPublicoDTO dto);

	// Cadastro por referência/link
	UsuarioDTO cadastroPorReferencia(Long referenciaId, CadastroPublicoDTO dto);

	// Atualizar usuário
	UsuarioDTO atualizarUsuario(Long id, AtualizarUsuarioDTO dto);

	// Buscar usuário por ID
	UsuarioDTO buscarPorId(Long id);

	// Buscar usuário por email (retorna a entidade)
	Usuario buscarPorEmail(String email);

	// Desativar usuário
	void desativarUsuario(Long id);

	// Reativar usuário
	void reativarUsuario(Long id);

	List<UsuarioDTO> listarTodos();

	List<UsuarioDTO> listarTodosAtivos(String nome, Boolean ativo);

	List<UsuarioHierarquiaDTO> listarHierarquia(Long usuarioId);

	List<UsuarioDTO> listarAtivos();

	List<UsuarioDTO> listarPorPerfil(String perfil);

	UsuarioDetalheDTO buscarDetalhe(Long id);

	UsuarioDTO buscarPorEmailDTO(String email);

	// Método adicional: Buscar usuário com hierarquia completa
	UsuarioDTO buscarComHierarquia(Long id);

	List<UsuarioDTO> listarComFiltros(String nome, String email, String perfil, Boolean ativo, LocalDate dataInicio,
			LocalDate dataFim);

	UsuarioArvoreDTO obterArvoreGenealogica(Long id);

	Usuario buscarPorTelefone(String telefone);
}