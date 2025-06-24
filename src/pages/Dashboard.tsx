// src/pages/Dashboard.tsx

import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Package, LineChart, Link as LinkIcon, Boxes } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel de Controle</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Link to="/ai-responses">
            <Card className="hover:shadow-lg hover:border-purple-500 transition-all">
              <CardHeader><CardTitle className="flex items-center"><Bot className="w-6 h-6 mr-3 text-purple-600" />Respostas com IA</CardTitle></CardHeader>
              <CardContent><CardDescription>Gerencie as perguntas de seus clientes com o poder da IA. Responda de forma rápida e inteligente.</CardDescription></CardContent>
            </Card>
          </Link>
          
          <Link to="/stock-management">
            <Card className="hover:shadow-lg hover:border-blue-500 transition-all">
              <CardHeader><CardTitle className="flex items-center"><Package className="w-6 h-6 mr-3 text-blue-600" />Gerenciador de Estoque</CardTitle></CardHeader>
              <CardContent><CardDescription>Visualize e sincronize todos os seus produtos do Mercado Livre em um só lugar.</CardDescription></CardContent>
            </Card>
          </Link>

          <Link to="/stock-groups">
            <Card className="hover:shadow-lg hover:border-green-500 transition-all">
              <CardHeader><CardTitle className="flex items-center"><Boxes className="w-6 h-6 mr-3 text-green-600" />Grupos de Estoque</CardTitle></CardHeader>
              <CardContent><CardDescription>Agrupe anúncios idênticos para sincronizar o estoque automaticamente entre eles.</CardDescription></CardContent>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card className="hover:shadow-lg hover:border-red-500 transition-all">
              <CardHeader><CardTitle className="flex items-center"><LineChart className="w-6 h-6 mr-3 text-red-600" />Análises e Relatórios</CardTitle></CardHeader>
              <CardContent><CardDescription>Entenda suas vendas, performance e tome decisões baseadas em dados. (Em breve)</CardDescription></CardContent>
            </Card>
          </Link>

          <Link to="/integrations">
            <Card className="hover:shadow-lg hover:border-yellow-500 transition-all">
              <CardHeader><CardTitle className="flex items-center"><LinkIcon className="w-6 h-6 mr-3 text-yellow-500" />Integrações</CardTitle></CardHeader>
              <CardContent><CardDescription>Conecte e gerencie suas contas de marketplaces e outras ferramentas.</CardDescription></CardContent>
            </Card>
          </Link>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;