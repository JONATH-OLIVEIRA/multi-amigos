package com.multi_amigos.model;

public enum TipoMensagem {
    IMPORTANTE("Importante", "warning"),
    INFORMATIVO("Informativo", "info"),
    URGENTE("Urgente", "danger");
    
    private final String descricao;
    private final String classeCss;
    
    TipoMensagem(String descricao, String classeCss) {
        this.descricao = descricao;
        this.classeCss = classeCss;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public String getClasseCss() {
        return classeCss;
    }
}