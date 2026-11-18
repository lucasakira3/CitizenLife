-- =====================================================================
-- Citizen Life · Global Solution 2026/2 · CitizenTech (FIAP)
-- Script Oracle: as tabelas do projeto e os dados de demonstração.
--
-- Como executar (SQL Developer): abra este arquivo e use "Executar Script" (F5).
-- Pode ser executado de novo a qualquer momento: o bloco inicial apaga só as
-- tabelas do projeto (prefixo CL_) antes de recriá-las.
-- Senha de todos os cidadãos de demonstração: Citizen@2026
-- =====================================================================


-- 1. Limpeza ----------------------------------------------------------
BEGIN
    FOR tabela IN (SELECT table_name FROM user_tables
                    WHERE table_name IN ('CL_CIDADAO_EVENTO', 'CL_EVENTO_LAZER', 'CL_LUGAR_LAZER', 'CL_INSCRICAO_PROGRAMA', 'CL_PROGRAMA_MORADIA', 'CL_CONTATO_EMERGENCIA', 'CL_PONTO_APOIO', 'CL_CIDADAO_FEIRA', 'CL_FEIRA', 'CL_ENDERECO', 'CL_ROTA_VIA', 'CL_ROTA',
                                         'CL_OCORRENCIA', 'CL_CIDADAO', 'CL_VIA', 'CL_OCORRENCIA_VIA', 'CL_REGIAO'))
    LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || tabela.table_name || ' CASCADE CONSTRAINTS PURGE';
    END LOOP;
END;
/


-- 2. Tabelas ----------------------------------------------------------

-- Quem usa o hub. O modal (meio de transporte) é opcional e muda o risco das ocorrências.
CREATE TABLE cl_cidadao (
    id_cidadao   NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome         VARCHAR2(100) NOT NULL,
    email        VARCHAR2(120) NOT NULL,
    senha_hash   VARCHAR2(200) NOT NULL,
    modal        VARCHAR2(10),
    dt_cadastro  DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_cl_cidadao PRIMARY KEY (id_cidadao),
    CONSTRAINT uk_cl_cidadao_email UNIQUE (email),
    CONSTRAINT ck_cl_cidadao_modal CHECK (modal IN ('CARRO', 'MOTO', 'ONIBUS', 'APP', 'PEDESTRE', 'BIKE'))
);

-- Avenidas e ruas acompanhadas, com a zona da cidade.
CREATE TABLE cl_via (
    id_via  NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome    VARCHAR2(120) NOT NULL,
    zona    VARCHAR2(20)  NOT NULL,
    CONSTRAINT pk_cl_via PRIMARY KEY (id_via),
    CONSTRAINT uk_cl_via_nome UNIQUE (nome),
    CONSTRAINT ck_cl_via_zona CHECK (zona IN ('Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste'))
);

-- Problema numa via (1:N via → ocorrências): alagamento, acidente, queda de árvore...
CREATE TABLE cl_ocorrencia (
    id_ocorrencia  NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    id_via         NUMBER(10)    NOT NULL,
    titulo         VARCHAR2(100) NOT NULL,
    descricao      VARCHAR2(500) NOT NULL,
    tipo           VARCHAR2(20)  NOT NULL,
    gravidade      NUMBER(1)     NOT NULL,
    dt_registro    DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_cl_ocorrencia PRIMARY KEY (id_ocorrencia),
    CONSTRAINT fk_cl_ocorrencia_via FOREIGN KEY (id_via) REFERENCES cl_via (id_via),
    CONSTRAINT uk_cl_ocorrencia_titulo UNIQUE (titulo),
    CONSTRAINT ck_cl_ocorrencia_tipo CHECK (tipo IN ('ACIDENTE', 'ALAGAMENTO', 'QUEDA_ARVORE', 'SEMAFORO_APAGADO',
                                                     'DESLIZAMENTO', 'VIA_BLOQUEADA', 'INSEGURANCA')),
    CONSTRAINT ck_cl_ocorrencia_gravidade CHECK (gravidade BETWEEN 1 AND 5)
);

-- Rota salva pelo cidadão (1:N cidadão → rotas). X e Y são a posição no mapa.
CREATE TABLE cl_rota (
    id_rota            NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    id_cidadao         NUMBER(10)    NOT NULL,
    nome               VARCHAR2(60)  NOT NULL,
    origem_descricao   VARCHAR2(120) NOT NULL,
    origem_x           NUMBER(8,2)   NOT NULL,
    origem_y           NUMBER(8,2)   NOT NULL,
    destino_descricao  VARCHAR2(120) NOT NULL,
    destino_x          NUMBER(8,2)   NOT NULL,
    destino_y          NUMBER(8,2)   NOT NULL,
    distancia_m        NUMBER(7)     NOT NULL,
    dt_criacao         DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_cl_rota PRIMARY KEY (id_rota),
    CONSTRAINT fk_cl_rota_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT uk_cl_rota_nome UNIQUE (id_cidadao, nome),
    CONSTRAINT ck_cl_rota_distancia CHECK (distancia_m > 0)
);

-- Associativa N:N entre rota e via: as vias por onde a rota passa, na ordem.
CREATE TABLE cl_rota_via (
    id_rota  NUMBER(10) NOT NULL,
    id_via   NUMBER(10) NOT NULL,
    ordem    NUMBER(3)  NOT NULL,
    CONSTRAINT pk_cl_rota_via PRIMARY KEY (id_rota, id_via),
    CONSTRAINT fk_cl_rotavia_rota FOREIGN KEY (id_rota) REFERENCES cl_rota (id_rota) ON DELETE CASCADE,
    CONSTRAINT fk_cl_rotavia_via FOREIGN KEY (id_via) REFERENCES cl_via (id_via),
    CONSTRAINT ck_cl_rotavia_ordem CHECK (ordem >= 1)
);

-- Endereços salvos pelo cidadão (1:N cidadão → endereços), atalhos de saída e destino.
CREATE TABLE cl_endereco (
    id_endereco  NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    id_cidadao   NUMBER(10)    NOT NULL,
    apelido      VARCHAR2(40)  NOT NULL,
    tipo         VARCHAR2(10)  NOT NULL,
    descricao    VARCHAR2(120) NOT NULL,
    pos_x        NUMBER(8,2)   NOT NULL,
    pos_y        NUMBER(8,2)   NOT NULL,
    CONSTRAINT pk_cl_endereco PRIMARY KEY (id_endereco),
    CONSTRAINT fk_cl_endereco_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT uk_cl_endereco_apelido UNIQUE (id_cidadao, apelido),
    CONSTRAINT ck_cl_endereco_tipo CHECK (tipo IN ('CASA', 'TRABALHO', 'ESTUDO', 'OUTRO'))
);

