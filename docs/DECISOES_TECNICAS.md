# Decisões técnicas do OrçaCerto

Este documento registra características e decisões verificáveis no código atual. Ele não afirma que integrações externas estejam configuradas ou que migrations tenham sido aplicadas em produção.

## Arquitetura da aplicação

- O frontend é uma SPA React inicializada em [`src/main.tsx`](../src/main.tsx). [`src/App.tsx`](../src/App.tsx) configura `BrowserRouter`, o tema e o rastreador de visitas.
- As rotas públicas e autenticadas são separadas; as páginas principais são carregadas sob demanda com `React.lazy`. [`src/AuthenticatedRoutes.tsx`](../src/AuthenticatedRoutes.tsx) agrupa as rotas protegidas e os provedores de autenticação, dados e notificações.
- A interface é dividida em páginas, componentes reutilizáveis, contextos, utilitários e tipos dentro de `src/`.
- Vite executa o servidor de desenvolvimento e o build. [`vite.config.ts`](../vite.config.ts) define a porta 3000, o alvo ES2020 e separa alguns grupos de dependências em chunks.

## Tecnologias

As dependências declaradas em [`package.json`](../package.json) incluem React, TypeScript, Vite, React Router, Tailwind CSS, Supabase JS, Lucide React, jsPDF, html2canvas, Vitest e oxlint. O CSS usa as diretivas Tailwind em [`src/index.css`](../src/index.css); os scripts npm definem build, lint e testes.

## Estado da interface

- `AuthContext` mantém o usuário e o estado de carregamento da autenticação.
- `DataContext` mantém orçamentos, clientes, empresa e notificações no estado React e concentra as operações desses dados.
- `ThemeContext` mantém o tema claro ou escuro e grava a preferência em `localStorage`.
- O código não declara uma biblioteca externa de estado global; os contextos React e o estado local dos componentes sustentam a interface.

## Autenticação

O [`AuthContext`](../src/context/AuthContext.tsx) usa Supabase Auth para restaurar uma sessão, autenticar com e-mail e senha, cadastrar, reenviar confirmação, solicitar redefinição e alterar a senha, além de iniciar OAuth com Google. [`ProtectedRoute`](../src/components/auth/ProtectedRoute.tsx) impede acesso às rotas privadas sem uma sessão autenticada. A aplicação declara no próprio contexto que um valor em cache local, isoladamente, não autentica o usuário.

O callback OAuth e a confirmação de e-mail usam `/auth/callback`; o pedido de confirmação identifica o fluxo por `flow=confirmation`. A recuperação retorna a `/redefinir-senha?flow=recovery`, onde a interface exige a sessão e o evento `PASSWORD_RECOVERY` do Supabase antes de aceitar uma nova senha. O login grava a sessão em `localStorage` quando “Lembrar de mim” está ativo e em `sessionStorage` quando está desativado; verificadores PKCE permanecem no armazenamento local para continuar acessíveis ao abrir links de e-mail em outra aba. As credenciais, templates e URLs permitidas de Google e Supabase são configuração externa; sua configuração ativa não pode ser inferida apenas pelo código.

## Persistência e banco de dados

- O cliente de [`src/lib/supabase.ts`](../src/lib/supabase.ts) é criado com `@supabase/supabase-js` e lê a configuração pública de variáveis de ambiente.
- `DataContext` consulta e grava empresas, clientes, orçamentos e itens no Supabase para usuários considerados persistentes pelo código. O estado também é copiado para `localStorage` em chaves associadas ao ID de usuário e usado como fallback em alguns caminhos de leitura.
- As tabelas centrais usadas pelo fluxo incluem `companies`, `clients`, `budgets` e `budget_items`. Os esquemas e migrations SQL estão em [`supabase/`](../supabase/). A migration [`20261014000000_security_rls_ownership.sql`](../supabase/migrations/20261014000000_security_rls_ownership.sql) habilita políticas de acesso por proprietário e valida relações entre registros. A presença do arquivo não comprova que ele foi aplicado ou verificado no banco publicado.

## Geração de PDF

O fluxo em [`PDFGenerator.ts`](../src/components/pdf/PDFGenerator.ts) importa jsPDF e html2canvas sob demanda, captura o elemento HTML do orçamento como imagem e o inclui no PDF. A captura usa largura de documento fixa em CSS e escala 2; isso foi implementado para manter uma largura de documento consistente quando o pedido de exportação vem de telas com larguras diferentes.

O PDF usa largura de 210 mm, margens de 12 mm e uma única página cuja altura é calculada pela proporção da captura. Assim, a altura acompanha o conteúdo. Como a captura é inserida como PNG, o documento gerado é visualmente fiel à composição HTML, mas seu texto não é uma camada textual selecionável. O CSS de impressão em [`src/index.css`](../src/index.css) também contém regras para impressão do navegador; o botão de PDF da aplicação usa o caminho jsPDF/html2canvas.

## WhatsApp e outras integrações

- [`src/lib/whatsapp.ts`](../src/lib/whatsapp.ts) monta uma mensagem com número, itens, valores e validade e a codifica em uma URL `wa.me`. Se houver um telefone brasileiro de 10 ou 11 dígitos sem código de país, o código acrescenta `55`.
- O compartilhamento abre a conversa ou mensagem preparada no WhatsApp. O app não envia a mensagem por conta própria nem anexa automaticamente o arquivo PDF; essas ações ficam com o usuário.
- [`src/lib/cakto.ts`](../src/lib/cakto.ts) contém links para checkout externo da Cakto. Não implementa um formulário próprio de pagamento; o fluxo retorna sem abrir checkout quando o modo de acesso gratuito está habilitado.
- O rastreador em [`src/lib/analytics.ts`](../src/lib/analytics.ts) tenta registrar visitas por uma função RPC do Supabase e trata falhas sem interromper a navegação.

## Responsividade e apresentação do documento

A interface usa utilitários responsivos do Tailwind CSS nas páginas e componentes, além de regras CSS globais. O tema claro/escuro é aplicado pela classe `dark` no elemento raiz.

Na exportação do orçamento, a largura do documento é definida para uma área consistente, as dimensões máximas e o recorte são removidos e a captura mede a altura real do conteúdo. Essa escolha permite que a largura da tela de celular não determine a largura final do PDF. As regras específicas da captura estão em [`src/index.css`](../src/index.css) e no gerador de PDF.

## Publicação e configuração

[`vercel.json`](../vercel.json) contém regras para servir rotas da SPA e cabeçalhos HTTP. [`index.html`](../index.html) declara `https://orcacerto.vercel.app/` como URL canônica. Esses arquivos registram a configuração pretendida, mas não comprovam disponibilidade atual do site ou estado do deploy.
