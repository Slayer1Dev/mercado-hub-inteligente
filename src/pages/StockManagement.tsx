// src/pages/StockManagement.tsx

import { useState, useEffect, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, Boxes, Loader2, RefreshCw, Search, MoreHorizontal, ArrowLeft, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  ml_item_id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  permalink: string;
  thumbnail: string;
  ean: string | null;
}

// Atualizada para receber a contagem de produtos
interface StockGroup {
  id: string;
  group_name: string;
  product_count: number;
}

interface GroupDetail extends StockGroup {
  products: Product[];
}

const ITEMS_PER_PAGE = 10;

const StockManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  // --- NOVOS STATES PARA PESQUISA E ORDENAÇÃO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("title-asc");
  // State para controlar a visão de detalhes do grupo e modais
  const [viewingGroup, setViewingGroup] = useState<GroupDetail | null>(null);
  const [productToManage, setProductToManage] = useState<Product | null>(null);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

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
  
  // ATUALIZADO: para buscar a contagem de produtos em cada grupo
  const fetchGroups = async () => {
    if (!user) return;
    setLoadingGroups(true);
    try {
      // Revertendo para a consulta implícita que estava funcionando corretamente.
      const { data, error } = await supabase
        .from('stock_groups')
        .select('*, product_count:stock_group_products(count)') // Alias para product_count
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setGroups(data.map(g => ({ ...g, product_count: g.product_count[0]?.count || 0 })) || []);
    } catch (error: any) {
      console.error("Erro ao buscar grupos de estoque:", error);
      toast.error("Erro ao buscar grupos de estoque.", { 
        description: error.message || "Verifique a conexão com o banco de dados." 
      });
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

  const handleCreateGroup = async (name: string): Promise<any | null> => {
    if (!name.trim()) {
      toast.warning("O nome do grupo não pode ser vazio.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('stock_groups')
        .insert({ group_name: name, user_id: user?.id, product_count: 0 }) // Initialize product_count
        .select('*')
        .single();
      if (error) throw error;
      toast.success(`Grupo "${name}" criado com sucesso!`);
      fetchGroups(); // Re-fetch all groups to update the list
      return { ...data, product_count: 0 }; // Return with product_count for consistency
    } catch (error: any) {
      toast.error("Falha ao criar grupo.", { description: error.message });
      return null;
    }
  };

  const handleViewGroup = async (group: StockGroup | GroupDetail) => {
    setLoadingGroupDetails(true); // Use specific loading state for group details
    const { data, error } = await supabase
      .from('stock_groups')
      .select(`*, stock_group_products(products(*))`)
      .eq('id', group.id)
      .single();

    if(error) {
      toast.error("Erro ao carregar detalhes do grupo.");
    } else if (data) {
      const productsFromJoinTable = data.stock_group_products.map((sgp: any) => sgp.products);
      setViewingGroup({ ...data, products: productsFromJoinTable, product_count: data.stock_group_products.length });
    }
    setLoadingGroupDetails(false);
  };

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

  // Se estiver vendo um grupo, mostra a tela de detalhes
  if (viewingGroup && !loadingGroupDetails) { // Only show detail view if not loading its data
    return (
        <GroupDetailView 
            group={viewingGroup}
            onBack={() => { setViewingGroup(null); fetchGroups(); }}
            onGroupUpdate={() => handleViewGroup(viewingGroup)}
        />
    )
  }

  // Global loading for initial page load
  if (loadingProducts || loadingGroups) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Carregando...</p>
      </div>
    );
  }

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
                        <TableHead className="w-[50px]">Ações</TableHead>
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
                            <TableCell className="text-right font-semibold">{product.stock_quantity}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setProductToManage(product)}>Adicionar ao Grupo</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                         <TableRow><TableCell colSpan={6} className="text-center h-24 text-gray-500">Nenhum produto encontrado. Clique em "Sincronizar Produtos" ou ajuste sua busca.</TableCell></TableRow>
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
            <Card>
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Seus Grupos de Estoque</CardTitle>
                      <CardDescription>Agrupe anúncios para sincronizar o estoque automaticamente.</CardDescription>
                    </div>
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
                      <Card key={group.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewGroup(group)}>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2 text-purple-600"/>{group.group_name}</CardTitle>
                            {/* ATUALIZADO: Exibe a contagem correta de produtos */}
                            <CardDescription>{group.product_count} produtos neste grupo</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto text-center">
                            <p className="text-sm text-blue-600 font-semibold">Ver Detalhes</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {productToManage && (
        <AddToGroupModal 
            product={productToManage}
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onClose={() => { setProductToManage(null); fetchGroups(); }} // Re-fetch groups on close to update counts
        />
      )}
    </div>
  );
};

