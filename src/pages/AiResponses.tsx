import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Clock, Zap, RefreshCw, Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from "@/components/AppHeader"; // Importando o cabeçalho

// ... (a interface MlQuestion e o resto da lógica do componente permanecem iguais)
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
  const [sending, setSending] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mercado_livre_questions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ia_answered')
        .order('question_date', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar perguntas.", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQuestions();
      const channel = supabase.channel('mercado_livre_questions_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mercado_livre_questions', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('Mudança em tempo real recebida!', payload);
            toast.info("A lista de perguntas foi atualizada.");
            fetchQuestions();
          }
        ).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const handleSyncQuestions = async () => {
    setSyncing(true);
    toast.info("Buscando novas perguntas no Mercado Livre...");
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-questions');
      if (error) throw error;
      toast.success("Sincronização concluída!", { description: data.message });
    } catch(error: any) {
      toast.error("Falha na sincronização de perguntas.", { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleAnswerChange = (questionId: string, newText: string) => {
    setQuestions(currentQuestions =>
      currentQuestions.map(q => q.question_id === questionId ? { ...q, ia_response: newText } : q)
    );
  };

  const handleSendResponse = async (questionId: string, text: string) => {
    setSending(questionId);
    try {
      const { error } = await supabase.functions.invoke('mercado-livre-integration/answer-question', {
        body: { question_id: questionId, text: text },
      });
      if (error) throw error;
      toast.success("Resposta enviada com sucesso!");
    } catch (error: any) {
      toast.error("Falha ao enviar resposta.", { description: error.message });
    } finally {
      setSending(null);
    }
  };

  const pendingQuestions = questions.length;

  // NOVA ESTRUTURA DO LAYOUT
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Respostas Pendentes</h1>
                <p className="text-gray-600">Aprove, edite e envie as respostas geradas pela IA.</p>
            </div>
            <Button onClick={handleSyncQuestions} disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar Perguntas
            </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Respostas Este Mês</CardTitle><Bot className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">N/A</div><p className="text-xs text-gray-600">perguntas respondidas</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendentes</CardTitle><MessageSquare className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingQuestions}</div><p className="text-xs text-gray-600">aguardando sua aprovação</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Médio</CardTitle><Clock className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">N/A</div><p className="text-xs text-gray-600">para responder</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Satisfação</CardTitle><Zap className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">N/A</div><p className="text-xs text-gray-600">clientes satisfeitos</p></CardContent></Card>
        </div>

        {/* Layout de uma coluna para as perguntas */}
        <Card>
            <CardHeader>
                <CardTitle>Caixa de Entrada</CardTitle>
                <CardDescription>Perguntas aguardando sua ação.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                  <p>Carregando perguntas...</p>
              ) : questions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                      <h3 className="font-semibold text-lg">Tudo em ordem!</h3>
                      <p className="text-sm mt-2">Nenhuma pergunta pendente no momento.</p>
                  </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <div>
                          <p className="font-medium text-sm text-gray-800">{item.question_text}</p>
                          <p className="text-xs text-gray-500">{new Date(item.question_date).toLocaleString('pt-BR')}</p>
                      </div>
                      <Textarea value={item.ia_response} onChange={(e) => handleAnswerChange(item.question_id, e.target.value)} className="bg-white" rows={4}/>
                      <Button onClick={() => handleSendResponse(item.question_id, item.ia_response)} disabled={sending === item.question_id} className="w-full">
                        {sending === item.question_id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Enviar Resposta
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </main>
    </div>
  );
};

export default AiResponses;