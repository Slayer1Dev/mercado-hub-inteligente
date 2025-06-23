import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Bot, MessageSquare, Clock, ArrowLeft, Zap, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Definindo o tipo para as perguntas
interface MlQuestion {
  id: number;
  question_id: string;
  item_id: string;
  question_text: string;
  status: string;
  ia_response: string;
  question_date: string;
}

const AiResponses = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MlQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Função para buscar as perguntas do nosso banco de dados
  const fetchQuestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mercado_livre_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('question_date', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar perguntas.", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Roda a busca ao carregar a página
  useEffect(() => {
    fetchQuestions();
  }, [user]);
  
  // Função para chamar a Edge Function de sincronização de perguntas
  const handleSyncQuestions = async () => {
    setSyncing(true);
    toast.info("Buscando novas perguntas no Mercado Livre...");
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-questions');
      if (error) throw error;
      toast.success("Sincronização concluída!", { description: data.message });
      await fetchQuestions(); // Atualiza a lista na tela
    } catch(error: any) {
      toast.error("Falha na sincronização de perguntas.", { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  // Calculando estatísticas com base nos dados reais
  const pendingQuestions = questions.filter(q => q.status === 'ia_answered').length;
  const totalAnswered = questions.filter(q => q.status !== 'ia_answered').length; // Supondo outros status como 'sent'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Bot className="w-8 h-8 text-purple-600" />
                <span className="text-xl font-bold text-gradient">Respostas IA</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleSyncQuestions} disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar Perguntas
              </Button>
              <UserButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Respostas Automáticas com IA</h1>
          <p className="text-gray-600">Atendimento inteligente para suas perguntas no Mercado Livre</p>
        </motion.div>

        {/* Stats Cards com dados reais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Respostas Este Mês</CardTitle><Bot className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{totalAnswered}</div><p className="text-xs text-gray-600">perguntas respondidas</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendentes</CardTitle><MessageSquare className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingQuestions}</div><p className="text-xs text-gray-600">aguardando sua aprovação</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Médio</CardTitle><Clock className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">N/A</div><p className="text-xs text-gray-600">para responder</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Satisfação</CardTitle><Zap className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">N/A</div><p className="text-xs text-gray-600">clientes satisfeitos</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Configuration */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <Card className="h-full"><CardHeader><CardTitle>Configuração da IA</CardTitle><CardDescription>Configure como a IA deve responder seus clientes</CardDescription></CardHeader><CardContent className="space-y-4"><div className="p-4 bg-purple-50 rounded-lg border border-purple-200"><h4 className="font-medium text-purple-800 mb-2">IA Gemini Configurada</h4><p className="text-sm text-purple-700 mb-3">Sua IA está pronta para responder perguntas automaticamente.</p><Button disabled className="w-full">Ajustar Configurações<span className="ml-2 text-xs">(Disponível em breve)</span></Button></div><div className="text-sm text-gray-600"><h5 className="font-medium mb-2">Recursos ativos:</h5><ul className="space-y-1"><li>• Respostas contextualizadas</li><li>• Aprendizado contínuo</li><li>• Personalização por produto</li><li>• Análise de sentimento</li></ul></div></CardContent></Card>
          </motion.div>

          {/* Recent Questions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <Card className="h-full">
              <CardHeader><CardTitle>Perguntas Recentes</CardTitle><CardDescription>Últimas interações da IA com seus clientes</CardDescription></CardHeader>
              <CardContent>
                {loading ? (
                    <p>Carregando perguntas...</p>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Nenhuma pergunta encontrada.</p>
                        <p className="text-sm mt-2">Clique em "Sincronizar Perguntas" para buscar novas perguntas do Mercado Livre.</p>
                    </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {questions.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm text-gray-800">{item.question_text}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'ia_answered' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.status === 'ia_answered' ? 'Pendente' : 'Respondida'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 p-2 bg-white rounded">
                          <strong className="text-purple-600">Resposta da IA:</strong> {item.ia_response}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(item.question_date).toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button variant="outline" className="w-full mt-4" disabled>Ver Todas as Perguntas</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AiResponses;