// --- NOVOS COMPONENTES PARA A NOVA INTERFACE ---
// Componente para a tela de detalhes de um grupo
const GroupDetailView = ({ group, onBack, onGroupUpdate }: { group: GroupDetail; onBack: () => void; onGroupUpdate: () => void }) => {
    const handleRemoveProduct = async (productId: string) => {
        const { error } = await supabase.from('stock_group_products').delete().match({ group_id: group.id, product_id: productId });
        if (error) {
            toast.error("Falha ao remover produto.");
        } else {
            toast.success("Produto removido do grupo.");
            onGroupUpdate(); // Atualiza a visão
        }
    };

    const [masterStock, setMasterStock] = useState<string>("");
    const [isSavingStock, setIsSavingStock] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão não encontrada");
        return { Authorization: `Bearer ${session.access_token}` };
    };

    const handleUpdateAllStock = async () => {
        if (masterStock === "" || isNaN(Number(masterStock))) {
            return toast.error("Por favor, insira um valor de estoque válido.");
        }
        setIsSavingStock(true);
        try {
            const headers = await getAuthHeaders();
            const item_ids = group.products.map((p: Product) => p.ml_item_id);
            
            // Verifica se há item_ids para evitar chamada desnecessária
            if (item_ids.length === 0) {
                toast.info("Nenhum produto no grupo para atualizar o estoque.");
                return;
            }

            await supabase.functions.invoke('update-ml-stock', {
                body: { item_ids, stock: Number(masterStock) },
                headers,
            });
            toast.success("Estoque de todos os produtos do grupo está sendo atualizado!");
            onGroupUpdate(); // Atualiza a visão
        } catch (error: any) {
            toast.error("Falha ao atualizar estoque.", { description: error.message });
        } finally {
            setIsSavingStock(false);
        }
    };

    const handleStatusChange = async (product: Product, newStatus: 'active' | 'paused') => {
        setUpdatingStatus(product.id);
        try {
            const headers = await getAuthHeaders();
            await supabase.functions.invoke('update-ml-status', {
                body: { item_id: product.ml_item_id, status: newStatus },
                headers,
            });
            toast.success(`Anúncio "${product.title}" está sendo ${newStatus === 'active' ? 'ativado' : 'pausado'}.`);
            onGroupUpdate();
        } catch (error: any) {
            toast.error("Falha ao alterar status.", { description: error.message });
        } finally {
            setUpdatingStatus(null);
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <AppHeader />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para todos os grupos</Button>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{group.group_name}</CardTitle>
                                <CardDescription>{group.products.length} produtos neste grupo.</CardDescription>
                            </div>
                            <div className="flex space-x-2 items-center">
                                <Input 
                                    type="number" 
                                    placeholder="Estoque Mestre" 
                                    className="w-32"
                                    value={masterStock}
                                    onChange={e => setMasterStock(e.target.value)}
                                />
                                <Button onClick={handleUpdateAllStock} disabled={isSavingStock}>
                                    {isSavingStock && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Salvar Estoque
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Imagem</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Estoque</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.products.map((product: Product) => (
                                    <TableRow key={product.id}>
                                        <TableCell><img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-md" /></TableCell>
                                        <TableCell>
                                            <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{product.title}</a>
                                            <p className="text-xs text-gray-500">EAN: {product.ean || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{product.stock_quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{product.status === 'active' ? 'Ativo' : 'Pausado'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {updatingStatus === product.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                            ) : (
                                                product.status === 'active' ? (
                                                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(product, 'paused')}>Pausar</Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleStatusChange(product, 'active')}>Ativar</Button>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(product.id)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

// Componente para o modal de adicionar a um grupo
const AddToGroupModal = ({ product, groups, onClose, onCreateGroup }: { product: Product, groups: StockGroup[], onClose: () => void, onCreateGroup: (name: string) => Promise<any | null> }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        let groupId = selectedGroupId;

        if (isCreatingNew) {
            if(!newGroupName) {
                toast.error("O nome do novo grupo é obrigatório.");
                setIsSaving(false);
                return;
            }
            const newGroup = await onCreateGroup(newGroupName);
            if (newGroup) {
              groupId = newGroup.id;
            } else {
              setIsSaving(false);
              return; // Error handled in onCreateGroup
            }
        }

        if (!groupId) {
            toast.error("Por favor, selecione um grupo.");
            setIsSaving(false);
            return;
        }

        const { error } = await supabase.from('stock_group_products').insert({
            group_id: groupId,
            product_id: product.id,
        });

        if (error) {
            toast.error("Erro ao adicionar produto ao grupo.", { description: "Este produto talvez já esteja no grupo."});
        } else {
            toast.success(`"${product.title}" adicionado ao grupo!`);
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar ao Grupo</DialogTitle>
                    <div className="flex items-center space-x-4 pt-4">
                        <img src={product.thumbnail} className="w-16 h-16 rounded-lg border" alt={product.title} />
                        <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-sm text-gray-500">Estoque: {product.stock_quantity} | EAN: {product.ean || 'N/A'}</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label>Selecione um grupo existente</Label>
                    <Select onValueChange={setSelectedGroupId} disabled={isCreatingNew}>
                        <SelectTrigger><SelectValue placeholder="Escolha um grupo..." /></SelectTrigger>
                        <SelectContent>
                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-2"><div className="flex-1 border-t"></div><span className="text-xs text-gray-500">OU</span><div className="flex-1 border-t"></div></div>

                    <div className="space-y-2">
                        <Button variant="outline" className="w-full" onClick={() => setIsCreatingNew(!isCreatingNew)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {isCreatingNew ? 'Cancelar Criação' : 'Criar Novo Grupo'}
                        </Button>
                        {isCreatingNew && (
                            <Input placeholder="Nome do novo grupo..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                         {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default StockManagement;