
# Guia de Configuração das Integrações

## Pré-requisitos

1. **Supabase CLI instalada**:
```bash
npm install -g supabase
```

2. **Login e vinculação do projeto**:
```bash
# Fazer login
supabase login

# Vincular projeto
supabase link --project-ref zbumnxegxvvhittxfdxh
```

## Configuração das Variáveis Secretas

### 1. Mercado Livre

Para obter as credenciais do Mercado Livre:
1. Acesse: https://developers.mercadolivre.com.br/
2. Crie uma aplicação
3. Anote o `CLIENT_ID` e `CLIENT_SECRET`

```bash
# Configurar segredos do Mercado Livre
supabase secrets set ML_CLIENT_ID="SEU_CLIENT_ID_AQUI"
supabase secrets set ML_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
```

### 2. Gemini AI

Para obter a API key do Gemini:
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma nova API key
3. Copie a chave gerada

```bash
# Configurar segredo do Gemini
supabase secrets set GEMINI_API_KEY="SUA_API_KEY_AQUI"
```

### 3. Supabase Service Role (obrigatório)

1. Vá para o painel do Supabase: https://supabase.com/dashboard/project/zbumnxegxvvhittxfdxh/settings/api
2. Copie a "service_role key" (não a anon key)

```bash
# Configurar chave de serviço
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY_AQUI"
```

### 4. URL do Site (para redirects)

```bash
# Para desenvolvimento local
supabase secrets set SITE_URL="http://localhost:5173"

# Para produção (substitua pela sua URL da Vercel)
supabase secrets set SITE_URL="https://seu-site.vercel.app"
```

## Deploy das Edge Functions

Após configurar todos os segredos:

```bash
# Deploy de todas as funções
supabase functions deploy
```

## Verificação

Para verificar se tudo está funcionando:

1. **Acesse a página de Integrações** no seu app
2. **Teste a conexão com Gemini AI** - deve mostrar "conectado"
3. **Conecte com Mercado Livre** - deve redirecionar para autorização
4. **Verifique os logs** na página de integrações para debug

## Comandos Úteis

```bash
# Ver logs de uma função específica
supabase functions logs mercado-livre-integration

# Ver logs do Gemini
supabase functions logs gemini-ai

# Listar segredos configurados
supabase secrets list

# Atualizar um segredo
supabase secrets set NOME_DO_SEGREDO="novo_valor"
```

## URLs das Funções (após deploy)

- Mercado Livre OAuth Start: `https://zbumnxegxvvhittxfdxh.supabase.co/functions/v1/mercado-livre-integration/oauth-start`
- Mercado Livre Callback: `https://zbumnxegxvvhittxfdxh.supabase.co/functions/v1/mercado-livre-integration/oauth-callback`
- Gemini AI Generate: `https://zbumnxegxvvhittxfdxh.supabase.co/functions/v1/gemini-ai/generate`
- Gemini AI Test: `https://zbumnxegxvvhittxfdxh.supabase.co/functions/v1/gemini-ai/test`

## Troubleshooting

- **Erro de CORS**: Verifique se as funções têm os headers corretos
- **Erro de autenticação**: Verifique se o SERVICE_ROLE_KEY está correto
- **Mercado Livre não conecta**: Verifique CLIENT_ID e CLIENT_SECRET
- **Gemini AI não funciona**: Verifique a API_KEY e cotas do Google

Para logs detalhados, sempre verifique a página de integrações no app - todos os erros são logados lá!
