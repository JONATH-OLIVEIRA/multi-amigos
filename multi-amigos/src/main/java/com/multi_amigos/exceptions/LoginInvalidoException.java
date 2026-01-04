package com.multi_amigos.exceptions;

public class LoginInvalidoException extends RuntimeException {
    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public LoginInvalidoException(String message) {
        super(message);
    }
}