-- Feiras livres do município, organizadas por dia da semana e pela zona da cidade.
CREATE TABLE cl_feira (
    id_feira      NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome          VARCHAR2(80)  NOT NULL,
    rua           VARCHAR2(120) NOT NULL,
    zona          VARCHAR2(20)  NOT NULL,
    dia_semana    VARCHAR2(12)  NOT NULL,
    horario       VARCHAR2(40)  NOT NULL,
    CONSTRAINT pk_cl_feira PRIMARY KEY (id_feira),
    CONSTRAINT uk_cl_feira_rua_dia UNIQUE (rua, dia_semana),
    CONSTRAINT ck_cl_feira_zona CHECK (zona IN ('Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste')),
    CONSTRAINT ck_cl_feira_dia CHECK (dia_semana IN ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'))
);

-- Feiras favoritas do cidadão. Uma feira pode ser favorita por mais de um cidadão.
CREATE TABLE cl_cidadao_feira (
    id_cidadao  NUMBER(10) NOT NULL,
    id_feira    NUMBER(10) NOT NULL,
    CONSTRAINT pk_cl_cidadao_feira PRIMARY KEY (id_cidadao, id_feira),
    CONSTRAINT fk_cl_cidadao_feira_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT fk_cl_cidadao_feira_feira FOREIGN KEY (id_feira) REFERENCES cl_feira (id_feira) ON DELETE CASCADE
);

-- Segurança: onde pedir ajuda. Delegacias, bases da PM e da GCM, saúde 24h e centros de acolhimento.
-- pos_x e pos_y estão no mesmo sistema do mapa (e de CL_ENDERECO): 1 unidade = 25 metros.
-- Quem não abre 24 horas informa abre e fecha no formato HH:MM.
CREATE TABLE cl_ponto_apoio (
    id_ponto    NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome        VARCHAR2(80)  NOT NULL,
    tipo        VARCHAR2(20)  NOT NULL,
    bairro      VARCHAR2(60)  NOT NULL,
    zona        VARCHAR2(20)  NOT NULL,
    telefone    VARCHAR2(20)  NOT NULL,
    aberto_24h  CHAR(1)       DEFAULT 'S' NOT NULL,
    abre        VARCHAR2(5),
    fecha       VARCHAR2(5),
    pos_x       NUMBER(8, 2)  NOT NULL,
    pos_y       NUMBER(8, 2)  NOT NULL,
    CONSTRAINT pk_cl_ponto_apoio PRIMARY KEY (id_ponto),
    CONSTRAINT uk_cl_ponto_apoio_nome UNIQUE (nome),
    CONSTRAINT ck_cl_ponto_apoio_tipo CHECK (tipo IN ('DELEGACIA', 'DELEGACIA_MULHER', 'POLICIA_MILITAR',
                                                      'GUARDA_MUNICIPAL', 'SAUDE_24H', 'ACOLHIMENTO')),
    CONSTRAINT ck_cl_ponto_apoio_zona CHECK (zona IN ('Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste')),
    CONSTRAINT ck_cl_ponto_apoio_24h CHECK (aberto_24h IN ('S', 'N')),
    CONSTRAINT ck_cl_ponto_apoio_horario CHECK (aberto_24h = 'S' OR (abre IS NOT NULL AND fecha IS NOT NULL))
);

-- Contatos de emergência do cidadão (N:1). O nome não se repete para o mesmo cidadão.
CREATE TABLE cl_contato_emergencia (
    id_contato   NUMBER(10)   GENERATED ALWAYS AS IDENTITY,
    id_cidadao   NUMBER(10)   NOT NULL,
    nome         VARCHAR2(60) NOT NULL,
    telefone     VARCHAR2(20) NOT NULL,
    parentesco   VARCHAR2(30),
    CONSTRAINT pk_cl_contato_emergencia PRIMARY KEY (id_contato),
    CONSTRAINT fk_cl_contato_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT uk_cl_contato_nome UNIQUE (id_cidadao, nome)
);


-- Habitação · consulta: programas de moradia (Minha Casa Minha Vida, aluguel social, regularização...).
-- "documentos" guarda a lista separada por ponto e vírgula; renda_maxima vazia = o programa não tem teto de renda.
CREATE TABLE cl_programa_moradia (
    id_programa      NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome             VARCHAR2(100) NOT NULL,
    tipo             VARCHAR2(15)  NOT NULL,
    canal            VARCHAR2(10)  NOT NULL,
    descricao        VARCHAR2(300) NOT NULL,
    quem_tem_direito VARCHAR2(500) NOT NULL,
    renda_maxima     NUMBER(9,2),
    documentos       VARCHAR2(600) NOT NULL,
    onde_inscrever   VARCHAR2(300) NOT NULL,
    site             VARCHAR2(150),
    CONSTRAINT pk_cl_programa_moradia PRIMARY KEY (id_programa),
    CONSTRAINT uk_cl_programa_nome UNIQUE (nome),
    CONSTRAINT ck_cl_programa_tipo CHECK (tipo IN ('CASA_PROPRIA', 'ALUGUEL', 'REGULARIZACAO', 'REFORMA', 'OUTRO')),
    CONSTRAINT ck_cl_programa_canal CHECK (canal IN ('ONLINE', 'PRESENCIAL', 'AMBOS')),
    CONSTRAINT ck_cl_programa_renda CHECK (renda_maxima IS NULL OR renda_maxima > 0)
);

-- Habitação · perfil: os programas em que o cidadão se inscreveu e em que pé está cada um (N:N cidadão × programa,
-- com atributos próprios). Um cidadão só se inscreve uma vez em cada programa.
CREATE TABLE cl_inscricao_programa (
    id_inscricao   NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    id_cidadao     NUMBER(10)    NOT NULL,
    id_programa    NUMBER(10)    NOT NULL,
    status         VARCHAR2(10)  DEFAULT 'INSCRITO' NOT NULL,
    protocolo      VARCHAR2(30),
    observacao     VARCHAR2(200),
    dt_inscricao   DATE          DEFAULT SYSDATE NOT NULL,
    dt_atualizacao DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_cl_inscricao_programa PRIMARY KEY (id_inscricao),
    CONSTRAINT fk_cl_inscricao_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT fk_cl_inscricao_programa FOREIGN KEY (id_programa) REFERENCES cl_programa_moradia (id_programa) ON DELETE CASCADE,
    CONSTRAINT uk_cl_inscricao_prog UNIQUE (id_cidadao, id_programa),
    CONSTRAINT ck_cl_inscricao_status CHECK (status IN ('INSCRITO', 'EM_ANALISE', 'APROVADO'))
);

-- Lazer · lugares: parques, praças, CEUs, centros culturais, bibliotecas e centros esportivos públicos.
-- Quem não abre 24 horas informa abre e fecha (HH:MM); fecha 00:00 = fecha à meia-noite.
-- pos_x e pos_y no mesmo sistema do mapa (1 unidade = 25 metros), como CL_PONTO_APOIO e CL_ENDERECO.
CREATE TABLE cl_lugar_lazer (
    id_lugar    NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    nome        VARCHAR2(80)  NOT NULL,
    tipo        VARCHAR2(20)  NOT NULL,
    bairro      VARCHAR2(60)  NOT NULL,
    zona        VARCHAR2(20)  NOT NULL,
    aberto_24h  CHAR(1)       DEFAULT 'N' NOT NULL,
    abre        VARCHAR2(5),
    fecha       VARCHAR2(5),
    pos_x       NUMBER(8, 2)  NOT NULL,
    pos_y       NUMBER(8, 2)  NOT NULL,
    CONSTRAINT pk_cl_lugar_lazer PRIMARY KEY (id_lugar),
    CONSTRAINT uk_cl_lugar_lazer_nome UNIQUE (nome),
    CONSTRAINT ck_cl_lugar_lazer_tipo CHECK (tipo IN ('PARQUE', 'PRACA', 'CEU', 'CENTRO_CULTURAL', 'BIBLIOTECA', 'ESPORTIVO')),
    CONSTRAINT ck_cl_lugar_lazer_zona CHECK (zona IN ('Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste')),
    CONSTRAINT ck_cl_lugar_lazer_24h CHECK (aberto_24h IN ('S', 'N')),
    CONSTRAINT ck_cl_lugar_lazer_horario CHECK (aberto_24h = 'S' OR (abre IS NOT NULL AND fecha IS NOT NULL))
);

-- Lazer · programação gratuita: cada evento acontece num lugar (N:1), com início e fim.
CREATE TABLE cl_evento_lazer (
    id_evento   NUMBER(10)    GENERATED ALWAYS AS IDENTITY,
    id_lugar    NUMBER(10)    NOT NULL,
    titulo      VARCHAR2(80)  NOT NULL,
    categoria   VARCHAR2(10)  NOT NULL,
    descricao   VARCHAR2(300) NOT NULL,
    dt_inicio   DATE          NOT NULL,
    dt_fim      DATE          NOT NULL,
    CONSTRAINT pk_cl_evento_lazer PRIMARY KEY (id_evento),
    CONSTRAINT fk_cl_evento_lugar FOREIGN KEY (id_lugar) REFERENCES cl_lugar_lazer (id_lugar) ON DELETE CASCADE,
    CONSTRAINT uk_cl_evento_titulo UNIQUE (id_lugar, titulo),
    CONSTRAINT ck_cl_evento_categoria CHECK (categoria IN ('ESPORTE', 'CULTURA', 'MUSICA', 'INFANTIL', 'CINEMA', 'OFICINA')),
    CONSTRAINT ck_cl_evento_datas CHECK (dt_fim > dt_inicio)
);

-- Lazer · perfil: a agenda do cidadão, os eventos em que ele marcou "Eu vou" (N:N cidadão × evento).
CREATE TABLE cl_cidadao_evento (
    id_cidadao   NUMBER(10) NOT NULL,
    id_evento    NUMBER(10) NOT NULL,
    dt_marcacao  DATE       DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_cl_cidadao_evento PRIMARY KEY (id_cidadao, id_evento),
    CONSTRAINT fk_cl_cidadao_evento_cidadao FOREIGN KEY (id_cidadao) REFERENCES cl_cidadao (id_cidadao) ON DELETE CASCADE,
    CONSTRAINT fk_cl_cidadao_evento_evento FOREIGN KEY (id_evento) REFERENCES cl_evento_lazer (id_evento) ON DELETE CASCADE
);

-- 3. Dados de demonstração --------------------------------------------
-- As chaves estrangeiras são buscadas por campos únicos (nome, e-mail, título),
-- então o script não depende dos ids gerados. SYSDATE - 3/24 = três horas atrás.

-- 3.1 Cidadãos: um para cada meio de transporte
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Ana Souza', 'ana.souza@exemplo.com',
        'pbkdf2$65536$mFrQjXjWLY5bwzc2daOtYw==$0fUOtRxmU00PCLgCrU+Iaq+zvnXNunGHFFvJJdp5fFg=', 'MOTO', SYSDATE - 60);
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Bruno Lima', 'bruno.lima@exemplo.com',
        'pbkdf2$65536$mYm08xWlUKdO/3vC84t5Cg==$9bB72W1KPsexnT7Ag3rZCblXM9rGmtLAkuYHbXYlPFY=', 'CARRO', SYSDATE - 55);
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Carla Mendes', 'carla.mendes@exemplo.com',
        'pbkdf2$65536$pn14GQEsSajxfHKXS/C9kA==$pwp5OwlckTCaXWS7MetkK9eQlwlkDZ2WA7AyeLn2RzA=', 'ONIBUS', SYSDATE - 50);
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Diego Santos', 'diego.santos@exemplo.com',
        'pbkdf2$65536$RfuHYpW6irXdLMdQu1nVMQ==$9z0qu5e6z1Q23hNEQETxZioMRzuDbMPuhtgISOzv4/U=', 'APP', SYSDATE - 45);
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Elisa Ferreira', 'elisa.ferreira@exemplo.com',
        'pbkdf2$65536$PWlZboS/99IOjA+dVmiHKQ==$mt64lB2KulbbtADu1aBQlQK5ulrnML7nDLAXNughPzg=', 'PEDESTRE', SYSDATE - 40);
