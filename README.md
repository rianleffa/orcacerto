# ⚡ OrçaCerto

> **Faça seu orçamento. Feche seu negócio.**

O **OrçaCerto** é um sistema de gestão de orçamentos desenvolvido para MEIs, autônomos, prestadores de serviços e pequenas empresas.

## 🚀 Funcionalidades

- Criação e personalização de orçamentos.
- Geração e download de PDFs profissionais.
- Compartilhamento de propostas pelo WhatsApp.
- Cadastro e gerenciamento de clientes.
- Acompanhamento do status dos orçamentos.
- Dashboard com indicadores e relatórios financeiros.
- Duplicação de orçamentos.
- Configuração de dados da empresa, logotipo e chave PIX.
- Interface responsiva com modo claro e escuro.
- Autenticação e armazenamento com Supabase.
- Modo demonstração com dados de exemplo.

## 🛠️ Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL e autenticação)
- jsPDF e html2canvas

## ⚙️ Como executar

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (por padrão, http://localhost:3000).

### Configuração do Supabase

O projeto usa Supabase para autenticação e para salvar os dados de contas reais. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no arquivo `.env.local` (há um modelo em `.env.example`). Essas variáveis também precisam ser definidas no ambiente de produção antes de gerar a versão publicada.

Para habilitar o painel administrativo e registrar visitas, aplique `supabase/admin_dashboard.sql` no SQL Editor do projeto Supabase. O script cria as tabelas e funções necessárias e restringe o painel à conta confirmada configurada na função `is_site_admin()`; revise essa conta no script antes de aplicá-lo. Os dados antigos de acesso não são reconstruídos.

O modo gratuito temporário é controlado por `VITE_FREE_ACCESS_ENABLED=true` e pela configuração global no banco. Aplique `supabase/free_access_mode.sql` no SQL Editor para habilitar o acesso gratuito no trigger de orçamentos. Para reativar os planos no futuro, defina `free_access_enabled` como `false` em `public.app_settings` e `VITE_FREE_ACCESS_ENABLED=false` no ambiente de build. Nenhuma coluna, conta, registro ou configuração de cobrança é removida.

Se usar login Google, habilite o provedor em Supabase > Authentication > Providers e cadastre os endereços de desenvolvimento e produção em Authentication > URL Configuration. A URL de callback OAuth do Google deve ser a URL fornecida pelo Supabase, não a URL local do OrçaCerto.

### Verificações locais

```bash
npm run lint
npm run build
```

O modo de demonstração fica disponível na tela de login e usa dados de exemplo locais; ele não confirma a configuração do banco nem salva dados na conta Supabase.

## 📄 Sobre o projeto

O OrçaCerto facilita a criação, organização e gestão de orçamentos comerciais, ajudando pequenos negócios a profissionalizar suas propostas e acompanhar suas oportunidades de venda.
