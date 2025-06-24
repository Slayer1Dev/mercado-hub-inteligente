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
  PaginationEllipsis,
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

const ITEMS_PER_PAGE = 10; // Define quantos produtos mostrar por página

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

  // --- NOVOS STATES PARA PAGINAÇÃO ---
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
    // ... (código existente, sem alterações)
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
    // ... (código existente, sem alterações)
  };

  // --- LÓGICA PARA CALCULAR OS PRODUTOS DA PÁGINA ATUAL ---
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
        {/* ... (código do header da página, sem alterações) ... */}

        <Tabs defaultValue="products" className="w-full">
          {/* ... (código do TabsList, sem alterações) ... */}

          <TabsContent value="products">
            <Card>
              <CardHeader>
                 {/* ... (código do CardHeader, sem alterações) ... */}
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    {/* ... (código do TableHeader, sem alterações) ... */}
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
                {/* --- CONTROLES DE PAGINAÇÃO ADICIONADOS --- */}
                {pageCount > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1} />
                        </PaginationItem>
                        {[...Array(pageCount).keys()].map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page + 1); }} isActive={currentPage === page + 1}>
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(pageCount, p + 1)); }} disabled={currentPage === pageCount}/>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups">
            {/* ... (código da aba de grupos, sem alterações) ... */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StockManagement;