INSERT INTO cl_cidadao (nome, email, senha_hash, modal, dt_cadastro)
VALUES ('Felipe Rocha', 'felipe.rocha@exemplo.com',
        'pbkdf2$65536$3Fh2VKjU4V4tQH4XofIM0A==$NEvkD+ST3QiZfGWbiuKurfUcmpcsxpn3BZLR2lVxqm0=', 'BIKE', SYSDATE - 35);

-- 3.2 Vias
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Paulista', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Rua da Consolação', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida 23 de Maio', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Prestes Maia', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Marginal Tietê', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Cruzeiro do Sul', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Inajar de Souza', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Engenheiro Caetano Álvares', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Santo Amaro', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Washington Luís', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Interlagos', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Ricardo Jafet', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Radial Leste', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Aricanduva', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Sapopemba', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Salim Farah Maluf', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Marginal Pinheiros', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Rebouças', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Brigadeiro Faria Lima', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Francisco Morato', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Ipiranga', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida São João', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Rua Augusta', 'Centro');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Braz Leme', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Água Fria', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Imirim', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida General Ataliba Leonel', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Nossa Senhora do Ó', 'Zona Norte');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Jabaquara', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Cupecê', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Senador Teotônio Vilela', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Vereador José Diniz', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Nossa Senhora do Sabará', 'Zona Sul');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Itaquera', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Ragueb Chohfi', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Marechal Tito', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Mateo Bei', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Jacu-Pêssego', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Amador Bueno da Veiga', 'Zona Leste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Pompeia', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Rua Teodoro Sampaio', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Corifeu de Azevedo Marques', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Escola Politécnica', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Pedroso de Morais', 'Zona Oeste');
INSERT INTO cl_via (nome, zona) VALUES ('Avenida Indianópolis', 'Zona Sul');

-- 3.3 Ocorrências espalhadas pelas cinco zonas (o mapa de riscos)
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Alagamento na Radial Leste, altura do Tatuapé',
       'Água acima do meio-fio nas duas faixas da direita. Carros passam devagar; motos estão derrapando.',
       'ALAGAMENTO', 3, SYSDATE - 3/24
  FROM cl_via WHERE nome = 'Radial Leste';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo apagado na Consolação com a Paulista',
       'Semáforo do cruzamento apagado nos dois sentidos. Pedestres atravessando no meio dos carros.',
       'SEMAFORO_APAGADO', 3, SYSDATE - 2/24
  FROM cl_via WHERE nome = 'Rua da Consolação';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Queda de árvore bloqueia faixa na Av. Rebouças',
       'Árvore de grande porte caiu sobre a faixa da direita e a ciclovia, perto da Rua Oscar Freire.',
       'QUEDA_ARVORE', 4, SYSDATE - 5/24
  FROM cl_via WHERE nome = 'Avenida Rebouças';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Colisão entre carro e bicicleta na Faria Lima',
       'Carro atingiu ciclista na faixa da direita. Resgate a caminho e trânsito parado no sentido Pinheiros.',
       'ACIDENTE', 4, SYSDATE - 1/24
  FROM cl_via WHERE nome = 'Avenida Brigadeiro Faria Lima';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Alagamento na pista local da Marginal Pinheiros',
       'Pista local completamente alagada perto da Ponte Cidade Jardim. Carros voltando de ré.',
       'ALAGAMENTO', 4, SYSDATE - 40/1440
  FROM cl_via WHERE nome = 'Marginal Pinheiros';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Ponto de ônibus sem iluminação na Av. Sapopemba',
       'Ponto perto do número 9000 está sem luz há três noites. Passageiros esperam no escuro depois das 22h.',
       'INSEGURANCA', 3, SYSDATE - 20/24
  FROM cl_via WHERE nome = 'Avenida Sapopemba';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Risco de deslizamento na Av. Engenheiro Caetano Álvares',
       'Trincas na encosta ao lado da calçada depois da chuva forte. Terra descendo para a pista.',
       'DESLIZAMENTO', 4, SYSDATE - 6/24
  FROM cl_via WHERE nome = 'Avenida Engenheiro Caetano Álvares';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo apagado na Ipiranga com a São João',
       'Cruzamento famoso sem semáforo nos dois sentidos. Muita gente atravessando entre os carros.',
       'SEMAFORO_APAGADO', 3, SYSDATE - 70/1440
  FROM cl_via WHERE nome = 'Avenida Ipiranga';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Feira de rua ocupa faixa da Avenida São João',
       'Barracas montadas na faixa da direita perto do Largo do Paissandu. Ônibus desviando.',
       'VIA_BLOQUEADA', 2, SYSDATE - 150/1440
  FROM cl_via WHERE nome = 'Avenida São João';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Trecho escuro e relatos de furto na Rua Augusta',
       'Postes apagados entre a Rua Peixoto Gomide e a Alameda Santos. Relatos de furto de celular à noite.',
       'INSEGURANCA', 3, SYSDATE - 5/24
  FROM cl_via WHERE nome = 'Rua Augusta';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Alagamento na Avenida Braz Leme perto do Campo de Marte',
       'Água cobrindo as duas faixas da direita depois da chuva. Motos passando pelo canteiro.',
       'ALAGAMENTO', 3, SYSDATE - 95/1440
  FROM cl_via WHERE nome = 'Avenida Braz Leme';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Galho grande pendurado sobre a Avenida Água Fria',
       'Galho rachado de uma tipuana balançando sobre a faixa da direita, perto da Rua Pedro Doll.',
       'QUEDA_ARVORE', 3, SYSDATE - 45/1440
  FROM cl_via WHERE nome = 'Avenida Água Fria';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Batida entre dois carros na Avenida Imirim',
       'Colisão traseira sem feridos. Carros parados na faixa da esquerda aguardando o guincho.',
       'ACIDENTE', 2, SYSDATE - 35/1440
  FROM cl_via WHERE nome = 'Avenida Imirim';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo piscando na General Ataliba Leonel',
       'Semáforo em amarelo piscante no cruzamento com a Rua Voluntários da Pátria.',
       'SEMAFORO_APAGADO', 2, SYSDATE - 2/24
  FROM cl_via WHERE nome = 'Avenida General Ataliba Leonel';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Terra da encosta na Avenida Nossa Senhora do Ó',
       'Barranco desceu sobre a calçada e parte da faixa. Pedestres andando pela pista.',
       'DESLIZAMENTO', 3, SYSDATE - 4/24
  FROM cl_via WHERE nome = 'Avenida Nossa Senhora do Ó';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Alagamento na Avenida Jabaquara perto da estação Conceição',
       'Água acima do meio-fio nos dois sentidos. Carros baixos ficando presos.',
       'ALAGAMENTO', 4, SYSDATE - 80/1440
  FROM cl_via WHERE nome = 'Avenida Jabaquara';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Trecho sem iluminação na Avenida Cupecê',
       'Cerca de 500 metros sem luz perto do Terminal Cidade Ademar. Ponto de ônibus no escuro.',
       'INSEGURANCA', 4, SYSDATE - 10/24
  FROM cl_via WHERE nome = 'Avenida Cupecê';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Caminhão tombado na Avenida Senador Teotônio Vilela',
       'Caminhão de entregas tombou na curva perto da Represa Billings. Uma faixa liberada.',
       'ACIDENTE', 4, SYSDATE - 55/1440
  FROM cl_via WHERE nome = 'Avenida Senador Teotônio Vilela';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Árvore caída no canteiro da Avenida Vereador José Diniz',
       'Árvore de médio porte caiu sobre o canteiro central e encosta na faixa da esquerda.',
       'QUEDA_ARVORE', 2, SYSDATE - 3/24
  FROM cl_via WHERE nome = 'Avenida Vereador José Diniz';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Obra fecha faixa da Avenida Nossa Senhora do Sabará',
       'Obra de saneamento com uma faixa fechada nos dois sentidos, sinalizada com cones.',
       'VIA_BLOQUEADA', 3, SYSDATE - 12/24
  FROM cl_via WHERE nome = 'Avenida Nossa Senhora do Sabará';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo apagado na Avenida Indianópolis',
       'Semáforo do cruzamento com a Avenida dos Bandeirantes apagado. Agente de trânsito ainda não chegou.',
       'SEMAFORO_APAGADO', 3, SYSDATE - 25/1440
  FROM cl_via WHERE nome = 'Avenida Indianópolis';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Córrego transborda na Avenida Itaquera',
       'Córrego encheu e a água tomou a pista perto da Rua Victorio Santim. Motos derrapando.',
       'ALAGAMENTO', 3, SYSDATE - 65/1440
  FROM cl_via WHERE nome = 'Avenida Itaquera';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Moto derrapa em areia na Avenida Ragueb Chohfi',
       'Areia de obra espalhada na pista. Um motociclista caiu, sem ferimentos graves.',
       'ACIDENTE', 3, SYSDATE - 40/1440
  FROM cl_via WHERE nome = 'Avenida Ragueb Chohfi';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Ponto de ônibus sem luz na Avenida Marechal Tito',
       'Ponto vandalizado e sem iluminação perto da estação São Miguel Paulista.',
       'INSEGURANCA', 3, SYSDATE - 15/24
  FROM cl_via WHERE nome = 'Avenida Marechal Tito';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Árvore derruba fios na Avenida Mateo Bei',
       'Árvore caiu sobre a rede elétrica e fechou a avenida. Fios no chão.',
       'QUEDA_ARVORE', 4, SYSDATE - 130/1440
  FROM cl_via WHERE nome = 'Avenida Mateo Bei';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Carreta quebrada na Avenida Jacu-Pêssego',
       'Carreta parada na faixa da direita no sentido Mauá. Trânsito lento por 2 km.',
       'VIA_BLOQUEADA', 4, SYSDATE - 85/1440
  FROM cl_via WHERE nome = 'Avenida Jacu-Pêssego';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo piscando na Avenida Amador Bueno da Veiga',
       'Semáforo em amarelo piscante perto do Shopping Penha.',
       'SEMAFORO_APAGADO', 2, SYSDATE - 50/1440
  FROM cl_via WHERE nome = 'Avenida Amador Bueno da Veiga';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Água acumulada na descida da Avenida Pompeia',
       'Poça grande na faixa da direita na descida para a Marginal. Carros jogando água na calçada.',
       'ALAGAMENTO', 2, SYSDATE - 30/1440
  FROM cl_via WHERE nome = 'Avenida Pompeia';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Semáforo apagado na Rua Teodoro Sampaio',
       'Semáforo do cruzamento com a Rua Henrique Schaumann apagado no horário de saída das escolas.',
       'SEMAFORO_APAGADO', 3, SYSDATE - 100/1440
  FROM cl_via WHERE nome = 'Rua Teodoro Sampaio';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Encosta cede ao lado da Avenida Corifeu de Azevedo Marques',
       'Muro de contenção cedeu e a terra fechou as faixas no sentido bairro.',
       'DESLIZAMENTO', 4, SYSDATE - 160/1440
  FROM cl_via WHERE nome = 'Avenida Corifeu de Azevedo Marques';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Colisão leve na Avenida Escola Politécnica',
       'Carro e moto se tocaram no semáforo. Sem feridos, veículos no acostamento.',
       'ACIDENTE', 2, SYSDATE - 20/1440
  FROM cl_via WHERE nome = 'Avenida Escola Politécnica';
