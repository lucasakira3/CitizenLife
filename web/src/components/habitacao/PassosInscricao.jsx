import { useApp } from "../../contexto.js";
import { ICONE_STATUS } from "../../utils/habitacao.js";
import Icone from "../Icone.jsx";

/**
 * Os três passos de uma inscrição (inscrito → em análise → aprovado), com o atual em destaque.
 * Sem "aoEscolher" é só leitura; com ele, cada passo vira um botão que muda o status com um toque.
 */
export default function PassosInscricao({ status, aoEscolher, desabilitado = false }) {
  const { dominio } = useApp();
  const atual = dominio.statusInscricao.findIndex((passo) => passo.codigo === status);

  return (
    <ol className={`passos passos--${status}`} aria-label="Andamento da inscrição">
      {dominio.statusInscricao.map((passo, indice) => {
        const estado = indice < atual ? "feito" : indice === atual ? "atual" : "adiante";
        const conteudo = (
          <>
            <span className="passo__marca" aria-hidden="true">
              <Icone nome={estado === "feito" ? "CHECK" : ICONE_STATUS[passo.codigo]} tamanho={16} />
            </span>
            <span className="passo__nome">{passo.rotulo}</span>
          </>
        );

        return (
          <li key={passo.codigo} className={`passo passo--${estado}`} aria-current={estado === "atual" ? "step" : undefined}>
            {aoEscolher ? (
              <button
                type="button"
                className="passo__corpo passo__corpo--botao"
                onClick={() => aoEscolher(passo.codigo)}
                disabled={desabilitado}
                aria-label={estado === "atual" ? `${passo.rotulo} (etapa atual)` : `Marcar como ${passo.rotulo.toLowerCase()}`}
              >
                {conteudo}
              </button>
            ) : (
              <span className="passo__corpo">
                {conteudo}
                {estado === "atual" && <span className="visualmente-oculto"> (etapa atual)</span>}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Selo pequeno com o status (cor e ícone mudam a cada etapa). */
export function SeloStatus({ status }) {
  const { rotulo } = useApp();
  return (
    <span className={`status-selo status-selo--${status}`}>
      <Icone nome={ICONE_STATUS[status]} tamanho={14} />
      {rotulo("statusInscricao", status)}
    </span>
  );
}
