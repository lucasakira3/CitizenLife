import { useState } from "react";
import { useApp } from "../../contexto.js";
import { useCarregar } from "../../hooks/useCarregar.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { api } from "../../services/api.js";
import { criarValidador } from "../../utils/validacao.js";
import Campo from "../Campo.jsx";
import { Aviso, Carregando, ErroCarga, Vazio } from "../Estados.jsx";
import Icone from "../Icone.jsx";
import IntroAba from "./IntroAba.jsx";

/** Segurança › Contatos de emergência: quem avisar quando algo acontecer (CRUD). */
export default function MeusContatos({ setAviso }) {
  const { sessao, dominio } = useApp();
  const contatos = useCarregar(() => api.buscar(`/cidadaos/${sessao.id}/contatos`), [sessao.id]);
  // null: só a lista; "novo": formulário vazio; um contato: formulário de edição
  const [editando, setEditando] = useState(null);
  const lista = contatos.dados ?? [];
  const cheio = lista.length >= dominio.maximoContatos;

  function aposSalvar(texto) {
    setEditando(null);
    setAviso({ tipo: "sucesso", texto });
    contatos.recarregar();
  }

  async function excluir(contato) {
    if (!window.confirm(`Excluir o contato "${contato.nome}"?`)) return;
    try {
      await api.excluir(`/cidadaos/${sessao.id}/contatos/${contato.id}`);
      setAviso({ tipo: "sucesso", texto: "Contato excluído." });
      contatos.recarregar();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro.message });
    }
  }

  return (
    <>
      <IntroAba descricao="Quem você quer avisar numa emergência. Um toque liga para a pessoa.">
        {editando === null && (
          <button type="button" className="botao botao--primario" onClick={() => setEditando("novo")} disabled={cheio}>
            <Icone nome="MAIS" tamanho={18} />
            Novo contato
          </button>
        )}
      </IntroAba>

      {editando !== null && (
        <FormularioContato
          contato={editando === "novo" ? null : editando}
          aoSalvar={aposSalvar}
          aoCancelar={() => setEditando(null)}
        />
      )}

      {contatos.carregando && !contatos.dados && <Carregando />}
      {contatos.erro && <ErroCarga erro={contatos.erro} aoTentar={contatos.recarregar} />}
      {contatos.dados && lista.length === 0 && editando === null && <Vazio titulo="Nenhum contato de emergência salvo." />}

      <ul className="cartoes-perfil">
        {lista.map((contato) => (
          <li key={contato.id} className="contato cartao-perfil">
            <span className="contato__avatar" aria-hidden="true">
              {contato.nome.charAt(0).toUpperCase()}
            </span>
            <div className="contato__texto">
              <p className="contato__nome">{contato.nome}</p>
              <p className="contato__meta">
                {contato.parentesco ? `${contato.parentesco} · ` : ""}
                <a href={`tel:${contato.telefoneDigitos}`}>{contato.telefone}</a>
              </p>
            </div>
            <div className="acoes acoes--linha contato__acoes">
              <button type="button" className="botao-texto" onClick={() => setEditando(contato)}>
                Editar<span className="visualmente-oculto"> {contato.nome}</span>
              </button>
              <button type="button" className="botao-texto botao-texto--perigo" onClick={() => excluir(contato)}>
                Excluir<span className="visualmente-oculto"> {contato.nome}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      {cheio && <p className="texto-apoio">Limite de {dominio.maximoContatos} contatos.</p>}
    </>
  );
}

function FormularioContato({ contato, aoSalvar, aoCancelar }) {
  const { sessao } = useApp();
  const form = useFormulario({
    nome: contato?.nome ?? "",
    telefone: contato?.telefone ?? "",
    parentesco: contato?.parentesco ?? "",
  });

  async function salvar(evento) {
    evento.preventDefault();
    const ok = await form.enviar(
      (valores) => {
        const validador = criarValidador();
        validador.texto("nome", valores.nome, "Nome", 2, 60);
        const digitos = valores.telefone.replace(/\D/g, "").length;
        validador.exigir(digitos >= 8 && digitos <= 13, "telefone", "Informe um telefone com DDD, como (11) 91234-5678.");
        validador.exigir(valores.parentesco.trim().length <= 30, "parentesco", "Parentesco pode ter no máximo 30 caracteres.");
        return validador.erros;
      },
      (valores) => {
        const corpo = {
          nome: valores.nome.trim(),
          telefone: valores.telefone.trim(),
          parentesco: valores.parentesco.trim(),
        };
        return contato
          ? api.atualizar(`/cidadaos/${sessao.id}/contatos/${contato.id}`, corpo)
          : api.criar(`/cidadaos/${sessao.id}/contatos`, corpo);
      },
    );
    if (ok) aoSalvar(contato ? "Contato atualizado." : "Contato salvo.");
  }

  return (
    <form className="cartao-perfil formulario contato-form" onSubmit={salvar} noValidate>
      <h2 className="perfil-subtitulo">{contato ? `Editar "${contato.nome}"` : "Novo contato"}</h2>
      <Aviso aviso={form.aviso} />

      <Campo id="contato-nome" rotulo="Nome" erro={form.erros.nome}>
        <input type="text" maxLength={60} value={form.valores.nome} onChange={form.alterar("nome")} />
      </Campo>
      <Campo id="contato-telefone" rotulo="Telefone" erro={form.erros.telefone} dica="Com DDD, como (11) 91234-5678.">
        <input type="tel" maxLength={20} inputMode="tel" value={form.valores.telefone} onChange={form.alterar("telefone")} />
      </Campo>
      <Campo id="contato-parentesco" rotulo="Parentesco" opcional erro={form.erros.parentesco}>
        <input type="text" maxLength={30} placeholder="Mãe, irmão, amiga…" value={form.valores.parentesco} onChange={form.alterar("parentesco")} />
      </Campo>

      <div className="acoes">
        <button type="submit" className="botao botao--primario" disabled={form.enviando}>
          {form.enviando ? "Salvando…" : "Salvar contato"}
        </button>
        <button type="button" className="botao botao--discreto" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