INSERT INTO cl_ocorrencia (id_via, titulo, descricao, tipo, gravidade, dt_registro)
SELECT id_via, 'Galhos na ciclovia da Avenida Pedroso de Morais',
       'Galhos caídos bloqueiam a ciclovia perto da Praça Pan-Americana. Ciclistas indo para a pista.',
       'QUEDA_ARVORE', 3, SYSDATE - 75/1440
  FROM cl_via WHERE nome = 'Avenida Pedroso de Morais';

-- 3.4 Rotas salvas e as vias por onde cada uma passa (N:N)
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Casa para o trabalho', 'Tatuapé', 1278.42, 1065.76, 'Praça da Sé', 1044.35, 1109.19, 7787, SYSDATE - 30
  FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Entregas na Paulista', 'Tatuapé', 1278.42, 1065.76, 'Avenida Paulista', 954.63, 1158.38, 11403, SYSDATE - 20
  FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Caminho do trabalho', 'Penha', 1415.84, 1008.15, 'República', 1011.32, 1081.27, 15648, SYSDATE - 28
  FROM cl_cidadao WHERE email = 'bruno.lima@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Visita aos meus pais', 'Penha', 1415.84, 1008.15, 'Santana', 1079.42, 897.37, 15883, SYSDATE - 28
  FROM cl_cidadao WHERE email = 'bruno.lima@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Ônibus para a faculdade', 'Sapopemba', 1537.36, 1356.02, 'Avenida Paulista', 954.63, 1158.38, 17803, SYSDATE - 25
  FROM cl_cidadao WHERE email = 'carla.mendes@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Corridas da manhã', 'Pinheiros', 803.34, 1183.19, 'Brooklin', 795.19, 1387.04, 8537, SYSDATE - 22
  FROM cl_cidadao WHERE email = 'diego.santos@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'A pé até o metrô', 'Rua da Consolação', 986.85, 1094.57, 'Estação Consolação', 935.47, 1141.54, 2071, SYSDATE - 18
  FROM cl_cidadao WHERE email = 'elisa.ferreira@exemplo.com';
INSERT INTO cl_rota (id_cidadao, nome, origem_descricao, origem_x, origem_y,
                     destino_descricao, destino_x, destino_y, distancia_m, dt_criacao)
SELECT id_cidadao, 'Ciclovia até o trabalho', 'Avenida Rebouças', 864.51, 1174.33, 'Avenida Brigadeiro Faria Lima', 846.98, 1270.94, 3371, SYSDATE - 15
  FROM cl_cidadao WHERE email = 'felipe.rocha@exemplo.com';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'ana.souza@exemplo.com' AND r.nome = 'Casa para o trabalho' AND v.nome = 'Radial Leste';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'ana.souza@exemplo.com' AND r.nome = 'Entregas na Paulista' AND v.nome = 'Radial Leste';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 2 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'ana.souza@exemplo.com' AND r.nome = 'Entregas na Paulista' AND v.nome = 'Avenida 23 de Maio';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 3 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'ana.souza@exemplo.com' AND r.nome = 'Entregas na Paulista' AND v.nome = 'Avenida Paulista';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'bruno.lima@exemplo.com' AND r.nome = 'Caminho do trabalho' AND v.nome = 'Radial Leste';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'bruno.lima@exemplo.com' AND r.nome = 'Visita aos meus pais' AND v.nome = 'Radial Leste';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 2 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'bruno.lima@exemplo.com' AND r.nome = 'Visita aos meus pais' AND v.nome = 'Marginal Tietê';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 3 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'bruno.lima@exemplo.com' AND r.nome = 'Visita aos meus pais' AND v.nome = 'Avenida Cruzeiro do Sul';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'carla.mendes@exemplo.com' AND r.nome = 'Ônibus para a faculdade' AND v.nome = 'Avenida Paulista';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'diego.santos@exemplo.com' AND r.nome = 'Corridas da manhã' AND v.nome = 'Avenida Brigadeiro Faria Lima';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 2 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'diego.santos@exemplo.com' AND r.nome = 'Corridas da manhã' AND v.nome = 'Marginal Pinheiros';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'elisa.ferreira@exemplo.com' AND r.nome = 'A pé até o metrô' AND v.nome = 'Rua da Consolação';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 2 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'elisa.ferreira@exemplo.com' AND r.nome = 'A pé até o metrô' AND v.nome = 'Avenida Paulista';
