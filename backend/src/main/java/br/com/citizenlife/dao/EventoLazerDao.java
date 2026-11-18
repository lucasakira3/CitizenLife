package br.com.citizenlife.dao;

import br.com.citizenlife.model.EventoLazer;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CRUD da tabela CL_EVENTO_LAZER e a agenda do cidadão (CL_CIDADAO_EVENTO). */
public class EventoLazerDao implements CrudDao<EventoLazer> {

    // O evento vem com o lugar onde acontece (JOIN), para a tela mostrar nome, bairro e zona
    private static final String SELECT = """
            SELECT e.id_evento, e.titulo, e.categoria, e.descricao, e.dt_inicio, e.dt_fim,
                   l.id_lugar, l.nome, l.tipo, l.bairro, l.zona, l.aberto_24h, l.abre, l.fecha, l.pos_x, l.pos_y
              FROM cl_evento_lazer e
              JOIN cl_lugar_lazer l ON l.id_lugar = e.id_lugar""";
    private static final String ORDEM = " ORDER BY e.dt_inicio, e.titulo";

    @Override
    public EventoLazer inserir(EventoLazer evento) {
        String sql = "INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql, new String[]{"ID_EVENTO"})) {
            preencher(comando, evento);
            comando.executeUpdate();
            evento.setId(Conexao.idGerado(comando));
            return evento;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar o evento");
        }
    }

    @Override
    public List<EventoLazer> listar() {
        return consultar(SELECT + ORDEM);
    }

    /**
     * Eventos que ainda não acabaram em "desde" e começam antes de "ate", com filtros opcionais
     * de zona (do lugar) e categoria.
     */
    public List<EventoLazer> listarEntre(LocalDateTime desde, LocalDateTime ate, String zona, String categoria) {
        StringBuilder sql = new StringBuilder(SELECT + " WHERE e.dt_fim > ? AND e.dt_inicio < ?");
        List<Object> parametros = new ArrayList<>(List.of(Timestamp.valueOf(desde), Timestamp.valueOf(ate)));
        if (zona != null) {
            sql.append(" AND l.zona = ?");
            parametros.add(zona);
        }
        if (categoria != null) {
            sql.append(" AND e.categoria = ?");
            parametros.add(categoria);
        }
        return consultar(sql + ORDEM, parametros.toArray());
    }

    @Override
    public Optional<EventoLazer> buscarPorId(long id) {
        return consultar(SELECT + " WHERE e.id_evento = ?", id).stream().findFirst();
    }

    @Override
    public boolean atualizar(EventoLazer evento) {
        String sql = "UPDATE cl_evento_lazer SET id_lugar = ?, titulo = ?, categoria = ?, descricao = ?, dt_inicio = ?, "
                + "dt_fim = ? WHERE id_evento = ?";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            preencher(comando, evento);
            comando.setLong(7, evento.getId());
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "atualizar o evento");
        }
    }

    @Override
    public boolean excluir(long id) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement("DELETE FROM cl_evento_lazer WHERE id_evento = ?")) {
            comando.setLong(1, id);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "excluir o evento");
        }
    }

    // ------------------------------------------------------------ agenda (CL_CIDADAO_EVENTO)

    /** Eventos que o cidadão marcou "Eu vou", do mais próximo ao mais distante no tempo. */
    public List<EventoLazer> listarAgenda(long idCidadao) {
        return consultar(SELECT + " JOIN cl_cidadao_evento ce ON ce.id_evento = e.id_evento WHERE ce.id_cidadao = ?"
                + ORDEM, idCidadao);
    }

    public void marcar(long idCidadao, long idEvento) {
        String sql = "INSERT INTO cl_cidadao_evento (id_cidadao, id_evento) VALUES (?, ?)";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            comando.setLong(1, idCidadao);
            comando.setLong(2, idEvento);
            comando.executeUpdate();
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar o evento na agenda");
        }
    }

    public boolean desmarcar(long idCidadao, long idEvento) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(
                     "DELETE FROM cl_cidadao_evento WHERE id_cidadao = ? AND id_evento = ?")) {
            comando.setLong(1, idCidadao);
            comando.setLong(2, idEvento);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "tirar o evento da agenda");
        }
    }

    private void preencher(PreparedStatement comando, EventoLazer evento) throws SQLException {
        comando.setLong(1, evento.getLugar().getId());
        comando.setString(2, evento.getTitulo());
        comando.setString(3, evento.getCategoria());
        comando.setString(4, evento.getDescricao());
        comando.setTimestamp(5, Timestamp.valueOf(evento.getInicio()));
        comando.setTimestamp(6, Timestamp.valueOf(evento.getFim()));
    }

    private List<EventoLazer> consultar(String sql, Object... parametros) {
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            for (int i = 0; i < parametros.length; i++) {
                comando.setObject(i + 1, parametros[i]);
            }
            List<EventoLazer> eventos = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    EventoLazer evento = new EventoLazer();
                    evento.setId(resultado.getLong("id_evento"));
                    evento.setTitulo(resultado.getString("titulo"));
                    evento.setCategoria(resultado.getString("categoria"));
                    evento.setDescricao(resultado.getString("descricao"));
                    evento.setInicio(Conexao.data(resultado, "dt_inicio"));
                    evento.setFim(Conexao.data(resultado, "dt_fim"));
                    evento.setLugar(LugarLazerDao.ler(resultado));
                    eventos.add(evento);
                }
            }
            return eventos;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar os eventos");
        }
    }
}
