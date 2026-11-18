import { useApp } from "../../contexto.js";
import { useCarregar } from "../../hooks/useCarregar.js";
import { CartaoEvento } from "../../pages/LazerPage.jsx";
import { api } from "../../services/api.js";
import { Carregando, ErroCarga, Vazio } from "../Estados.jsx";
import Icone from "../Icone.jsx";
import IntroAba from "./IntroAba.jsx";

/** Lazer › Minha agenda: os eventos em que o cidadão marcou "Eu vou", os próximos primeiro. */
export default function MinhaAgenda({ setAviso }) {
  const { sessao, dominio } = useApp();
  const agenda = useCarregar(() => api.buscar(`/cidadaos/${sessao.id}/agenda`), [sessao.id]);
  const lista = agenda.dados ?? [];
  const proximos = lista.filter((evento) => !evento.terminou);
  const passados = lista.filter((evento) => evento.terminou).reverse();

  async function tirar(evento) {
    try {
      await api.excluir(`/cidadaos/${sessao.id}/agenda/${evento.id}`);
      setAviso({ tipo: "sucesso", texto: `"${evento.titulo}" saiu da sua agenda.` });
      agenda.recarregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  const cartao = (evento) => (
    <li key={evento.id}>
      <CartaoEvento evento={evento} naAgenda comConta aoAlternar={() => tirar(evento)} acaoTexto="Tirar da agenda" />
    </li>
  );

  return (
    <>
      <IntroAba descricao={`Os eventos em que você marcou "Eu vou". Até ${dominio.maximoAgenda} eventos.`}>
        <a className="botao botao--primario" href="#/lazer">
          <Icone nome="LAZER" tamanho={18} />
          Ver a programação
        </a>
      </IntroAba>

      {agenda.carregando && !agenda.dados && <Carregando />}
      {agenda.erro && <ErroCarga erro={agenda.erro} aoTentar={agenda.recarregar} />}
      {agenda.dados && proximos.length === 0 && (
        <Vazio titulo="Nenhum evento marcado para os próximos dias.">
          <a className="botao botao--secundario botao--pequeno" href="#/lazer">
            Escolher um evento
          </a>
        </Vazio>
      )}

      <ul className="cartoes-perfil">{proximos.map(cartao)}</ul>

      {passados.length > 0 && (
        <>
          <h2 className="perfil-subtitulo">Já aconteceram</h2>
          <ul className="cartoes-perfil">{passados.map(cartao)}</ul>
        </>
      )}
    </>
  );
}