INSERT INTO cl_rota_via (id_rota, id_via, ordem)
SELECT r.id_rota, v.id_via, 1 FROM cl_rota r JOIN cl_cidadao c ON c.id_cidadao = r.id_cidadao, cl_via v
 WHERE c.email = 'felipe.rocha@exemplo.com' AND r.nome = 'Ciclovia até o trabalho' AND v.nome = 'Avenida Brigadeiro Faria Lima';

-- 3.5 Endereços salvos (casa e trabalho viram atalhos na tela de rota)
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Tatuapé', 1278.42, 1065.76 FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Trabalho', 'TRABALHO', 'Praça da Sé', 1044.35, 1109.19 FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Penha', 1415.84, 1008.15 FROM cl_cidadao WHERE email = 'bruno.lima@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Trabalho', 'TRABALHO', 'República', 1011.32, 1081.27 FROM cl_cidadao WHERE email = 'bruno.lima@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa dos meus pais', 'OUTRO', 'Santana', 1079.42, 897.37 FROM cl_cidadao WHERE email = 'bruno.lima@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Sapopemba', 1537.36, 1356.02 FROM cl_cidadao WHERE email = 'carla.mendes@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Faculdade', 'ESTUDO', 'Avenida Paulista', 954.63, 1158.38 FROM cl_cidadao WHERE email = 'carla.mendes@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Pinheiros', 803.34, 1183.19 FROM cl_cidadao WHERE email = 'diego.santos@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Rua da Consolação', 986.85, 1094.57 FROM cl_cidadao WHERE email = 'elisa.ferreira@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Trabalho', 'TRABALHO', 'Estação Consolação', 935.47, 1141.54 FROM cl_cidadao WHERE email = 'elisa.ferreira@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Casa', 'CASA', 'Avenida Rebouças', 864.51, 1174.33 FROM cl_cidadao WHERE email = 'felipe.rocha@exemplo.com';
INSERT INTO cl_endereco (id_cidadao, apelido, tipo, descricao, pos_x, pos_y)
SELECT id_cidadao, 'Trabalho', 'TRABALHO', 'Avenida Brigadeiro Faria Lima', 846.98, 1270.94 FROM cl_cidadao WHERE email = 'felipe.rocha@exemplo.com';

-- 3.6 Feiras livres e favoritas
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Mercado da Rua da Consolação', 'Rua da Consolação', 'Centro', 'SEGUNDA', '08:00 às 13:00');
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Feira da Avenida Paulista', 'Avenida Paulista', 'Centro', 'QUARTA', '08:00 às 17:00');
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Mercado da Vila Mariana', 'Avenida Santo Amaro', 'Zona Sul', 'SEXTA', '09:00 às 16:00');
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Feira da Vila Prudente', 'Rua Padre Adelino', 'Zona Leste', 'SABADO', '07:30 às 14:00');
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Feira de Mandaqui', 'Avenida General Ataliba Leonel', 'Zona Norte', 'DOMINGO', '08:00 às 15:00');
INSERT INTO cl_feira (nome, rua, zona, dia_semana, horario) VALUES ('Mercado da Lapa', 'Rua da Lapa', 'Centro', 'TERCA', '08:30 às 13:30');

INSERT INTO cl_cidadao_feira (id_cidadao, id_feira)
SELECT c.id_cidadao, f.id_feira
FROM cl_cidadao c
JOIN cl_feira f ON f.rua = 'Rua da Consolação' AND f.dia_semana = 'SEGUNDA'
WHERE c.email IN ('ana.souza@exemplo.com', 'elisa.ferreira@exemplo.com');

INSERT INTO cl_cidadao_feira (id_cidadao, id_feira)
SELECT c.id_cidadao, f.id_feira
FROM cl_cidadao c
JOIN cl_feira f ON f.rua = 'Avenida Paulista' AND f.dia_semana = 'QUARTA'
WHERE c.email IN ('bruno.lima@exemplo.com', 'carla.mendes@exemplo.com');

