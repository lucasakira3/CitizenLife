package br.com.citizenlife.service;

import br.com.citizenlife.dao.ContatoEmergenciaDao;
import br.com.citizenlife.dao.EnderecoDao;
import br.com.citizenlife.dao.PontoApoioDao;
import br.com.citizenlife.exception.CitizenLifeException;
import br.com.citizenlife.exception.ValidacaoException;
import br.com.citizenlife.model.ContatoEmergencia;
import br.com.citizenlife.model.Endereco;
import br.com.citizenlife.model.PontoApoio;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Pilar Segurança: onde pedir ajuda (pontos de apoio) e os contatos de emergência do cidadão.
 * Regras: filtros por zona e tipo, "aberto agora" pelo horário de São Paulo, pontos mais próximos
 * do endereço de casa, o ponto mais perto de um local do mapa (usado quando a rota passa por uma
 * ocorrência de insegurança) e até {@value #MAXIMO_CONTATOS} contatos por pessoa.
 */
public class SegurancaService {

    public static final int MAXIMO_CONTATOS = 5;
    public static final int QUANTIDADE_PROXIMOS = 3;
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    /** Para insegurança (furto, trecho escuro), a ajuda certa é a polícia ou a guarda, não um pronto-socorro. */
    public static final Set<String> TIPOS_POLICIAIS = Set.of(
            "DELEGACIA", "DELEGACIA_MULHER", "POLICIA_MILITAR", "GUARDA_MUNICIPAL");
    private static final Set<String> ZONAS = Set.of("Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste");

    /** Um ponto de apoio com a distância até o endereço de referência. */
    public record PontoProximo(PontoApoio ponto, int distanciaMetros) {
    }

    /** Os pontos mais próximos e o endereço a partir do qual a distância foi medida. */
    public record Proximos(Endereco referencia, List<PontoProximo> pontos) {
    }

    private final PontoApoioDao pontoDao;
    private final ContatoEmergenciaDao contatoDao;
    private final EnderecoDao enderecoDao;
    private final CidadaoService cidadaoService;

    public SegurancaService(PontoApoioDao pontoDao, ContatoEmergenciaDao contatoDao, EnderecoDao enderecoDao,
                            CidadaoService cidadaoService) {
        this.pontoDao = pontoDao;
        this.contatoDao = contatoDao;
        this.enderecoDao = enderecoDao;
        this.cidadaoService = cidadaoService;
    }

    // ---------------------------------------------------------------- pontos de apoio

    public List<PontoApoio> listarPontos(String zona, String tipo, boolean soAbertos) {
        List<PontoApoio> pontos = pontoDao.listarPorZonaETipo(normalizarZona(zona), normalizarTipo(tipo));
        if (!soAbertos) {
            return pontos;
        }
        LocalTime agora = agora();
        return pontos.stream().filter(ponto -> ponto.estaAberto(agora)).toList();
    }

    /**
     * Os pontos mais próximos da casa do cidadão (ou do primeiro endereço salvo, se não houver casa).
     * Devolve null quando o cidadão ainda não salvou nenhum endereço.
     */
    public Proximos proximosDeCasa(long idCidadao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        List<Endereco> enderecos = enderecoDao.listarPorCidadao(idCidadao);
        if (enderecos.isEmpty()) {
            return null;
        }
        // A lista já vem com CASA em primeiro lugar (ordem do EnderecoDao)
        Endereco referencia = enderecos.get(0);
        List<PontoProximo> pontos = pontoDao.listar().stream()
                .map(ponto -> new PontoProximo(ponto, ponto.distanciaMetrosAte(referencia.getX(), referencia.getY())))
                .sorted(Comparator.comparingInt(PontoProximo::distanciaMetros))
                .limit(QUANTIDADE_PROXIMOS)
                .toList();
        return new Proximos(referencia, pontos);
    }

    /**
     * O ponto de apoio mais perto de um local do mapa. Prefere um que esteja aberto agora:
     * só sugere um fechado quando nenhum está aberto. Com uma ocorrência de insegurança, só
     * entram os pontos policiais ({@link #TIPOS_POLICIAIS}). Devolve null se não houver nenhum.
     */
    public PontoProximo maisProximo(double x, double y, String tipoOcorrencia) {
        ValidacaoException erros = new ValidacaoException();
        erros.exigir(Double.isFinite(x) && x >= 0, "x", "Informe a posição x do local no mapa.");
        erros.exigir(Double.isFinite(y) && y >= 0, "y", "Informe a posição y do local no mapa.");
        erros.lancarSeHouverErros();
        LocalTime agora = agora();
        boolean inseguranca = "INSEGURANCA".equals(tipoOcorrencia);
        return pontoDao.listar().stream()
                .filter(ponto -> !inseguranca || TIPOS_POLICIAIS.contains(ponto.getTipo()))
                .map(ponto -> new PontoProximo(ponto, ponto.distanciaMetrosAte(x, y)))
                .min(Comparator.comparing((PontoProximo item) -> !item.ponto().estaAberto(agora))
                        .thenComparingInt(PontoProximo::distanciaMetros))
                .orElse(null);
    }

    public LocalTime agora() {
        return LocalTime.now(SAO_PAULO);
    }

    // ---------------------------------------------------------------- contatos de emergência

    public List<ContatoEmergencia> listarContatos(long idCidadao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        return contatoDao.listarPorCidadao(idCidadao);
    }

    public ContatoEmergencia criarContato(long idCidadao, ContatoEmergencia dados, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        List<ContatoEmergencia> atuais = contatoDao.listarPorCidadao(idCidadao);
        validar(dados, atuais);
        if (atuais.size() >= MAXIMO_CONTATOS) {
            throw new ValidacaoException("nome", "Você já tem " + MAXIMO_CONTATOS + " contatos. Exclua um antes.");
        }
        dados.setIdCidadao(idCidadao);
        return contatoDao.inserir(dados);
    }

    public ContatoEmergencia atualizarContato(long idCidadao, long idContato, ContatoEmergencia dados, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        contatoDoCidadao(idCidadao, idContato);
        dados.setId(idContato);
        dados.setIdCidadao(idCidadao);
        validar(dados, contatoDao.listarPorCidadao(idCidadao));
        contatoDao.atualizar(dados);
        return dados;
    }

    public void excluirContato(long idCidadao, long idContato, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        contatoDoCidadao(idCidadao, idContato);
        contatoDao.excluir(idContato);
    }

    private void validar(ContatoEmergencia contato, List<ContatoEmergencia> atuais) {
        ValidacaoException erros = new ValidacaoException();
        contato.setNome(erros.texto("nome", contato.getNome(), "Nome", 2, 60));
        contato.setTelefone(contato.getTelefone() == null ? "" : contato.getTelefone().trim());
        int digitos = contato.getTelefoneDigitos().length();
        erros.exigir(digitos >= 8 && digitos <= 13 && contato.getTelefone().length() <= 20,
                "telefone", "Informe um telefone com DDD, como (11) 91234-5678.");
        String parentesco = contato.getParentesco() == null ? "" : contato.getParentesco().trim();
        erros.exigir(parentesco.length() <= 30, "parentesco", "Parentesco pode ter no máximo 30 caracteres.");
        contato.setParentesco(parentesco.isEmpty() ? null : parentesco);
        for (ContatoEmergencia outro : atuais) {
            if (!Objects.equals(outro.getId(), contato.getId())) {
                erros.exigir(!outro.getNome().equalsIgnoreCase(contato.getNome()),
                        "nome", "Você já tem um contato com este nome.");
            }
        }
        erros.lancarSeHouverErros();
    }

    private ContatoEmergencia contatoDoCidadao(long idCidadao, long idContato) {
        return contatoDao.buscarPorId(idContato)
                .filter(contato -> contato.getIdCidadao() == idCidadao)
                .orElseThrow(() -> CitizenLifeException.naoEncontrado("Contato não encontrado."));
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

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return null;
        }
        String valor = tipo.trim().toUpperCase(Locale.ROOT);
        if (!PontoApoio.TIPOS.contains(valor)) {
            throw new ValidacaoException("tipo", "Tipo de ponto de apoio inválido.");
        }
        return valor;
    }
}
