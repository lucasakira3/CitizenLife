import { useState } from "react";
import { useApp } from "../../contexto.js";
import { useCarregar } from "../../hooks/useCarregar.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { api } from "../../services/api.js";
import { tempoRelativo } from "../../utils/formato.js";
import { ICONE_PROGRAMA, ICONE_STATUS } from "../../utils/habitacao.js";
import { criarValidador } from "../../utils/validacao.js";
import Campo from "../Campo.jsx";
import { Aviso, Carregando, ErroCarga, Vazio } from "../Estados.jsx";
import PassosInscricao from "../habitacao/PassosInscricao.jsx";
import Icone from "../Icone.jsx";
import IntroAba from "./IntroAba.jsx";

/** Habitação › Meus programas: as inscrições do cidadão e o andamento de cada uma (CRUD). */
export default function MinhasInscricoes({ setAviso }) {
  const { sessao, dominio, rotulo } = useApp();
  const inscricoes = useCarregar(() => api.buscar(`/cidadaos/${sessao.id}/inscricoes`), [sessao.id]);
  const programas = useCarregar(() => api.buscar("/programas-moradia"), []);
  // null: só a lista; "novo": formulário vazio; uma inscrição: formulário de edição
  const [editando, setEditando] = useState(null);
  const [atualizando, setAtualizando] = useState(null);

  const lista = inscricoes.dados ?? [];
  const jaInscritos = new Set(lista.map((item) => item.programa.id));
  const disponiveis = (programas.dados ?? []).filter((programa) => !jaInscritos.has(programa.id));

  function aposSalvar(texto) {
    setEditando(null);
    setAviso({ tipo: "sucesso", texto });
    inscricoes.recarregar();
  }

  // Um toque no passo salva o novo status, como em "Como me locomovo"
  async function mudarStatus(inscricao, status) {
    if (status === inscricao.status || atualizando !== null) return;
    setAtualizando(inscricao.id);
    try {
      await api.atualizar(`/cidadaos/${sessao.id}/inscricoes/${inscricao.id}`, {
        status,
        protocolo: inscricao.protocolo,
        observacao: inscricao.observacao,
      });
      setAviso({ tipo: "sucesso", texto: `"${inscricao.programa.nome}" agora está como ${rotulo("statusInscricao", status).toLowerCase()}.` });
      inscricoes.recarregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    } finally {
      setAtualizando(null);
    }
  }

  async function excluir(inscricao) {
    if (!window.confirm(`Remover a inscrição em "${inscricao.programa.nome}"?`)) return;
    try {
      await api.excluir(`/cidadaos/${sessao.id}/inscricoes/${inscricao.id}`);
      setAviso({ tipo: "sucesso", texto: "Inscrição removida." });
      inscricoes.recarregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  return (
    <>
      <IntroAba descricao="Registre os programas em que você se inscreveu e acompanhe em que etapa cada um está.">
        {editando === null && (
          <button
            type="button"
            className="botao botao--primario"
            onClick={() => setEditando("novo")}
            disabled={programas.carregando || disponiveis.length === 0}
          >
            <Icone nome="MAIS" tamanho={18} />
            Registrar inscrição
          </button>
        )}
      </IntroAba>

      <div className="quadros quadros--status">
        {dominio.statusInscricao.map((status) => (
          <div key={status.codigo} className="quadro">
            <span className="quadro__rotulo">{status.rotulo}</span>
            <span className="quadro__valor">
              {inscricoes.dados ? lista.filter((item) => item.status === status.codigo).length : "…"}
              <span className="quadro__icones">
                <Icone nome={ICONE_STATUS[status.codigo]} tamanho={18} />
              </span>
            </span>
          </div>
        ))}
      </div>

      {editando !== null && (
        <FormularioInscricao
          inscricao={editando === "novo" ? null : editando}
          disponiveis={disponiveis}
          aoSalvar={aposSalvar}
          aoCancelar={() => setEditando(null)}
        />
      )}

      {inscricoes.carregando && !inscricoes.dados && <Carregando texto="Carregando suas inscrições…" />}
      {inscricoes.erro && <ErroCarga erro={inscricoes.erro} aoTentar={inscricoes.recarregar} />}
      {inscricoes.dados && lista.length === 0 && editando === null && (
        <Vazio titulo="Você ainda não registrou nenhuma inscrição.">
          <p>Veja os programas, descubra quem tem direito e volte aqui para acompanhar.</p>
          <a className="botao botao--secundario" href="#/habitacao">
            Ver programas de moradia
          </a>
        </Vazio>
      )}

      <ul className="cartoes-perfil inscricoes">
        {lista.map((inscricao) => {
          const programa = inscricao.programa;
          const dica = dominio.statusInscricao.find((item) => item.codigo === inscricao.status)?.dica;
          return (
            <li key={inscricao.id} className="cartao-perfil inscricao">
              <header className="programa__cabeca">
                <span className="programa__icone" aria-hidden="true">
                  <Icone nome={ICONE_PROGRAMA[programa.tipo]} tamanho={22} />
                </span>
                <div>
                  <p className="programa__tipo">{rotulo("tiposPrograma", programa.tipo)}</p>
                  <h3 className="programa__nome">{programa.nome}</h3>
                </div>
              </header>

              <PassosInscricao
                status={inscricao.status}
                aoEscolher={(status) => mudarStatus(inscricao, status)}
                desabilitado={atualizando === inscricao.id}
              />
              <p className="texto-apoio inscricao__legenda">Toque numa etapa para atualizar o andamento.</p>

              <dl className="inscricao__dados">
                <div>
                  <dt>Protocolo</dt>
                  <dd className="inscricao__protocolo">{inscricao.protocolo ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt>Inscrição</dt>
                  <dd>{tempoRelativo(inscricao.dataInscricao)}</dd>
                </div>
                <div>
                  <dt>Atualizado</dt>
                  <dd>{tempoRelativo(inscricao.dataAtualizacao)}</dd>
                </div>
              </dl>

              {inscricao.observacao && <p className="inscricao__obs">{inscricao.observacao}</p>}
              {dica && (
                <p className="inscricao__dica">
                  <Icone nome="ESCUDO" tamanho={16} />
                  {dica}
                </p>
              )}

              <div className="acoes acoes--linha">
                <button type="button" className="botao-texto" onClick={() => setEditando(inscricao)}>
                  Editar<span className="visualmente-oculto"> {programa.nome}</span>
                </button>
                <button type="button" className="botao-texto botao-texto--perigo" onClick={() => excluir(inscricao)}>
                  Remover<span className="visualmente-oculto"> {programa.nome}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function FormularioInscricao({ inscricao, disponiveis, aoSalvar, aoCancelar }) {
  const { sessao, dominio } = useApp();
  const form = useFormulario({
    idPrograma: "",
    status: inscricao?.status ?? "INSCRITO",
    protocolo: inscricao?.protocolo ?? "",
    observacao: inscricao?.observacao ?? "",
  });

  async function salvar(evento) {
    evento.preventDefault();
    const ok = await form.enviar(
      (valores) => {
        const validador = criarValidador();
        if (!inscricao) validador.escolha("idPrograma", valores.idPrograma, "Escolha o programa.");
        validador.escolha("status", valores.status, "Escolha o status da inscrição.");
        const protocolo = valores.protocolo.trim();
        if (protocolo) {
          validador.exigir(protocolo.length >= 3 && protocolo.length <= 30, "protocolo", "O protocolo precisa ter de 3 a 30 caracteres.");
          validador.exigir(/^[A-Za-z0-9./_-]+$/.test(protocolo), "protocolo", "Use só letras, números, ponto, barra e hífen no protocolo.");
        }
        validador.exigir(valores.observacao.trim().length <= 200, "observacao", "A observação pode ter no máximo 200 caracteres.");
        return validador.erros;
      },
      (valores) => {
        const corpo = { status: valores.status, protocolo: valores.protocolo.trim(), observacao: valores.observacao.trim() };
        return inscricao
          ? api.atualizar(`/cidadaos/${sessao.id}/inscricoes/${inscricao.id}`, corpo)
          : api.criar(`/cidadaos/${sessao.id}/inscricoes`, { ...corpo, idPrograma: Number(valores.idPrograma) });
      },
    );
    if (ok) aoSalvar(inscricao ? "Inscrição atualizada." : "Inscrição registrada.");
  }

  return (
    <form className="cartao-perfil inscricao-form formulario" onSubmit={salvar} noValidate>
      <h2 className="perfil-subtitulo">{inscricao ? `Editar "${inscricao.programa.nome}"` : "Registrar inscrição"}</h2>
      <Aviso aviso={form.aviso} />

      {!inscricao && (
        <Campo id="inscricao-programa" rotulo="Programa" erro={form.erros.idPrograma}>
          <select value={form.valores.idPrograma} onChange={form.alterar("idPrograma")}>
            <option value="">Escolha um programa</option>
            {dominio.tiposPrograma.map((tipo) => {
              const itens = disponiveis.filter((programa) => programa.tipo === tipo.codigo);
              return itens.length > 0 ? (
                <optgroup key={tipo.codigo} label={tipo.rotulo}>
                  {itens.map((programa) => (
                    <option key={programa.id} value={programa.id}>
                      {programa.nome}
                    </option>
                  ))}
                </optgroup>
              ) : null;
            })}
          </select>
        </Campo>
      )}

      <fieldset className={`campo tipos-endereco ${form.erros.status ? "campo--erro" : ""}`}>
        <legend className="campo__rotulo">Em que etapa está</legend>
        <div className="tipos-endereco__opcoes">
          {dominio.statusInscricao.map((status) => (
            <label key={status.codigo} className="tipo-endereco">
              <input
                type="radio"
                name="status-inscricao"
                checked={form.valores.status === status.codigo}
                onChange={() => form.definir("status", status.codigo)}
              />
              <span>
                <Icone nome={ICONE_STATUS[status.codigo]} tamanho={18} />
                {status.rotulo}
              </span>
            </label>
          ))}
        </div>
        {form.erros.status && <p className="campo__erro">{form.erros.status}</p>}
      </fieldset>

      <Campo id="inscricao-protocolo" rotulo="Número do protocolo" opcional erro={form.erros.protocolo} dica="Está no comprovante da inscrição.">
        <input type="text" maxLength={30} value={form.valores.protocolo} onChange={form.alterar("protocolo")} />
      </Campo>

      <Campo id="inscricao-obs" rotulo="Observação" opcional erro={form.erros.observacao} dica={`${form.valores.observacao.length}/200`}>
        <textarea rows={3} maxLength={200} value={form.valores.observacao} onChange={form.alterar("observacao")} />
      </Campo>

      <div className="acoes">
        <button type="submit" className="botao botao--primario" disabled={form.enviando}>
          {form.enviando ? "Salvando…" : "Salvar inscrição"}
        </button>
        <button type="button" className="botao botao--discreto" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
