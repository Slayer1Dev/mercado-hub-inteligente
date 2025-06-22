
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Settings, Package, Bot, BarChart3, Link as LinkIcon, MessageCircle, Shield } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";

const Dashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const { signOut: clerkSignOut } = useClerk();

  const handleWhatsAppContact = () => {
    window.open('https://wa.me/qr/LMAV2IFGFOFFF1', '_blank');
  };

  const quickActions = [
    {
      title: "Gestão de Estoque",
      description: "Gerencie seus produtos e estoque",
      icon: <Package className="w-6 h-6" />,
      href: "/stock-management",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Respostas IA",
      description: "Configure respostas automáticas",
      icon: <Bot className="w-6 h-6" />,
      href: "/ai-responses",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Analytics",
      description: "Veja relatórios detalhados",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/analytics",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Integrações",
      description: "Conecte suas contas",
      icon: <LinkIcon className="w-6 h-6" />,
      href: "/integrations",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Hub de Ferramentas</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="destructive" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Button>
                </Link>
              )}

              <Button
                onClick={handleWhatsAppContact}
                variant="outline"
                size="sm"
                className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Suporte
              </Button>
              
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={clerkSignOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Bem-vindo, {profile?.name || user?.email?.split('@')[0]}!
                  </h2>
                  <p className="text-blue-100">
                    Seus negócios estão funcionando perfeitamente. Confira suas métricas abaixo.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                    <BarChart3 className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      {action.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suas Métricas</h3>
          <DashboardStats />
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
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
                  onClick={handleWhatsAppContact}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
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

export default Dashboard;