-- Segurança: pontos de apoio (dados de demonstração; o telefone é a central do serviço)
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia de Polícia · Sé', 'DELEGACIA', 'Sé', 'Centro', '197', 'S', NULL, NULL, 1056.4, 1098.2);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia da Mulher · República', 'DELEGACIA_MULHER', 'República', 'Centro', '180', 'S', NULL, NULL, 1019.8, 1084.6);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Polícia Militar · Santa Cecília', 'POLICIA_MILITAR', 'Santa Cecília', 'Centro', '190', 'S', NULL, NULL, 951.2, 1050.1);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Guarda Civil · Liberdade', 'GUARDA_MUNICIPAL', 'Liberdade', 'Centro', '153', 'S', NULL, NULL, 1058.3, 1176.4);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Pronto-socorro · Bela Vista', 'SAUDE_24H', 'Bela Vista', 'Centro', '192', 'S', NULL, NULL, 982.1, 1148.9);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro de Referência da Mulher · Consolação', 'ACOLHIMENTO', 'Consolação', 'Centro', '156', 'N', '08:00', '18:00', 940.6, 1108.3);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia de Polícia · Santana', 'DELEGACIA', 'Santana', 'Zona Norte', '197', 'S', NULL, NULL, 1070.1, 899.4);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Guarda Civil · Casa Verde', 'GUARDA_MUNICIPAL', 'Casa Verde', 'Zona Norte', '153', 'S', NULL, NULL, 957.4, 909.8);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('UPA 24h · Tucuruvi', 'SAUDE_24H', 'Tucuruvi', 'Zona Norte', '192', 'S', NULL, NULL, 1164.9, 804.1);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Polícia Militar · Brasilândia', 'POLICIA_MILITAR', 'Brasilândia', 'Zona Norte', '190', 'S', NULL, NULL, 812.6, 735.2);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro de Assistência Social · Freguesia do Ó', 'ACOLHIMENTO', 'Freguesia do Ó', 'Zona Norte', '156', 'N', '08:00', '17:00', 797.3, 827.0);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia de Polícia · Tatuapé', 'DELEGACIA', 'Tatuapé', 'Zona Leste', '197', 'S', NULL, NULL, 1288.7, 1071.3);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia da Mulher · Penha', 'DELEGACIA_MULHER', 'Penha', 'Zona Leste', '180', 'N', '09:00', '18:00', 1408.2, 995.0);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Polícia Militar · Itaquera', 'POLICIA_MILITAR', 'Itaquera', 'Zona Leste', '190', 'S', NULL, NULL, 1768.1, 1049.7);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('UPA 24h · São Mateus', 'SAUDE_24H', 'São Mateus', 'Zona Leste', '192', 'S', NULL, NULL, 1661.4, 1318.2);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Guarda Civil · Mooca', 'GUARDA_MUNICIPAL', 'Mooca', 'Zona Leste', '153', 'S', NULL, NULL, 1197.6, 1151.6);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro de Assistência Social · Guaianases', 'ACOLHIMENTO', 'Guaianases', 'Zona Leste', '156', 'N', '08:00', '17:00', 1966.0, 1121.5);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia de Polícia · Vila Mariana', 'DELEGACIA', 'Vila Mariana', 'Zona Sul', '197', 'S', NULL, NULL, 1040.6, 1292.7);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia da Mulher · Santo Amaro', 'DELEGACIA_MULHER', 'Santo Amaro', 'Zona Sul', '180', 'S', NULL, NULL, 775.5, 1505.4);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Polícia Militar · Jabaquara', 'POLICIA_MILITAR', 'Jabaquara', 'Zona Sul', '190', 'S', NULL, NULL, 1000.9, 1541.6);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('UPA 24h · Campo Limpo', 'SAUDE_24H', 'Campo Limpo', 'Zona Sul', '192', 'S', NULL, NULL, 522.4, 1486.2);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Guarda Civil · Ipiranga', 'GUARDA_MUNICIPAL', 'Ipiranga', 'Zona Sul', '153', 'S', NULL, NULL, 1175.4, 1301.6);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro de Assistência Social · Capão Redondo', 'ACOLHIMENTO', 'Capão Redondo', 'Zona Sul', '156', 'N', '08:00', '17:00', 452.9, 1640.8);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Delegacia de Polícia · Pinheiros', 'DELEGACIA', 'Pinheiros', 'Zona Oeste', '197', 'S', NULL, NULL, 836.8, 1164.3);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Polícia Militar · Lapa', 'POLICIA_MILITAR', 'Lapa', 'Zona Oeste', '190', 'S', NULL, NULL, 760.8, 978.2);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('UPA 24h · Butantã', 'SAUDE_24H', 'Butantã', 'Zona Oeste', '192', 'S', NULL, NULL, 665.0, 1189.9);
INSERT INTO cl_ponto_apoio (nome, tipo, bairro, zona, telefone, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Base da Guarda Civil · Perdizes', 'GUARDA_MUNICIPAL', 'Perdizes', 'Zona Oeste', '153', 'S', NULL, NULL, 896.8, 1059.8);

INSERT INTO cl_contato_emergencia (id_cidadao, nome, telefone, parentesco)
SELECT id_cidadao, 'Marina Souza', '(11) 98888-0101', 'Irmã' FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_contato_emergencia (id_cidadao, nome, telefone, parentesco)
SELECT id_cidadao, 'Roberto Souza', '(11) 97777-0102', 'Pai' FROM cl_cidadao WHERE email = 'ana.souza@exemplo.com';
INSERT INTO cl_contato_emergencia (id_cidadao, nome, telefone, parentesco)
SELECT id_cidadao, 'Lúcia Ferreira', '(11) 96666-0201', 'Mãe' FROM cl_cidadao WHERE email = 'elisa.ferreira@exemplo.com';
INSERT INTO cl_contato_emergencia (id_cidadao, nome, telefone, parentesco)
SELECT id_cidadao, 'Gabriel Rocha', '(11) 95555-0301', 'Irmão' FROM cl_cidadao WHERE email = 'felipe.rocha@exemplo.com';

-- 3.7 Programas de moradia (Habitação · consulta)
-- Faixas e limites conferidos nas regras do MCMV de 2026 (Portaria MCID 333/2026). Os valores mudam: confirme no site oficial.
INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Minha Casa Minha Vida · Faixa 1', 'CASA_PROPRIA', 'AMBOS',
        'Casa própria com o maior subsídio do programa, em empreendimentos selecionados pela Prefeitura.',
        'Famílias com renda mensal bruta de até R$ 3.200, inscritas no CadÚnico e sem imóvel próprio. A seleção segue sorteio e critérios de prioridade, como mulheres responsáveis pela família, idosos e pessoas com deficiência.',
        3200,
        'RG e CPF de todos da família;CadÚnico atualizado (NIS);Comprovante de residência;Comprovante de renda ou autodeclaração;Certidão de nascimento ou casamento',
        'Cadastro habitacional da Prefeitura (Sehab) nos períodos de inscrição. Para atualizar o CadÚnico, procure o CRAS da sua região.',
        'https://prefeitura.sp.gov.br/web/habitacao');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Minha Casa Minha Vida · Faixas 2, 3 e 4', 'CASA_PROPRIA', 'AMBOS',
        'Financiamento de imóvel novo ou usado com juros abaixo do mercado e, nas faixas de menor renda, subsídio na entrada.',
        'Famílias com renda mensal bruta de até R$ 13.000: faixa 2 até R$ 5.000, faixa 3 até R$ 9.600 e faixa 4 até R$ 13.000. O crédito precisa ser aprovado pelo banco e o imóvel precisa estar dentro do valor máximo da faixa.',
        13000,
        'RG e CPF;Comprovante de renda dos últimos meses;Comprovante de residência;Certidão de nascimento ou casamento;Carteira de trabalho ou declaração do Imposto de Renda',
        'Direto na Caixa ou em outro banco do programa, ou com a construtora do empreendimento que você escolheu.',
        'https://www.caixa.gov.br');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Programa de moradia da CDHU', 'CASA_PROPRIA', 'AMBOS',
        'Moradia popular do governo do Estado de São Paulo, com inscrição em períodos divulgados pela companhia.',
        'Famílias de baixa renda que atendam aos critérios do programa estadual vigente. Cada período de inscrição publica as regras, as faixas de renda e os grupos com prioridade.',
        NULL,
        'RG e CPF;Comprovante de residência;Comprovante de renda familiar;Certidão de nascimento ou casamento',
        'Site da CDHU ou atendimento presencial da companhia, nos períodos de inscrição.',
        'https://www.cdhu.sp.gov.br');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Auxílio aluguel (aluguel social)', 'ALUGUEL', 'PRESENCIAL',
        'Benefício temporário em dinheiro para pagar aluguel enquanto a família espera uma solução de moradia definitiva.',
        'Famílias em emergência habitacional, como removidas de áreas de risco, atingidas por enchentes ou por obras públicas, que não tenham imóvel próprio. Depende de laudo da assistência social ou da Defesa Civil.',
        NULL,
        'RG ou documento oficial com foto;CPF;Comprovante de renda familiar ou autodeclaração;Comprovante de residência ou termo de remoção;Laudo da Defesa Civil ou relatório da assistência social',
        'CRAS da sua região ou atendimento da Sehab. Parte do atendimento também pode ser consultada pelo SP156.',
        'https://prefeitura.sp.gov.br/web/habitacao');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Auxílio aluguel para mulheres em situação de violência', 'ALUGUEL', 'PRESENCIAL',
        'R$ 400 por mês, como complemento de renda para as despesas de moradia.',
        'Mulheres vítimas de violência doméstica em situação de vulnerabilidade social, atendidas pela rede de proteção do município.',
        NULL,
        'RG ou documento oficial com foto;CPF;Comprovante de renda ou autodeclaração;Boletim de ocorrência ou relatório do atendimento, quando houver',
        'Casa da Mulher Brasileira, Casas da Mulher e Centros de Defesa e de Convivência da Mulher (CDCM), da Secretaria de Direitos Humanos.',
        'https://www.prefeitura.sp.gov.br/cidade/secretarias/direitos_humanos/mulheres/auxilio_aluguel/');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Locação social', 'ALUGUEL', 'PRESENCIAL',
        'Apartamentos públicos alugados com valor subsidiado, para quem precisa de moradia sem comprar um imóvel.',
        'Famílias de baixa renda em vulnerabilidade habitacional. A seleção e o valor do aluguel dependem da renda e da análise da Sehab.',
        NULL,
        'RG e CPF;Comprovante de renda familiar;Comprovante de residência;Certidão de nascimento ou casamento;CadÚnico atualizado',
        'Atendimento da Secretaria Municipal de Habitação (Sehab) ou chamamentos públicos divulgados no Diário Oficial.',
        'https://prefeitura.sp.gov.br/web/habitacao');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Regularização fundiária (escritura do seu imóvel)', 'REGULARIZACAO', 'PRESENCIAL',
        'Transforma a posse em propriedade: a família passa a ter o documento do imóvel em seu nome.',
        'Moradores de loteamentos, conjuntos ou núcleos urbanos irregulares já consolidados. Para famílias de baixa renda, a regularização é gratuita. Confira antes se o seu bairro já tem um processo aberto.',
        NULL,
        'RG e CPF;Comprovante de residência (conta de água ou luz);Contrato de compra e venda, recibo ou declaração de posse;Certidão de nascimento ou casamento;CadÚnico ou comprovante de renda',
        'Sehab ou subprefeitura da sua região, que informam se o seu núcleo está em processo de regularização.',
        'https://prefeitura.sp.gov.br/web/habitacao');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Reforma Casa Brasil', 'REFORMA', 'ONLINE',
        'Crédito de R$ 10 mil a R$ 50 mil para reformar, melhorar ou ampliar a sua casa, com juros reduzidos.',
        'Famílias com renda mensal bruta de até R$ 13.000 e imóvel em área urbana, que pode ser próprio, alugado ou cedido. A Caixa analisa o crédito, e quem mora em área de risco não pode participar.',
        13000,
        'RG e CPF;Comprovante de renda;Comprovante de residência;Fotos do imóvel que será reformado',
        'Site ou aplicativo da Caixa (simulação e contratação 100% digitais) ou agência da Caixa.',
        'https://www.caixa.gov.br');

