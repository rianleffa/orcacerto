# ⚡ OrçaCerto

> **"Faça seu orçamento. Feche seu negócio."**

O **OrçaCerto** é um Micro-SaaS completo, moderno e profissional projetado especialmente para **MEIs, autônomos, prestadores de serviços e pequenas empresas brasileiras**.

A plataforma resolve com maestria uma dor cotidiana: a necessidade de criar propostas e orçamentos elegantes em menos de 3 minutos, gerar PDFs em alta resolução, enviar diretamente pelo WhatsApp com mensagem personalizada e acompanhar o status de aprovação.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS, Lucide Icons, clsx, tailwind-merge
- **Identidade Visual:** Startup SaaS brasileira (Verde Moderno `#10B981`, Grafite e Branco puro, suporte completo a Modo Claro e Escuro)
- **Geração de PDF:** `jspdf` + `html2canvas` com renderização retinal e suporte nativo a impressão
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Row Level Security, Auth)
- **Persistência Híbrida / Offline First:** Fallback automático com armazenamento local e dados demo realistas brasileiros
- **Inteligência Artificial:** Módulo de aprimoramento de descrições ("Melhorar descrição com IA ✨") com motor contextual nativo e slot para OpenAI / Gemini API
- **Efeitos e Microinterações:** Confetti de celebração no fechamento de negócios (`canvas-confetti`), toasts, timeline interativa de status e skeletons

---

## 📁 Estrutura do Projeto

```
orcacerto/
├── public/                     # Favicon em SVG e assets públicos
├── src/
│   ├── assets/                 # Imagens e logotipos
│   ├── components/
│   │   ├── common/             # Button, Input, Modal, Badge, Card, Toast, Skeleton, EmptyState
│   │   ├── layout/             # AppLayout, MobileBottomNav, Header, Dropdowns
│   │   ├── landing/            # LandingNavbar, InteractiveSimulator, HowItWorks, Benefits, TemplatesShowcase, PricingSection, LandingFooter
│   │   ├── templates/          # ModernTemplate, ElegantTemplate, MinimalistTemplate, BudgetTemplateRenderer
│   │   └── pdf/                # PDFGenerator (renderização retinal para A4 e impressão)
│   ├── context/
│   │   ├── AuthContext.tsx     # Autenticação com 1-clique demo e Supabase Auth
│   │   ├── DataContext.tsx     # CRUD de Orçamentos, Clientes, Notificações e Empresa
│   │   └── ThemeContext.tsx    # Modo Claro (Light) e Modo Escuro (Dark)
│   ├── lib/
│   │   ├── aiService.ts        # IA de enriquecimento técnico de serviços e follow-ups
│   │   ├── mockData.ts         # Dados iniciais realistas (EletroVolt, clientes, orçamentos)
│   │   ├── supabase.ts         # Cliente Supabase com detecção de credenciais
│   │   ├── utils.ts            # Formatação de moeda (R$ BRL), datas, máscaras de CPF/CNPJ e telefone
│   │   └── whatsapp.ts         # Gerador de links wa.me com templates de mensagens
│   ├── pages/
│   │   ├── LandingPage.tsx      # Landing page de alta conversão com simulador ao vivo
│   │   ├── LoginPage.tsx        # Login com botão de demonstração rápida
│   │   ├── RegisterPage.tsx     # Cadastro de usuário e empresa
│   │   ├── OnboardingPage.tsx   # Configuração guiada em 3 etapas
│   │   ├── DashboardPage.tsx    # Painel com KPIs, follow-up prioritário e lista recente
│   │   ├── BudgetsPage.tsx      # Meus orçamentos com busca e filtros de status
│   │   ├── CreateBudgetPage.tsx # Editor split-screen com visualização ao vivo e IA
│   │   ├── BudgetDetailPage.tsx # Visualização, timeline de status, PDF, WhatsApp e follow-up
│   │   ├── ClientsPage.tsx      # Diretório de clientes e métricas financeiras
│   │   ├── ClientDetailPage.tsx # Histórico individual de orçamentos e dados do cliente
│   │   ├── ReportsPage.tsx      # Gráficos de conversão e desempenho (7d, 30d, 90d)
│   │   ├── PlansPage.tsx        # Planos (Gratuito, Profissional, Premium) com checkout demo
│   │   └── SettingsPage.tsx     # Configurações da empresa, chave PIX, logo e temas
│   ├── types/
│   │   └── database.ts          # Definições completas de TypeScript
│   ├── App.tsx                  # Definição de rotas e providers
│   ├── index.css                # Diretivas Tailwind e estilos de impressão
│   └── main.tsx                 # Ponto de entrada React
├── supabase/
│   └── schema.sql               # Script SQL com tabelas, RLS e triggers
├── .env.example                 # Exemplo de variáveis de ambiente
├── tailwind.config.js           # Cores customizadas da marca e animações
├── tsconfig.json
└── vite.config.ts
```

