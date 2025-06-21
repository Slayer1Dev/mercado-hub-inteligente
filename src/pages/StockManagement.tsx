
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Package, AlertCircle, TrendingUp, Settings, ArrowLeft } from "lucide-react";

const StockManagement = () => {
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
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gradient">Gestão de Estoque</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão Inteligente de Estoque</h1>
          <p className="text-gray-600">Controle seus produtos em múltiplos anúncios do Mercado Livre</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">156</div>
                <p className="text-xs text-gray-600">cadastrados</p>
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
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-gray-600">produtos em alerta</p>
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
                <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">142</div>
                <p className="text-xs text-gray-600">com Mercado Livre</p>
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
                <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
                <Settings className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">2min</div>
                <p className="text-xs text-gray-600">atrás</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Configuração de Integração</CardTitle>
                <CardDescription>
                  Configure sua conexão com o Mercado Livre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Configuração Pendente</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Para usar a gestão de estoque, configure suas credenciais do Mercado Livre.
                  </p>
                  <Button disabled className="w-full">
                    Configurar Integração
                    <span className="ml-2 text-xs">(Disponível em breve)</span>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <h5 className="font-medium mb-2">Recursos disponíveis:</h5>
                  <ul className="space-y-1">
                    <li>• Sincronização automática de estoque</li>
                    <li>• Alertas de estoque baixo</li>
                    <li>• Gestão de múltiplos anúncios</li>
                    <li>• Relatórios de movimentação</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product List Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Produtos Recentes</CardTitle>
                <CardDescription>
                  Últimos produtos adicionados ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Smartphone Samsung Galaxy", stock: 15, status: "ok" },
                    { name: "Notebook Lenovo Ideapad", stock: 3, status: "low" },
                    { name: "Fone Bluetooth JBL", stock: 28, status: "ok" },
                    { name: "Smart Watch Apple", stock: 1, status: "critical" }
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">Estoque: {product.stock} unidades</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        product.status === 'ok' ? 'bg-green-100 text-green-800' :
                        product.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'ok' ? 'OK' :
                         product.status === 'low' ? 'Baixo' : 'Crítico'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4" disabled>
                  Ver Todos os Produtos
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
