
# Hub Ferramentas - SaaS para Vendedores do Mercado Livre

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Controle de Acesso](#controle-de-acesso)
- [Páginas e Componentes](#páginas-e-componentes)
- [Configuração e Instalação](#configuração-e-instalação)
- [Deploy e Produção](#deploy-e-produção)
- [Manutenção e Atualizações](#manutenção-e-atualizações)

## 🎯 Visão Geral

O Hub Ferramentas é uma plataforma SaaS (Software as a Service) desenvolvida especificamente para vendedores do Mercado Livre que desejam automatizar e otimizar suas operações de venda. A plataforma oferece três ferramentas principais:

1. **Gestão Inteligente de Estoque** - Sincronização automática de produtos entre múltiplos anúncios
2. **Respostas Automáticas com IA** - Sistema de atendimento automatizado usando Inteligência Artificial
3. **Analytics Avançado** - Relatórios e métricas detalhadas para otimização de vendas

### Modelo de Negócio
- **Tipo**: SaaS por assinatura mensal
- **Valor**: R$ 149,90/mês
- **Controle de Acesso**: Manual (liberação após pagamento e contato)
- **Target**: Vendedores do Mercado Livre que buscam automação e crescimento

## 🏗️ Arquitetura do Sistema

### Frontend (React + TypeScript)
```
┌─────────────────────────────────────┐
│           FRONTEND LAYER            │
├─────────────────────────────────────┤
│ • React 18 + TypeScript             │
│ • Vite (Build Tool)                 │
│ • Tailwind CSS (Styling)           │
│ • Framer Motion (Animations)       │
│ • React Router (Navigation)        │
│ • Shadcn/ui (Component Library)    │
└─────────────────────────────────────┘
```

### Autenticação (Clerk)
```
┌─────────────────────────────────────┐
│         AUTHENTICATION LAYER        │
├─────────────────────────────────────┤
│ • Clerk.com (Auth Provider)         │
│ • Email/Password Authentication     │
│ • User Profile Management          │
│ • Session Management               │
│ • Protected Routes                 │
└─────────────────────────────────────┘
```

### Controle de Acesso Personalizado
```
┌─────────────────────────────────────┐
│         ACCESS CONTROL LAYER        │
├─────────────────────────────────────┤
│ • Custom Hook (useAccessControl)    │
│ • Email-based Access List          │
│ • Manual Approval System           │
│ • Payment Verification Process     │
└─────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
src/
├── components/                 # Componentes reutilizáveis
│   ├── ui/                    # Componentes base (shadcn/ui)
│   ├── AccessDenied.tsx       # Tela de acesso negado
│   ├── Features.tsx           # Seção de recursos (homepage)
│   ├── Hero.tsx               # Seção hero (homepage)
│   ├── Navbar.tsx             # Navegação principal
│   └── Pricing.tsx            # Seção de preços
│
├── pages/                     # Páginas da aplicação
│   ├── Index.tsx              # Homepage
│   ├── Dashboard.tsx          # Dashboard principal
│   ├── AdminDashboard.tsx     # Dashboard administrativo
│   ├── Settings.tsx           # Configurações
│   ├── Billing.tsx            # Faturamento
│   ├── StockManagement.tsx    # Gestão de Estoque
│   ├── AiResponses.tsx        # Respostas IA
│   ├── Analytics.tsx          # Analytics
│   └── NotFound.tsx           # Página 404
│
├── hooks/                     # Custom Hooks
│   ├── useAccessControl.tsx   # Controle de acesso
│   ├── use-mobile.tsx         # Detecção mobile
│   └── use-toast.ts           # Sistema de toasts
│
├── lib/                       # Utilities
│   └── utils.ts               # Funções utilitárias
│
├── App.tsx                    # Componente raiz
├── main.tsx                   # Entry point
└── index.css                  # Estilos globais
```

## 💻 Tecnologias Utilizadas

### Core Framework
- **React 18.3.1** - Library JavaScript para interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool moderna e rápida

### Styling & UI
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **Shadcn/ui** - Biblioteca de componentes baseada em Radix UI
- **Framer Motion 12.18.1** - Biblioteca de animações
- **Lucide React 0.462.0** - Biblioteca de ícones

### Autenticação & Estado
- **Clerk React 5.32.0** - Serviço de autenticação
- **TanStack React Query 5.56.2** - Gerenciamento de estado servidor
- **React Router DOM 6.26.2** - Roteamento client-side

### Funcionalidades Adicionais
- **React Hook Form 7.53.0** - Gerenciamento de formulários
- **React Intersection Observer 9.16.0** - Observer para scroll
- **Date-fns 3.6.0** - Manipulação de datas
- **Recharts 2.12.7** - Biblioteca de gráficos

## ⚙️ Funcionalidades

### 1. Homepage (Landing Page)
- **Hero Section**: Apresentação da proposta de valor
- **Features Section**: Demonstração das três ferramentas principais
- **Pricing Section**: Plano único de R$ 149,90/mês
- **Navegação Suave**: Scroll automático para seções
- **Call-to-Actions**: Botões de cadastro integrados com Clerk

### 2. Sistema de Autenticação
- **Registro**: Cadastro via email/senha através do Clerk
- **Login**: Autenticação segura
- **Perfil**: Gerenciamento de dados do usuário
- **Sessões**: Manutenção automática de sessões ativas

### 3. Controle de Acesso Manual
- **Verificação**: Sistema personalizado que verifica email do usuário
- **Lista de Aprovados**: Array de emails liberados (em `useAccessControl.tsx`)
- **Tela de Bloqueio**: Interface amigável para usuários não aprovados
- **Processo de Liberação**: Instruções claras para contato e pagamento

### 4. Dashboard Principal
- **Métricas**: Visão geral de produtos, vendas e IA
- **Navegação**: Acesso rápido a todas as ferramentas
- **Status**: Indicadores de configuração e integração
- **Responsivo**: Interface adaptativa para mobile/desktop

### 5. Gestão de Estoque
- **Sincronização**: Preparado para integração com API do Mercado Livre
- **Alertas**: Sistema de notificações para estoque baixo
- **Múltiplos Anúncios**: Gerenciamento centralizado
- **Relatórios**: Movimentação e histórico de produtos

### 6. Respostas IA
- **Configuração**: Setup para integração com Gemini AI
- **Automação**: Respostas automáticas para perguntas frequentes
- **Aprendizado**: Sistema preparado para machine learning
- **Métricas**: Acompanhamento de performance da IA

### 7. Analytics
- **Dashboards**: Gráficos de vendas e performance
- **KPIs**: Métricas-chave de negócio
- **Relatórios**: Exportação de dados
- **Insights**: Análises automáticas e recomendações

## 🔐 Sistema de Autenticação

### Configuração do Clerk
```typescript
// main.tsx - Configuração principal
const PUBLISHABLE_KEY = "pk_test_Y2hlZXJmdWwtZ3JpZmZvbi03LmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
```

### Proteção de Rotas
```typescript
// App.tsx - Proteção com SignedIn
<Route 
  path="/dashboard" 
  element={
    <SignedIn>
      <Dashboard />
    </SignedIn>
  } 
/>
```

### Componentes de Autenticação
- `<SignInButton>` - Botão de login
- `<SignUpButton>` - Botão de cadastro  
- `<UserButton>` - Menu do usuário
- `<SignedIn>` - Wrapper para usuários logados
- `<SignedOut>` - Wrapper para usuários não logados

## 🛡️ Controle de Acesso

### Hook useAccessControl
```typescript
// hooks/useAccessControl.tsx
const APPROVED_USERS = [
  // Lista de emails aprovados
  "usuario@exemplo.com"
];

export const useAccessControl = () => {
  const { user, isLoaded } = useUser();
  
  const hasAccess = () => {
    if (!isLoaded || !user) return false;
    const userEmail = user.emailAddresses[0]?.emailAddress;
    return APPROVED_USERS.includes(userEmail || "");
  };

  return { hasAccess: hasAccess(), isLoaded, userEmail: getUserEmail() };
};
```

### Fluxo de Acesso
1. **Usuário se cadastra** via Clerk
2. **Sistema verifica** se email está na lista de aprovados
3. **Se NÃO aprovado**: Mostra tela AccessDenied
4. **Se aprovado**: Libera acesso completo ao dashboard

### Processo de Liberação
1. **Usuário entra em contato** via WhatsApp/telefone
2. **Informa email cadastrado** no sistema
3. **Realiza pagamento** de R$ 149,90
4. **Admin adiciona email** na lista APPROVED_USERS
5. **Acesso liberado** automaticamente

## 📱 Páginas e Componentes

### Homepage (Index.tsx)
- **Componentes**: Navbar, Hero, Features, Pricing
- **Funcionalidades**: Navegação suave, animações, CTAs
- **Responsividade**: Mobile-first design

### Dashboard (Dashboard.tsx)
- **Controle de Acesso**: Verificação obrigatória
- **Métricas**: Cards com dados simulados
- **Navegação**: Links para ferramentas específicas
- **Loading States**: Estados de carregamento

### Ferramentas Específicas
1. **StockManagement.tsx**: Interface de gestão de estoque
2. **AiResponses.tsx**: Painel de respostas automáticas
3. **Analytics.tsx**: Dashboard de métricas e relatórios

### AccessDenied.tsx
- **Informações**: Instruções claras de liberação
- **Contatos**: WhatsApp, telefone, email
- **Preços**: Valor da mensalidade
- **UX**: Interface amigável e profissional

## 🚀 Configuração e Instalação

### Pré-requisitos
```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### Instalação Local
```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd hub-ferramentas

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
# Crie arquivo .env.local com:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# 4. Execute em desenvolvimento
npm run dev

# 5. Build para produção
npm run build
```

### Configuração do Clerk
1. **Acesse**: https://clerk.com
2. **Crie conta** e novo projeto
3. **Configure**: Email/password authentication
4. **Copie**: Publishable Key
5. **Cole**: Em VITE_CLERK_PUBLISHABLE_KEY

### Configuração de Usuários Aprovados
```typescript
// Edite: src/hooks/useAccessControl.tsx
const APPROVED_USERS = [
  "cliente1@email.com",
  "cliente2@email.com",
  // Adicione emails aqui
];
```

## 🌐 Deploy e Produção

### Deploy na Lovable
1. **Clique**: Botão "Publish" no Lovable
2. **Domínio**: Configurado automaticamente
3. **SSL**: Certificado automático

### Deploy Manual
```bash
# Build de produção
npm run build

# Upload para servidor
# Arquivos em dist/ devem ser servidos estaticamente
```

### Variáveis de Ambiente de Produção
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...  # Chave de produção
```

### Configurações de Domínio
- **Domínio gratuito**: *.lovable.app
- **Domínio customizado**: Configure nas configurações do projeto

## 🔧 Manutenção e Atualizações

### Liberação de Novos Usuários
1. **Receba contato** do cliente
2. **Confirme pagamento** via PIX/cartão
3. **Adicione email** em APPROVED_USERS
4. **Redeploye** a aplicação
5. **Confirme acesso** com o cliente

### Monitoramento
- **Clerk Dashboard**: Estatísticas de usuários
- **Analytics**: Métricas de uso da plataforma
- **Logs**: Acompanhamento de erros

### Atualizações Frequentes
```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Build e teste
npm run build
```

### Integrações Futuras
1. **Mercado Livre API**: Para sincronização real de produtos
2. **Gemini AI**: Para respostas automáticas reais
3. **Sistema de Pagamento**: Stripe para cobrança automática
4. **Banco de Dados**: Para persistência de dados

## 📞 Suporte e Contato

### Para Desenvolvedores
- **Documentação**: Este README
- **Códigos**: Comentários inline no código
- **Estrutura**: Organização modular e clara

### Para Clientes
- **WhatsApp**: (11) 99999-9999
- **Email**: suporte@hubferramentas.com
- **Horário**: Segunda a sexta, 9h às 18h

---

## 🎯 Próximos Passos

1. **Substitua** o número de telefone em `AccessDenied.tsx`
2. **Configure** email de suporte real
3. **Implemente** integrações com APIs externas
4. **Adicione** sistema de pagamento automatizado
5. **Configure** banco de dados para persistência

Este sistema está pronto para uso com controle manual de acesso. Para automatizar completamente, considere integrar com Stripe para pagamentos e banco de dados para gerenciamento de usuários.