---

## ⚡ Como Instalar e Executar

### 1. Pré-requisitos
- Node.js versão 18+ instalada
- Gerenciador de pacotes npm

### 2. Instalação das dependências
Abra o terminal no diretório do projeto:
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O Vite iniciará a aplicação. Acesse a URL indicada no terminal (geralmente `http://localhost:5173`).

---

## 🧪 Modo Demonstração Instantâneo

O OrçaCerto foi desenvolvido com o conceito **Zero Friction**:
- Não é obrigatório configurar o Supabase para testar o sistema.
- Se nenhuma variável de ambiente for configurada, o sistema inicializa automaticamente no **Modo Demo**, com:
  - 4 clientes brasileiros pré-cadastrados (com telefones, endereços e histórico).
  - 5 orçamentos de exemplo em diferentes status (Aprovado, Aguardando aprovação, Enviado, Rascunho, Expirado).
  - Empresa de exemplo: *EletroVolt Soluções Elétricas*.
  - Notificações de negócios fechados e follow-up.
  - Na tela de login (`/login`), há um botão de **1 clique** para entrar direto na demonstração!

---

## 🗄️ Configuração do Supabase (Opcional para Produção)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Acesse o **SQL Editor** do seu painel do Supabase.
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` e execute.
4. No arquivo `.env` (copiado a partir de `.env.example`), adicione suas chaves:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
5. Reinicie o servidor (`npm run dev`). O sistema conectará com o PostgreSQL e aplicará as políticas de segurança RLS (`auth.uid() = user_id`).

---

## 🎯 Principais Funcionalidades

### 1. Landing Page Interativa
- **Simulador ao Vivo**: O visitante digita o nome do cliente, serviço e valor, e vê o orçamento sendo formatado e o botão do WhatsApp pronto para disparo instantâneo.
- Apresentação dos 3 modelos de templates.
- Benefícios focados no público brasileiro.

### 2. Criação Rápida de Orçamentos (Split-Screen)
- **Tela dividida**: Formulário de um lado e prévia real do documento do outro.
- **✨ Melhorar descrição com IA**: Transforma anotações curtas em descrições comerciais de alto padrão com vocabulário técnico.
- **Cálculo instantâneo**: Descontos, quantidades e valor total atualizados a cada tecla.
- **3 Templates Inclusos**:
  - *Modelo Moderno*: Cabeçalho contemporâneo e cores vibrantes.
  - *Modelo Elegante*: Tipografia serifada, molduras clássicas e acabamento refinado.
  - *Modelo Minimalista*: Linhas em grafite, clareza extrema e foco total em dados.
- Assinatura digital visual configurável.

### 3. Compartilhamento & Envio
- **Geração de PDF**: Download com 1 clique de arquivo formatado em A4 com logotipo e cores da sua empresa.
- **Envio no WhatsApp**: Botão direto que abre o WhatsApp Web / App com a mensagem pré-formatada.
- **Follow-up Inteligente**: Mensagens prontas para cobrança cordial e fechamento de propostas abertas há mais de 2 dias.

### 4. Gestão & Desempenho
- Acompanhamento por status (🟡 Rascunho, 🔵 Enviado, 🟢 Aprovado, 🔴 Recusado, ⚪ Expirado).
- Efeito festivo de **confetti** ao marcar um orçamento como Aprovado!
- Duplicação de orçamentos com 1 clique.
- Relatórios com funil de conversão e filtros por período (7d, 30d, 90d).
- Alternância instantânea entre **Modo Claro** e **Modo Escuro**.
- Experiência mobile responsiva com barra inferior de navegação.

---

## 📄 Licença

Desenvolvido para empreendedores, autônomos e pequenos negócios que valorizam agilidade e profissionalismo.
