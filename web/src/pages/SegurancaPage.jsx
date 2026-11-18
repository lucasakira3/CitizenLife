import { useRef, useState } from "react";
import Icone from "../components/Icone.jsx";
import Paginacao from "../components/Paginacao.jsx";
import { Carregando, ErroCarga, Vazio } from "../components/Estados.jsx";
import { useApp } from "../contexto.js";
import { useCarregar } from "../hooks/useCarregar.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { api, consulta } from "../services/api.js";
import { formatarDistancia } from "../utils/formato.js";

/** Pontos de apoio por página: duas fileiras de três no computador. */
const POR_PAGINA = 6;

/** Pilar Segurança: telefones de emergência, os pontos de apoio mais perto de casa e a lista com filtros. */
export default function SegurancaPage() {
  useTitulo("Segurança");
  const { sessao, dominio } = useApp();
  const [zona, setZona] = useState("");
  const [tipo, setTipo] = useState("");
  const [abertoAgora, setAbertoAgora] = useState(false);
  const [pagina, setPagina] = useState(1);
  const refLista = useRef(null);

  // Trocar um filtro volta para a primeira página
  function filtrar(definir) {
    return (valor) => {
      definir(valor);
      setPagina(1);
    };
  }
  const mudarZona = filtrar(setZona);
  const mudarTipo = filtrar(setTipo);
  const mudarAberto = filtrar(setAbertoAgora);

  function irParaPagina(numero) {
    setPagina(numero);
    refLista.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pontos = useCarregar(() => api.buscar(`/pontos-apoio${consulta({ zona, tipo, abertoAgora })}`), [zona, tipo, abertoAgora]);
  const proximos = useCarregar(
    () => (sessao ? api.buscar(`/cidadaos/${sessao.id}/pontos-proximos`) : Promise.resolve(null)),
    [sessao?.id],
  );

  const lista = pontos.dados ?? [];
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const daPagina = lista.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <>
      <a className="voltar" href="#/">
        Todos os pilares
      </a>

      <section className="pilar-cabeca" aria-labelledby="seguranca-titulo" style={{ "--cor-pilar": "var(--pilar-seguranca)" }}>
        <span className="pilar-cabeca__icone">
          <Icone nome="SEGURANCA" tamanho={34} />
        </span>
        <div>
          <p className="sobretitulo">Pilar · Segurança</p>
          <h1 id="seguranca-titulo">Onde pedir ajuda perto de você</h1>
          <p className="lead">Delegacias, bases da polícia e da guarda, saúde 24h e acolhimento, com o que está aberto agora.</p>
        </div>
      </section>

      <section className="emergencia" aria-labelledby="emergencia-titulo">
        <h2 id="emergencia-titulo" className="emergencia__titulo">
          <Icone nome="TELEFONE" tamanho={20} />
          Em perigo agora? Ligue.
        </h2>
        <ul className="emergencia__numeros">
          {dominio.telefonesEmergencia.map((item) => (
            <li key={item.numero}>
              <a className="emergencia__numero" href={`tel:${item.numero}`}>
                <span className="emergencia__digitos">{item.numero}</span>
                <span className="emergencia__rotulo">{item.rotulo}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {sessao && <PertoDeCasa proximos={proximos} />}

      <section className="perfil-bloco" aria-labelledby="pontos-titulo" ref={refLista}>
        <h2 id="pontos-titulo" className="perfil-subtitulo">Pontos de apoio</h2>

        <div className="filtros-seguranca">
          <div className="filtro-chips" role="group" aria-label="Filtrar por zona">
            <button type="button" aria-pressed={!zona} onClick={() => mudarZona("")}>
              Toda a cidade
            </button>
            {dominio.zonas.map((nome) => (
              <button key={nome} type="button" aria-pressed={zona === nome} onClick={() => mudarZona(zona === nome ? "" : nome)}>
                {nome}
              </button>
            ))}
          </div>
          <div className="filtro-chips" role="group" aria-label="Filtrar por tipo">
            <button type="button" aria-pressed={!tipo} onClick={() => mudarTipo("")}>
              Todos os tipos
            </button>
            {dominio.tiposPontoApoio.map((item) => (
              <button
                key={item.codigo}
                type="button"
                aria-pressed={tipo === item.codigo}
                onClick={() => mudarTipo(tipo === item.codigo ? "" : item.codigo)}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
          <label className="filtro-aberto">
            <input type="checkbox" checked={abertoAgora} onChange={(evento) => mudarAberto(evento.target.checked)} />
            Só o que está aberto agora
          </label>
        </div>

        {pontos.carregando && !pontos.dados && <Carregando texto="Carregando pontos de apoio…" />}
        {pontos.erro && <ErroCarga erro={pontos.erro} aoTentar={pontos.recarregar} />}
        {pontos.dados && (
          <p className="filtro-conta" role="status">
            {pontos.dados.length} {pontos.dados.length === 1 ? "ponto de apoio" : "pontos de apoio"}
            {totalPaginas > 1 && <> · página {paginaAtual} de {totalPaginas}</>}
          </p>
        )}
        {pontos.dados && pontos.dados.length === 0 && <Vazio titulo="Nenhum ponto de apoio com estes filtros." />}

        <ul className="cartoes-perfil">
          {daPagina.map((ponto) => (
            <li key={ponto.id}>
              <CartaoPonto ponto={ponto} />
            </li>
          ))}
        </ul>
        <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} aoMudar={irParaPagina} rotulo="Páginas dos pontos de apoio" />
      </section>
    </>
  );
}

/** Os três pontos de apoio mais perto da casa do cidadão (ou do primeiro endereço salvo). */
function PertoDeCasa({ proximos }) {
  return (
    <section className="perfil-bloco" aria-labelledby="perto-titulo">
      <h2 id="perto-titulo" className="perfil-subtitulo">Mais perto de você</h2>
      {proximos.carregando && !proximos.dados && <Carregando texto="Procurando o que fica perto de você…" />}
      {proximos.erro && <ErroCarga erro={proximos.erro} aoTentar={proximos.recarregar} />}
      {!proximos.carregando && !proximos.erro && !proximos.dados && (
        <Vazio titulo="Salve o endereço da sua casa para ver o que fica mais perto.">
          <a className="botao botao--secundario botao--pequeno" href="#/perfil/mobilidade/enderecos">
            Salvar endereço
          </a>
        </Vazio>
      )}
      {proximos.dados && (
        <>
          <p className="texto-apoio">
            A partir de <strong>{proximos.dados.referencia.apelido}</strong> ({proximos.dados.referencia.local.descricao}),
            em linha reta.
          </p>
          <ul className="cartoes-perfil">
            {proximos.dados.pontos.map((ponto) => (
              <li key={ponto.id}>
                <CartaoPonto ponto={ponto} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function CartaoPonto({ ponto }) {
  const { dominio, rotulo } = useApp();
  const tipo = dominio.tiposPontoApoio.find((item) => item.codigo === ponto.tipo);
  const horario = ponto.aberto24h ? "24 horas" : `${ponto.abre} às ${ponto.fecha}`;

  return (
    <article className="cartao-perfil ponto-apoio">
      <div className="ponto-apoio__cabeca">
        <span className={`ponto-apoio__icone ponto-apoio__icone--${ponto.tipo}`} aria-hidden="true">
          <Icone nome={tipo?.icone ?? "ESCUDO"} tamanho={20} />
        </span>
        <div className="ponto-apoio__texto">
          <p className="ponto-apoio__tipo">{rotulo("tiposPontoApoio", ponto.tipo)}</p>
          <h3 className="ponto-apoio__nome">{ponto.nome}</h3>
        </div>
        <span className={`ponto-apoio__estado ${ponto.abertoAgora ? "ponto-apoio__estado--aberto" : ""}`}>
          {ponto.abertoAgora ? "Aberto agora" : "Fechado"}
        </span>
      </div>
      <p className="rotas-salvas__meta">
        <Icone nome="PIN" tamanho={14} /> {ponto.bairro} · {ponto.zona}
        {ponto.distanciaMetros !== undefined && <> · {formatarDistancia(ponto.distanciaMetros)}</>}
      </p>
      <p className="rotas-salvas__meta">
        <Icone nome="RELOGIO" tamanho={14} /> {horario}
      </p>
      <div className="ponto-apoio__acoes">
        <a className="botao botao--secundario botao--pequeno" href={`tel:${ponto.telefone}`}>
          <Icone nome="TELEFONE" tamanho={16} />
          Ligar {ponto.telefone}
        </a>
        <a className="botao botao--secundario botao--pequeno" href={linkDoMapa(ponto)}>
          <Icone nome="MAPA" tamanho={16} />
          Ver no mapa
        </a>
      </div>
    </article>
  );
}

/** Abre o planejador de rota com o ponto de apoio como destino (a saída é a casa, se estiver salva). */
function linkDoMapa(ponto) {
  const busca = new URLSearchParams({ destino: ponto.nome, x: String(ponto.local.x), y: String(ponto.local.y) });
  return `#/mobilidade/rota?${busca}`;
}
