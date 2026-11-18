package br.com.citizenlife.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Inscrição do cidadão em um programa de moradia, com o andamento dela (tabela CL_INSCRICAO_PROGRAMA).
 * O status segue a ordem do processo: inscrito, em análise e aprovado.
 */
public class InscricaoPrograma {

    public static final List<String> STATUS = List.of("INSCRITO", "EM_ANALISE", "APROVADO");

    private Long id;
    private Long idCidadao;
    private ProgramaMoradia programa;
    private String status;
    private String protocolo;
    private String observacao;
    private LocalDateTime dataInscricao;
    private LocalDateTime dataAtualizacao;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdCidadao() {
        return idCidadao;
    }

    public void setIdCidadao(Long idCidadao) {
        this.idCidadao = idCidadao;
    }

    public ProgramaMoradia getPrograma() {
        return programa;
    }

    public void setPrograma(ProgramaMoradia programa) {
        this.programa = programa;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProtocolo() {
        return protocolo;
    }

    public void setProtocolo(String protocolo) {
        this.protocolo = protocolo;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public LocalDateTime getDataInscricao() {
        return dataInscricao;
    }

    public void setDataInscricao(LocalDateTime dataInscricao) {
        this.dataInscricao = dataInscricao;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }
}
