package br.com.citizenlife.model;

import java.time.LocalDateTime;
import java.util.List;

/** Atividade gratuita num lugar de lazer, com início e fim (tabela CL_EVENTO_LAZER). */
public class EventoLazer {

    public static final List<String> CATEGORIAS = List.of(
            "ESPORTE", "CULTURA", "MUSICA", "INFANTIL", "CINEMA", "OFICINA");

    private Long id;
    private LugarLazer lugar;
    private String titulo;
    private String categoria;
    private String descricao;
    private LocalDateTime inicio;
    private LocalDateTime fim;

    /** Já acabou? Evento que acabou não aparece na programação e não entra na agenda. */
    public boolean jaTerminou(LocalDateTime agora) {
        return !fim.isAfter(agora);
    }

    /** Está acontecendo neste momento? */
    public boolean acontecendo(LocalDateTime agora) {
        return !inicio.isAfter(agora) && fim.isAfter(agora);
    }

    /** Começa (ou continua) antes do limite? Usado para "os próximos N dias". */
    public boolean comecaAte(LocalDateTime limite) {
        return inicio.isBefore(limite);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LugarLazer getLugar() {
        return lugar;
    }

    public void setLugar(LugarLazer lugar) {
        this.lugar = lugar;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDateTime getInicio() {
        return inicio;
    }

    public void setInicio(LocalDateTime inicio) {
        this.inicio = inicio;
    }

    public LocalDateTime getFim() {
        return fim;
    }

    public void setFim(LocalDateTime fim) {
        this.fim = fim;
    }
}
