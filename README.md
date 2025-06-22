.
# Hub de Ferramentas - Sistema de Gestão Completo

Um sistema completo de gestão com integrações, IA e dashboard administrativo desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login/Logout seguro com Supabase Auth
- Controle de acesso baseado em roles (usuário/admin)
- Proteção de rotas com middleware
- Gestão de sessões e tokens

### ✅ Dashboard Administrativo Completo
- **Gestão de Usuários**: Visualização, edição e controle total
- **Controle de Planos**: Trial, Mensal, Trimestral, Anual, Vitalício
- **Status de Usuários**: Online/Offline, último acesso
- **Observações**: Sistema completo de anotações por usuário
- **Estatísticas em Tempo Real**: Usuários totais, ativos, receita
- **Sistema de Logs**: Rastreamento de todas as ações administrativas

### ✅ Sistema de Assinaturas
- Planos: Trial (7 dias), Mensal (R$ 97), Trimestral (R$ 267), Anual (R$ 997), Vitalício (R$ 1.997)
- Status: Ativo, Pendente, Expirado, Cancelado
- Controle de datas de expiração
- Gestão automática de acesso baseada no plano

### ✅ Interface de Usuário
- Design moderno com Tailwind CSS e Shadcn/UI
- Animações suaves com Framer Motion
- Responsivo para desktop e mobile
- Tema consistente azul/indigo
- Feedback visual com toasts e notificações

### ✅ Banco de Dados Supabase
- **Tabelas**: profiles, user_roles, user_subscriptions, user_integrations, admin_logs
- **RLS (Row Level Security)**: Políticas de segurança implementadas
- **Triggers**: Criação automática de perfis e planos trial
- **Funções**: Verificação de admin, atualização de status online
- **Tempo Real**: Updates automáticos no dashboard

## 🔧 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/UI
- **Animações**: Framer Motion
- **Backend**: Supabase (Auth, Database, Realtime)
- **Roteamento**: React Router DOM
- **Estado**: TanStack Query
- **Ícones**: Lucide React

## 📋 Funcionalidades Pendentes

### 🔄 Para Implementar

#### 1. Sistema de Email Marketing
- [ ] Integração com serviço de email (SendGrid/Mailgun)
- [ ] Templates de email personalizáveis
- [ ] Campanhas segmentadas por tipo de usuário
- [ ] Automação de emails (boas-vindas, cobrança, etc.)

#### 2. Sistema de Pagamentos
- [ ] Integração com gateway de pagamento (Stripe/Mercado Pago)
- [ ] Checkout automático
- [ ] Gestão de faturas e recibos
- [ ] Webhooks para atualização automática de status

#### 3. Integrações Externas
- [ ] **Mercado Livre**: API completa para gestão de produtos
- [ ] **IA Gemini**: Integração para análises e sugestões
- [ ] **WhatsApp Business**: Automação de mensagens
- [ ] **Outras APIs**: Conforme necessidade dos clientes

#### 4. Dashboard de Usuário
- [ ] Painel personalizado para cada usuário
- [ ] Métricas e relatórios individuais
- [ ] Configurações de conta
- [ ] Histórico de uso e logs

#### 5. Sistema de Suporte
- [ ] Chat interno para suporte
- [ ] Sistema de tickets
- [ ] Base de conhecimento
- [ ] FAQ dinâmico

#### 6. Analytics Avançado
- [ ] Métricas detalhadas de uso
- [ ] Relatórios de performance
- [ ] Dashboards personalizáveis
- [ ] Exportação de dados

#### 7. Mobile App (Futuro)
- [ ] React Native ou PWA
- [ ] Notificações push
- [ ] Sincronização offline

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes Shadcn/UI
│   └── ProtectedRoute  # Middleware de autenticação
├── hooks/              # Hooks customizados
│   └── useAuth         # Hook de autenticação
├── pages/              # Páginas da aplicação
│   ├── Auth            # Login/Cadastro
│   ├── Dashboard       # Dashboard do usuário
│   ├── AdminDashboard  # Painel administrativo
│   └── ...
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos do Supabase
└── lib/                # Utilitários
```

## 🚀 Como Executar

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITÓRIO]
cd hub-de-ferramentas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# As credenciais do Supabase já estão configuradas no cliente
```

4. **Execute o projeto**
```bash
npm run dev
```

## 👨‍💼 Acesso Administrativo

Para acessar o painel administrativo:

1. Faça cadastro com o email: `lucasgabrielbarbosa84@gmail.com`
2. Execute a query SQL no Supabase para adicionar role de admin
3. Acesse `/admin` para o painel completo

## 📞 Suporte

**Lucas - Desenvolvedor e Suporte Técnico**
- 📧 Email: hubdeferramentas@gmail.com  
- 📱 WhatsApp: (11) 9 4897-3101

## 🔐 Segurança

- RLS (Row Level Security) ativo em todas as tabelas
- Autenticação JWT com Supabase
- Políticas de acesso granulares
- Logs de auditoria para ações administrativas
- Validação de dados client e server-side

## 📊 Status do Projeto

- ✅ **Fase 1**: Sistema base e autenticação - **CONCLUÍDA**
- ✅ **Fase 2**: Dashboard administrativo - **CONCLUÍDA**  
- 🔄 **Fase 3**: Integrações e pagamentos - **EM PLANEJAMENTO**
- ⏳ **Fase 4**: Features avançadas - **FUTURO**

---

*Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento web moderno.*
