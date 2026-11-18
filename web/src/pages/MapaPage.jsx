import { useCallback, useEffect, useRef, useState } from "react";
import { Gravidade } from "../components/Etiquetas.jsx";
import { ErroCarga, Vazio } from "../components/Estados.jsx";
import Icone from "../components/Icone.jsx";
import MapaCidade, { zonaDaRegiao } from "../components/MapaCidade.jsx";
import PlacaVia from "../components/PlacaVia.jsx";
import SeletorModal from "../components/SeletorModal.jsx";
import SinalRisco from "../components/SinalRisco.jsx";
import { useApp } from "../contexto.js";
import { useCarregar } from "../hooks/useCarregar.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { api, consulta } from "../services/api.js";
import { formatarNumero, formatarPeriodo, tempoRelativo } from "../utils/formato.js";
import { MODAL_FRASE } from "../utils/rotulos.js";

const ZONAS = [
  ["CENTRO", "Centro"],
  ["NORTE", "Norte"],
  ["SUL", "Sul"],
  ["LESTE", "Leste"],
  ["OESTE", "Oeste"],
];
const CELULAR = "(max-width: 860px)";

/** Parâmetros da URL: #/mobilidade/mapa?modal=MOTO&ocorrencia=3 (vindo de um alerta, por exemplo). */
function parametroDaUrl(nome) {
  const busca = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  return busca.get(nome);
}

