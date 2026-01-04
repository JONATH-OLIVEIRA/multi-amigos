package com.multi_amigos.exceptions;

public class UsuarioNaoEncontradoException extends RuntimeException {
    
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public UsuarioNaoEncontradoException(String message) {
        super(message);
    }
}
