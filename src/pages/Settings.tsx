import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Settings, ArrowLeft, User, Save, Edit, Loader2, ShoppingBag, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  const updateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user?.id);

      if (error) {
        console.error("Erro ao atualizar o perfil:", error);
        alert("Erro ao atualizar o perfil.");
      } else {
        setIsEditing(false);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const integrationButtons = [
    {
      title: "Ver Todas as Integrações",
      description: "Gerencie todas suas integrações em um só lugar",
      icon: <Settings className="w-5 h-5" />,
      href: "/integrations",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Mercado Livre",
      description: "Conectar conta do Mercado Livre",
      icon: <ShoppingBag className="w-5 h-5" />,
      action: () => window.location.href = '/integrations',
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Gemini AI",
      description: "Configurar respostas inteligentes",
      icon: <Bot className="w-5 h-5" />,
      action: () => window.location.href = '/integrations',
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-600">Gerencie sua conta e integrações</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Perfil do Usuário</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <div className="flex space-x-2">
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  <Button
                    variant="outline"
                    onClick={isEditing ? updateProfile : () => setIsEditing(true)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEditing ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LinkIcon className="w-5 h-5" />
                <span>Integrações</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Conecte suas contas e configure automações
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {integrationButtons.map((button, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {button.href ? (
                      <Link to={button.href}>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                          <CardContent className="p-4">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${button.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-200`}>
                              {button.icon}
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{button.title}</h4>
                            <p className="text-xs text-gray-600">{button.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ) : (
                      <Card 
                        className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group h-full"
                        onClick={button.action}
                      >
                        <CardContent className="p-4">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${button.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-200`}>
                            {button.icon}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1 text-sm">{button.title}</h4>
                          <p className="text-xs text-gray-600">{button.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Precisa de Ajuda?</h3>
                  <p className="text-green-700">
                    Fale diretamente com nosso suporte técnico no WhatsApp. Lucas está pronto para te ajudar!
                  </p>
                </div>
                <Button
                  onClick={() => window.open('https://wa.me/qr/LMAV2IFGFOFFF1', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Falar no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
