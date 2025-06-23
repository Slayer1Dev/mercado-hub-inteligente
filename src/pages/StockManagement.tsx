import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, AlertCircle, TrendingUp, Settings, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Definindo o tipo para os nossos produtos, baseado na tabela do DB
interface Product {
  id: number;
  ml_item_id: string;
  title: string;
  stock_quantity: number;
  status: string;
  permalink: string;
  thumbnail: string;
}

const StockManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Função para buscar os produtos do nosso banco de dados
  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar produtos.", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Roda a função de busca quando a página carrega
  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Função para chamar a Edge Function de sincronização
  const handleSyncProducts = async () => {
    setSyncing(true);
    toast.info("Iniciando sincronização com o Mercado Livre...");
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-products');

      if (error) throw error;
      
      toast.success("Sincronização concluída!", { description: data.message });
      await fetchProducts(); // Atualiza a lista de produtos na tela
    } catch (error: any) {
      toast.error("Falha na sincronização.", { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  // Calculando estatísticas com base nos dados reais
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5).length;
  const syncedProducts = products.filter(p => p.status === 'active').length;

  const getStatusBadge = (stock: number) => {
    if (stock <= 1) return { text: 'Crítico', className: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { text: 'Baixo', className: 'bg-yellow-100 text-yellow-800' };
    return { text: 'OK', className: 'bg-green-100 text-green-800' };
  };

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
               <Button onClick={handleSyncProducts} disabled={syncing}>
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sincronizar com Mercado Livre
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards com dados reais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
                <p className="text-xs text-gray-600">anúncios encontrados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
                <p className="text-xs text-gray-600">produtos com 5 ou menos unid.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{syncedProducts}</div>
                <p className="text-xs text-gray-600">sincronizados e ativos no ML</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Estoque</CardTitle>
            <CardDescription>Lista dos seus produtos sincronizados do Mercado Livre.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando produtos...</p>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhum produto encontrado.</p>
                <p className="text-sm text-gray-400">Clique em "Sincronizar com Mercado Livre" para buscar seus anúncios.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                    const statusBadge = getStatusBadge(product.stock_quantity);
                    return (
                        <a href={product.permalink} target="_blank" rel="noopener noreferrer" key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                                <img src={product.thumbnail} alt={product.title} className="w-12 h-12 rounded-md object-cover" />
                                <div>
                                    <p className="font-medium text-sm">{product.title}</p>
                                    <p className="text-xs text-gray-600">Estoque: {product.stock_quantity} unidades</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                                {statusBadge.text}
                            </div>
                        </a>
                    )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockManagement;