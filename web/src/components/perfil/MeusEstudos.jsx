import { useMemo, useState } from "react";
import { useApp } from "../../contexto.js";
import {
  alternarFavoritoEducacao,
  BENEFICIOS_EDUCACIONAIS,
  CATEGORIAS_EDUCACAO,
  ITENS_EDUCACAO_CENTRO,
  lerFavoritosEducacao,
} from "../../utils/educacaoCentro.js";
import { Vazio } from "../Estados.jsx";
import IntroAba from "./IntroAba.jsx";

/** Educação › Meus interesses: escolas, cursos, bibliotecas e workshops salvos pelo cidadão no Centro. */
export default function MeusEstudos({ setAviso }) {
  const { sessao } = useApp();
  const idUsuario = sessao?.id ?? "visitante";
  const [favoritos, setFavoritos] = useState(() => lerFavoritosEducacao(idUsuario));

  const rotuloCategoria = useMemo(
    () => Object.fromEntries(CATEGORIAS_EDUCACAO.map((c) => [c.id, c.rotulo])),
    [],
  );

  const salvos = useMemo(
    () => ITENS_EDUCACAO_CENTRO.filter((item) => favoritos.includes(item.id)),
    [favoritos],
  );

  function remover(item) {
    const { salvos: proximos } = alternarFavoritoEducacao(idUsuario, item.id);
    setFavoritos(proximos);
    setAviso?.({ tipo: "sucesso", texto: `"${item.nome}" removido dos seus interesses.` });
  }

  return (
    <>
      <IntroAba descricao="Instituições, cursos e bibliotecas que você salvou na Zona Central.">
        <a className="botao botao--secundario botao--pequeno" href="#/educacao">
          Ver quadro de Educação
        </a>
      </IntroAba>

      <h2 className="perfil-subtitulo">
        Meus locais e cursos salvos <span className="perfil-contador">{salvos.length}</span>
      </h2>

      {salvos.length === 0 ? (
        <Vazio titulo="Você ainda não salvou nenhuma instituição ou curso.">
          <a className="botao botao--primario botao--pequeno" href="#/educacao">
            Explorar oportunidades no Centro
          </a>
        </Vazio>
      ) : (
        <ul className="cartoes-perfil">
          {salvos.map((item) => (
            <li key={item.id} className="cartao-perfil">
              <div className="rotas-salvas__cabeca">
                <span className="rotas-salvas__nome">{item.nome}</span>
                <span className="rotas-salvas__livre">{rotuloCategoria[item.categoria] ?? item.categoria}</span>
              </div>
              <p className="rotas-salvas__meta" style={{ margin: "0.3rem 0" }}>
                <mark className="grifo-gratuito">{item.selo}</mark> · {item.bairro}
              </p>
              <p className="rotas-salvas__meta">
                📍 {item.endereco}
              </p>
              <div className="acoes acoes--linha" style={{ marginTop: "0.65rem" }}>
                <a
                  className="botao botao--primario botao--pequeno"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.rotuloUrl} ↗
                </a>
                <button type="button" className="botao-texto botao-texto--perigo" onClick={() => remover(item)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="perfil-bloco">
        <h2 className="perfil-subtitulo">Links diretos de benefícios estudantis</h2>
        <ul className="cartoes-perfil">
          {BENEFICIOS_EDUCACIONAIS.map((beneficio) => (
            <li key={beneficio.id} className="cartao-perfil">
              <div className="rotas-salvas__cabeca">
                <span className="rotas-salvas__nome">{beneficio.titulo}</span>
                <span className="rotas-salvas__livre">{beneficio.selo}</span>
              </div>
              <p className="rotas-salvas__meta" style={{ margin: "0.3rem 0" }}>
                <mark className="grifo-beneficio">{beneficio.valor}</mark> — {beneficio.resumo}
              </p>
              <a
                className="botao-texto"
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
    </>
  );
}
