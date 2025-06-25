import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Link as LinkIcon, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ShoppingBag, 
  Bot,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';

interface Integration {
  id: string;
  integration_type: string;
  is_connected: boolean;
  last_sync: string | null;
  created_at: string;
}

interface LogEntry {
  id: number;
  integration_type: string;
  action: string;
  status: string;
  message: string;
  created_at: string;
  details: any;
}

const Integrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadIntegrations(), loadLogs()])
        .catch(err => console.error("Erro ao carregar dados da página de integrações:", err))
        .finally(() => setLoading(false));
    } else if(!user) {
      setLoading(false);
    }
  }, [user]);

  // CORREÇÃO: A função getAuthHeaders foi movida para dentro do componente
  // para evitar o erro de importação no build.
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado.');
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const loadIntegrations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar suas integrações.', { description: error.message });
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error.message);
    }
  };

  const connectMercadoLivre = async () => {
    setConnecting('mercado_livre');
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/oauth-start', { headers });
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('URL de autorização não recebida');
      }
    } catch (error: any) {
      toast.error('Erro ao conectar com Mercado Livre', { description: error.message });
      setConnecting(null);
    }
  };

  const testGeminiConnection = async () => {
    setConnecting('gemini');
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('gemini-ai/test', { headers });
      if (error) throw error;
      if (data?.connected) {
        toast.success('Conexão com Gemini AI funcionando!');
        if(user) {
            await supabase.from('user_integrations').upsert({
            user_id: user.id,
            integration_type: 'gemini',
            is_connected: true,
            last_sync: new Date().toISOString(),
          }, { onConflict: 'user_id, integration_type' });
        }
        loadIntegrations();
      } else {
        toast.error(data?.error || 'Falha na conexão com Gemini AI');
      }
    } catch (error: any) {
      toast.error('Erro ao testar conexão com Gemini AI', { description: error.message });
    } finally {
      setConnecting(null);
    }
  };

  const syncQuestions = async () => {
    setConnecting('sync');
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-questions', { headers });
      if (error) throw error;
      toast.success(data.message || 'Sincronização iniciada com sucesso!');
      loadLogs();
    } catch (error: any) {
      toast.error('Erro na sincronização de perguntas', { description: error.message });
    } finally {
      setConnecting(null);
    }
  };
  
  const getIntegrationStatus = (type: string) => {
    const integration = integrations.find(i => i.integration_type === type);
    return {
      connected: integration?.is_connected || false,
      last_sync: integration?.last_sync
    };
  };

  const getStatusBadge = (type: string) => {
    const { connected } = getIntegrationStatus(type);
    if (connected) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> Conectado</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Desconectado</Badge>;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
                <p className="text-gray-600">Conecte suas contas e gerencie suas automações.</p>
            </div>
        </div>

        <Alert className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Após conectar sua conta do Mercado Livre, lembre-se de sincronizar seus produtos e perguntas para começar a usar as ferramentas.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Mercado Livre */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Mercado Livre</CardTitle>
                      {getStatusBadge('mercado_livre')}
                    </div>
                  </div>
                  <Button 
                    onClick={connectMercadoLivre} 
                    disabled={connecting === 'mercado_livre'}
                  >
                    {connecting === 'mercado_livre' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {getIntegrationStatus('mercado_livre').connected ? 'Reconectar' : 'Conectar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Sincronize produtos, estoque e responda perguntas automaticamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={async () => {
                      toast.info("Iniciando sincronização de produtos...");
                      const headers = await getAuthHeaders();
                      await supabase.functions.invoke('mercado-livre-integration/sync-products', { headers });
                    }}
                    disabled={!getIntegrationStatus('mercado_livre').connected}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Produtos
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={syncQuestions} 
                    disabled={!getIntegrationStatus('mercado_livre').connected || connecting === 'sync'}
                  >
                    {connecting === 'sync' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sincronizar Perguntas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gemini AI */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Gemini AI</CardTitle>
                      {getStatusBadge('gemini')}
                    </div>
                  </div>
                  <Button 
                    onClick={testGeminiConnection} 
                    disabled={connecting === 'gemini'}
                  >
                    {connecting === 'gemini' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Testar Conexão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Configure a chave de API do Google Gemini para habilitar respostas inteligentes. A chave deve ser adicionada como um segredo no Supabase com o nome `GEMINI_API_KEY`.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Logs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Logs de Integração</h2>
            <Button variant="outline" onClick={() => setShowLogs(!showLogs)}>
              <Eye className="w-4 h-4 mr-2" />
              {showLogs ? 'Ocultar Logs' : 'Mostrar Logs'}
            </Button>
          </div>
          {showLogs && (
            <Card>
              <CardContent className="p-4 max-h-96 overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="text-xs font-mono p-2 bg-gray-100 rounded flex items-start space-x-2">
                        <span className="text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                        <span className={`font-bold ${log.status === 'success' ? 'text-green-600' : log.status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>[{log.action.toUpperCase()}]</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">Nenhum log encontrado.</p>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Integrations;

