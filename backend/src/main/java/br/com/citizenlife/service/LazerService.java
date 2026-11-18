package br.com.citizenlife.service;

import br.com.citizenlife.dao.EnderecoDao;
import br.com.citizenlife.dao.EventoLazerDao;
import br.com.citizenlife.dao.LugarLazerDao;
import br.com.citizenlife.exception.CitizenLifeException;
import br.com.citizenlife.exception.ValidacaoException;
import br.com.citizenlife.model.Endereco;
import br.com.citizenlife.model.EventoLazer;
import br.com.citizenlife.model.LugarLazer;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Pilar Lazer: lugares públicos (com "aberto agora" e os mais perto de casa), a programação
 * gratuita dos próximos dias e a agenda do cidadão ("Eu vou").
 * Regras: a programação mostra só o que ainda não acabou, de 1 a {@value #MAXIMO_DIAS} dias à frente;
 * evento que já acabou não entra na agenda; até {@value #MAXIMO_AGENDA} eventos marcados por pessoa.
 */
public class LazerService {

    public static final int DIAS_PADRAO = 7;
    public static final int MAXIMO_DIAS = 31;
    public static final int MAXIMO_AGENDA = 20;
    public static final int QUANTIDADE_PERTO = 3;
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final Set<String> ZONAS = Set.of("Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste");

    /** Um lugar com a distância até o endereço de referência. */
    public record LugarProximo(LugarLazer lugar, int distanciaMetros) {
    }

    /** Os lugares mais perto e o endereço a partir do qual a distância foi medida. */
    public record Perto(Endereco referencia, List<LugarProximo> lugares) {
    }

    private final LugarLazerDao lugarDao;
    private final EventoLazerDao eventoDao;
    private final EnderecoDao enderecoDao;
    private final CidadaoService cidadaoService;

    public LazerService(LugarLazerDao lugarDao, EventoLazerDao eventoDao, EnderecoDao enderecoDao,
                        CidadaoService cidadaoService) {
        this.lugarDao = lugarDao;
        this.eventoDao = eventoDao;
        this.enderecoDao = enderecoDao;
        this.cidadaoService = cidadaoService;
    }

    // ---------------------------------------------------------------- lugares

    public List<LugarLazer> listarLugares(String zona, String tipo, boolean soAbertos) {
        List<LugarLazer> lugares = lugarDao.listarPorZonaETipo(normalizarZona(zona), normalizar(tipo, LugarLazer.TIPOS, "tipo",
                "Tipo de lugar inválido."));
        if (!soAbertos) {
            return lugares;
        }
        LocalDateTime agora = agora();
        return lugares.stream().filter(lugar -> lugar.estaAberto(agora.toLocalTime())).toList();
    }

    /**
     * Os lugares mais perto da casa do cidadão (ou do primeiro endereço salvo, se não houver casa).
     * Devolve null quando o cidadão ainda não salvou nenhum endereço.
     */
    public Perto pertoDeCasa(long idCidadao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        List<Endereco> enderecos = enderecoDao.listarPorCidadao(idCidadao);
        if (enderecos.isEmpty()) {
            return null;
        }
        // A lista já vem com CASA em primeiro lugar (ordem do EnderecoDao)
        Endereco referencia = enderecos.get(0);
        List<LugarProximo> lugares = lugarDao.listar().stream()
                .map(lugar -> new LugarProximo(lugar, lugar.distanciaMetrosAte(referencia.getX(), referencia.getY())))
                .sorted(Comparator.comparingInt(LugarProximo::distanciaMetros))
                .limit(QUANTIDADE_PERTO)
                .toList();
        return new Perto(referencia, lugares);
    }

    // ---------------------------------------------------------------- programação

    /** Eventos que ainda não acabaram e começam nos próximos "dias" (7 se não for informado). */
    public List<EventoLazer> listarEventos(String zona, String categoria, String dias) {
        int quantidade = lerDias(dias);
        LocalDateTime agora = agora();
        return eventoDao.listarEntre(agora, agora.plusDays(quantidade), normalizarZona(zona),
                normalizar(categoria, EventoLazer.CATEGORIAS, "categoria", "Categoria de evento inválida."));
    }

    // ---------------------------------------------------------------- agenda

    public List<EventoLazer> listarAgenda(long idCidadao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        return eventoDao.listarAgenda(idCidadao);
    }

    /** Marca "Eu vou": o evento precisa existir, não pode ter acabado nem já estar na agenda. */
    public EventoLazer marcar(long idCidadao, long idEvento, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        EventoLazer evento = eventoDao.buscarPorId(idEvento)
                .orElseThrow(() -> CitizenLifeException.naoEncontrado("Evento não encontrado."));
        if (evento.jaTerminou(agora())) {
            throw new ValidacaoException("idEvento", "Este evento já terminou.");
        }
        List<EventoLazer> agenda = eventoDao.listarAgenda(idCidadao);
        if (agenda.stream().anyMatch(item -> item.getId().equals(idEvento))) {
            throw CitizenLifeException.conflito("Este evento já está na sua agenda.", null);
        }
        LocalDateTime agora = agora();
        long futuros = agenda.stream().filter(item -> !item.jaTerminou(agora)).count();
        if (futuros >= MAXIMO_AGENDA) {
            throw new ValidacaoException("idEvento", "Sua agenda já tem " + MAXIMO_AGENDA + " eventos. Tire um antes.");
        }
        eventoDao.marcar(idCidadao, idEvento);
        return evento;
    }

    public void desmarcar(long idCidadao, long idEvento, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        if (!eventoDao.desmarcar(idCidadao, idEvento)) {
            throw CitizenLifeException.naoEncontrado("Este evento não está na sua agenda.");
        }
    }

    public LocalDateTime agora() {
        return LocalDateTime.now(SAO_PAULO);
    }

    // ---------------------------------------------------------------- apoio

    private int lerDias(String texto) {
        if (texto == null || texto.isBlank()) {
            return DIAS_PADRAO;
        }
        try {
            int dias = Integer.parseInt(texto.trim());
            if (dias >= 1 && dias <= MAXIMO_DIAS) {
                return dias;
            }
        } catch (NumberFormatException e) {
            // cai na mensagem abaixo
        }
        throw new ValidacaoException("dias", "Escolha de 1 a " + MAXIMO_DIAS + " dias.");
    }

    private String normalizarZona(String zona) {
        if (zona == null || zona.isBlank()) {
            return null;
        }
        String valor = zona.trim();
        if (!ZONAS.contains(valor)) {
            throw new ValidacaoException("zona", "Zona inválida. Escolha uma zona da cidade.");
        }
        return valor;
    }

    private String normalizar(String valor, List<String> aceitos, String campo, String mensagem) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String codigo = valor.trim().toUpperCase(Locale.ROOT);
        if (!aceitos.contains(codigo)) {
            throw new ValidacaoException(campo, mensagem);
        }
        return codigo;
    }
}
