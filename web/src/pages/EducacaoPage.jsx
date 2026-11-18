import { useMemo, useState } from "react";
import { Aviso, Vazio } from "../components/Estados.jsx";
import Icone from "../components/Icone.jsx";
import { useApp } from "../contexto.js";
import { useTitulo } from "../hooks/useTitulo.js";
import {
  alternarFavoritoEducacao,
  CATEGORIAS_EDUCACAO,
  GRUPOS_BENEFICIOS,
  ITENS_EDUCACAO_CENTRO,
  lerFavoritosEducacao,
} from "../utils/educacaoCentro.js";

const PREVIA_POR_CATEGORIA = 3;

function limpoParaTel(telefone) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  return digitos.length >= 3 ? `tel:${digitos}` : null;
}

export default function EducacaoPage() {
  useTitulo("Educação · Zona Central");
  const { sessao } = useApp();
  const idUsuario = sessao?.id ?? "visitante";

  // null = gaveta de benefícios recolhida; ou id do grupo aberto ("FINANCEIROS", "TECNOLOGICOS", "PESQUISA")
  const [abaBeneficioAberta, setAbaBeneficioAberta] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("TODAS");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [bairroAtivo, setBairroAtivo] = useState("TODOS");
  const [apenasGratuitos, setApenasGratuitos] = useState(false);
  const [apenasSalvos, setApenasSalvos] = useState(false);
  const [busca, setBusca] = useState("");
  const [favoritos, setFavoritos] = useState(() => lerFavoritosEducacao(idUsuario));
  const [aviso, setAviso] = useState(null);

  const grupoBeneficio = useMemo(
    () => GRUPOS_BENEFICIOS.find((g) => g.id === abaBeneficioAberta) ?? null,
    [abaBeneficioAberta],
  );

  const totalBeneficios = useMemo(
    () => GRUPOS_BENEFICIOS.reduce((soma, g) => soma + g.itens.length, 0),
    [],
  );

  const bairrosCentro = useMemo(() => {
    const unicos = new Set(ITENS_EDUCACAO_CENTRO.map((item) => item.bairro));
    return ["TODOS", ...Array.from(unicos).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, []);

  const contagemPorCategoria = useMemo(() => {
    const mapa = { TODAS: ITENS_EDUCACAO_CENTRO.length };
    CATEGORIAS_EDUCACAO.forEach((cat) => {
      mapa[cat.id] = ITENS_EDUCACAO_CENTRO.filter((item) => item.categoria === cat.id).length;
    });
    return mapa;
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ITENS_EDUCACAO_CENTRO.filter((item) => {
      if (categoriaAtiva !== "TODAS" && item.categoria !== categoriaAtiva) return false;
      if (bairroAtivo !== "TODOS" && item.bairro !== bairroAtivo) return false;
      if (apenasGratuitos && !item.gratuito) return false;
      if (apenasSalvos && !favoritos.includes(item.id)) return false;
      if (!termo) return true;
      const texto = [
        item.nome,
        item.rede,
        item.bairro,
        item.endereco,
        item.selo,
        ...(item.destaques ?? []),
        ...(item.beneficios ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return texto.includes(termo);
    });
  }, [categoriaAtiva, bairroAtivo, apenasGratuitos, apenasSalvos, busca, favoritos]);

  const categoriasVisiveis = useMemo(() => {
    if (categoriaAtiva !== "TODAS") {
      return CATEGORIAS_EDUCACAO.filter((cat) => cat.id === categoriaAtiva);
    }
    return CATEGORIAS_EDUCACAO.filter((cat) => itensFiltrados.some((item) => item.categoria === cat.id));
  }, [categoriaAtiva, itensFiltrados]);

  function alternarAbaBeneficio(idGrupo) {
    setAbaBeneficioAberta((atual) => (atual === idGrupo ? null : idGrupo));
  }

  function alternarExpansaoCategoria(idCat) {
    setCategoriasExpandidas((atual) => ({ ...atual, [idCat]: !atual[idCat] }));
  }

  function aoAlternarFavorito(item) {
    const { salvos, adicionado } = alternarFavoritoEducacao(idUsuario, item.id);
    setFavoritos(salvos);
    setAviso({
      tipo: "sucesso",
      texto: adicionado ? `"${item.nome}" salvo nos seus interesses.` : `"${item.nome}" removido dos seus interesses.`,
    });
  }

  function limparFiltros() {
    setCategoriaAtiva("TODAS");
    setBairroAtivo("TODOS");
    setApenasGratuitos(false);
    setApenasSalvos(false);
    setBusca("");
  }

  const temFiltroAtivo =
    categoriaAtiva !== "TODAS" ||
    bairroAtivo !== "TODOS" ||
    apenasGratuitos ||
    apenasSalvos ||
    busca.trim().length > 0;

  return (
    <div className="educacao-centro">
      <a className="voltar" href="#/">
        Todos os pilares
      </a>

      {/* Hero atrativo do Hub de Educação */}
      <section
        className="educacao-hero"
        aria-labelledby="educacao-titulo"
        style={{ "--cor-pilar": "var(--pilar-educacao)" }}
      >
        <div className="educacao-hero__principal">
          <span className="pilar-cabeca__icone educacao-cabeca__icone">
            <Icone nome="EDUCACAO" tamanho={36} />
          </span>
          <div>
            <p className="sobretitulo">Pilar · Educação </p>
            <h1 id="educacao-titulo">Educação</h1>
            <p className="lead">
              Da creche à universidade, cursos técnicos, idiomas, bibliotecas, museus e olimpíadas — com{" "}
              <mark className="grifo-gratuito">gratuidades</mark> e{" "}
              <mark className="grifo-beneficio">benefícios estudantis</mark> em um só lugar.
            </p>
          </div>
        </div>

        <ul className="educacao-hero__numeros" aria-label="Resumo do catálogo">
          <li>
            <strong>{ITENS_EDUCACAO_CENTRO.length}</strong>
            <span>Oportunidades mapeadas</span>
          </li>
          <li>
            <strong>{CATEGORIAS_EDUCACAO.length}</strong>
            <span>Áreas de ensino</span>
          </li>
          <li>
            <strong>{totalBeneficios}</strong>
            <span>Bolsas e benefícios</span>
          </li>
        </ul>
      </section>

      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      {/* Gaveta Expansível de Benefícios (Fechada por padrão, abre ao clicar na aba desejada) */}
      <section className="beneficios-gaveta" aria-labelledby="beneficios-titulo">
        <div className="beneficios-gaveta__barra">
          <div className="beneficios-gaveta__chamada">
            <span className="educacao-beneficios__etiqueta">Direitos do Estudante</span>
            <div>
              <h2 id="beneficios-titulo" className="beneficios-gaveta__titulo">
                Auxílios Financeiros, Softwares Gratuitos e Bolsas de Pesquisa
              </h2>
              <p className="beneficios-gaveta__resumo">
                Pé-de-Meia, ProUni, Bilhete Estudantil, GitHub Pack, Office 365, PIBIC e FAPESP — escolha uma aba para
                expandir:
              </p>
            </div>
          </div>

          <div className="beneficios-gaveta__botoes" role="tablist" aria-label="Expandir benefícios por categoria">
            {GRUPOS_BENEFICIOS.map((grupo) => {
              const aberta = abaBeneficioAberta === grupo.id;
              return (
                <button
                  key={grupo.id}
                  type="button"
                  role="tab"
                  aria-selected={aberta}
                  aria-expanded={aberta}
                  className={`botao-aba-beneficio ${aberta ? "botao-aba-beneficio--ativa" : ""}`}
                  onClick={() => alternarAbaBeneficio(grupo.id)}
                >
                  <span>{grupo.rotulo}</span>
                  <span className="botao-aba-beneficio__seta" aria-hidden="true">
                    {aberta ? "▴" : "▾"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {grupoBeneficio && (
          <div className="beneficios-gaveta__painel" role="region" aria-label={grupoBeneficio.rotulo}>
            <div className="beneficios-gaveta__painel-topo">
              <p className="beneficios-gaveta__painel-titulo">
                Mostrando: <strong>{grupoBeneficio.rotulo}</strong>
              </p>
              <button
                type="button"
                className="botao-texto"
                onClick={() => setAbaBeneficioAberta(null)}
              >
                Fechar janela de benefícios ✕
              </button>
            </div>

            <ul className="educacao-beneficios__colunas">
              {grupoBeneficio.itens.map((beneficio) => (
                <li key={beneficio.id} className="beneficio-mini">
                  <div className="beneficio-mini__topo">
                    <span className="selo-destaque selo-destaque--beneficio">{beneficio.selo}</span>
                  </div>
                  <h3 className="beneficio-mini__titulo">{beneficio.titulo}</h3>
                  <p className="beneficio-mini__valor">
                    <mark className="grifo-gratuito">{beneficio.valor}</mark>
                  </p>
                  <p className="beneficio-mini__resumo">{beneficio.resumo}</p>
                  <a
                    className="beneficio-mini__link"
                    href={beneficio.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {beneficio.rotuloUrl} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Barra de busca e filtros por categoria */}
      <section className="educacao-barra cartao" aria-label="Filtros de Educação">
        <div className="educacao-barra__controles">
          <input
            type="search"
            className="educacao-barra__busca"
            aria-label="Buscar curso, escola, biblioteca, competição ou bairro"
            placeholder="Buscar instituição, curso, museu, plataforma ou bairro (ex.: ETEC, USP, Inglês, CS50, OBMEP)…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="educacao-barra__select"
            aria-label="Filtrar por bairro do Centro"
            value={bairroAtivo}
            onChange={(e) => setBairroAtivo(e.target.value)}
          >
            {bairrosCentro.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro === "TODOS" ? "Todos os bairros do Centro" : bairro}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`chip-filtro chip-filtro--gratuito ${apenasGratuitos ? "chip-filtro--ativo" : ""}`}
            aria-pressed={apenasGratuitos}
            onClick={() => setApenasGratuitos((v) => !v)}
          >
            ✓ Gratuitos / Públicos
          </button>

          <button
            type="button"
            className={`chip-filtro ${apenasSalvos ? "chip-filtro--ativo" : ""}`}
            aria-pressed={apenasSalvos}
            onClick={() => setApenasSalvos((v) => !v)}
          >
            ★ Salvos ({favoritos.length})
          </button>

          {sessao && (
            <a className="botao-texto" href="#/perfil/educacao/interesses">
              Meus salvos no Perfil →
            </a>
          )}
        </div>

        <nav className="educacao-categorias" aria-label="Filtrar por categoria">
          <button
            type="button"
            className={`aba-categoria ${categoriaAtiva === "TODAS" ? "aba-categoria--ativa" : ""}`}
            aria-pressed={categoriaAtiva === "TODAS"}
            onClick={() => setCategoriaAtiva("TODAS")}
          >
            Todas ({contagemPorCategoria.TODAS})
          </button>
          {CATEGORIAS_EDUCACAO.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`aba-categoria ${categoriaAtiva === cat.id ? "aba-categoria--ativa" : ""}`}
              aria-pressed={categoriaAtiva === cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
            >
              {cat.rotulo} ({contagemPorCategoria[cat.id] ?? 0})
            </button>
          ))}
        </nav>
      </section>

      {/* Categorias no centro da tela com prévia de 3 cards e botão "Ver mais" para não poluir */}
      {itensFiltrados.length === 0 ? (
        <Vazio titulo="Nenhum resultado encontrado com esses filtros.">
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </Vazio>
      ) : (
        <div className="educacao-secoes">
          {categoriasVisiveis.map((categoria) => {
            const todosDaCategoria = itensFiltrados.filter((item) => item.categoria === categoria.id);
            if (todosDaCategoria.length === 0) return null;

            const expandida =
              temFiltroAtivo || Boolean(categoriasExpandidas[categoria.id]);
            const itensExibidos = expandida
              ? todosDaCategoria
              : todosDaCategoria.slice(0, PREVIA_POR_CATEGORIA);
            const ocultos = todosDaCategoria.length - itensExibidos.length;

            return (
              <section
                key={categoria.id}
                className="educacao-secao"
                aria-labelledby={`sec-${categoria.id}`}
              >
                <header className="educacao-secao__cabeca">
                  <div className="educacao-secao__titulo-bloco">
                    <span
                      className="educacao-secao__ponto"
                      style={{ background: categoria.corCapa }}
                      aria-hidden="true"
                    />
                    <div>
                      <h2 id={`sec-${categoria.id}`} className="educacao-secao__titulo">
                        {categoria.rotulo}
                      </h2>
                      <p className="educacao-secao__subtitulo">{categoria.subtitulo}</p>
                    </div>
                  </div>

                  <div className="educacao-secao__acoes">
                    <span className="perfil-contador">{todosDaCategoria.length} opções</span>
                    {!temFiltroAtivo && todosDaCategoria.length > PREVIA_POR_CATEGORIA && (
                      <button
                        type="button"
                        className="botao botao--secundario botao--pequeno"
                        aria-expanded={expandida}
                        onClick={() => alternarExpansaoCategoria(categoria.id)}
                      >
                        {expandida ? "Recolher ▴" : `Ver todas (+${ocultos}) ▾`}
                      </button>
                    )}
                  </div>
                </header>

                <ul className="educacao-grade-cards">
                  {itensExibidos.map((item) => {
                    const salvo = favoritos.includes(item.id);
                    const hrefTel = limpoParaTel(item.telefone);
                    return (
                      <li key={item.id} className="educacao-card">
                        {/* Foto de capa da instituição/categoria com selos sobrepostos */}
                        <div
                          className="educacao-card__capa"
                          style={{ background: categoria.corCapa }}
                        >
                          {item.imagem && (
                            <img
                              src={item.imagem}
                              alt={item.nome}
                              loading="lazy"
                              className="educacao-card__img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div className="educacao-card__capa-topo">
                            <span
                              className={`selo-destaque ${item.gratuito ? "selo-destaque--gratuito" : "selo-destaque--bolsa"
                                }`}
                            >
                              {item.selo}
                            </span>
                            <button
                              type="button"
                              className={`educacao-card__favorito ${salvo ? "educacao-card__favorito--ativo" : ""}`}
                              aria-pressed={salvo}
                              title={salvo ? "Remover dos salvos" : "Salvar nos meus interesses"}
                              onClick={() => aoAlternarFavorito(item)}
                            >
                              {salvo ? "★" : "☆"}
                            </button>
                          </div>
                          <span className="educacao-card__bairro">📍 {item.bairro}</span>
                        </div>

                        {/* Conteúdo enxuto do card */}
                        <div className="educacao-card__corpo">
                          <p className="educacao-card__rede">{item.rede}</p>
                          <h3 className="educacao-card__nome">{item.nome}</h3>

                          <ul className="educacao-card__tags" aria-label="Oferta">
                            {item.destaques.map((tag) => (
                              <li key={tag} className="tag-oferta">
                                {tag}
                              </li>
                            ))}
                          </ul>

                          <div className="educacao-card__beneficios">
                            {item.beneficios.map((ben) => (
                              <mark key={ben} className="grifo-item-beneficio">
                                ✓ {ben}
                              </mark>
                            ))}
                          </div>

                          <div className="educacao-card__info">
                            {item.endereco && <span>📍 {item.endereco}</span>}
                            {item.horario && <span>🕒 {item.horario}</span>}
                            {item.telefone && (
                              <span>
                                📞{" "}
                                {hrefTel ? (
                                  <a href={hrefTel} className="educacao-card__tel">
                                    {item.telefone}
                                  </a>
                                ) : (
                                  item.telefone
                                )}
                              </span>
                            )}
                          </div>

                          <div className="educacao-card__rodape">
                            <a
                              className="botao botao--primario botao--pequeno educacao-card__link"
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.rotuloUrl} ↗
                            </a>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
