package com.multi_amigos.service.imple;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.multi_amigos.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

	private final JavaMailSender mailSender;

	public EmailServiceImpl(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	@Override
	public void enviarResetSenha(String para, String nome, String link) {
		SimpleMailMessage msg = new SimpleMailMessage();
		msg.setTo(para);
		msg.setSubject("MultiAmigos - Redefinição de senha");
		msg.setText("Olá, " + (nome == null ? "usuário" : nome) + "!\n\n"
				+ "Recebemos uma solicitação para redefinir sua senha.\n"
				+ "Clique no link abaixo para criar uma nova senha:\n\n" + link + "\n\n"
				+ "Se você não solicitou isso, ignore este e-mail.\n\n" + "Equipe MultiAmigos");
		mailSender.send(msg);
	}
}
