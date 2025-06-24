// src/pages/Dashboard.tsx

import { motion } from "framer-motion";
import AppHeader from "@/components/AppHeader"; // Usando o header padrão
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Package, BarChart3, Link as LinkIcon, Boxes } from "lucide-react"; // Adicionado Boxes

const Dashboard = () => {
  const { user, profile } = useAuth();

  const quickActions = [
    {
      title: "Respostas com IA",
      description: "Gerencie as perguntas de seus clientes com o poder da IA.",
      icon: <Bot className="w-6 h-6" />,
      href: "/ai-responses",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Gerenciador de Estoque",
      description: "Visualize, gerencie e agrupe o estoque de seus produtos.",
      icon: <Package className="w-6 h-6" />,
      href: "/stock-management",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Analytics",
      description: "Veja relatórios detalhados de performance. (Em breve)",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/analytics",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Integrações",
      description: "Conecte e gerencie suas contas de marketplaces.",
      icon: <LinkIcon className="w-6 h-6" />,
      href: "/integrations",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    Seus negócios estão funcionando perfeitamente. Confira suas ferramentas abaixo.
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
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Ferramentas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                  <CardContent className="p-6 flex flex-col">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                    <p className="text-sm text-gray-600 flex-1">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;