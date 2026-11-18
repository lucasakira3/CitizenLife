import { useState } from "react";
import { useApp } from "../../contexto.js";
import { formatarReais, ICONE_CANAL, ICONE_PROGRAMA } from "../../utils/habitacao.js";
import Icone from "../Icone.jsx";
import { SeloStatus } from "./PassosInscricao.jsx";

/**
 * Um programa de moradia. No cartão ficam o essencial (o que é, teto de renda e canal de inscrição);
 * ao abrir, quem tem direito, a lista de documentos para ir marcando e onde se inscrever.
 *
 * "rendaInformada" liga o aviso de teto de renda (quem decide é o Java: vem em programa.compativel).
 */
export default function CartaoPrograma({ programa, inscricao, rendaInformada, inscrevendo, aoInscrever }) {
  const { sessao, rotulo } = useApp();
  // Os documentos que a pessoa já tem em mãos. Fica só na tela: é um apoio para quem vai ao atendimento.
  const [prontos, setProntos] = useState(() => new Set());

  const documentos = programa.documentos;
  const temTeto = programa.rendaMaxima !== null;
  const foraDoTeto = rendaInformada && temTeto && programa.compativel === false;

  function alternar(documento) {
    setProntos((atuais) => {
      const novos = new Set(atuais);
      if (!novos.delete(documento)) {
        novos.add(documento);
      }
      return novos;
    });
  }

  return (
    <li className={`programa ${foraDoTeto ? "programa--fora" : ""}`}>
      <header className="programa__cabeca">
        <span className="programa__icone" aria-hidden="true">
          <Icone nome={ICONE_PROGRAMA[programa.tipo]} tamanho={22} />
        </span>
        <div>
          <p className="programa__tipo">{rotulo("tiposPrograma", programa.tipo)}</p>
          <h3 className="programa__nome">{programa.nome}</h3>
        </div>
      </header>

      <p className="programa__descricao">{programa.descricao}</p>

      <ul className="programa__etiquetas" aria-label="Resumo do programa">
        <li className="etiqueta-moradia">{temTeto ? `Renda até ${formatarReais(programa.rendaMaxima)}` : "Sem teto de renda"}</li>
        <li className="etiqueta-moradia">
          {ICONE_CANAL[programa.canal].map((nome) => (
            <Icone key={nome} nome={nome} tamanho={14} />
          ))}
          {rotulo("canaisPrograma", programa.canal)}
        </li>
        {rendaInformada && temTeto && (
          <li className={`etiqueta-moradia ${foraDoTeto ? "etiqueta-moradia--atencao" : "etiqueta-moradia--ok"}`}>
            <Icone nome={foraDoTeto ? "ALVO" : "CHECK"} tamanho={14} />
            {foraDoTeto ? "Renda acima do teto" : "Renda dentro do teto"}
          </li>
        )}
      </ul>

      <details className="programa__detalhes">
        <summary>Quem tem direito, documentos e onde se inscrever</summary>

        <div className="programa__corpo">
          <section>
            <h4>Quem tem direito</h4>
            <p>{programa.quemTemDireito}</p>
          </section>

          <section>
            <h4>
              Documentos
              <span className="programa__contagem">
                {prontos.size} de {documentos.length} prontos
              </span>
            </h4>
            <ul className="documentos">
              {documentos.map((documento) => (
                <li key={documento} className="documento">
                  <label>
                    <input type="checkbox" checked={prontos.has(documento)} onChange={() => alternar(documento)} />
                    <span>{documento}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div
              className="programa__progresso"
              role="progressbar"
              aria-label="Documentos prontos"
              aria-valuemin={0}
              aria-valuemax={documentos.length}
              aria-valuenow={prontos.size}
            >
              <span style={{ "--feito": documentos.length ? prontos.size / documentos.length : 0 }} />
            </div>
          </section>

          <section>
            <h4>Onde se inscrever</h4>
            <p>{programa.ondeInscrever}</p>
            {programa.site && (
              <a className="programa__site" href={programa.site} target="_blank" rel="noopener noreferrer">
                Site oficial
                <Icone nome="EXTERNO" tamanho={15} />
                <span className="visualmente-oculto"> (abre em outra aba)</span>
              </a>
            )}
          </section>
        </div>
      </details>

      <footer className="programa__rodape">
        {!sessao && (
          <a className="botao-texto" href="#/entrar">
            Entre para acompanhar a sua inscrição
          </a>
        )}
        {sessao && inscricao && (
          <>
            <SeloStatus status={inscricao.status} />
            <a className="botao-texto" href="#/perfil/habitacao/programas">
              Acompanhar no perfil
            </a>
          </>
        )}
        {sessao && !inscricao && (
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={() => aoInscrever(programa)}
            disabled={inscrevendo}
          >
            <Icone nome="CHECK" tamanho={16} />
            {inscrevendo ? "Registrando…" : "Já me inscrevi"}
          </button>
        )}
      </footer>
    </li>
  );
}
