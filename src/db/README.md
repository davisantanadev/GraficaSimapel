## Arquivo .sql

-- 1. TABELA DE CLIENTES
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE,
    telefone TEXT,
    cpf_cnpj TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE ESTOQUE (MATERIAIS)
CREATE TABLE estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_material TEXT NOT NULL,
    tipo_material TEXT, -- Ex: Papel, Tinta, Lona
    quantidade_atual DECIMAL DEFAULT 0,
    unidade_medida TEXT, -- Ex: Folha, ML, Metro
    nivel_critico DECIMAL DEFAULT 10,
    preco_custo_unidade DECIMAL(10,2)
);

-- 3. TABELA DE PEDIDOS/ORÇAMENTOS
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    status_producao TEXT DEFAULT 'orcamento', -- orcamento, criacao, producao, acabamento, finalizado
    status_financeiro TEXT DEFAULT 'pendente', -- pendente, pago, parcial
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_entrega_prevista DATE,
    valor_total DECIMAL(10,2) DEFAULT 0,
    margem_lucro DECIMAL(10,2)
);

-- 4. ITENS DO PEDIDO (PARA O CÁLCULO DE FOLHAS/ESTOQUE)
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    material_id UUID REFERENCES estoque(id),
    quantidade_pedida INTEGER, -- Ex: 250 unidades
    aproveitamento_folha INTEGER, -- Ex: 9 (o F9 que você citou)
    folhas_utilizadas DECIMAL GENERATED ALWAYS AS (CEIL(quantidade_pedida::float / aproveitamento_folha::float)) STORED
);

-- 5. TABELA FINANCEIRA (ENTRADAS E SAÍDAS)
CREATE TABLE financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
    descricao TEXT,
    valor DECIMAL(10,2),
    data_vencimento DATE,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente'
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar uma política que permite qualquer pessoa (ou apenas logados) ler e escrever
-- NOTA: Em produção, você deve restringir isso!
CREATE POLICY "Permitir tudo para usuários autenticados" 
ON clientes FOR ALL 
TO authenticated 
USING (true);
