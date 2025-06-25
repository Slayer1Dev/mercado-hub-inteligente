// src/pages/StockManagement.tsx

import { useState, useEffect, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Package, Boxes, Loader2, RefreshCw, Search, MoreHorizontal, ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Interfaces de Dados ---
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

interface StockGroup {
  id: string;
  group_name: string;
  product_count: number;
}

interface GroupDetail extends StockGroup {
  products: Product[];
}

const ITEMS_PER_PAGE = 10;

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const StockManagement = () => {
    const { user } = useAuth();
    // States da página
    const [products, setProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    
    // States para UI e filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("title-asc");
    const [currentPage, setCurrentPage] = useState(1);
  
    // States para controlar qual view ou modal está ativo
    const [viewingGroup, setViewingGroup] = useState<GroupDetail | null>(null);
    const [productToManage, setProductToManage] = useState<Product | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
    /**
     * Efeito inicial que busca todos os dados necessários quando o usuário é carregado.
     */
    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([fetchProducts(), fetchGroups()]).finally(() => setLoading(false));
        }
    }, [user]);

    /**
     * Busca todos os produtos do usuário no banco de dados.
     */
    const fetchProducts = async () => {
        if (!user) return;
        const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id);
        if (error) { toast.error("Erro ao buscar produtos.", { description: error.message }); return; }
        setProducts(data || []);
    };
    
    /**
     * Busca todos os grupos de estoque do usuário usando a função RPC.
     */
    const fetchGroups = async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_stock_groups_with_product_count');
        if (error) { toast.error("Erro ao buscar grupos de estoque.", { description: error.message }); return; }
        setGroups(data || []);
    };
    
    /**
     * Cria um novo grupo de estoque no banco de dados.
     */
    const handleCreateGroup = async (name: string): Promise<any | null> => {
        if (!name.trim()) {
            toast.warning("O nome do grupo não pode ser vazio.");
            return null;
        }
        try {
            const { data, error } = await supabase.from('stock_groups').insert({ group_name: name, user_id: user?.id }).select().single();
            if (error) throw error;
            toast.success(`Grupo "${name}" criado com sucesso!`);
            await fetchGroups(); // Atualiza a lista de grupos
            return data;
        } catch (error: any) {
            toast.error("Falha ao criar grupo.", { description: error.message });
            return null;
        }
    };

    /**
     * Busca os detalhes completos de um grupo, incluindo seus produtos.
     */
    const handleViewGroup = async (group: StockGroup) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_group_details', { p_group_id: group.id });
            if (error) throw error;
            setViewingGroup(data);
        } catch(error: any) {
            toast.error("Erro ao carregar detalhes do grupo.", { description: error.message });
        } finally {
            setLoading(false);
        }
    }

    /**
     * Dispara a função de backend para sincronizar produtos do Mercado Livre.
     */
    const handleSyncProducts = async () => {
        setSyncing(true);
        toast.info("Sincronização completa iniciada. Pode levar alguns minutos.");
        try {
            const { data, error } = await supabase.functions.invoke('mercado-livre-integration/sync-products');
            if (error) throw error;
            toast.success(data?.message || "Sincronização concluída!");
            await fetchProducts();
        } catch(error: any) {
            toast.error("Falha na sincronização", { description: error.message });
        } finally {
            setSyncing(false);
        }
    };

    /**
     * Memoiza a lista de produtos após aplicar filtro de busca e ordenação.
     */
    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products].filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
        result.sort((a, b) => {
            switch (sortOrder) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'title-desc': return b.title.localeCompare(a.title);
                default: return a.title.localeCompare(b.title);
            }
        });
        return result;
    }, [products, searchTerm, sortOrder]);
  
    const pageCount = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedProducts, currentPage]);
    
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder]);
  
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </div>
        );
    }

    if (viewingGroup) {
      return (
          <GroupDetailView 
              group={viewingGroup}
              onBack={() => { setViewingGroup(null); fetchGroups(); }}
              onGroupUpdate={() => handleViewGroup(viewingGroup)}
          />
      )
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
    
                <TabsContent value="products" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div>
                                    <CardTitle>Seus Produtos</CardTitle>
                                    <CardDescription>Lista de todos os seus produtos sincronizados.</CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input placeholder="Pesquisar por título..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                    <Select value={sortOrder} onValueChange={setSortOrder}>
                                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Ordenar por..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                                            <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                                            <SelectItem value="price-asc">Preço (Menor)</SelectItem>
                                            <SelectItem value="price-desc">Preço (Maior)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleSyncProducts} disabled={syncing} className="w-full sm:w-auto">
                                        {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                        Sincronizar
                                    </Button>
                                </div>
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
                                            <TableHead className="text-right">Estoque</TableHead>
                                            <TableHead className="w-[50px] text-center">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedProducts.length > 0 ? (
                                            paginatedProducts.map(product => (
                                                <TableRow key={product.id}>
                                                    <TableCell><img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-md" /></TableCell>
                                                    <TableCell className="font-medium max-w-sm truncate" title={product.title}>{product.title}</TableCell>
                                                    <TableCell><Badge variant={product.status === 'active' ? 'default' : 'destructive'}>{product.status === 'active' ? 'Ativo' : 'Pausado'}</Badge></TableCell>
                                                    <TableCell className="text-right font-semibold">{product.stock_quantity}</TableCell>
                                                    <TableCell className="text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={() => setProductToManage(product)}>Adicionar ao Grupo</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => window.open(product.permalink, '_blank')}>Ver no Mercado Livre</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-gray-500">Nenhum produto encontrado.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {pageCount > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1} /></PaginationItem>
                                            <PaginationItem><span className="px-4 py-2 text-sm">Página {currentPage} de {pageCount}</span></PaginationItem>
                                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(pageCount, p + 1)); }} disabled={currentPage === pageCount} /></PaginationItem>
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
                                <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)}><PlusCircle className="w-4 h-4 mr-2" />Criar Novo Grupo</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                          {groups.length === 0 ? (
                                <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                                    <Boxes className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                                    <h3 className="font-semibold text-lg">Nenhum grupo encontrado</h3>
                                </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map(group => (
                                <Card key={group.id} className="flex flex-col hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2 text-purple-600"/>{group.group_name}</CardTitle>
                                        <CardDescription>{group.product_count} produtos neste grupo</CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto">
                                        <Button variant="outline" className="w-full" onClick={() => handleViewGroup(group)}>Gerenciar Grupo</Button>
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
              onClose={() => setProductToManage(null)}
              onAssociationSuccess={fetchGroups}
          />
        )}
        <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} onCreate={handleCreateGroup}/>
      </div>
    );
};
  
