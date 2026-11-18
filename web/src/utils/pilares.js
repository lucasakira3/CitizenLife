// Os seis pilares da vida na cidade que o Citizen Life reúne, na ordem do menu.
// Os seis pilares já funcionam, cada um com a sua primeira consulta e as abas no perfil.

export const PILARES = [
  {
    id: "mobilidade",
    cor: "var(--pilar-mobilidade)",
    nome: "Mobilidade",
    icone: "MOBILIDADE",
    disponivel: true,
    resumo: "Planeje a rota da saída ao destino e veja os riscos do caminho para o seu meio de transporte.",
    consulta: "Rota segura e mapa de riscos",
  },
  {
    id: "educacao",
    perfil: ["Meus interesses e favoritos", "Guia de benefícios"],
    cor: "var(--pilar-educacao)",
    nome: "Educação",
    icone: "EDUCACAO",
    disponivel: true,
    resumo: "Escolas, cursos profissionalizantes e livres, universidades, bibliotecas e workshops na região central, com destaque para gratuidades e benefícios.",
    consulta: "Escolas, cursos, bibliotecas e benefícios no Centro",
    planos: [
      "Escolas de anos iniciais, ensino fundamental e médio na Zona Central",
      "Cursos profissionalizantes, livres, universidades, bibliotecas e workshops",
      "Guia de gratuidades e benefícios estudantis (Passe Livre, Pé-de-Meia, ProUni, PSG)",
    ],
  },
  {
    id: "alimentacao",
    perfil: ["Preferências e restrições alimentares", "Feiras e mercados favoritos"],
    cor: "var(--pilar-alimentacao)",
    corIcone: "var(--asfalto)",
    nome: "Alimentação",
    icone: "ALIMENTACAO",
    disponivel: true,
    resumo: "Feiras livres, restaurantes populares e bancos de alimentos da sua região.",
    consulta: "Feiras livres por dia e por zona",
    planos: [
      "Feiras livres por dia da semana e endereço",
      "Restaurantes populares com preço e horário",
      "Bancos de alimentos e pontos de doação",
    ],
  },
  {
    id: "seguranca",
    perfil: ["Contatos de emergência", "Bairros que você acompanha"],
    cor: "var(--pilar-seguranca)",
    nome: "Segurança",
    icone: "SEGURANCA",
    disponivel: true,
    resumo: "Delegacias, bases da guarda e pontos de apoio abertos agora.",
    consulta: "Onde pedir ajuda perto de você",
    planos: [
      "Delegacias e bases da guarda municipal mais próximas",
      "Pontos de apoio abertos 24 horas",
      "Telefones de emergência de cada serviço",
    ],
  },
  {
    id: "habitacao",
    perfil: ["Meus programas"],
    cor: "var(--pilar-habitacao)",
    nome: "Habitação",
    icone: "HABITACAO",
    disponivel: true,
    resumo: "Programas de moradia, aluguel social e regularização de imóveis.",
    consulta: "Programas de moradia para você",
    planos: [
      "Programas habitacionais com regras de inscrição",
      "Aluguel social: quem tem direito e como pedir",
      "Onde regularizar o imóvel e quais documentos levar",
    ],
  },
  {
    id: "lazer",
    perfil: ["Interesses (esporte, cultura, parques)", "Bairros favoritos"],
    cor: "var(--pilar-lazer)",
    nome: "Lazer",
    icone: "LAZER",
    disponivel: true,
    resumo: "Parques, centros culturais e eventos gratuitos perto de você.",
    consulta: "Programação gratuita por região",
    planos: [
      "Parques e praças com horário de funcionamento",
      "Centros culturais, CEUs e bibliotecas com atividades da semana",
      "Eventos gratuitos filtrados pela sua região",
    ],
  },
];

export function pilarPorId(id) {
  return PILARES.find((pilar) => pilar.id === id) ?? null;
}
