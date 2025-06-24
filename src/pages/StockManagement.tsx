// src/pages/StockManagement.tsx

import { useState, useEffect, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, Boxes, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  ml_item_id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  permalink: string;
  thumbnail: string;
}

interface StockGroup {
  id: string;
  group_name: string;
}

const ITEMS_PER_PAGE = 10;

const StockManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchGroups();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id).order('title', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar produtos.", { description: error.message });
    } finally {
      setLoadingProducts(false);
    }
  };
  
  const fetchGroups = async () => {
    if (!user) return;
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase.from('stock_groups').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar grupos de estoque.", { description: error.message });
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSyncProducts = async () => {
    setSyncing(true);
    toast.info("Sincronização completa iniciada. Isso pode levar alguns minutos...", {
      description: "Estamos buscando todos os seus produtos no Mercado Livre.",
    });
    try {
      const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-products');
      if (error) throw error;
      toast.success(data.message || "Sincronização concluída!");
      await fetchProducts();
    } catch(error: any) {
      toast.error("Falha na sincronização", { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.warning("O nome do grupo não pode ser vazio.");
      return;
    }
    setSavingGroup(true);
    try {
      const { data, error } = await supabase
        .from('stock_groups')
        .insert({ group_name: newGroupName, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      toast.success(`Grupo "${newGroupName}" criado com sucesso!`);
      if(data) setGroups([...groups, data]);
      setNewGroupName("");
      setIsGroupDialogOpen(false);
    } catch (error: any) {
      toast.error("Falha ao criar grupo.", { description: error.message });
    } finally {
      setSavingGroup(false);
    }
  };

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  const pageCount = Math.ceil(products.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Estoque</h1>
                <p className="text-gray-600">Visualize, gerencie e agrupe o estoque de seus produtos.</p>
            </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Todos os Produtos</TabsTrigger>
            <TabsTrigger value="groups">Grupos de Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              {/* === BOTÃO RESTAURADO AQUI === */}
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Seus Produtos</CardTitle>
                    <CardDescription>Lista de todos os seus produtos sincronizados do Mercado Livre.</CardDescription>
                  </div>
                  <Button onClick={handleSyncProducts} disabled={syncing}>
                    {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2"/>}
                    Sincronizar Produtos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Imagem</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProducts ? (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando produtos...</TableCell></TableRow>
                      ) : paginatedProducts.length > 0 ? (
                        paginatedProducts.map(product => (
                          <TableRow key={product.id}>
                            <TableCell><img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-md" /></TableCell>
                            <TableCell className="font-medium max-w-sm truncate" title={product.title}>{product.title}</TableCell>
                            <TableCell><Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{product.status}</Badge></TableCell>
                            <TableCell className="text-right">R$ {product.price?.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{product.stock_quantity}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                         <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">Nenhum produto encontrado. Clique em "Sincronizar Produtos".</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {pageCount > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} />
                        </PaginationItem>
                        {/* Simplificando a renderização da paginação para evitar sobrecarga */}
                        <PaginationItem>
                          <span className="px-4 py-2 text-sm">Página {currentPage} de {pageCount}</span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(pageCount, p + 1)); }} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Seus Grupos de Estoque</CardTitle>
                      <CardDescription>Agrupe anúncios para sincronizar o estoque automaticamente.</CardDescription>
                    </div>
                     <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline"><PlusCircle className="w-4 h-4 mr-2" />Criar Novo Grupo</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Criar Novo Grupo de Estoque</DialogTitle>
                          <DialogDescription>Dê um nome para seu grupo. Ex: "Projetor Hy320".</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nome</Label><Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="col-span-3" placeholder="Nome do grupo"/></div></div>
                        <DialogFooter><Button onClick={handleCreateGroup} disabled={savingGroup}>{savingGroup ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}Salvar</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
              </CardHeader>
              <CardContent>
                {loadingGroups ? <p>Carregando grupos...</p> : groups.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                      <Boxes className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                      <h3 className="font-semibold text-lg">Nenhum grupo encontrado</h3>
                      <p className="text-sm mt-2">Clique em "Criar Novo Grupo" para começar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                      <Card key={group.id}>
                        <CardHeader><CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2 text-purple-600"/>{group.group_name}</CardTitle><CardDescription>0 produtos neste grupo</CardDescription></CardHeader>
                        <CardContent><Button variant="outline" className="w-full" disabled>Adicionar Produto (em breve)</Button></CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StockManagement;