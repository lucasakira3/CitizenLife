package br.com.citizenlife.model;

import java.util.Arrays;
import java.util.List;

/**
 * Programa de moradia que o cidadão pode consultar: Minha Casa Minha Vida, aluguel social,
 * regularização e outros (tabela CL_PROGRAMA_MORADIA).
 */
public class ProgramaMoradia {

    public static final List<String> TIPOS = List.of("CASA_PROPRIA", "ALUGUEL", "REGULARIZACAO", "REFORMA", "OUTRO");

    private Long id;
    private String nome;
    private String tipo;
    private String canal;
    private String descricao;
    private String quemTemDireito;
    /** Teto de renda familiar mensal, em reais. Nulo quando o programa não tem teto de renda. */
    private Double rendaMaxima;
    /** Documentos separados por ponto e vírgula, como estão na coluna do banco. */
    private String documentos;
    private String ondeInscrever;
    private String site;

    /** Regra de renda: sem teto, qualquer renda atende; com teto, vale até o valor do teto. */
    public boolean atendeRenda(double rendaFamiliar) {
        return rendaMaxima == null || rendaFamiliar <= rendaMaxima;
    }

    /** A coluna de documentos transformada em lista, uma entrada para cada documento. */
    public List<String> listaDocumentos() {
        if (documentos == null || documentos.isBlank()) {
            return List.of();
        }
        return Arrays.stream(documentos.split(";")).map(String::trim).filter(item -> !item.isEmpty()).toList();
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

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getQuemTemDireito() {
        return quemTemDireito;
    }

    public void setQuemTemDireito(String quemTemDireito) {
        this.quemTemDireito = quemTemDireito;
    }

    public Double getRendaMaxima() {
        return rendaMaxima;
    }

    public void setRendaMaxima(Double rendaMaxima) {
        this.rendaMaxima = rendaMaxima;
    }

    public String getDocumentos() {
        return documentos;
    }

    public void setDocumentos(String documentos) {
        this.documentos = documentos;
    }

    public String getOndeInscrever() {
        return ondeInscrever;
    }

    public void setOndeInscrever(String ondeInscrever) {
        this.ondeInscrever = ondeInscrever;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }
}
