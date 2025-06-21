
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, DollarSign, Users, ArrowLeft, Calendar } from "lucide-react";

const Analytics = () => {
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
                <BarChart3 className="w-8 h-8 text-green-600" />
                <span className="text-xl font-bold text-gradient">Analytics</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics e Relatórios</h1>
          <p className="text-gray-600">Métricas detalhadas para otimizar suas vendas</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 15.420</div>
                <p className="text-xs text-gray-600">+12% vs mês anterior</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">247</div>
                <p className="text-xs text-gray-600">este mês</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">189</div>
                <p className="text-xs text-gray-600">novos clientes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R$ 62,43</div>
                <p className="text-xs text-gray-600">por venda</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts and Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Vendas por Período</CardTitle>
                <CardDescription>
                  Evolução das suas vendas nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Gráfico de Vendas</p>
                    <p className="text-sm text-gray-500">Disponível após configuração</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" disabled>
                  Exportar Relatório
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>
                  Ranking dos seus produtos com melhor performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Smartphone Samsung Galaxy A54", sales: 45, revenue: "R$ 13.500" },
                    { name: "Fone Bluetooth JBL Tune 510BT", sales: 32, revenue: "R$ 3.200" },
                    { name: "Smart Watch Xiaomi Band 7", sales: 28, revenue: "R$ 2.800" },
                    { name: "Carregador Turbo 65W USB-C", sales: 24, revenue: "R$ 1.440" },
                    { name: "Capa Silicone Transparente", sales: 19, revenue: "R$ 380" }
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sales} vendas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-green-600">{product.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4" disabled>
                  Ver Relatório Completo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Insights de Performance</CardTitle>
              <CardDescription>
                Análises automáticas para melhorar seus resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-green-800 mb-1">Crescimento Positivo</h4>
                  <p className="text-sm text-green-700">
                    Suas vendas cresceram 12% este mês comparado ao anterior.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-blue-800 mb-1">Novos Clientes</h4>
                  <p className="text-sm text-blue-700">
                    76% dos seus clientes este mês foram novos compradores.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <DollarSign className="w-8 h-8 text-orange-600 mb-2" />
                  <h4 className="font-medium text-orange-800 mb-1">Oportunidade</h4>
                  <p className="text-sm text-orange-700">
                    Produtos de acessórios têm maior margem de lucro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
