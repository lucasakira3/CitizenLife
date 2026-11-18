import { useEffect, useState } from "react";
import { Aviso, Carregando, ErroCarga, Vazio } from "../components/Estados.jsx";
import Campo from "../components/Campo.jsx";
import CartaoPrograma from "../components/habitacao/CartaoPrograma.jsx";
import Icone from "../components/Icone.jsx";
import { useApp } from "../contexto.js";
import { useCarregar } from "../hooks/useCarregar.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { api, consulta } from "../services/api.js";
import { formatarReais, ICONE_PROGRAMA, lerRenda } from "../utils/habitacao.js";

/**
 * Habitação › Programas de moradia: Minha Casa Minha Vida, aluguel social, regularização e outros,
 * com quem tem direito, os documentos e onde se inscrever. O filtro de renda é feito pela API (Java).
 */
export default function HabitacaoPage() {
  useTitulo("Habitação");
  const { sessao, dominio } = useApp();
  const [tipo, setTipo] = useState("");
  const [rendaTexto, setRendaTexto] = useState("");
  const [rendaAplicada, setRendaAplicada] = useState("");
  const [aviso, setAviso] = useState(null);
  const [inscrevendo, setInscrevendo] = useState(null);

  const leituraRenda = lerRenda(rendaTexto);

  // Espera a pessoa parar de digitar antes de consultar a renda na API
  useEffect(() => {
    const { valor, erro } = lerRenda(rendaTexto);
    const espera = setTimeout(() => setRendaAplicada(erro ? "" : valor), 450);
    return () => clearTimeout(espera);
  }, [rendaTexto]);

  const programas = useCarregar(
    () => api.buscar(`/programas-moradia${consulta({ tipo, renda: rendaAplicada })}`),
    [tipo, rendaAplicada],
  );
  const inscricoes = useCarregar(
    () => (sessao ? api.buscar(`/cidadaos/${sessao.id}/inscricoes`) : Promise.resolve([])),
    [sessao?.id],
  );

  const lista = programas.dados ?? [];
  const minhas = inscricoes.dados ?? [];
  const inscricaoDoPrograma = new Map(minhas.map((item) => [item.programa.id, item]));
  const dentroDoTeto = lista.filter((programa) => programa.rendaMaxima !== null && programa.compativel).length;

  async function inscrever(programa) {
    setInscrevendo(programa.id);
    try {
      await api.criar(`/cidadaos/${sessao.id}/inscricoes`, { idPrograma: programa.id });
      inscricoes.recarregar();
      setAviso({
        tipo: "sucesso",
        texto: `Inscrição em "${programa.nome}" registrada. Atualize o andamento em Meu perfil › Habitação.`,
      });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setInscrevendo(null);
    }
  }

  return (
    <>
      <a className="voltar" href="#/">
        Todos os pilares
      </a>

      <section
        className="pilar-cabeca"
        aria-labelledby="habitacao-titulo"
        style={{ "--cor-pilar": "var(--pilar-habitacao)" }}
      >
        <span className="pilar-cabeca__icone">
          <Icone nome="HABITACAO" tamanho={34} />
        </span>
        <div>
          <p className="sobretitulo">Pilar · Habitação</p>
          <h1 id="habitacao-titulo">Programas de moradia</h1>
          <p className="lead">
            Casa própria, aluguel social, regularização e outros apoios: quem tem direito, quais documentos levar e onde
            se inscrever.
          </p>
        </div>
      </section>

      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      {sessao && minhas.length > 0 && <ResumoInscricoes inscricoes={minhas} />}

      <section className="filtro-moradia" aria-label="Filtrar programas">
        <fieldset className="tipos-endereco filtro-moradia__tipos">
          <legend className="visualmente-oculto">Tipo de programa</legend>
          <div className="tipos-endereco__opcoes">
            <label className="tipo-endereco">
              <input type="radio" name="tipo-programa" checked={tipo === ""} onChange={() => setTipo("")} />
              <span>
                <Icone nome="RESUMO" tamanho={18} />
                Todos
              </span>
            </label>
            {dominio.tiposPrograma.map((item) => (
              <label key={item.codigo} className="tipo-endereco">
                <input
                  type="radio"
                  name="tipo-programa"
                  checked={tipo === item.codigo}
                  onChange={() => setTipo(item.codigo)}
                />
                <span>
                  <Icone nome={ICONE_PROGRAMA[item.codigo]} tamanho={18} />
                  {item.rotulo}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Campo
          id="renda-familiar"
          rotulo="Renda familiar por mês"
          opcional
          erro={rendaTexto && leituraRenda.erro}
          dica="Some a renda de quem mora com você. Mostramos o que está dentro do teto."
          className="filtro-moradia__renda"
        >
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 2.500"
            maxLength={14}
            value={rendaTexto}
            onChange={(evento) => setRendaTexto(evento.target.value)}
          />
        </Campo>
      </section>

      <section className="perfil-bloco" aria-labelledby="programas-titulo">
        <h2 id="programas-titulo" className="visualmente-oculto">
          Programas encontrados
        </h2>

        {programas.carregando && !programas.dados && <Carregando texto="Carregando programas…" />}
        {programas.erro && <ErroCarga erro={programas.erro} aoTentar={programas.recarregar} />}
        {programas.dados && lista.length === 0 && <Vazio titulo="Nenhum programa encontrado para este filtro." />}

        {lista.length > 0 && (
          <p className="programas__contagem" aria-live="polite">
            {lista.length} {lista.length === 1 ? "programa" : "programas"}
            {rendaAplicada && ` · ${dentroDoTeto} com a renda de ${formatarReais(Number(rendaAplicada))} dentro do teto`}
          </p>
        )}

        <ul className="programas">
          {lista.map((programa) => (
            <CartaoPrograma
              key={programa.id}
              programa={programa}
              inscricao={inscricaoDoPrograma.get(programa.id)}
              rendaInformada={Boolean(rendaAplicada)}
              inscrevendo={inscrevendo === programa.id}
              aoInscrever={inscrever}
            />
          ))}
        </ul>

        <p className="texto-apoio programas__aviso">
          Regras, valores e prazos mudam. Confirme no site oficial do programa antes de ir ao atendimento. O teto de renda
          ajuda a se orientar, mas quem decide é o órgão responsável.
        </p>
      </section>
    </>
  );
}

/** Faixa no topo para quem já registrou inscrições: quantas estão em cada etapa e o atalho para o perfil. */
function ResumoInscricoes({ inscricoes }) {
  const { dominio } = useApp();
  return (
    <a className="habitacao-resumo" href="#/perfil/habitacao/programas">
      <span className="habitacao-resumo__titulo">
        <Icone nome="DOCUMENTO" tamanho={18} />
        Suas inscrições
      </span>
      <span className="habitacao-resumo__etapas">
        {dominio.statusInscricao.map((status) => {
          const total = inscricoes.filter((item) => item.status === status.codigo).length;
          return total > 0 ? (
            <span key={status.codigo} className={`status-selo status-selo--${status.codigo}`}>
              {total} {status.rotulo.toLowerCase()}
            </span>
          ) : null;
        })}
      </span>
      <span className="habitacao-resumo__acao">
        Abrir meus programas
        <Icone nome="SETA" tamanho={16} />
      </span>
    </a>
  );
}