// --- COMPONENTES FILHOS ---

const GroupDetailView = ({ group, onBack, onGroupUpdate }: { group: GroupDetail; onBack: () => void; onGroupUpdate: () => void }) => {
  const [masterStock, setMasterStock] = useState<string>("");
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);

  const getAuthHeaders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada");
      return { Authorization: `Bearer ${session.access_token}` };
  };

  const handleUpdateAllStock = async () => {
      const stockValue = parseInt(masterStock, 10);
      if (isNaN(stockValue) || stockValue < 0) {
          return toast.error("Por favor, insira um valor de estoque válido.");
      }
      setIsSavingStock(true);
      try {
          const headers = await getAuthHeaders();
          const item_ids = group.products.map((p: Product) => p.ml_item_id);
          if (item_ids.length === 0) {
              toast.info("Nenhum produto no grupo para atualizar.");
              return;
          }
          const { error } = await supabase.functions.invoke('update-ml-stock', { body: { item_ids, stock: stockValue }, headers });
          if (error) throw error;

          toast.success("Estoque de todos os produtos do grupo está sendo atualizado!");
          setTimeout(onGroupUpdate, 2500);
      } catch (error: any) {
          toast.error("Falha ao atualizar estoque.", { description: error.message });
      } finally {
          setIsSavingStock(false);
      }
  };

  const handleStatusChange = async (product: Product, newStatus: 'active' | 'paused') => {
      setUpdatingStatusFor(product.id);
      try {
          const headers = await getAuthHeaders();
          const { error } = await supabase.functions.invoke('update-ml-status', { 
              body: { item_id: product.ml_item_id, status: newStatus }, 
              headers 
          });

          if (error) throw error;

          toast.success(`Anúncio "${product.title}" ${newStatus === 'active' ? 'ativado' : 'pausado'}.`);
          setTimeout(onGroupUpdate, 2500); // Delay para ML processar
      } catch (error: any) {
          toast.error("Falha ao alterar status.", { description: error.message });
      } finally {
          setUpdatingStatusFor(null);
      }
  };

  const handleRemoveProduct = async (productId: string) => {
      // ... (código existente, sem alterações)
  };
  
  return (
      <div className="flex flex-col min-h-screen bg-gray-50">
          <AppHeader />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para todos os grupos</Button>
              <Card>
                  <CardHeader>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div>
                              <CardTitle className="text-2xl">{group.group_name}</CardTitle>
                              <CardDescription>{group.products.length} produtos neste grupo.</CardDescription>
                          </div>
                          <div className="flex space-x-2 items-center">
                              <Input type="number" placeholder="Estoque Mestre" className="w-32" value={masterStock} onChange={e => setMasterStock(e.target.value)} />
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
                                  <TableHead>Anúncio</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Estoque</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {group.products.map((product: Product) => (
                                  <TableRow key={product.id}>
                                      <TableCell className="flex items-center space-x-3">
                                          <img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-md" />
                                          <div>
                                              <a href={product.permalink} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{product.title}</a>
                                              <p className="text-xs text-gray-500">EAN: {product.ean || 'N/A'}</p>
                                          </div>
                                      </TableCell>
                                      <TableCell><Badge variant={product.status === 'active' ? 'default' : 'destructive'}>{product.status === 'active' ? 'Ativo' : 'Pausado'}</Badge></TableCell>
                                      <TableCell className="text-right font-semibold">{product.stock_quantity}</TableCell>
                                      <TableCell className="text-right space-x-2">
                                          {updatingStatusFor === product.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin inline-flex" />
                                          ) : (
                                              product.status === 'active' ? 
                                              <Button size="sm" variant="destructive" onClick={() => handleStatusChange(product, 'paused')}>Pausar</Button> :
                                              <Button size="sm" onClick={() => handleStatusChange(product, 'active')}>Ativar</Button>
                                          )}
                                          <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(product.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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

const AddToGroupModal = ({ product, groups, onClose, onCreateGroup, onAssociationSuccess }: { 
    product: Product; 
    groups: StockGroup[]; 
    onClose: () => void; 
    onCreateGroup: (name: string) => Promise<any | null>;
    onAssociationSuccess: () => void;
}) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        let groupId = selectedGroupId;

        if (isCreatingNew) {
            if (!newGroupName) {
                toast.error("O nome do novo grupo é obrigatório.");
                setIsSaving(false);
                return;
            }
            const newGroup = await onCreateGroup(newGroupName);
            if (newGroup) {
                groupId = newGroup.id;
            } else {
                setIsSaving(false);
                return;
            }
        }

        if (!groupId) {
            toast.error("Por favor, selecione um grupo.");
            setIsSaving(false);
            return;
        }

        const { error } = await supabase.from('stock_group_products').insert({ group_id: groupId, product_id: product.id });
        if (error) {
            toast.error("Erro ao adicionar produto ao grupo.", { description: "Este produto talvez já esteja no grupo."});
        } else {
            toast.success(`"${product.title}" adicionado ao grupo!`);
            onAssociationSuccess();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar "{product.title.substring(0, 30)}..." ao Grupo</DialogTitle>
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

const CreateGroupDialog = ({ open, onOpenChange, onCreate }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    onCreate: (name: string) => Promise<any | null>; 
}) => {
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async () => {
        setIsSaving(true);
        const newGroup = await onCreate(name);
        if (newGroup) {
            onOpenChange(false);
            setName("");
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Grupo de Estoque</DialogTitle>
                    <DialogDescription>Dê um nome para seu novo grupo. Ex: "Projetor Hy320".</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="group-name-dialog" className="text-right">Nome</Label>
                        <Input id="group-name-dialog" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Nome do grupo"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                        Salvar Grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StockManagement;