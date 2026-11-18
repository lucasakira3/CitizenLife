package br.com.citizenlife.dao;

import br.com.citizenlife.model.ProgramaMoradia;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Consulta a tabela CL_PROGRAMA_MORADIA. O catálogo de programas é só de leitura para o cidadão,
 * então este DAO não implementa o CRUD completo (como o OcorrenciaDao).
 */
public class ProgramaMoradiaDao {

    static final String COLUNAS = "p.id_programa, p.nome, p.tipo, p.canal, p.descricao, p.quem_tem_direito, "
            + "p.renda_maxima, p.documentos, p.onde_inscrever, p.site";

    private static final String SELECT = "SELECT " + COLUNAS + " FROM cl_programa_moradia p";
    // Casa própria, aluguel, regularização, reforma e outros, nesta ordem; dentro do tipo, a ordem de cadastro
    private static final String ORDEM = " ORDER BY CASE p.tipo WHEN 'CASA_PROPRIA' THEN 1 WHEN 'ALUGUEL' THEN 2 "
            + "WHEN 'REGULARIZACAO' THEN 3 WHEN 'REFORMA' THEN 4 ELSE 5 END, p.id_programa";

    /** Todos os programas ou só os de um tipo (tipo nulo = sem filtro). */
    public List<ProgramaMoradia> listar(String tipo) {
        if (tipo == null) {
            return consultar(SELECT + ORDEM);
        }
        return consultar(SELECT + " WHERE p.tipo = ?" + ORDEM, tipo);
    }

    public Optional<ProgramaMoradia> buscarPorId(long id) {
        return consultar(SELECT + " WHERE p.id_programa = ?", id).stream().findFirst();
    }

    /** Lê as colunas do programa da linha atual. Também serve ao InscricaoProgramaDao, que junta as duas tabelas. */
    static ProgramaMoradia ler(ResultSet resultado) throws SQLException {
        ProgramaMoradia programa = new ProgramaMoradia();
        programa.setId(resultado.getLong("id_programa"));
        programa.setNome(resultado.getString("nome"));
        programa.setTipo(resultado.getString("tipo"));
        programa.setCanal(resultado.getString("canal"));
        programa.setDescricao(resultado.getString("descricao"));
        programa.setQuemTemDireito(resultado.getString("quem_tem_direito"));
        double renda = resultado.getDouble("renda_maxima");
        programa.setRendaMaxima(resultado.wasNull() ? null : renda);
        programa.setDocumentos(resultado.getString("documentos"));
        programa.setOndeInscrever(resultado.getString("onde_inscrever"));
        programa.setSite(resultado.getString("site"));
        return programa;
    }

    private List<ProgramaMoradia> consultar(String sql, Object... parametros) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql)) {
            for (int i = 0; i < parametros.length; i++) {
                comando.setObject(i + 1, parametros[i]);
            }
            List<ProgramaMoradia> programas = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    programas.add(ler(resultado));
                }
            }
            return programas;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar os programas de moradia");
        }
    }
}