INSERT INTO cl_programa_moradia (nome, tipo, canal, descricao, quem_tem_direito, renda_maxima, documentos, onde_inscrever, site)
VALUES ('Orientação jurídica sobre despejo e remoção', 'OUTRO', 'AMBOS',
        'Defesa gratuita de quem foi notificado para sair de casa ou corre risco de remoção.',
        'Pessoas que não podem pagar um advogado e enfrentam despejo, reintegração de posse ou remoção. Você tem direito de receber uma notificação formal ou um mandado judicial antes de sair.',
        NULL,
        'RG e CPF;Comprovante de residência;Notificação, mandado ou processo recebido;Contrato de aluguel ou documento que mostre a moradia',
        'Núcleo de Habitação e Urbanismo da Defensoria Pública do Estado de São Paulo.',
        'https://www.defensoria.sp.def.br');

-- 3.8 Inscrições dos cidadãos nos programas (Habitação · perfil)
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'EM_ANALISE', 'HAB-2026-048213', 'Entreguei os documentos no CRAS da Penha.', SYSDATE - 62, SYSDATE - 9
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'ana.souza@exemplo.com' AND p.nome = 'Minha Casa Minha Vida · Faixa 1';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'INSCRITO', NULL, 'Simulação feita no aplicativo da Caixa.', SYSDATE - 4, SYSDATE - 4
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'ana.souza@exemplo.com' AND p.nome = 'Reforma Casa Brasil';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'APROVADO', 'CX-77120-2026', 'Crédito aprovado. Falta a vistoria do imóvel.', SYSDATE - 40, SYSDATE - 6
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'bruno.lima@exemplo.com' AND p.nome = 'Minha Casa Minha Vida · Faixas 2, 3 e 4';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'INSCRITO', NULL, NULL, SYSDATE - 15, SYSDATE - 15
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'bruno.lima@exemplo.com' AND p.nome = 'Regularização fundiária (escritura do seu imóvel)';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'APROVADO', 'SEHAB-AA-2025-3391', 'Benefício ativo. Renovar o cadastro no próximo semestre.', SYSDATE - 180, SYSDATE - 30
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'carla.mendes@exemplo.com' AND p.nome = 'Auxílio aluguel (aluguel social)';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'EM_ANALISE', 'CDM-2026-1184', NULL, SYSDATE - 21, SYSDATE - 3
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'elisa.ferreira@exemplo.com' AND p.nome = 'Auxílio aluguel para mulheres em situação de violência';
INSERT INTO cl_inscricao_programa (id_cidadao, id_programa, status, protocolo, observacao, dt_inscricao, dt_atualizacao)
SELECT c.id_cidadao, p.id_programa, 'INSCRITO', NULL, 'Inscrição pelo site no período aberto em outubro.', SYSDATE - 28, SYSDATE - 28
  FROM cl_cidadao c, cl_programa_moradia p
 WHERE c.email = 'felipe.rocha@exemplo.com' AND p.nome = 'Programa de moradia da CDHU';


-- Lazer: lugares e programação gratuita (dados de demonstração; datas relativas a hoje)
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque Ibirapuera', 'PARQUE', 'Vila Mariana', 'Zona Sul', 'N', '05:00', '00:00', 940.6, 1276.1);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque Villa-Lobos', 'PARQUE', 'Alto de Pinheiros', 'Zona Oeste', 'N', '05:30', '19:00', 676.6, 1093.1);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque da Juventude', 'PARQUE', 'Santana', 'Zona Norte', 'N', '06:00', '22:00', 1096.9, 918.8);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque do Belém', 'PARQUE', 'Belém', 'Zona Leste', 'N', '06:00', '18:00', 1229.4, 1037.5);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque Ecológico do Tietê', 'PARQUE', 'Engenheiro Goulart', 'Zona Leste', 'N', '08:00', '17:00', 1509.4, 827.5);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque da Aclimação', 'PARQUE', 'Aclimação', 'Centro', 'N', '05:00', '20:00', 1065.5, 1217.8);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque da Água Branca', 'PARQUE', 'Água Branca', 'Zona Oeste', 'N', '06:00', '20:00', 897.8, 1021.8);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Parque Santo Dias', 'PARQUE', 'Capão Redondo', 'Zona Sul', 'N', '06:00', '18:00', 476.6, 1612.6);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Praça da Sé', 'PRACA', 'Sé', 'Centro', 'S', NULL, NULL, 1053.0, 1104.0);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('CEU · Butantã', 'CEU', 'Butantã', 'Zona Oeste', 'N', '07:00', '22:00', 661.4, 1193.6);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('CEU · Guaianases', 'CEU', 'Guaianases', 'Zona Leste', 'N', '07:00', '22:00', 1969.8, 1117.9);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('CEU · Casa Verde', 'CEU', 'Casa Verde', 'Zona Norte', 'N', '07:00', '22:00', 953.6, 912.5);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('CEU · Campo Limpo', 'CEU', 'Campo Limpo', 'Zona Sul', 'N', '07:00', '22:00', 518.8, 1489.9);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro Cultural São Paulo', 'CENTRO_CULTURAL', 'Liberdade', 'Centro', 'N', '10:00', '20:00', 1040.0, 1205.0);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Casa de Cultura · Penha', 'CENTRO_CULTURAL', 'Penha', 'Zona Leste', 'N', '09:00', '18:00', 1411.9, 991.3);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Casa de Cultura · Santo Amaro', 'CENTRO_CULTURAL', 'Santo Amaro', 'Zona Sul', 'N', '09:00', '18:00', 771.9, 1509.1);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Biblioteca Mário de Andrade', 'BIBLIOTECA', 'República', 'Centro', 'N', '08:00', '20:00', 1015.5, 1080.0);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Biblioteca · Lapa', 'BIBLIOTECA', 'Lapa', 'Zona Oeste', 'N', '09:00', '18:00', 757.1, 981.9);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro Esportivo · Mooca', 'ESPORTIVO', 'Mooca', 'Zona Leste', 'N', '07:00', '21:00', 1194.0, 1155.3);
INSERT INTO cl_lugar_lazer (nome, tipo, bairro, zona, aberto_24h, abre, fecha, pos_x, pos_y)
VALUES ('Centro Esportivo · Tucuruvi', 'ESPORTIVO', 'Tucuruvi', 'Zona Norte', 'N', '07:00', '21:00', 1161.1, 800.4);

INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Aulão de ioga ao ar livre', 'ESPORTE',
       'Aula aberta para todas as idades no gramado perto do lago. Leve uma canga ou toalha.',
       TRUNC(SYSDATE) + 1 + 480/1440, TRUNC(SYSDATE) + 1 + 570/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Ibirapuera';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Orquestra no parque', 'MUSICA',
       'Concerto gratuito com repertório popular e erudito na área do palco ao ar livre.',
       TRUNC(SYSDATE) + 3 + 660/1440, TRUNC(SYSDATE) + 3 + 780/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Ibirapuera';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Festival de pipas', 'INFANTIL',
       'Oficina de pipas com linha sem cerol e soltura acompanhada por monitores.',
       TRUNC(SYSDATE) + 12 + 600/1440, TRUNC(SYSDATE) + 12 + 960/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Ibirapuera';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Corrida e caminhada orientada', 'ESPORTE',
       'Percurso de 5 km com aquecimento e professores de educação física.',
       TRUNC(SYSDATE) + 2 + 420/1440, TRUNC(SYSDATE) + 2 + 540/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Villa-Lobos';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Cinema ao ar livre: sessão família', 'CINEMA',
       'Filme de animação no telão. Chegue cedo e leve uma canga.',
       TRUNC(SYSDATE) + 5 + 1140/1440, TRUNC(SYSDATE) + 5 + 1260/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Villa-Lobos';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Oficina de grafite', 'OFICINA',
       'Técnicas básicas de grafite com artistas da zona norte. Material incluso.',
       TRUNC(SYSDATE) + 1 + 840/1440, TRUNC(SYSDATE) + 1 + 1020/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque da Juventude';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Torneio de basquete 3x3', 'ESPORTE',
       'Inscrição das equipes no local, a partir das 8h. Categorias juvenil e adulto.',
       TRUNC(SYSDATE) + 6 + 540/1440, TRUNC(SYSDATE) + 6 + 900/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque da Juventude';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Contação de histórias para crianças', 'INFANTIL',
       'Histórias e brincadeiras para crianças de 3 a 8 anos, perto do parquinho.',
       TRUNC(SYSDATE) + 900/1440, TRUNC(SYSDATE) + 990/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque do Belém';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Passeio de observação de aves', 'CULTURA',
       'Trilha guiada por biólogos, com binóculos emprestados no centro de visitantes.',
       TRUNC(SYSDATE) + 4 + 480/1440, TRUNC(SYSDATE) + 4 + 660/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Ecológico do Tietê';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Roda de choro no coreto', 'MUSICA',
       'Músicos da região tocam choro e samba; quem toca pode levar o instrumento.',
       TRUNC(SYSDATE) + 2 + 960/1440, TRUNC(SYSDATE) + 2 + 1080/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque da Aclimação';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Feira de trocas de livros e brinquedos', 'INFANTIL',
       'Traga um livro ou brinquedo em bom estado e troque por outro.',
       TRUNC(SYSDATE) + 6 + 600/1440, TRUNC(SYSDATE) + 6 + 900/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque da Água Branca';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Futebol de várzea: final do campeonato', 'ESPORTE',
       'Final do campeonato da região, com torcida organizada e food trucks.',
       TRUNC(SYSDATE) + 7 + 540/1440, TRUNC(SYSDATE) + 7 + 720/1440
  FROM cl_lugar_lazer WHERE nome = 'Parque Santo Dias';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Teatro infantil: o jardim da cidade', 'INFANTIL',
       'Peça sobre cuidar dos espaços públicos, para crianças de 4 a 10 anos.',
       TRUNC(SYSDATE) + 3 + 900/1440, TRUNC(SYSDATE) + 3 + 990/1440
  FROM cl_lugar_lazer WHERE nome = 'CEU · Butantã';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Show de rap da quebrada', 'MUSICA',
       'Artistas da zona leste no palco do teatro do CEU. Classificação 14 anos.',
       TRUNC(SYSDATE) + 4 + 1080/1440, TRUNC(SYSDATE) + 4 + 1260/1440
  FROM cl_lugar_lazer WHERE nome = 'CEU · Guaianases';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Aula aberta de dança de salão', 'CULTURA',
       'Forró, samba de gafieira e bolero para iniciantes. Não precisa de par.',
       TRUNC(SYSDATE) + 1140/1440, TRUNC(SYSDATE) + 1260/1440
  FROM cl_lugar_lazer WHERE nome = 'CEU · Casa Verde';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Mostra de curtas da periferia', 'CINEMA',
       'Curtas-metragens feitos por coletivos da zona sul, com bate-papo no fim.',
       TRUNC(SYSDATE) + 8 + 1140/1440, TRUNC(SYSDATE) + 8 + 1260/1440
  FROM cl_lugar_lazer WHERE nome = 'CEU · Campo Limpo';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Exposição de fotografia urbana', 'CULTURA',
       'Retratos de trabalhadores e trabalhadoras do centro de São Paulo.',
       TRUNC(SYSDATE) + 600/1440, TRUNC(SYSDATE) + 1200/1440
  FROM cl_lugar_lazer WHERE nome = 'Centro Cultural São Paulo';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Sessão de cinema nacional', 'CINEMA',
       'Clássico do cinema brasileiro na sala de projeção. Retire a senha 1 hora antes.',
       TRUNC(SYSDATE) + 1 + 1080/1440, TRUNC(SYSDATE) + 1 + 1200/1440
  FROM cl_lugar_lazer WHERE nome = 'Centro Cultural São Paulo';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Oficina de cerâmica', 'OFICINA',
       'Modelagem em argila para iniciantes. Vagas limitadas por ordem de chegada.',
       TRUNC(SYSDATE) + 2 + 840/1440, TRUNC(SYSDATE) + 2 + 1020/1440
  FROM cl_lugar_lazer WHERE nome = 'Casa de Cultura · Penha';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Sarau aberto', 'CULTURA',
       'Microfone aberto para poesia, música e leitura. Inscreva-se na hora.',
       TRUNC(SYSDATE) + 5 + 1140/1440, TRUNC(SYSDATE) + 5 + 1260/1440
  FROM cl_lugar_lazer WHERE nome = 'Casa de Cultura · Santo Amaro';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Clube de leitura', 'CULTURA',
       'Conversa sobre um romance brasileiro contemporâneo. Exemplares para empréstimo.',
       TRUNC(SYSDATE) + 3 + 1080/1440, TRUNC(SYSDATE) + 3 + 1170/1440
  FROM cl_lugar_lazer WHERE nome = 'Biblioteca Mário de Andrade';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Palestra: histórias do centro', 'CULTURA',
       'Pesquisadores contam a história dos prédios e ruas do centro.',
       TRUNC(SYSDATE) - 1 + 1080/1440, TRUNC(SYSDATE) - 1 + 1200/1440
  FROM cl_lugar_lazer WHERE nome = 'Biblioteca Mário de Andrade';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Hora do conto', 'INFANTIL',
       'Leitura em voz alta para crianças, com atividade de desenho depois.',
       TRUNC(SYSDATE) + 1 + 600/1440, TRUNC(SYSDATE) + 1 + 660/1440
  FROM cl_lugar_lazer WHERE nome = 'Biblioteca · Lapa';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Natação para iniciantes: aula aberta', 'ESPORTE',
       'Aula experimental na piscina. Traga touca, óculos e atestado médico.',
       TRUNC(SYSDATE) + 4 + 540/1440, TRUNC(SYSDATE) + 4 + 600/1440
  FROM cl_lugar_lazer WHERE nome = 'Centro Esportivo · Mooca';
INSERT INTO cl_evento_lazer (id_lugar, titulo, categoria, descricao, dt_inicio, dt_fim)
SELECT id_lugar, 'Vôlei de quadra: aula aberta', 'ESPORTE',
       'Fundamentos de vôlei para adolescentes e adultos.',
       TRUNC(SYSDATE) + 9 + 1020/1440, TRUNC(SYSDATE) + 9 + 1140/1440
  FROM cl_lugar_lazer WHERE nome = 'Centro Esportivo · Tucuruvi';

INSERT INTO cl_cidadao_evento (id_cidadao, id_evento)
SELECT c.id_cidadao, e.id_evento
  FROM cl_cidadao c, cl_evento_lazer e
 WHERE c.email = 'ana.souza@exemplo.com' AND e.titulo = 'Orquestra no parque';
INSERT INTO cl_cidadao_evento (id_cidadao, id_evento)
SELECT c.id_cidadao, e.id_evento
  FROM cl_cidadao c, cl_evento_lazer e
 WHERE c.email = 'ana.souza@exemplo.com' AND e.titulo = 'Roda de choro no coreto';
INSERT INTO cl_cidadao_evento (id_cidadao, id_evento)
SELECT c.id_cidadao, e.id_evento
  FROM cl_cidadao c, cl_evento_lazer e
 WHERE c.email = 'felipe.rocha@exemplo.com' AND e.titulo = 'Corrida e caminhada orientada';

COMMIT;


-- 4. Conferência: linhas em cada tabela -------------------------------
SELECT 'CL_CIDADAO' AS tabela, COUNT(*) AS linhas FROM cl_cidadao
UNION ALL SELECT 'CL_VIA', COUNT(*) FROM cl_via
UNION ALL SELECT 'CL_OCORRENCIA', COUNT(*) FROM cl_ocorrencia
UNION ALL SELECT 'CL_ROTA', COUNT(*) FROM cl_rota
UNION ALL SELECT 'CL_ROTA_VIA', COUNT(*) FROM cl_rota_via
UNION ALL SELECT 'CL_ENDERECO', COUNT(*) FROM cl_endereco
UNION ALL SELECT 'CL_FEIRA', COUNT(*) FROM cl_feira
UNION ALL SELECT 'CL_CIDADAO_FEIRA', COUNT(*) FROM cl_cidadao_feira
UNION ALL SELECT 'CL_PONTO_APOIO', COUNT(*) FROM cl_ponto_apoio
UNION ALL SELECT 'CL_CONTATO_EMERGENCIA', COUNT(*) FROM cl_contato_emergencia
UNION ALL SELECT 'CL_PROGRAMA_MORADIA', COUNT(*) FROM cl_programa_moradia
UNION ALL SELECT 'CL_INSCRICAO_PROGRAMA', COUNT(*) FROM cl_inscricao_programa
UNION ALL SELECT 'CL_LUGAR_LAZER', COUNT(*) FROM cl_lugar_lazer
UNION ALL SELECT 'CL_EVENTO_LAZER', COUNT(*) FROM cl_evento_lazer
UNION ALL SELECT 'CL_CIDADAO_EVENTO', COUNT(*) FROM cl_cidadao_evento;
