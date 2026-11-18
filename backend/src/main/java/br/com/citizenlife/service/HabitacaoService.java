package br.com.citizenlife.service;

import br.com.citizenlife.dao.InscricaoProgramaDao;
import br.com.citizenlife.dao.ProgramaMoradiaDao;
import br.com.citizenlife.exception.CitizenLifeException;
import br.com.citizenlife.exception.ValidacaoException;
import br.com.citizenlife.model.InscricaoPrograma;
import br.com.citizenlife.model.ProgramaMoradia;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Habitação: consulta dos programas de moradia (com o filtro de renda) e as inscrições do cidadão.
 * Regras: uma inscrição por programa, status inscrito, em análise ou aprovado, protocolo e observação opcionais.
 */
public class HabitacaoService {

    public static final int MAXIMO_OBSERVACAO = 200;
    /** Renda familiar mensal aceita no filtro (um teto só para barrar valores absurdos). */
    private static final double RENDA_MAXIMA_FILTRO = 1_000_000;

    private final ProgramaMoradiaDao programaDao;
    private final InscricaoProgramaDao inscricaoDao;
    private final CidadaoService cidadaoService;

    public HabitacaoService(ProgramaMoradiaDao programaDao, InscricaoProgramaDao inscricaoDao,
                            CidadaoService cidadaoService) {
        this.programaDao = programaDao;
        this.inscricaoDao = inscricaoDao;
        this.cidadaoService = cidadaoService;
    }

    // ------------------------------------------------------------ consulta

    /**
     * Lista os programas, só de um tipo se ele for informado. Com a renda familiar, quem atende
     * ao teto de renda do programa vem primeiro (a ordem de cada grupo se mantém).
     */
    public List<ProgramaMoradia> listarProgramas(String tipo, Double renda) {
        List<ProgramaMoradia> programas = new ArrayList<>(programaDao.listar(normalizarTipo(tipo)));
        if (renda != null) {
            programas.sort(Comparator.comparing(programa -> !programa.atendeRenda(renda)));
        }
        return programas;
    }

    public ProgramaMoradia buscarPrograma(long idPrograma) {
        return programaDao.buscarPorId(idPrograma)
                .orElseThrow(() -> CitizenLifeException.naoEncontrado("Programa de moradia não encontrado."));
    }

    /** Converte a renda digitada (aceita vírgula) em número; vazio = sem filtro de renda. */
    public Double lerRenda(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        try {
            double renda = Double.parseDouble(texto.trim().replace(',', '.'));
            if (Double.isFinite(renda) && renda >= 0 && renda <= RENDA_MAXIMA_FILTRO) {
                return renda;
            }
        } catch (NumberFormatException e) {
            // cai na mensagem abaixo
        }
        throw new ValidacaoException("renda", "Informe a renda familiar mensal em reais, como 2500.");
    }

    // ------------------------------------------------------------ inscrições

    public List<InscricaoPrograma> listarInscricoes(long idCidadao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        return inscricaoDao.listarPorCidadao(idCidadao);
    }

    /** Registra que o cidadão se inscreveu no programa (dados.programa.id). Sem status, começa em "inscrito". */
    public InscricaoPrograma inscrever(long idCidadao, InscricaoPrograma dados, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        validar(dados);
        long idPrograma = dados.getPrograma() == null || dados.getPrograma().getId() == null
                ? -1 : dados.getPrograma().getId();
        dados.setPrograma(buscarPrograma(idPrograma));
        boolean repetida = inscricaoDao.listarPorCidadao(idCidadao).stream()
                .anyMatch(item -> item.getPrograma().getId().equals(idPrograma));
        if (repetida) {
            throw CitizenLifeException.conflito("Você já registrou a sua inscrição neste programa.", null);
        }
        dados.setIdCidadao(idCidadao);
        return inscricaoDao.inserir(dados);
    }

    /** Atualiza o andamento: status, protocolo e observação. O programa da inscrição não muda. */
    public InscricaoPrograma atualizar(long idCidadao, long idInscricao, InscricaoPrograma dados, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        inscricaoDoCidadao(idCidadao, idInscricao);
        validar(dados);
        dados.setId(idInscricao);
        inscricaoDao.atualizar(dados);
        return inscricaoDoCidadao(idCidadao, idInscricao);
    }

    public void excluir(long idCidadao, long idInscricao, Long idAtor) {
        cidadaoService.exigirDono(idAtor, idCidadao);
        inscricaoDoCidadao(idCidadao, idInscricao);
        inscricaoDao.excluir(idInscricao);
    }

    // ------------------------------------------------------------ apoio

    private void validar(InscricaoPrograma inscricao) {
        ValidacaoException erros = new ValidacaoException();

        String status = inscricao.getStatus() == null || inscricao.getStatus().isBlank()
                ? "INSCRITO" : inscricao.getStatus().trim().toUpperCase(Locale.ROOT);
        erros.exigir(InscricaoPrograma.STATUS.contains(status), "status", "Escolha o status da inscrição.");
        inscricao.setStatus(status);

        String protocolo = inscricao.getProtocolo() == null ? "" : inscricao.getProtocolo().trim();
        if (!protocolo.isEmpty()) {
            erros.exigir(protocolo.length() >= 3 && protocolo.length() <= 30, "protocolo",
                    "O protocolo precisa ter de 3 a 30 caracteres.");
            erros.exigir(protocolo.matches("[A-Za-z0-9./_-]+"), "protocolo",
                    "Use só letras, números, ponto, barra e hífen no protocolo.");
        }
        inscricao.setProtocolo(protocolo.isEmpty() ? null : protocolo);

        String observacao = inscricao.getObservacao() == null ? "" : inscricao.getObservacao().trim();
        erros.exigir(observacao.length() <= MAXIMO_OBSERVACAO, "observacao",
                "A observação pode ter no máximo " + MAXIMO_OBSERVACAO + " caracteres.");
        inscricao.setObservacao(observacao.isEmpty() ? null : observacao);

        erros.lancarSeHouverErros();
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return null;
        }
        String valor = tipo.trim().toUpperCase(Locale.ROOT);
        if (!ProgramaMoradia.TIPOS.contains(valor)) {
            throw new ValidacaoException("tipo", "Tipo de programa inválido.");
        }
        return valor;
    }

    private InscricaoPrograma inscricaoDoCidadao(long idCidadao, long idInscricao) {
        return inscricaoDao.buscarPorId(idInscricao)
                .filter(inscricao -> inscricao.getIdCidadao() == idCidadao)
                .orElseThrow(() -> CitizenLifeException.naoEncontrado("Inscrição não encontrada."));
    }
}
