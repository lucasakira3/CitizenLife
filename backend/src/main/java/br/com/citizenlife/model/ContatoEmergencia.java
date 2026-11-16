package br.com.citizenlife.model;

/** Pessoa que o cidadão quer avisar numa emergência (tabela CL_CONTATO_EMERGENCIA). */
public class ContatoEmergencia {

    private Long id;
    private Long idCidadao;
    private String nome;
    private String telefone;
    private String parentesco;

    /** Só os dígitos do telefone, para validar o tamanho e montar o link tel:. */
    public String getTelefoneDigitos() {
        return telefone == null ? "" : telefone.replaceAll("\\D", "");
    }

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

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getParentesco() {
        return parentesco;
    }

    public void setParentesco(String parentesco) {
        this.parentesco = parentesco;
    }
}
