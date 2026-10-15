# OrçaCerto

> Aplicação de produção: [orcacerto.vercel.app](https://orcacerto.vercel.app/)
>
> **GIF do fluxo real (aprox. 10 segundos): pendente de gravação.** O arquivo deverá ser salvo em `docs/media/orcacerto-fluxo.gif`. Veja as [instruções para produzir a captura](docs/media/README.md). Nenhuma animação ilustrativa foi usada como evidência do produto.

O OrçaCerto é uma aplicação web para autônomos, MEIs, prestadores de serviço e pequenos negócios criarem e acompanharem orçamentos comerciais.

## Funcionalidades

- Autenticação por Google usando Supabase Auth; o projeto também mantém o fluxo de cadastro e acesso por e-mail existente.
- Cadastro de clientes e gerenciamento de orçamentos, itens, status e modelos de documento.
- Cálculo de subtotal, descontos fixos por item e total em reais.
- Geração de PDF no navegador com jsPDF e html2canvas, incluindo documentos com várias páginas.
- Abertura do WhatsApp com uma mensagem preenchida para revisão e envio. O navegador não confirma o envio e o PDF deve ser anexado à conversa pelo usuário.
- Configurações da empresa e preferências visuais para os documentos.
- Dashboard, relatórios e interface adaptável a diferentes larguras de tela.

## Tecnologias

- React 19, TypeScript e Vite.
- Tailwind CSS e Lucide React.
- Supabase Auth e PostgreSQL.
- jsPDF e html2canvas.
- Vitest para testes unitários dos cálculos.
- Vercel para publicação e reescrita de rotas da SPA.

## Requisitos

- Node.js 22.12 ou superior.
- npm.
- Um projeto Supabase configurado com o esquema do OrçaCerto e as credenciais de OAuth do Google.

## Instalação e execução local

```bash
npm install
cp .env.example .env.local
npm run dev
```

O Vite serve a aplicação em `http://localhost:3000`. Preencha as variáveis em `.env.local` antes de testar login ou persistência. Não compartilhe esse arquivo.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública de cliente do Supabase. A RLS deve proteger todos os dados privados. O código ainda aceita `VITE_SUPABASE_ANON_KEY` como nome legado. |
| `VITE_FREE_ACCESS_ENABLED` | Opcional; omitida ou `true` mantém o acesso gratuito que já está ativo no frontend. |

O Client ID e o Client Secret do Google são configurados no provedor Google do Supabase. Não coloque o Client Secret, uma service role key ou outra credencial privilegiada em variáveis `VITE_*`.

## Configuração do Supabase e Google OAuth

1. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente local e nas variáveis de build da Vercel.
2. No Supabase, habilite o provedor Google em **Authentication → Providers → Google** e informe o Client ID e o Client Secret criados no Google Cloud.
3. No Google Cloud, adicione como URI de redirecionamento autorizada a URL de callback mostrada pelo Supabase, no formato `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Em **Authentication → URL Configuration** no Supabase, defina a URL do site e permita os callbacks da aplicação: `https://orcacerto.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`. Acrescente outros domínios de preview que forem usados.
5. Confirme a URL base do projeto e o fluxo de confirmação de e-mail, se o cadastro por e-mail estiver habilitado.

O app monta o callback `/auth/callback` usando o domínio que iniciou o fluxo. As configurações externas do Google, Supabase e Vercel não foram verificadas por esta auditoria.

## Banco de dados e migrations

O esquema SQL existente está em `supabase/`. As tabelas centrais incluem `profiles`, `companies`, `clients`, `budgets`, `budget_items`, `notifications` e `subscriptions`. Os itens pertencem a um orçamento, que pertence a um usuário; clientes, empresas e orçamentos também guardam `user_id`.

Foi adicionada a migration versionada `supabase/migrations/20261014000000_security_rls_ownership.sql`. Ela habilita RLS, recria políticas de proprietário para operações por usuário, valida que o cliente associado ao orçamento também pertence ao usuário, restringe os campos de perfil que o frontend pode gravar e bloqueia acesso de cliente às tabelas administrativas. Ela não foi aplicada nem testada contra o banco de produção nesta execução.

Para o banco já existente, revise e aplique a migration no SQL Editor do Supabase. Faça backup e valide em ambiente de teste antes de aplicar em produção. Os scripts legados `supabase/schema.sql` e `supabase/setup_complete_database.sql` são referências de instalação e não substituem a migration incremental. Para futuras migrações, mantenha arquivos SQL versionados em `supabase/migrations/`.

Depois de aplicar, valide com duas contas autenticadas distintas: cada uma deve consultar e alterar apenas os próprios clientes, orçamentos e itens; tentativas de associar orçamento ao cliente de outra conta devem falhar. Confirme também que `profiles` não permite alterar plano, limites, status de assinatura ou identificadores de cobrança pelo cliente.

## Testes e verificações

```bash
npm run test:run
npm run lint
npm run build
```

Os testes automatizados cobrem cálculos de item, subtotal, desconto fixo, total final, valores decimais, arredondamento, entradas inválidas, zero, orçamento vazio, limites numéricos usados pelo banco, construção do callback OAuth e codificação de mensagens do WhatsApp. Eles não substituem o login real, testes RLS com múltiplas contas ou validação visual em dispositivos físicos.

## Deploy na Vercel

1. Importe o repositório GitHub na Vercel.
2. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e, se necessário, `VITE_FREE_ACCESS_ENABLED` nas variáveis de ambiente para cada ambiente.
3. Use `npm run build` como comando de build e `dist` como diretório de saída.
4. Cadastre os domínios de produção e preview na configuração de redirecionamento do Supabase e confirme os domínios OAuth no Google Cloud.

O arquivo `vercel.json` contém cabeçalhos e regras de reescrita para as rotas da SPA. A auditoria local não valida a configuração ativa da Vercel nem o deploy em produção.

## Capturas e GIF

Não havia captura real da aplicação autenticada no repositório. O GIF solicitado pelo professor ainda precisa ser gravado com uma conta autorizada e dados não sensíveis. Grave, em cerca de 10 segundos, a criação do orçamento, sua visualização, a geração do PDF e a abertura da mensagem no WhatsApp; salve o resultado em `docs/media/orcacerto-fluxo.gif`. O fluxo deve usar a aplicação real, sem substituir as operações por telas compostas.

## Limitações conhecidas

- O envio do WhatsApp depende de confirmação manual e o aplicativo não recebe retorno que comprove que a mensagem foi enviada.
- O PDF é renderizado a partir do documento visível no navegador. Imagens externas, como logotipos, precisam permitir carregamento CORS para aparecer na exportação.
- Login Google, recuperação de sessão, gravação no Supabase, isolamento entre contas, RLS aplicada em produção, responsividade em celular físico e o fluxo completo de produção ainda dependem de validação em ambientes externos.
- A licença MIT está incluída em [`LICENSE`](LICENSE), com o titular dos direitos autorais informado.

## Licença

Este projeto é distribuído sob a licença MIT. Consulte o arquivo [`LICENSE`](LICENSE) para ver o texto completo e o titular dos direitos autorais.
