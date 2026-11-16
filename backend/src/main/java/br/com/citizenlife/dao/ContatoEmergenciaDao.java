package br.com.citizenlife.dao;

import br.com.citizenlife.model.ContatoEmergencia;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CRUD da tabela CL_CONTATO_EMERGENCIA. */
public class ContatoEmergenciaDao implements CrudDao<ContatoEmergencia> {

    private static final String SELECT =
            "SELECT id_contato, id_cidadao, nome, telefone, parentesco FROM cl_contato_emergencia";

    @Override
    public ContatoEmergencia inserir(ContatoEmergencia contato) {
        String sql = "INSERT INTO cl_contato_emergencia (id_cidadao, nome, telefone, parentesco) VALUES (?, ?, ?, ?)";
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement(sql, new String[]{"ID_CONTATO"})) {
            comando.setLong(1, contato.getIdCidadao());
            comando.setString(2, contato.getNome());
            comando.setString(3, contato.getTelefone());
            comando.setString(4, contato.getParentesco());
            comando.executeUpdate();
            contato.setId(Conexao.idGerado(comando));
            return contato;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "salvar o contato");
        }
    }

    @Override
    public List<ContatoEmergencia> listar() {
        return consultar(SELECT + " ORDER BY nome", null);
    }

    public List<ContatoEmergencia> listarPorCidadao(long idCidadao) {
        return consultar(SELECT + " WHERE id_cidadao = ? ORDER BY nome", idCidadao);
    }

    @Override
    public Optional<ContatoEmergencia> buscarPorId(long id) {
        return consultar(SELECT + " WHERE id_contato = ?", id).stream().findFirst();
    }

    @Override
    public boolean atualizar(ContatoEmergencia contato) {
        String sql = "UPDATE cl_contato_emergencia SET nome = ?, telefone = ?, parentesco = ? WHERE id_contato = ?";
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            comando.setString(1, contato.getNome());
            comando.setString(2, contato.getTelefone());
            comando.setString(3, contato.getParentesco());
            comando.setLong(4, contato.getId());
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "atualizar o contato");
        }
    }

    @Override
    public boolean excluir(long id) {
        try (Connection conexao = Conexao.abrir();
             PreparedStatement comando = conexao.prepareStatement("DELETE FROM cl_contato_emergencia WHERE id_contato = ?")) {
            comando.setLong(1, id);
            return comando.executeUpdate() > 0;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "excluir o contato");
        }
    }

    private List<ContatoEmergencia> consultar(String sql, Object parametro) {
        try (Connection conexao = Conexao.abrir(); PreparedStatement comando = conexao.prepareStatement(sql)) {
            if (parametro != null) {
                comando.setObject(1, parametro);
            }
            List<ContatoEmergencia> contatos = new ArrayList<>();
            try (ResultSet resultado = comando.executeQuery()) {
                while (resultado.next()) {
                    ContatoEmergencia contato = new ContatoEmergencia();
                    contato.setId(resultado.getLong("id_contato"));
                    contato.setIdCidadao(resultado.getLong("id_cidadao"));
                    contato.setNome(resultado.getString("nome"));
                    contato.setTelefone(resultado.getString("telefone"));
                    contato.setParentesco(resultado.getString("parentesco"));
                    contatos.add(contato);
                }
            }
            return contatos;
        } catch (SQLException e) {
            throw Conexao.traduzir(e, "consultar os contatos");
        }
    }
}