export default function MapaPage() {
  useTitulo("Mapa de riscos");
  const { sessao, dominio, rotulo } = useApp();
  const modalInicial = parametroDaUrl("modal");
  const [modal, setModal] = useState(
    dominio.modais.some((item) => item.codigo === modalInicial) ? modalInicial : (sessao?.modal ?? "MOTO"),
  );
  const [zona, setZona] = useState(null);
  const [focoInicial] = useState(() => Number(parametroDaUrl("ocorrencia")) || null);
  const [selecionada, setSelecionada] = useState(focoInicial);
  const [celular, setCelular] = useState(() => window.matchMedia(CELULAR).matches);
  const [painelAberto, setPainelAberto] = useState(() => !window.matchMedia(CELULAR).matches);
  const [folga, setFolga] = useState({ esquerda: 0, inferior: 0 });
  const refMapa = useRef(null);
  const refPainel = useRef(null);

  const ativas = useCarregar(() => api.buscar(`/ocorrencias${consulta({ modal })}`), [modal]);

  // Camada do pilar Segurança: os pontos de apoio só são buscados quando o cidadão liga o botão
  const [verApoio, setVerApoio] = useState(() => parametroDaUrl("apoio") === "1");
  const [pontoAtivo, setPontoAtivo] = useState(null);
  const [pontos, setPontos] = useState(null);
  const [erroPontos, setErroPontos] = useState(null);
  useEffect(() => {
    if (!verApoio || pontos) return;
    api
      .buscar("/pontos-apoio")
      .then(setPontos)
      .catch(setErroPontos);
  }, [verApoio, pontos]);
  const pontosNoMapa = verApoio && pontos ? pontos : null;
  const pontoEscolhido = pontosNoMapa?.find((ponto) => ponto.id === pontoAtivo) ?? null;

  // Camada do pilar Lazer: lugares e a programação dos próximos 14 dias (buscados ao ligar o botão)
  const [verLazer, setVerLazer] = useState(() => parametroDaUrl("lazer") === "1");
  const [lugarAtivo, setLugarAtivo] = useState(null);
  const [lazer, setLazer] = useState(null); // { lugares, eventos }
  const [erroLazer, setErroLazer] = useState(null);
  useEffect(() => {
    if (!verLazer || lazer) return;
    Promise.all([api.buscar("/lugares-lazer"), api.buscar("/eventos-lazer?dias=14")])
      .then(([lugares, eventos]) => setLazer({ lugares, eventos }))
      .catch(setErroLazer);
  }, [verLazer, lazer]);
  const lugaresNoMapa = verLazer && lazer ? lazer.lugares : null;
  const lugarEscolhido = lugaresNoMapa?.find((lugar) => lugar.id === lugarAtivo) ?? null;

  function alternarLazer() {
    setVerLazer((ligado) => !ligado);
    setLugarAtivo(null);
    setErroLazer(null);
  }

  const escolherLugar = useCallback(
    (id) => {
      setLugarAtivo(id);
      if (id) {
        setSelecionada(null);
        setPontoAtivo(null);
        if (celular) setPainelAberto(true);
        const lugar = lazer?.lugares.find((item) => item.id === id);
        if (lugar) refMapa.current?.focarPonto(lugar.local.x, lugar.local.y);
      }
    },
    [celular, lazer],
  );

  function alternarApoio() {
    setVerApoio((ligado) => !ligado);
    setPontoAtivo(null);
    setErroPontos(null);
  }

  const escolherPonto = useCallback(
    (id) => {
      setPontoAtivo(id);
      if (id) {
        setSelecionada(null);
        setLugarAtivo(null);
        if (celular) setPainelAberto(true);
        const ponto = pontos?.find((item) => item.id === id);
        if (ponto) refMapa.current?.focarPonto(ponto.local.x, ponto.local.y);
      }
    },
    [celular, pontos],
  );

  // Vindo de um alerta: assim que o mapa e as placas carregam, a câmera voa até a ocorrência.
  useEffect(() => {
    if (!focoInicial || !ativas.dados) return undefined;
    let tentativas = 0;
    const relogio = setInterval(() => {
      tentativas += 1;
      if (refMapa.current?.focarOcorrencia(focoInicial) || tentativas > 60) clearInterval(relogio);
    }, 200);
    return () => clearInterval(relogio);
  }, [focoInicial, ativas.dados]);

  // Celular: o painel vira uma gaveta embaixo; computador: uma coluna à esquerda.
  useEffect(() => {
    const consultaMidia = window.matchMedia(CELULAR);
    const aoMudar = () => setCelular(consultaMidia.matches);
    consultaMidia.addEventListener("change", aoMudar);
    return () => consultaMidia.removeEventListener("change", aoMudar);
  }, []);

  // A câmera centraliza a cidade no espaço que sobra ao lado (ou acima) do painel.
  useEffect(() => {
    const painel = refPainel.current;
    if (!painel || typeof ResizeObserver === "undefined") return undefined;
    const observador = new ResizeObserver(() => {
      const caixa = painel.getBoundingClientRect();
      setFolga(celular ? { esquerda: 0, inferior: caixa.height + 12 } : { esquerda: caixa.width + 24, inferior: 0 });
    });
    observador.observe(painel);
    return () => observador.disconnect();
  }, [celular]);

  const ordenadas = ativas.dados ? [...ativas.dados].sort((a, b) => b.risco.valor - a.risco.valor) : [];
  const visiveis = zona
    ? ordenadas.filter((ocorrencia) => zonaDaRegiao(ocorrencia.via.zona) === zona)
    : ordenadas;
  const comAlerta = ordenadas.filter((ocorrencia) => ocorrencia.risco.alerta).length;
  const escolhida = ordenadas.find((ocorrencia) => ocorrencia.id === selecionada) ?? null;

  const selecionar = useCallback(
    (id) => {
      setSelecionada(id);
      if (id) {
        setPontoAtivo(null);
        setLugarAtivo(null);
      }
      if (id && celular) setPainelAberto(true);
    },
    [celular],
  );

  function abrirDaLista(id) {
    setSelecionada(id);
    refMapa.current?.focarOcorrencia(id);
  }

  // Filtro de zona: a lista mostra só a zona e a câmera voa até ela
  function escolherZona(chave) {
    setZona(chave);
    setSelecionada(null);
    if (chave) {
      refMapa.current?.verZona(chave);
    } else {
      refMapa.current?.verCidade();
    }
  }

  return (
    <section className="mapa-tela" aria-labelledby="mapa-titulo" data-tela-cheia>
      {ativas.erro ? (
        <div className="mapa-tela__erro">
          <ErroCarga erro={ativas.erro} aoTentar={ativas.recarregar} />
        </div>
      ) : (
        <MapaCidade
          ref={refMapa}
          ocorrencias={ordenadas}
          modo="tela"
          zonaSelecionada={zona}
          selecionada={selecionada}
          aoSelecionar={selecionar}
          folga={folga}
          pontosApoio={pontosNoMapa}
          pontoAtivo={pontoAtivo}
          aoEscolherPonto={escolherPonto}
          lugaresLazer={lugaresNoMapa}
          lugarAtivo={lugarAtivo}
          aoEscolherLugar={escolherLugar}
        />
      )}

      <aside
        ref={refPainel}
        className={`mapa-painel ${painelAberto ? "mapa-painel--aberto" : ""}`}
        aria-label="Ocorrências no mapa"
      >
        <header className="mapa-painel__cabeca">
          {celular && (
            <button
              type="button"
              className="mapa-painel__puxador"
              aria-expanded={painelAberto}
              aria-controls="mapa-painel-corpo"
              onClick={() => setPainelAberto((aberto) => !aberto)}
            >
              <span className="visualmente-oculto">{painelAberto ? "Recolher o painel" : "Abrir o painel"}</span>
            </button>
          )}
          <p className="sobretitulo">Mapa de riscos</p>
          <h1 id="mapa-titulo" className="mapa-painel__titulo">
            A cidade calculada para quem {MODAL_FRASE[modal]}
          </h1>
          <SeletorModal valor={modal} aoMudar={setModal} legenda="Calcular o risco para" />
          <button
            type="button"
            className="mapa-camada"
            aria-pressed={verApoio}
            onClick={alternarApoio}
          >
            <Icone nome="SEGURANCA" tamanho={16} />
            {verApoio ? "Esconder pontos de apoio" : "Mostrar pontos de apoio"}
          </button>
          <button
            type="button"
            className="mapa-camada mapa-camada--lazer"
            aria-pressed={verLazer}
            onClick={alternarLazer}
          >
            <Icone nome="LAZER" tamanho={16} />
            {verLazer ? "Esconder lugares de lazer" : "Mostrar lugares de lazer"}
          </button>
          {erroPontos && <p className="mapa-camada__erro">{erroPontos.message}</p>}
          {erroLazer && <p className="mapa-camada__erro">{erroLazer.message}</p>}
          {ativas.dados && (
            <p className="mapa-painel__resumo" aria-live="polite">
              <strong>
                {comAlerta} de {ordenadas.length}
              </strong>{" "}
              ocorrências ativas pedem atenção.
            </p>
          )}
        </header>

        <div id="mapa-painel-corpo" className="mapa-painel__corpo" hidden={celular && !painelAberto}>
          {lugarEscolhido ? (
            <DetalheLugar
              key={lugarEscolhido.id}
              lugar={lugarEscolhido}
              eventos={lazer.eventos.filter((evento) => evento.lugar.id === lugarEscolhido.id)}
              rotulo={rotulo}
              aoVoltar={() => setLugarAtivo(null)}
            />
          ) : pontoEscolhido ? (
            <DetalhePonto key={pontoEscolhido.id} ponto={pontoEscolhido} rotulo={rotulo} aoVoltar={() => setPontoAtivo(null)} />
          ) : escolhida ? (
            <DetalheNoMapa
              key={escolhida.id}
              ocorrencia={escolhida}
              rotulo={rotulo}
              aoVoltar={() => setSelecionada(null)}
            />
          ) : (
            <>
              <div className="mapa-zonas" role="group" aria-label="Filtrar por zona">
                <button type="button" aria-pressed={!zona} onClick={() => escolherZona(null)}>
                  Todas
                </button>
                {ZONAS.map(([chave, nome]) => (
                  <button
                    key={chave}
                    type="button"
                    aria-pressed={zona === chave}
                    onClick={() => escolherZona(zona === chave ? null : chave)}
                  >
                    {nome}
                  </button>
                ))}
              </div>
              {zona && (
                <p className="mapa-zonas__conta" role="status">
                  {visiveis.length} {visiveis.length === 1 ? "ocorrência ativa" : "ocorrências ativas"} nesta zona.
                </p>
              )}

              {!ativas.dados && !ativas.erro && <p className="mapa-painel__carregando">Carregando ocorrências…</p>}
              {ativas.dados && visiveis.length === 0 && (
                <Vazio titulo={zona ? "Nenhuma ocorrência ativa nesta zona." : "Nenhuma ocorrência ativa agora."} />
              )}

              <ol className="mapa-lista">
                {visiveis.map((ocorrencia, indice) => (
                  <li key={ocorrencia.id} style={{ "--i": Math.min(indice, 10) }}>
                    <button type="button" className="mapa-lista__item" onClick={() => abrirDaLista(ocorrencia.id)}>
                      <SinalRisco key={`${ocorrencia.risco.nivel}-${ocorrencia.risco.valor}`} risco={ocorrencia.risco} tamanho="pequeno" />
                      <span className="mapa-lista__texto">
                        <span className="mapa-lista__tipo">
                          <Icone nome={ocorrencia.tipo} tamanho={14} />
                          {rotulo("tiposOcorrencia", ocorrencia.tipo)} · {tempoRelativo(ocorrencia.dataRegistro)}
                        </span>
                        <span className="mapa-lista__titulo">{ocorrencia.titulo}</span>
                        <span className="mapa-lista__vias">
                          {ocorrencia.via.nome}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <p className="mapa-painel__dica">
                Arraste para mover · role para aproximar · toque numa placa.
              </p>
            </>
          )}
        </div>
      </aside>
    </section>
  );
}

function DetalheNoMapa({ ocorrencia, rotulo, aoVoltar }) {
  const { risco } = ocorrencia;
  return (
    <article className="mapa-detalhe" aria-labelledby="mapa-detalhe-titulo">
      <button type="button" className="mapa-detalhe__voltar" onClick={aoVoltar}>
        <Icone nome="VOLTAR" tamanho={16} />
        Todas as ocorrências
      </button>
      <div className="mapa-detalhe__topo">
        <SinalRisco risco={risco} tamanho="grande" />
        <div>
          <p className="mapa-detalhe__tipo">
            <Icone nome={ocorrencia.tipo} tamanho={16} />
            {rotulo("tiposOcorrencia", ocorrencia.tipo)}
          </p>
          <h2 id="mapa-detalhe-titulo" className="mapa-detalhe__titulo">
            {ocorrencia.titulo}
          </h2>
        </div>
      </div>
      <p className="mapa-detalhe__risco">
        Risco <strong>{rotulo("niveisRisco", risco.nivel).toLowerCase()}</strong> ({formatarNumero(risco.valor, 1)}
        ){risco.alerta ? ": gera alerta para quem passa por aqui." : "."}
      </p>
      {ocorrencia.descricao && <p className="mapa-detalhe__descricao">{ocorrencia.descricao}</p>}
      <div className="mapa-detalhe__etiquetas">
        <Gravidade valor={ocorrencia.gravidade} />
      </div>
      <div className="mapa-detalhe__vias">
        <PlacaVia via={ocorrencia.via} />
      </div>
      <p className="mapa-detalhe__quando">
        Registrada {tempoRelativo(ocorrencia.dataRegistro)}.
      </p>
    </article>
  );
}

/** Ponto de apoio escolhido no mapa (camada do pilar Segurança). */
function DetalhePonto({ ponto, rotulo, aoVoltar }) {
  const horario = ponto.aberto24h ? "24 horas" : `${ponto.abre} às ${ponto.fecha}`;
  return (
    <article className="mapa-detalhe" aria-labelledby="mapa-ponto-titulo">
      <button type="button" className="mapa-detalhe__voltar" onClick={aoVoltar}>
        <Icone nome="VOLTAR" tamanho={16} />
        Todas as ocorrências
      </button>
      <p className="mapa-detalhe__tipo">
        <Icone nome="SEGURANCA" tamanho={16} />
        {rotulo("tiposPontoApoio", ponto.tipo)}
      </p>
      <h2 id="mapa-ponto-titulo" className="mapa-detalhe__titulo">
        {ponto.nome}
      </h2>
      <p className="mapa-detalhe__risco">
        <span className={`ponto-apoio__estado ${ponto.abertoAgora ? "ponto-apoio__estado--aberto" : ""}`}>
          {ponto.abertoAgora ? "Aberto agora" : "Fechado agora"}
        </span>{" "}
        {horario}
      </p>
      <p className="mapa-detalhe__descricao">
        {ponto.bairro} · {ponto.zona}
      </p>
      <a className="botao botao--primario botao--pequeno" href={`tel:${ponto.telefone}`}>
        <Icone nome="TELEFONE" tamanho={16} />
        Ligar {ponto.telefone}
      </a>
      <p className="mapa-detalhe__quando">
        <a href="#/seguranca">Ver todos os pontos de apoio</a>
      </p>
    </article>
  );
}

/** Lugar de lazer escolhido no mapa (camada do pilar Lazer), com a programação dos próximos dias. */
function DetalheLugar({ lugar, eventos, rotulo, aoVoltar }) {
  const horario = lugar.aberto24h ? "24 horas" : `${lugar.abre} às ${lugar.fecha === "00:00" ? "meia-noite" : lugar.fecha}`;
  const rota = new URLSearchParams({ destino: lugar.nome, x: String(lugar.local.x), y: String(lugar.local.y) });
  return (
    <article className="mapa-detalhe" aria-labelledby="mapa-lugar-titulo">
      <button type="button" className="mapa-detalhe__voltar" onClick={aoVoltar}>
        <Icone nome="VOLTAR" tamanho={16} />
        Todas as ocorrências
      </button>
      <p className="mapa-detalhe__tipo">
        <Icone nome="LAZER" tamanho={16} />
        {rotulo("tiposLugarLazer", lugar.tipo)}
      </p>
      <h2 id="mapa-lugar-titulo" className="mapa-detalhe__titulo">
        {lugar.nome}
      </h2>
      <p className="mapa-detalhe__risco">
        <span className={`ponto-apoio__estado ${lugar.abertoAgora ? "ponto-apoio__estado--aberto" : ""}`}>
          {lugar.abertoAgora ? "Aberto agora" : "Fechado agora"}
        </span>{" "}
        {horario}
      </p>
      <p className="mapa-detalhe__descricao">
        {lugar.bairro} · {lugar.zona}
      </p>
      <h3 className="mapa-detalhe__subtitulo">Nos próximos 14 dias</h3>
      {eventos.length === 0 ? (
        <p className="mapa-detalhe__descricao">Nenhum evento marcado aqui.</p>
      ) : (
        <ul className="mapa-detalhe__eventos">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <strong>{evento.titulo}</strong>
              <span>
                {rotulo("categoriasEvento", evento.categoria)} · {formatarPeriodo(evento.inicio, evento.fim)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <a className="botao botao--primario botao--pequeno" href={`#/mobilidade/rota?${rota}`}>
        <Icone nome="MAPA" tamanho={16} />
        Como chegar
      </a>
      <p className="mapa-detalhe__quando">
        <a href="#/lazer">Ver toda a programação</a>
      </p>
    </article>
  );
}
