# OrçaCerto

**Orçamentos profissionais para autônomos, prestadores de serviço e pequenos negócios.** Crie propostas, organize clientes e prepare o compartilhamento do documento em PDF e pelo WhatsApp.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green.svg)](LICENSE)

**Website configurado:** [orcacerto.vercel.app](https://orcacerto.vercel.app/) · **Repositório:** [github.com/rianleffa/orcacerto](https://github.com/rianleffa/orcacerto)

> **Demonstração:** ainda não há um GIF do fluxo completo neste repositório. Para mostrar criação, salvamento, PDF e WhatsApp sem encenar uma etapa, é necessária uma conta de teste autorizada no Supabase. Veja os [critérios de captura](docs/media/README.md). Nenhum dado ou tela foi inventado para esta documentação.

## O problema que resolve

Preparar um orçamento comercial costuma envolver reunir dados do cliente, descrever serviços e materiais, calcular valores e formatar um documento manualmente. O OrçaCerto reúne essas etapas em uma aplicação web para criar e acompanhar orçamentos em um só lugar.

## Funcionalidades

- Criar e acompanhar orçamentos, com itens, quantidades, descontos, valores e status.
- Cadastrar clientes e associá-los aos orçamentos.
- Conferir subtotal e total em reais, validade, condições e observações.
- Escolher entre os modelos de documento disponíveis e configurar os dados da empresa.
- Gerar um PDF a partir do documento apresentado na tela, em uma página contínua de altura dinâmica.
- Preparar uma mensagem de orçamento com `wa.me`; o usuário revisa e envia a mensagem e anexa o PDF manualmente.
- Acompanhar indicadores no dashboard e consultar relatórios.
- Acessar com e-mail e senha ou Google OAuth, por meio do Supabase Auth.

## Tecnologias

| Área | Tecnologias presentes no projeto |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS, Lucide React |
| Desenvolvimento e build | Vite 8, TypeScript, PostCSS, Autoprefixer |
| Rotas e estado | React Router 7, Context API do React |
| Autenticação e dados | Supabase Auth, Supabase JS e PostgreSQL |
| PDF e compartilhamento | jsPDF, html2canvas, links `wa.me` |
| Verificações | Vitest, oxlint |
| Publicação | Configuração de SPA para Vercel em `vercel.json` |

## Executar localmente

**Requisitos:** Node.js `^20.19.0` ou `>=22.12.0` e npm. Essas versões atendem aos requisitos do Vite instalado neste projeto.

```bash
npm install
```

Copie o exemplo de ambiente:

```powershell
Copy-Item .env.example .env.local
```

No macOS, Linux ou Git Bash, use `cp .env.example .env.local`. Depois, preencha as variáveis descritas abaixo e inicie o servidor:

```bash
npm run dev
```

O Vite disponibiliza o app em [http://localhost:3000](http://localhost:3000). Para compilar, executar as verificações ou rodar os testes definidos no repositório:

```bash
npm run build
npm run lint
npm run test:run
```

## Ambiente e Supabase

O arquivo `.env.example` contém apenas valores de exemplo. Copie-o para `.env.local` e configure o projeto Supabase que será usado localmente. O `.gitignore` exclui arquivos `.env*`, mantendo apenas `.env.example` versionado.

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do cliente Supabase. O frontend também aceita `VITE_SUPABASE_ANON_KEY` para compatibilidade. |
| `VITE_FREE_ACCESS_ENABLED` | Opcional. Omitida ou `true` mantém habilitado o modo de acesso gratuito configurado no app; `false` reativa as verificações de plano existentes. |

Não adicione senhas, chaves `service_role` ou outros segredos a variáveis `VITE_*`: elas são incluídas no bundle do navegador. Configure o Client ID e o Client Secret do Google no provedor Google do Supabase, não neste arquivo.

Para habilitar o fluxo, no painel Supabase permita cadastro por e-mail e mantenha **Confirm email** ligado em **Authentication → Sign In / Providers → Email**. Configure a URL do site e permita os retornos de produção e locais em **Authentication → URL Configuration**: `/auth/callback`, `/auth/callback?flow=confirmation` e `/redefinir-senha?flow=recovery` para `https://orcacerto.vercel.app` e `http://localhost:3000`. Acrescente domínios de preview da Vercel se forem usados. O URI de callback do Google permanece o endereço Supabase `/auth/v1/callback` já configurado no Google Cloud.

Para entregar e-mails a endereços Gmail e de outros provedores, configure um SMTP personalizado em **Authentication → SMTP Settings**. O SMTP compartilhado do Supabase é voltado a testes e, conforme a [documentação atual](https://supabase.com/docs/guides/auth/auth-smtp), restringe destinatários a membros da organização e tem limite baixo de envio. No painel de templates, mantenha `{{ .ConfirmationURL }}` nos modelos de confirmação e recuperação para preservar o retorno solicitado pelo app; veja [templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates) e [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls). Credenciais SMTP ficam somente no painel, nunca em variáveis `VITE_*`.

As migrations versionadas ficam em [`supabase/migrations/`](supabase/migrations/). Revise-as e aplique-as ao banco correspondente antes de validar gravação e políticas de acesso. A configuração ativa de Supabase, SMTP, Google OAuth e Vercel não foi verificada nesta auditoria.

## Estrutura do projeto

```text
src/
├── components/     # Componentes de interface, layout, modelos e PDF
├── context/        # Estado de autenticação, dados e tema
├── lib/            # Acesso a serviços, cálculos e utilitários
├── pages/          # Páginas da aplicação
└── types/          # Tipos compartilhados
supabase/
└── migrations/     # Migrações SQL versionadas
tests/              # Testes automatizados
docs/               # Documentação e instruções de mídia
```

## Decisões técnicas

As decisões comprováveis pelo código estão em [`docs/DECISOES_TECNICAS.md`](docs/DECISOES_TECNICAS.md), incluindo arquitetura, estado, autenticação, persistência, PDF, WhatsApp e responsividade.

## Licença

O repositório contém uma licença [MIT](LICENSE). O arquivo informa Copyright (c) 2026 Rian Cardoso Leffa.
