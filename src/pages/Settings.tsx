
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Link as LinkIcon,
  MessageCircle,
  Bot,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";

const Settings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    name: profile?.name || '',
    notifications: true,
    autoResponses: true,
    stockAlerts: true,
    customPrompt: '',
  });

  const [integrations] = useState([
    {
      name: 'Mercado Livre',
      description: 'Conecte sua conta do Mercado Livre para sincronizar produtos',
      icon: <ShoppingCart className="w-6 h-6" />,
      connected: false,
      status: 'disconnected',
      actionText: 'Conectar',
      color: 'yellow'
    },
    {
      name: 'IA Gemini',
      description: 'Configure respostas automáticas inteligentes',
      icon: <Bot className="w-6 h-6" />,
      connected: false,
      status: 'disconnected',
      actionText: 'Configurar',
      color: 'blue'
    }
  ]);

  const handleWhatsAppContact = () => {
    window.open('https://wa.me/qr/LMAV2IFGFOFFF1', '_blank');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: settings.name,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectIntegration = (integrationName: string) => {
    if (integrationName === 'Mercado Livre') {
      // TODO: Implementar OAuth do Mercado Livre
      toast.info('Integração com Mercado Livre em desenvolvimento');
    } else if (integrationName === 'IA Gemini') {
      // TODO: Configurar IA Gemini
      toast.info('Configuração da IA Gemini em desenvolvimento');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-600">Gerencie suas preferências e integrações</p>
              </div>
            </div>
            
            <Button
              onClick={handleWhatsAppContact}
              variant="outline"
              size="sm"
              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Suporte
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Bell className="w-5 h-5 mr-2 text-green-600" />
                    Notificações
                  </CardTitle>
                  <CardDescription>
                    Configure suas preferências de notificação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notificações gerais</p>
                      <p className="text-sm text-gray-600">Receba updates sobre vendas e sistema</p>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Alertas de estoque</p>
                      <p className="text-sm text-gray-600">Seja notificado quando produtos estiverem em baixa</p>
                    </div>
                    <Switch
                      checked={settings.stockAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, stockAlerts: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Respostas automáticas</p>
                      <p className="text-sm text-gray-600">Ativar respostas automáticas da IA</p>
                    </div>
                    <Switch
                      checked={settings.autoResponses}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoResponses: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Bot className="w-5 h-5 mr-2 text-purple-600" />
                    Configuração da IA
                  </CardTitle>
                  <CardDescription>
                    Personalize como a IA responde seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customPrompt">Prompt Personalizado</Label>
                    <Textarea
                      id="customPrompt"
                      value={settings.customPrompt}
                      onChange={(e) => setSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
                      placeholder="Ex: Responda sempre de forma educada e profissional, oferecendo informações detalhadas sobre nossos produtos..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Configure como a IA deve se comportar ao responder seus clientes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Integrations */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <LinkIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Integrações
                  </CardTitle>
                  <CardDescription>
                    Conecte suas contas e serviços
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integrations.map((integration, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-${integration.color}-100 text-${integration.color}-600`}>
                            {integration.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                              {getStatusIcon(integration.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                            <Badge 
                              variant="outline" 
                              className={`mt-2 ${getStatusColor(integration.status)}`}
                            >
                              {integration.connected ? 'Conectado' : 'Não conectado'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button
                          onClick={() => handleConnectIntegration(integration.name)}
                          size="sm"
                          variant={integration.connected ? "outline" : "default"}
                          className="flex-1"
                        >
                          {integration.connected ? 'Configurar' : integration.actionText}
                        </Button>
                        {integration.connected && (
                          <Button size="sm" variant="outline" className="px-3">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-green-900">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Precisa de Ajuda?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 mb-4">
                    Nossa equipe está pronta para te ajudar com qualquer dúvida ou configuração.
                  </p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Lucas - Suporte Técnico</strong>
                    </p>
                    <p className="text-sm text-green-700">hubdeferramentas@gmail.com</p>
                    <p className="text-sm text-green-700">(11) 9 4897-3101</p>
                  </div>
                  <Button
                    onClick={handleWhatsAppContact}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Falar no WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
