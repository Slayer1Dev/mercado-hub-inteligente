
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";

const Settings = () => {
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
              <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Integração Mercado Livre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Integração Mercado Livre</CardTitle>
                <CardDescription>
                  Configure sua conexão com o Mercado Livre para sincronizar produtos e perguntas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      A integração com o Mercado Livre será implementada em breve
                    </p>
                  </div>
                </div>
                <Button disabled className="w-full">
                  Conectar com Mercado Livre
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configurações da IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Configurações da IA</CardTitle>
                <CardDescription>
                  Personalize como a IA responde às perguntas dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Respostas Automáticas</Label>
                    <p className="text-sm text-gray-600">
                      Permitir que a IA responda automaticamente quando tiver alta confiança
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confidence">Nível de Confiança Mínimo (%)</Label>
                  <Input 
                    id="confidence" 
                    type="number" 
                    defaultValue="85" 
                    min="0" 
                    max="100"
                    placeholder="85"
                  />
                  <p className="text-sm text-gray-600">
                    Respostas abaixo deste nível serão enviadas para aprovação manual
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt Personalizado</Label>
                  <textarea 
                    id="prompt"
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Digite instruções personalizadas para a IA..."
                    defaultValue="Você é um assistente de vendas do Mercado Livre. Responda de forma educada, clara e objetiva. Use as informações do produto para dar respostas precisas."
                  />
                </div>

                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gestão de Estoque */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Estoque</CardTitle>
                <CardDescription>
                  Configure alertas e sincronização de estoque
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alertas de Estoque Baixo</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações quando produtos estiverem em baixo estoque
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-threshold">Limite para Alerta (unidades)</Label>
                  <Input 
                    id="stock-threshold" 
                    type="number" 
                    defaultValue="5" 
                    min="1"
                    placeholder="5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sincronização Automática</Label>
                    <p className="text-sm text-gray-600">
                      Atualizar estoque automaticamente a cada venda
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferências de Notificação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Escolha como e quando você quer ser notificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Novas Perguntas</Label>
                    <p className="text-sm text-gray-600">
                      Notificar sobre novas perguntas de clientes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Vendas Realizadas</Label>
                    <p className="text-sm text-gray-600">
                      Notificar quando uma venda for realizada
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Relatórios Semanais</Label>
                    <p className="text-sm text-gray-600">
                      Receber resumo semanal por email
                    </p>
                  </div>
                  <Switch />
                </div>

                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
