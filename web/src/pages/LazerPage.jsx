import { useRef, useState } from "react";
import { Aviso, Carregando, ErroCarga, Vazio } from "../components/Estados.jsx";
import Icone from "../components/Icone.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { useApp } from "../contexto.js";
import { useCarregar } from "../hooks/useCarregar.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { api, consulta } from "../services/api.js";
import { formatarDistancia, formatarPeriodo } from "../utils/formato.js";

/** Eventos e lugares por página: duas fileiras de três no computador. */
const POR_PAGINA = 6;

/**
 * Pilar Lazer: a programação gratuita dos próximos dias (com "Eu vou" para quem tem conta),
 * os lugares mais perto de casa e os parques, CEUs, centros culturais e bibliotecas com o que está aberto agora.
 */
export default function LazerPage() {
  useTitulo("Lazer");
  const { sessao, dominio } = useApp();
  const [aviso, setAviso] = useState(null);

  // Programação
  const [zona, setZona] = useState("");
  const [categoria, setCategoria] = useState("");
  const [dias, setDias] = useState(7);
  const [paginaEventos, setPaginaEventos] = useState(1);
  const refEventos = useRef(null);
  const eventos = useCarregar(
    () => api.buscar(`/eventos-lazer${consulta({ zona, categoria, dias })}`),
    [zona, categoria, dias],
  );

  // Lugares
  const [tipo, setTipo] = useState("");
  const [abertoAgora, setAbertoAgora] = useState(false);
  const [paginaLugares, setPaginaLugares] = useState(1);
  const refLugares = useRef(null);
  const lugares = useCarregar(
    () => api.buscar(`/lugares-lazer${consulta({ zona, tipo, abertoAgora })}`),
    [zona, tipo, abertoAgora],
  );

  // Com conta: os lugares perto de casa e os eventos já marcados na agenda
  const perto = useCarregar(
    () => (sessao ? api.buscar(`/cidadaos/${sessao.id}/lazer-perto`) : Promise.resolve(null)),
    [sessao?.id],
  );
  const agenda = useCarregar(
    () => (sessao ? api.buscar(`/cidadaos/${sessao.id}/agenda`) : Promise.resolve([])),
    [sessao?.id],
  );
  const naAgenda = new Set((agenda.dados ?? []).map((evento) => evento.id));

  // A zona vale para as duas listas; trocar qualquer filtro volta para a primeira página
  function mudarZona(valor) {
    setZona(valor);
    setPaginaEventos(1);
    setPaginaLugares(1);
  }

  async function alternarAgenda(evento) {
    setAviso(null);
    try {
      if (naAgenda.has(evento.id)) {
        await api.excluir(`/cidadaos/${sessao.id}/agenda/${evento.id}`);
        setAviso({ tipo: "sucesso", texto: `"${evento.titulo}" saiu da sua agenda.` });
      } else {
        await api.criar(`/cidadaos/${sessao.id}/agenda`, { idEvento: evento.id });
        setAviso({ tipo: "sucesso", texto: `"${evento.titulo}" está na sua agenda.` });
      }
      agenda.recarregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  const listaEventos = eventos.dados ?? [];
  const totalEventos = Math.max(1, Math.ceil(listaEventos.length / POR_PAGINA));
  const paginaE = Math.min(paginaEventos, totalEventos);
  const listaLugares = lugares.dados ?? [];
  const totalLugares = Math.max(1, Math.ceil(listaLugares.length / POR_PAGINA));
  const paginaL = Math.min(paginaLugares, totalLugares);

  return (
    <>
      <a className="voltar" href="#/">
        Todos os pilares
      </a>

      <section className="pilar-cabeca" aria-labelledby="lazer-titulo" style={{ "--cor-pilar": "var(--pilar-lazer)" }}>
        <span className="pilar-cabeca__icone">
          <Icone nome="LAZER" tamanho={34} />
        </span>
        <div>
          <p className="sobretitulo">Pilar · Lazer</p>
          <h1 id="lazer-titulo">Programação gratuita por região</h1>
          <p className="lead">
            Parques, CEUs, centros culturais e bibliotecas, com o que acontece nos próximos dias e o que está aberto agora.
          </p>
          <a className="botao botao--secundario botao--pequeno" href="#/mobilidade/mapa?lazer=1">
            <Icone nome="MAPA" tamanho={16} />
            Ver os lugares no mapa
          </a>
        </div>
      </section>

      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />


      {sessao && <PertoDeCasa perto={perto} />}

      <p className="lazer-zonas__rotulo">Região da programação e dos lugares</p>
      <div className="filtro-chips lazer-zonas" role="group" aria-label="Filtrar a programação e os lugares por zona">
        <button type="button" aria-pressed={!zona} onClick={() => mudarZona("")}>
          Toda a cidade
        </button>
        {dominio.zonas.map((nome) => (
          <button key={nome} type="button" aria-pressed={zona === nome} onClick={() => mudarZona(zona === nome ? "" : nome)}>
            {nome}
          </button>
        ))}
      </div>

      <section className="perfil-bloco" aria-labelledby="eventos-titulo" ref={refEventos}>
        <h2 id="eventos-titulo" className="perfil-subtitulo">Programação gratuita</h2>
        <div className="filtros-seguranca">
          <div className="filtro-chips" role="group" aria-label="Filtrar por categoria">
            <button type="button" aria-pressed={!categoria} onClick={() => { setCategoria(""); setPaginaEventos(1); }}>
              Todas
            </button>
            {dominio.categoriasEvento.map((item) => (
              <button
                key={item.codigo}
                type="button"
                aria-pressed={categoria === item.codigo}
                onClick={() => { setCategoria(categoria === item.codigo ? "" : item.codigo); setPaginaEventos(1); }}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
          <div className="filtro-chips" role="group" aria-label="Período">
            {[[7, "Próximos 7 dias"], [14, "Próximos 14 dias"]].map(([valor, rotulo]) => (
              <button key={valor} type="button" aria-pressed={dias === valor} onClick={() => { setDias(valor); setPaginaEventos(1); }}>
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        {eventos.carregando && !eventos.dados && <Carregando texto="Carregando a programação…" />}
        {eventos.erro && <ErroCarga erro={eventos.erro} aoTentar={eventos.recarregar} />}
        {eventos.dados && (
          <p className="filtro-conta" role="status">
            {listaEventos.length} {listaEventos.length === 1 ? "evento" : "eventos"}
            {totalEventos > 1 && <> · página {paginaE} de {totalEventos}</>}
          </p>
        )}
        {eventos.dados && listaEventos.length === 0 && <Vazio titulo="Nenhum evento com estes filtros." />}

        <ul className="cartoes-perfil">
          {listaEventos.slice((paginaE - 1) * POR_PAGINA, paginaE * POR_PAGINA).map((evento) => (
            <li key={evento.id}>
              <CartaoEvento
                evento={evento}
                naAgenda={naAgenda.has(evento.id)}
                comConta={Boolean(sessao)}
                aoAlternar={() => alternarAgenda(evento)}
              />
            </li>
          ))}
        </ul>
        <Paginacao
          pagina={paginaE}
          totalPaginas={totalEventos}
          aoMudar={(numero) => {
            setPaginaEventos(numero);
            refEventos.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          rotulo="Páginas da programação"
        />
      </section>

      <section className="perfil-bloco" aria-labelledby="lugares-titulo" ref={refLugares}>
        <h2 id="lugares-titulo" className="perfil-subtitulo">Lugares</h2>
        <div className="filtros-seguranca">
          <div className="filtro-chips" role="group" aria-label="Filtrar por tipo de lugar">
            <button type="button" aria-pressed={!tipo} onClick={() => { setTipo(""); setPaginaLugares(1); }}>
              Todos
            </button>
            {dominio.tiposLugarLazer.map((item) => (
              <button
                key={item.codigo}
                type="button"
                aria-pressed={tipo === item.codigo}
                onClick={() => { setTipo(tipo === item.codigo ? "" : item.codigo); setPaginaLugares(1); }}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
          <label className="filtro-aberto">
            <input
              type="checkbox"
              checked={abertoAgora}
              onChange={(evento) => { setAbertoAgora(evento.target.checked); setPaginaLugares(1); }}
            />
            Só o que está aberto agora
          </label>
        </div>

        {lugares.carregando && !lugares.dados && <Carregando texto="Carregando os lugares…" />}
        {lugares.erro && <ErroCarga erro={lugares.erro} aoTentar={lugares.recarregar} />}
        {lugares.dados && (
          <p className="filtro-conta" role="status">
            {listaLugares.length} {listaLugares.length === 1 ? "lugar" : "lugares"}
            {totalLugares > 1 && <> · página {paginaL} de {totalLugares}</>}
          </p>
        )}
        {lugares.dados && listaLugares.length === 0 && <Vazio titulo="Nenhum lugar com estes filtros." />}

        <ul className="cartoes-perfil">
          {listaLugares.slice((paginaL - 1) * POR_PAGINA, paginaL * POR_PAGINA).map((lugar) => (
            <li key={lugar.id}>
              <CartaoLugar lugar={lugar} />
            </li>
          ))}
        </ul>
        <Paginacao
          pagina={paginaL}
          totalPaginas={totalLugares}
          aoMudar={(numero) => {
            setPaginaLugares(numero);
            refLugares.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          rotulo="Páginas dos lugares"
        />
      </section>
    </>
  );
}

/** Os três lugares de lazer mais perto da casa do cidadão (ou do primeiro endereço salvo). */
function PertoDeCasa({ perto }) {
  return (
    <section className="perfil-bloco" aria-labelledby="lazer-perto-titulo">
      <h2 id="lazer-perto-titulo" className="perfil-subtitulo">Perto de você</h2>
      {perto.carregando && !perto.dados && <Carregando texto="Procurando o que fica perto de você…" />}
      {perto.erro && <ErroCarga erro={perto.erro} aoTentar={perto.recarregar} />}
      {!perto.carregando && !perto.erro && !perto.dados && (
        <Vazio titulo="Salve o endereço da sua casa para ver os lugares mais perto.">
          <a className="botao botao--secundario botao--pequeno" href="#/perfil/mobilidade/enderecos">
            Salvar endereço
          </a>
        </Vazio>
      )}
      {perto.dados && (
        <>
          <p className="texto-apoio">
            A partir de <strong>{perto.dados.referencia.apelido}</strong> ({perto.dados.referencia.local.descricao}), em linha reta.
          </p>
          <ul className="cartoes-perfil">
            {perto.dados.lugares.map((lugar) => (
              <li key={lugar.id}>
                <CartaoLugar lugar={lugar} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function CartaoEvento({ evento, naAgenda, comConta, aoAlternar, acaoTexto }) {
  const { dominio, rotulo } = useApp();
  const categoria = dominio.categoriasEvento.find((item) => item.codigo === evento.categoria);

  return (
    <article className={`cartao-perfil evento-lazer ${evento.terminou ? "evento-lazer--passado" : ""}`}>
      <div className="evento-lazer__topo">
        <span className={`evento-lazer__categoria evento-lazer__categoria--${evento.categoria}`}>
          <Icone nome={categoria?.icone ?? "LAZER"} tamanho={14} />
          {rotulo("categoriasEvento", evento.categoria)}
        </span>
        {evento.acontecendo && <span className="ponto-apoio__estado ponto-apoio__estado--aberto">Acontecendo agora</span>}
        {evento.terminou && <span className="ponto-apoio__estado">Já aconteceu</span>}
      </div>
      <h3 className="evento-lazer__titulo">{evento.titulo}</h3>
      <p className="evento-lazer__quando">
        <Icone nome="RELOGIO" tamanho={14} /> {formatarPeriodo(evento.inicio, evento.fim)}
      </p>
      <p className="rotas-salvas__meta evento-lazer__onde">
        <Icone nome="PIN" tamanho={14} /> {evento.lugar.nome} · {evento.lugar.zona}
      </p>
      <p className="evento-lazer__descricao">{evento.descricao}</p>
      <div className="ponto-apoio__acoes">
        {comConta ? (
          !evento.terminou || naAgenda ? (
            <button
              type="button"
              className={`botao botao--pequeno ${naAgenda ? "botao--primario" : "botao--secundario"}`}
              aria-pressed={naAgenda}
              onClick={aoAlternar}
            >
              <Icone nome={naAgenda ? "CHECK" : "MAIS"} tamanho={16} />
              {acaoTexto ?? (naAgenda ? "Na sua agenda" : "Eu vou")}
            </button>
          ) : null
        ) : (
          <a className="botao botao--secundario botao--pequeno" href="#/entrar">
            Entre para salvar na agenda
          </a>
        )}
        <a className="botao botao--secundario botao--pequeno" href={linkDaRota(evento.lugar)}>
          <Icone nome="MAPA" tamanho={16} />
          Como chegar
        </a>
      </div>
    </article>
  );
}

function CartaoLugar({ lugar }) {
  const { dominio, rotulo } = useApp();
  const tipo = dominio.tiposLugarLazer.find((item) => item.codigo === lugar.tipo);
  const horario = lugar.aberto24h ? "24 horas" : `${lugar.abre} às ${lugar.fecha === "00:00" ? "meia-noite" : lugar.fecha}`;

  return (
    <article className="cartao-perfil ponto-apoio">
      <div className="ponto-apoio__cabeca">
        <span className={`ponto-apoio__icone lugar-lazer__icone--${lugar.tipo}`} aria-hidden="true">
          <Icone nome={tipo?.icone ?? "LAZER"} tamanho={20} />
        </span>
        <div className="ponto-apoio__texto">
          <p className="ponto-apoio__tipo">{rotulo("tiposLugarLazer", lugar.tipo)}</p>
          <h3 className="ponto-apoio__nome">{lugar.nome}</h3>
        </div>
        <span className={`ponto-apoio__estado ${lugar.abertoAgora ? "ponto-apoio__estado--aberto" : ""}`}>
          {lugar.abertoAgora ? "Aberto agora" : "Fechado"}
        </span>
      </div>
      <p className="rotas-salvas__meta">
        <Icone nome="PIN" tamanho={14} /> {lugar.bairro} · {lugar.zona}
        {lugar.distanciaMetros !== undefined && <> · {formatarDistancia(lugar.distanciaMetros)}</>}
      </p>
      <p className="rotas-salvas__meta">
        <Icone nome="RELOGIO" tamanho={14} /> {horario}
      </p>
      <div className="ponto-apoio__acoes">
        <a className="botao botao--secundario botao--pequeno" href={linkDaRota(lugar)}>
          <Icone nome="MAPA" tamanho={16} />
          Como chegar
        </a>
      </div>
    </article>
  );
}

/** Abre o planejador de rota com o lugar como destino (a saída é a casa, se estiver salva). */
function linkDaRota(lugar) {
  const busca = new URLSearchParams({ destino: lugar.nome, x: String(lugar.local.x), y: String(lugar.local.y) });
  return `#/mobilidade/rota?${busca}`;
}
