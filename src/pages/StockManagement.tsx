// src/pages/StockManagement.tsx

import { useState, useEffect, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, Boxes, Loader2, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interfaces... (sem alteração)
interface Product { /* ... */ }
interface StockGroup { /* ... */ }

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

  // --- NOVOS STATES PARA PESQUISA E ORDENAÇÃO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("title-asc");

  // ... (funções fetchProducts, fetchGroups, handleSyncProducts, handleCreateGroup não mudam) ...
  const fetchProducts = async () => { /* ... */ };
  const fetchGroups = async () => { /* ... */ };
  const handleSyncProducts = async () => { /* ... */ };
  const handleCreateGroup = async () => { /* ... */ };
  
  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchGroups();
    }
  }, [user]);

  // --- LÓGICA DE FILTRO E ORDENAÇÃO ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = products
      .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'title-asc':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [products, searchTerm, sortOrder]);

  // --- LÓGICA DE PAGINAÇÃO ATUALIZADA para usar a lista filtrada ---
  const pageCount = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  // Reseta a página para 1 quando a busca ou ordenação muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);


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
                {/* --- CONTROLES DE PESQUISA E ORDENAÇÃO ADICIONADOS --- */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Pesquisar por título..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                      <SelectItem value="price-asc">Preço (Menor para Maior)</SelectItem>
                      <SelectItem value="price-desc">Preço (Maior para Menor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                         <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">Nenhum produto encontrado. Clique em "Sincronizar Produtos" ou ajuste sua busca.</TableCell></TableRow>
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
            {/* ... (código da aba de grupos, sem alterações) ... */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StockManagement;