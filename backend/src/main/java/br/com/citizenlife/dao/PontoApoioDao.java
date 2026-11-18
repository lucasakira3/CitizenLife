package br.com.citizenlife.dao;

import br.com.citizenlife.model.PontoApoio;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CRUD da tabela CL_PONTO_APOIO (onde pedir ajuda). */
public class PontoApoioDao implements CrudDao<PontoApoio> {

    private static final String SELECT = "SELECT id_ponto, nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, "
            + "pos_x, pos_y FROM cl_ponto_apoio";
    private static final String ORDEM = " ORDER BY zona, tipo, nome";

    @Override
    public PontoApoio inserir(PontoApoio ponto) {
        String sql = "INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql, new String[]{"ID_PONTO"})) {
            preencher(comando, ponto);
            comando.executeUpdate();
            ponto.setId(Conexao.idGerado(comando));
            return ponto;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar o ponto de apoio");
        }
    }

    @Override
    public List<PontoApoio> listar() {
        return consultar(SELECT + ORDEM);
    }

    /** Filtra por zona e por tipo; um filtro nulo não restringe nada. */
    public List<PontoApoio> listarPorZonaETipo(String zona, String tipo) {
        StringBuilder sql = new StringBuilder(SELECT + " WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();
        if (zona != null) {
            sql.append(" AND zona = ?");
            parametros.add(zona);
        }
        if (tipo != null) {
            sql.append(" AND tipo = ?");
            parametros.add(tipo);
        }
        return consultar(sql + ORDEM, parametros.toArray());
    }

    @Override
    public Optional<PontoApoio> buscarPorId(long id) {
        return consultar(SELECT + " WHERE id_ponto = ?", id).stream().findFirst();
    }

    @Override
    public boolean atualizar(PontoApoio ponto) {
        String sql = "UPDATE cl_ponto_apoio SET nome = ?, tipo = ?, bairro = ?, zona = ?, telefone = ?, aberto_24h = ?, "
                + "abre = ?, fecha = ?, pos_x = ?, pos_y = ? WHERE id_ponto = ?";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            preencher(comando, ponto);
            comando.setLong(11, ponto.getId());
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "atualizar o ponto de apoio");
        }
    }

    @Override
    public boolean excluir(long id) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement("DELETE FROM cl_ponto_apoio WHERE id_ponto = ?")) {
            comando.setLong(1, id);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "excluir o ponto de apoio");
        }
    }

    private void preencher(PreparedStatement comando, PontoApoio ponto) throws SQLException {
        comando.setString(1, ponto.getNome());
        comando.setString(2, ponto.getTipo());
        comando.setString(3, ponto.getBairro());
        comando.setString(4, ponto.getZona());
        comando.setString(5, ponto.getTelefone());
        comando.setString(6, ponto.isAberto24h() ? "S" : "N");
        comando.setString(7, ponto.isAberto24h() ? null : ponto.getAbre());
        comando.setString(8, ponto.isAberto24h() ? null : ponto.getFecha());
        comando.setDouble(9, ponto.getX());
        comando.setDouble(10, ponto.getY());
    }

    private List<PontoApoio> consultar(String sql, Object... parametros) {
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            for (int i = 0; i < parametros.length; i++) {
                comando.setObject(i + 1, parametros[i]);
            }
            List<PontoApoio> pontos = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    PontoApoio ponto = new PontoApoio();
                    ponto.setId(resultado.getLong("id_ponto"));
                    ponto.setNome(resultado.getString("nome"));
                    ponto.setTipo(resultado.getString("tipo"));
                    ponto.setBairro(resultado.getString("bairro"));
                    ponto.setZona(resultado.getString("zona"));
                    ponto.setTelefone(resultado.getString("telefone"));
                    ponto.setAberto24h("S".equals(resultado.getString("aberto_24h")));
                    ponto.setAbre(resultado.getString("abre"));
                    ponto.setFecha(resultado.getString("fecha"));
                    ponto.setX(resultado.getDouble("pos_x"));
                    ponto.setY(resultado.getDouble("pos_y"));
                    pontos.add(ponto);
                }
            }
            return pontos;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar os pontos de apoio");
        }
    }
}
