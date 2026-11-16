# ✦ Toudy Style & Co

Loja online de roupas streetwear com catálogo, carrinho, login de clientes e checkout.
Frete grátis e embalagem ecológica.

> **Status:** em desenvolvimento. O fluxo de compra cria o pedido como `pendente`; a integração
> com pagamento (PIX e cartão) ainda não foi feita.

## Funcionalidades

- Home com seções institucionais, produtos em destaque, avaliações e contato
- Catálogo por categoria: **Camisetas, Calças, Moletons e Polos**
- Produtos "EM BREVE" e controle de estoque por tamanho (P, M, G, GG)
- Carrinho salvo no navegador (`localStorage`)
- Cadastro e login de clientes (Supabase Auth)
- Checkout com endereço de entrega e forma de pagamento (PIX, cartão de crédito ou débito)
- Inscrição na newsletter

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript puro |
| Banco de dados e autenticação | [Supabase](https://supabase.com) (PostgreSQL, Auth e RLS) |
| Fontes | Bebas Neue e Space Grotesk (Google Fonts) |

## Estrutura do projeto

```
Toudy/
├── index.html          # Site completo (páginas, estilos e carrinho)
├── supabase-loja.js    # Integração com o Supabase (catálogo, newsletter, login e checkout)
├── README.md
└── *.png               # Imagens dos produtos e das seções (h1, h2, h3, i1, j1, k1...)
```

## Banco de dados

| Tabela | Função |
|---|---|
| `categorias` | Camisetas, Calças, Moletons e Polos |
| `produtos` | Catálogo: nome, preço, imagem, `em_breve` e `ativo` |
| `produto_tamanhos` | Estoque de cada produto por tamanho |
| `usuarios` | Perfil do cliente, ligado ao Supabase Auth |
| `enderecos` | Endereços de entrega do cliente |
| `pedidos` | Pedidos, com status e forma de pagamento |
| `itens_pedido` | Itens de cada pedido (produto, tamanho, quantidade e preço) |
| `depoimentos` | Avaliações exibidas na home |
| `inscritos_newsletter` | E-mails cadastrados na newsletter |

**Status do pedido:** `pendente`, `pago`, `enviado`, `entregue` ou `cancelado`.

### Como o checkout funciona

O cliente **não grava pedidos diretamente** nas tabelas. O site chama a função
`criar_pedido(endereco_id, forma_pagamento, itens)`, que roda no servidor e:

1. confere se o cliente está logado e se o endereço é dele;
2. busca o preço real de cada produto no banco (o preço enviado pelo navegador é ignorado);
3. baixa o estoque do tamanho escolhido e recusa a compra se não houver unidades;
4. cria o pedido e seus itens, calculando o total.

### Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas.
- Catálogo, categorias e depoimentos são públicos e somente leitura.
- Cada cliente só enxerga o próprio perfil, endereços e pedidos.
- A lista de e-mails da newsletter não pode ser lida pelo site.
- A chave usada em `supabase-loja.js` é a chave **pública** (`sb_publishable_...`), segura para ficar no
  front-end. **Nunca** coloque a chave `service_role` no código.

## Como rodar

1. Clone o repositório:
   ```bash
   git clone https://github.com/Seiasseios/Toudy.git
   cd Toudy
   ```
2. Abra o `index.html` no navegador, ou use uma extensão como o Live Server do VS Code.
3. Mantenha as imagens `.png` na mesma pasta do `index.html`.

O site já vem configurado para o projeto Supabase da Toudy. Para usar outro projeto, troque a URL e a
chave pública no início do `supabase-loja.js`.

## Como testar a compra

1. Abra o site, entre em uma categoria e clique em um produto.
2. Escolha um tamanho e adicione ao carrinho.
3. Clique em **Finalizar compra** e crie uma conta.
   O Supabase envia um e-mail de confirmação: confirme e entre.
4. Preencha o endereço, escolha a forma de pagamento e confirme.
5. Confira o pedido na tabela `pedidos` do painel do Supabase.

## Próximos passos

- [ ] Integrar pagamento (PIX e cartão) com um gateway
- [ ] Aplicar a regra "apenas uma peça por CPF"
- [ ] Página "Meus pedidos" para o cliente
- [ ] Painel para gerenciar produtos, estoque e pedidos
- [ ] Carregar os produtos em destaque da home a partir do banco

## Contato

Toudy Style & Co · toudyreidelas244@hotmail.com

© 2025 Toudy Style & Co. Todos os direitos reservados.
