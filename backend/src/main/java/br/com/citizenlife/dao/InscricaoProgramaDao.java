package br.com.citizenlife.dao;

import br.com.citizenlife.model.InscricaoPrograma;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CRUD da tabela CL_INSCRICAO_PROGRAMA, sempre com o programa junto (JOIN com CL_PROGRAMA_MORADIA). */
public class InscricaoProgramaDao implements CrudDao<InscricaoPrograma> {

    private static final String SELECT = "SELECT i.id_inscricao, i.id_cidadao, i.status, i.protocolo, i.observacao, "
            + "i.dt_inscricao, i.dt_atualizacao, " + ProgramaMoradiaDao.COLUNAS
            + " FROM cl_inscricao_programa i JOIN cl_programa_moradia p ON p.id_programa = i.id_programa";
    // Aprovadas primeiro, depois em análise e inscritas; dentro de cada grupo, a mais recente no topo
    private static final String ORDEM = " ORDER BY CASE i.status WHEN 'APROVADO' THEN 1 WHEN 'EM_ANALISE' THEN 2 ELSE 3 END, "
            + "i.dt_atualizacao DESC, i.id_inscricao DESC";

    @Override
    public InscricaoPrograma inserir(InscricaoPrograma inscricao) {
        String sql = "INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao) "
                + "VALUES (?, ?, ?, ?, ?)";
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql, new String[]{"ID_INSCRICAO"})) {
            comando.setLong(1, inscricao.getIdCidadao());
            comando.setLong(2, inscricao.getPrograma().getId());
            comando.setString(3, inscricao.getStatus());
            comando.setString(4, inscricao.getProtocolo());
            comando.setString(5, inscricao.getObservacao());
            comando.executeUpdate();
            inscricao.setId(Conexao.idGerado(comando));
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar a inscrição");
        }
        // Lê de volta: as datas e o programa completo vêm do banco
        return buscarPorId(inscricao.getId()).orElse(inscricao);
    }

    @Override
    public List<InscricaoPrograma> listar() {
        return consultar(SELECT + ORDEM);
    }

    public List<InscricaoPrograma> listarPorCidadao(long idCidadao) {
        return consultar(SELECT + " WHERE i.id_cidadao = ?" + ORDEM, idCidadao);
    }

    @Override
    public Optional<InscricaoPrograma> buscarPorId(long id) {
        return consultar(SELECT + " WHERE i.id_inscricao = ?", id).stream().findFirst();
    }

    /** Muda o status, o protocolo e a observação. O programa de uma inscrição não muda: para trocar, exclua e inscreva de novo. */
    @Override
    public boolean atualizar(InscricaoPrograma inscricao) {
        String sql = "UPDATE cl_inscricao_programa SET status = ?, protocolo = ?, observacao = ?, dt_atualizacao = SYSDATE "
                + "WHERE id_inscricao = ?";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            comando.setString(1, inscricao.getStatus());
            comando.setString(2, inscricao.getProtocolo());
            comando.setString(3, inscricao.getObservacao());
            comando.setLong(4, inscricao.getId());
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "atualizar a inscrição");
        }
    }

    @Override
    public boolean excluir(long id) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement("DELETE FROM cl_inscricao_programa WHERE id_inscricao = ?")) {
            comando.setLong(1, id);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "excluir a inscrição");
        }
    }

    private List<InscricaoPrograma> consultar(String sql, Object... parametros) {
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            for (int i = 0; i < parametros.length; i++) {
                comando.setObject(i + 1, parametros[i]);
            }
            List<InscricaoPrograma> inscricoes = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    InscricaoPrograma inscricao = new InscricaoPrograma();
                    inscricao.setId(resultado.getLong("id_inscricao"));
                    inscricao.setIdCidadao(resultado.getLong("id_cidadao"));
                    inscricao.setStatus(resultado.getString("status"));
                    inscricao.setProtocolo(resultado.getString("protocolo"));
                    inscricao.setObservacao(resultado.getString("observacao"));
                    inscricao.setDataInscricao(Conexao.data(resultado, "dt_inscricao"));
                    inscricao.setDataAtualizacao(Conexao.data(resultado, "dt_atualizacao"));
                    inscricao.setPrograma(ProgramaMoradiaDao.ler(resultado));
                    inscricoes.add(inscricao);
                }
            }
            return inscricoes;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar as inscrições");
        }
    }
}
