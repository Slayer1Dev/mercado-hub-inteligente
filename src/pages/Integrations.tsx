
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
      loadIntegrations();
      loadLogs();
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const connectMercadoLivre = async () => {
    setConnecting('mercado_livre');
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/oauth-start', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('URL de autorização não recebida');
      }
    } catch (error) {
      console.error('Erro ao conectar Mercado Livre:', error);
      toast.error('Erro ao conectar com Mercado Livre');
      setConnecting(null);
    }
  };

  const testGeminiConnection = async () => {
    setConnecting('gemini');
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai/test', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.connected) {
        toast.success('Conexão com Gemini AI funcionando!');
        // Atualizar estado da integração
        await supabase
          .from('user_integrations')
          .upsert({
            user_id: user?.id,
            integration_type: 'gemini',
            is_connected: true,
            last_sync: new Date().toISOString(),
          });
        loadIntegrations();
      } else {
        toast.error(data?.error || 'Falha na conexão com Gemini AI');
      }
    } catch (error) {
      console.error('Erro ao testar Gemini:', error);
      toast.error('Erro ao testar conexão com Gemini AI');
    } finally {
      setConnecting(null);
    }
  };

  const syncQuestions = async () => {
    setConnecting('sync');
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-questions', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success('Sincronização iniciada com sucesso!');
      loadLogs();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização de perguntas');
    } finally {
      setConnecting(null);
    }
  };

  const getIntegrationStatus = (type: string) => {
    const integration = integrations.find(i => i.integration_type === type);
    return integration?.is_connected || false;
  };

  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Conectado
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    );
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrações</h1>
          <p className="text-gray-600">
            Conecte suas contas e configure as integrações para automatizar seu negócio
          </p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Mercado Livre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <ShoppingBag className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Mercado Livre</CardTitle>
                      <p className="text-sm text-gray-600">Sincronize perguntas automaticamente</p>
                    </div>
                  </div>
                  {getStatusBadge(getIntegrationStatus('mercado_livre'))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Conecte sua conta do Mercado Livre para receber e responder perguntas automaticamente com IA.
                  </div>
                  <div className="flex space-x-2">
                    {!getIntegrationStatus('mercado_livre') ? (
                      <Button 
                        onClick={connectMercadoLivre}
                        disabled={connecting === 'mercado_livre'}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {connecting === 'mercado_livre' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <LinkIcon className="w-4 h-4 mr-2" />
                        )}
                        Conectar
                      </Button>
                    ) : (
                      <Button 
                        onClick={syncQuestions}
                        disabled={connecting === 'sync'}
                        variant="outline"
                      >
                        {connecting === 'sync' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Sincronizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gemini AI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Gemini AI</CardTitle>
                      <p className="text-sm text-gray-600">Respostas inteligentes automáticas</p>
                    </div>
                  </div>
                  {getStatusBadge(getIntegrationStatus('gemini'))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Use a IA do Google Gemini para gerar respostas personalizadas para seus clientes.
                  </div>
                  <Button 
                    onClick={testGeminiConnection}
                    disabled={connecting === 'gemini'}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {connecting === 'gemini' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Instructions Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Configuração necessária:</strong> Para que as integrações funcionem, configure as variáveis secretas no Supabase.
              Execute os comandos fornecidos na documentação para configurar as API keys.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Logs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Logs de Atividade</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showLogs ? 'Ocultar' : 'Ver Logs'}
                </Button>
              </div>
            </CardHeader>
            {showLogs && (
              <CardContent>
                {logs.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'success' ? 'bg-green-500' :
                            log.status === 'error' ? 'bg-red-500' :
                            log.status === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.integration_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className={`${getLogStatusColor(log.status)} font-medium`}>
                            {log.message}
                          </div>
                          {log.details && (
                            <div className="mt-1 text-xs text-gray-500 font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum log encontrado
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Integrations;
