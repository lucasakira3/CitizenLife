// Opções e rótulos usados nas telas. São só textos de interface: as regras (o cálculo do risco,
// as validações) ficam no Java. Os códigos são os mesmos das colunas e dos CHECK do script.sql.

export const DOMINIO = {
  modais: [
    { codigo: "CARRO", rotulo: "Carro", velocidadeMediaKmh: 22.0, motorizado: true },
    { codigo: "MOTO", rotulo: "Moto", velocidadeMediaKmh: 28.0, motorizado: true },
    { codigo: "ONIBUS", rotulo: "Passageiro de ônibus", velocidadeMediaKmh: 15.0, motorizado: true },
    { codigo: "APP", rotulo: "Motorista de app", velocidadeMediaKmh: 22.0, motorizado: true },
    { codigo: "PEDESTRE", rotulo: "Pedestre", velocidadeMediaKmh: 4.5, motorizado: false },
    { codigo: "BIKE", rotulo: "Bicicleta", velocidadeMediaKmh: 14.0, motorizado: false },
  ],
  tiposOcorrencia: [
    { codigo: "ACIDENTE", rotulo: "Acidente de trânsito" },
    { codigo: "ALAGAMENTO", rotulo: "Alagamento" },
    { codigo: "QUEDA_ARVORE", rotulo: "Queda de árvore" },
    { codigo: "SEMAFORO_APAGADO", rotulo: "Semáforo apagado" },
    { codigo: "DESLIZAMENTO", rotulo: "Deslizamento de terra" },
    { codigo: "VIA_BLOQUEADA", rotulo: "Via bloqueada" },
    { codigo: "INSEGURANCA", rotulo: "Insegurança no trajeto" },
  ],
  niveisRisco: [
    { codigo: "BAIXO", rotulo: "Baixo" },
    { codigo: "MODERADO", rotulo: "Moderado" },
    { codigo: "ALTO", rotulo: "Alto" },
    { codigo: "CRITICO", rotulo: "Crítico" },
  ],
  tiposEndereco: [
    { codigo: "CASA", rotulo: "Casa", unico: true },
    { codigo: "TRABALHO", rotulo: "Trabalho", unico: true },
    { codigo: "ESTUDO", rotulo: "Estudo", unico: false },
    { codigo: "OUTRO", rotulo: "Outro", unico: false },
  ],
  /** Segurança: tipos de ponto de apoio (mesmos códigos do CHECK de CL_PONTO_APOIO). */
  tiposPontoApoio: [
    { codigo: "DELEGACIA", rotulo: "Delegacia", icone: "ESCUDO" },
    { codigo: "DELEGACIA_MULHER", rotulo: "Delegacia da Mulher", icone: "PESSOA" },
    { codigo: "POLICIA_MILITAR", rotulo: "Polícia Militar", icone: "ESCUDO" },
    { codigo: "GUARDA_MUNICIPAL", rotulo: "Guarda Civil", icone: "ESCUDO" },
    { codigo: "SAUDE_24H", rotulo: "Saúde 24h", icone: "MAIS" },
    { codigo: "ACOLHIMENTO", rotulo: "Acolhimento", icone: "HABITACAO" },
  ],
  zonas: ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste"],
  /** Números nacionais de emergência, sempre visíveis no pilar Segurança. */
  telefonesEmergencia: [
    { numero: "190", rotulo: "Polícia Militar" },
    { numero: "192", rotulo: "SAMU" },
    { numero: "193", rotulo: "Bombeiros" },
    { numero: "153", rotulo: "Guarda Civil" },
    { numero: "180", rotulo: "Central da Mulher" },
  ],
  maximoContatos: 5,
  /** Faixas do risco, só para a legenda (o Java é quem classifica). */
  limitesRisco: { moderado: 4, alto: 7, critico: 10, alerta: 4 },
  maximoRotas: 10,
  maximoEnderecos: 10,
  /** Sem meio de transporte informado, o Java calcula o risco para quem anda a pé. */
  modalPadraoRisco: "PEDESTRE",
};
