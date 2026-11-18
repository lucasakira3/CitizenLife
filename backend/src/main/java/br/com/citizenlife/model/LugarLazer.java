package br.com.citizenlife.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Lugar público de lazer: parque, praça, CEU, centro cultural, biblioteca ou centro esportivo
 * (tabela CL_LUGAR_LAZER). A posição usa o mesmo sistema do mapa que os pontos de apoio.
 */
public class LugarLazer {

    public static final List<String> TIPOS = List.of(
            "PARQUE", "PRACA", "CEU", "CENTRO_CULTURAL", "BIBLIOTECA", "ESPORTIVO");

    private Long id;
    private String nome;
    private String tipo;
    private String bairro;
    private String zona;
    private boolean aberto24h;
    private String abre;
    private String fecha;
    private double x;
    private double y;

    /** Aberto no horário informado? A regra fica em {@link Horario#estaAberto}. */
    public boolean estaAberto(LocalTime agora) {
        return Horario.estaAberto(aberto24h, abre, fecha, agora);
    }

    /** Distância em linha reta, em metros, até um ponto do mapa (a casa do cidadão, por exemplo). */
    public int distanciaMetrosAte(double outroX, double outroY) {
        return (int) Math.round(Math.hypot(x - outroX, y - outroY) * PontoApoio.METROS_POR_UNIDADE);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }

    public boolean isAberto24h() {
        return aberto24h;
    }

    public void setAberto24h(boolean aberto24h) {
        this.aberto24h = aberto24h;
    }

    public String getAbre() {
        return abre;
    }

    public void setAbre(String abre) {
        this.abre = abre;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
