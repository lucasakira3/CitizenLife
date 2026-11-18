package br.com.citizenlife.dao;

import br.com.citizenlife.model.LugarLazer;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CRUD da tabela CL_LUGAR_LAZER (parques, CEUs, centros culturais...). */
public class LugarLazerDao implements CrudDao<LugarLazer> {

    private static final String SELECT = "SELECT id_lugar, nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y "
            + "FROM cl_lugar_lazer";
    private static final String ORDEM = " ORDER BY zona, tipo, nome";

    @Override
    public LugarLazer inserir(LugarLazer lugar) {
        String sql = "INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql, new String[]{"ID_LUGAR"})) {
            preencher(comando, lugar);
            comando.executeUpdate();
            lugar.setId(Conexao.idGerado(comando));
            return lugar;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar o lugar de lazer");
        }
    }

    @Override
    public List<LugarLazer> listar() {
        return consultar(SELECT + ORDEM);
    }

    /** Filtra por zona e por tipo; um filtro nulo não restringe nada. */
    public List<LugarLazer> listarPorZonaETipo(String zona, String tipo) {
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
    public Optional<LugarLazer> buscarPorId(long id) {
        return consultar(SELECT + " WHERE id_lugar = ?", id).stream().findFirst();
    }

    @Override
    public boolean atualizar(LugarLazer lugar) {
        String sql = "UPDATE cl_lugar_lazer SET nome = ?, tipo = ?, bairro = ?, zona = ?, aberto_24h = ?, abre = ?, "
                + "fecha = ?, pos_x = ?, pos_y = ? WHERE id_lugar = ?";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            preencher(comando, lugar);
            comando.setLong(10, lugar.getId());
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "atualizar o lugar de lazer");
        }
    }

    @Override
    public boolean excluir(long id) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement("DELETE FROM cl_lugar_lazer WHERE id_lugar = ?")) {
            comando.setLong(1, id);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "excluir o lugar de lazer");
        }
    }

    private void preencher(PreparedStatement comando, LugarLazer lugar) throws SQLException {
        comando.setString(1, lugar.getNome());
        comando.setString(2, lugar.getTipo());
        comando.setString(3, lugar.getBairro());
        comando.setString(4, lugar.getZona());
        comando.setString(5, lugar.isAberto24h() ? "S" : "N");
        comando.setString(6, lugar.isAberto24h() ? null : lugar.getAbre());
        comando.setString(7, lugar.isAberto24h() ? null : lugar.getFecha());
        comando.setDouble(8, lugar.getX());
        comando.setDouble(9, lugar.getY());
    }

    private List<LugarLazer> consultar(String sql, Object... parametros) {
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            for (int i = 0; i < parametros.length; i++) {
                comando.setObject(i + 1, parametros[i]);
            }
            List<LugarLazer> lugares = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    lugares.add(ler(resultado));
                }
            }
            return lugares;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar os lugares de lazer");
        }
    }

    /** Monta o lugar a partir de uma linha (também usado pelo EventoLazerDao, que faz JOIN com esta tabela). */
    static LugarLazer ler(ResultSet resultado) throws SQLException {
        LugarLazer lugar = new LugarLazer();
        lugar.setId(resultado.getLong("id_lugar"));
        lugar.setNome(resultado.getString("nome"));
        lugar.setTipo(resultado.getString("tipo"));
        lugar.setBairro(resultado.getString("bairro"));
        lugar.setZona(resultado.getString("zona"));
        lugar.setAberto24h("S".equals(resultado.getString("aberto_24h")));
        lugar.setAbre(resultado.getString("abre"));
        lugar.setFecha(resultado.getString("fecha"));
        lugar.setX(resultado.getDouble("pos_x"));
        lugar.setY(resultado.getDouble("pos_y"));
        return lugar;
    }
}
