// Apoio da Habitação: ícones por tipo de programa e leitura da renda digitada.
// As regras (quem atende ao teto de renda, o que é uma inscrição válida) ficam no Java.

/** Ícone de cada tipo de programa (os códigos são os do CHECK de CL_PROGRAMA_MORADIA). */
export const ICONE_PROGRAMA = {
  CASA_PROPRIA: "HABITACAO",
  ALUGUEL: "CHAVE",
  REGULARIZACAO: "DOCUMENTO",
  REFORMA: "TIJOLOS",
  OUTRO: "ESCUDO",
};

/** Ícone de cada status da inscrição. */
export const ICONE_STATUS = {
  INSCRITO: "DOCUMENTO",
  EM_ANALISE: "RELOGIO",
  APROVADO: "CHECK",
};

/** Ícones do canal de inscrição: a tela, o balcão ou os dois. */
export const ICONE_CANAL = {
  ONLINE: ["TELA"],
  PRESENCIAL: ["PIN"],
  AMBOS: ["TELA", "PIN"],
};

/**
 * Converte o que a pessoa digitou em um número para a API.
 * Aceita "2500", "2.500", "2.500,50" e "R$ 2500,5". Vazio = sem filtro; texto inválido = erro.
 */
export function lerRenda(texto) {
  const limpo = (texto ?? "").replace(/R\$|\s/g, "");
  if (!limpo) {
    return { valor: "", erro: null };
  }
  // No Brasil o ponto separa milhares e a vírgula, os centavos
  const normal = limpo.replace(/\./g, "").replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normal)) {
    return { valor: "", erro: "Informe a renda familiar mensal em reais, como 2500 ou 2.500,50." };
  }
  return { valor: normal, erro: null };
}

/** 3200 → "R$ 3.200"; 2500.5 → "R$ 2.500,50". */
export function formatarReais(valor) {
  const temCentavos = Math.round(valor * 100) % 100 !== 0;
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: temCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
