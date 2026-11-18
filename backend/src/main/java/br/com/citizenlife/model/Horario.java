package br.com.citizenlife.model;

import java.time.LocalTime;

/**
 * Regra de horário de funcionamento usada pelos lugares com "aberto agora"
 * (pontos de apoio da Segurança e lugares de lazer).
 */
public final class Horario {

    private Horario() {
    }

    /**
     * Aberto no horário informado? Funciona também para quem vira a noite (abre 22:00, fecha 06:00)
     * e para quem fecha à meia-noite (abre 05:00, fecha 00:00).
     * Um horário ilegível conta como fechado: na dúvida, o sistema não promete atendimento.
     */
    public static boolean estaAberto(boolean aberto24h, String abre, String fecha, LocalTime agora) {
        if (aberto24h) {
            return true;
        }
        try {
            LocalTime inicio = LocalTime.parse(abre);
            LocalTime fim = LocalTime.parse(fecha);
            if (inicio.isBefore(fim)) {
                return !agora.isBefore(inicio) && agora.isBefore(fim);
            }
            return !agora.isBefore(inicio) || agora.isBefore(fim);
        } catch (RuntimeException e) {
            return false;
        }
    }
}
