# Lucas Agora V2 — Supabase

Esta versão já está preparada para funcionar entre celulares diferentes.

## O que já existe
- Cadastro e login por e-mail/senha
- Conta `client` ou `business`
- Perfil de empresa
- Cliente publica pedido no banco online
- Empresas veem pedidos abertos
- Empresa envia/atualiza proposta
- Cliente recebe propostas
- Cliente escolhe uma proposta
- Atualização Realtime
- PWA
- RLS no banco

## Passo 1 — Criar projeto no Supabase
1. Entre em https://supabase.com/
2. Crie um projeto.
3. Abra `SQL Editor`.
4. Cole TODO o conteúdo do arquivo `supabase_schema.sql`.
5. Execute.

## Passo 2 — Pegar as credenciais públicas
No painel do projeto, use o botão/área `Connect` ou API settings e copie:
- Project URL
- Publishable key

Abra `config.js` e substitua:
- `COLE_SUA_PROJECT_URL_AQUI`
- `COLE_SUA_PUBLISHABLE_KEY_AQUI`

NUNCA coloque `service_role`, secret key ou senha do banco em `config.js`.

## Passo 3 — Auth
Por padrão, o Supabase pode exigir confirmação de e-mail.
Para testes, você pode confirmar o e-mail recebido.
Em produção, mantenha confirmação de e-mail.

## Passo 4 — Publicar
Envie os arquivos para a raiz do repositório GitHub Pages:
- index.html
- config.js
- manifest.json
- sw.js

## Teste real
1. Celular A: crie conta Cliente.
2. Publique um pedido.
3. Celular B: crie conta Empresa.
4. Complete o perfil da empresa.
5. Veja o pedido do Cliente.
6. Responda com preço e prazo.
7. O Celular A recebe a proposta.
8. O cliente escolhe a empresa.

## Segurança
A V2 usa Row Level Security.
O navegador usa apenas a `publishable key`.
Nunca publique `service_role` / secret key.
