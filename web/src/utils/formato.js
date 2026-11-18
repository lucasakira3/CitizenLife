// Formatação de datas e números no padrão brasileiro.

/** "há 40 min", "há 3 h", "há 5 dias". */
export function tempoRelativo(iso) {
  if (!iso) {
    return "";
  }
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) {
    return "agora";
  }
  if (minutos < 60) {
    return `há ${minutos} min`;
  }
  const horas = Math.round(minutos / 60);
  if (horas < 24) {
    return `há ${horas} h`;
  }
  const dias = Math.round(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

export function formatarNumero(valor, casas = 0) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return "—";
  }
  return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** 850 → "850 m"; 2340 → "2,3 km". */
export function formatarDistancia(metros) {
  if (metros === null || metros === undefined) {
    return "—";
  }
  return metros < 1000 ? `${Math.round(metros / 10) * 10} m` : `${formatarNumero(metros / 1000, 1)} km`;
}

/** 18 → "18 min"; 125 → "2 h 05 min". */
export function formatarMinutos(minutos) {
  if (minutos === null || minutos === undefined) {
    return "—";
  }
  const total = Math.round(minutos);
  if (total < 60) {
    return `${total} min`;
  }
  const horas = Math.floor(total / 60);
  const resto = String(total % 60).padStart(2, "0");
  return `${horas} h ${resto} min`;
}

/** Abrevia como nas placas de rua de São Paulo: "Avenida Paulista" → "Av. Paulista". */
export function abreviarVia(nome) {
  return nome
    .replace(/^Avenida\s/i, "Av. ")
    .replace(/^Rua\s/i, "R. ")
    .replace(/\bBrigadeiro\s/i, "Brig. ")
    .replace(/\bEngenheiro\s/i, "Eng. ");
}

const HORA = { hour: "2-digit", minute: "2-digit" };

/** Data e horário de um evento: "Hoje, 15:00 às 16:30", "Amanhã, 08:00 às 09:30", "sáb., 22/11, 10:00 às 16:00". */
export function formatarPeriodo(inicioIso, fimIso) {
  const inicio = new Date(inicioIso);
  const fim = new Date(fimIso);
  const horas = `${inicio.toLocaleTimeString("pt-BR", HORA)} às ${fim.toLocaleTimeString("pt-BR", HORA)}`;
  return `${rotuloDoDia(inicio)}, ${horas}`;
}

/** "Hoje", "Amanhã" ou "sáb., 22/11". */
export function rotuloDoDia(data) {
  const dia = new Date(data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dia);
  alvo.setHours(0, 0, 0, 0);
  const diferenca = Math.round((alvo - hoje) / 86400000);
  if (diferenca === 0) return "Hoje";
  if (diferenca === 1) return "Amanhã";
  if (diferenca === -1) return "Ontem";
  return dia.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
