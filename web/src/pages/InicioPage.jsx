import Icone from "../components/Icone.jsx";
import { useApp } from "../contexto.js";
import { useCarregar } from "../hooks/useCarregar.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { api } from "../services/api.js";
import { formatarDistancia } from "../utils/formato.js";
import { PILARES } from "../utils/pilares.js";

export default function InicioPage() {
  useTitulo(null);
  const { sessao } = useApp();
  const primeiroNome = sessao?.nome.split(" ")[0];

  return (
    <>
      <section className="hub-apresentacao" aria-labelledby="hub-titulo">
        <div className="hub-apresentacao__texto">
          <p className="hub-apresentacao__eyebrow">Citizen Life</p>
          <h1 id="hub-titulo">
            {primeiroNome ? (
              <>
                {primeiroNome}, o que você <em>precisa hoje?</em>
              </>
            ) : (
              <>
                O seu dia a dia na cidade, <em>num lugar só.</em>
              </>
            )}
          </h1>
          <p className="hub-apresentacao__lead">
            Mobilidade, alimentação, lazer, segurança, educação e moradia reunidos em um só lugar.
          </p>
          <div className="hub-apresentacao__acoes">
            <a className="botao botao--primario botao--seta" href="#/mobilidade/rota">
              Planejar rota
            </a>
            <a className="botao botao--secundario" href="#/alimentacao">
              Ver o que tem perto
            </a>
          </div>
        </div>

        <ResumoHoje sessao={sessao} />
      </section>

      <section className="hub-apps" aria-labelledby="apps-titulo">
        <header className="hub-secao">
          <h2 id="apps-titulo">Apps do dia a dia</h2>
          <p>Escolha o que precisa resolver agora.</p>
        </header>

        <div className="hub-app-grid">
          {PILARES.map((pilar) => (
            <a
              key={pilar.id}
              href={`#/${pilar.id}`}
              className={`hub-app ${pilar.disponivel ? "hub-app--disponivel" : ""}`}
              aria-label={`${pilar.nome}${pilar.disponivel ? ", disponível" : ", em breve"}`}
              style={{ "--cor-pilar": pilar.cor, "--cor-icone": pilar.corIcone }}
            >
              <span className="hub-app__icone" aria-hidden="true">
                <Icone nome={pilar.icone} tamanho={24} />
              </span>

              <div className="hub-app__conteudo">
                <h3>{pilar.nome}</h3>
                <p>{pilar.resumo}</p>
              </div>

              <div className="hub-app__rodape">
                <span>{pilar.disponivel ? "Disponível" : "Em breve"}</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

const FORA_DO_AR = "Indisponível agora";

/** "Hoje perto de você": dados reais da conta (feira favorita, rotas e ajuda mais perto de casa). */
function ResumoHoje({ sessao }) {
  const id = sessao?.id;
  const daConta = (caminho) => () => (id ? api.buscar(`/cidadaos/${id}${caminho}`) : Promise.resolve(null));
  const feira = useCarregar(daConta("/feira-hoje"), [id]);
  const rotas = useCarregar(daConta("/rotas"), [id]);
  const alertas = useCarregar(daConta("/alertas"), [id, sessao?.modal]);
  const ajuda = useCarregar(daConta("/pontos-proximos"), [id]);

  const itens = id
    ? [
        {
          titulo: "Feira favorita",
          href: "#/alimentacao",
          texto: feira.carregando ? "…" : feira.erro ? FORA_DO_AR : feira.dados ? `${feira.dados.rua} · ${feira.dados.horario}` : "Nenhuma hoje · ver as feiras",
        },
        {
          titulo: "Suas rotas",
          href: "#/perfil/mobilidade/rotas",
          texto: textoRotas(rotas, alertas),
        },
        {
          titulo: "Ajuda mais perto",
          href: "#/seguranca",
          texto: ajuda.carregando ? "…" : ajuda.erro ? FORA_DO_AR : ajuda.dados?.pontos?.[0] ? `${ajuda.dados.pontos[0].nome} · ${formatarDistancia(ajuda.dados.pontos[0].distanciaMetros)}` : "Cadastre a sua casa para ver",
        },
      ]
    : [
        { titulo: "Feiras livres", href: "#/alimentacao", texto: "Por zona e dia da semana" },
        { titulo: "Rota mais segura", href: "#/mobilidade/rota", texto: "Compare com a mais rápida" },
        { titulo: "Em perigo?", href: "#/seguranca", texto: "Ligue 190 · 192 · 193" },
      ];

  return (
    <aside className="hub-resumo" aria-label="Resumo do dia">
      <div className="hub-resumo__topo">
        <span>{id ? "Hoje perto de você" : "Comece por aqui"}</span>
      </div>
      <ul className="hub-resumo__lista">
        {itens.map((item) => (
          <li key={item.titulo}>
            <a href={item.href}>
              <strong>{item.titulo}</strong>
              <span>{item.texto}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function textoRotas(rotas, alertas) {
  if (rotas.carregando || alertas.carregando) return "…";
  if (rotas.erro || alertas.erro) return FORA_DO_AR;
  const total = rotas.dados?.length ?? 0;
  if (total === 0) return "Nenhuma salva · planeje a primeira";
  const atencao = (alertas.dados ?? []).filter((alerta) => alerta.risco.alerta).length;
  const textoAlertas = atencao === 0 ? "sem alerta" : atencao === 1 ? "1 alerta" : `${atencao} alertas`;
  return `${total} ${total === 1 ? "rota salva" : "rotas salvas"} · ${textoAlertas}`;
}
