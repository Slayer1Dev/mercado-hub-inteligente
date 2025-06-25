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

// --- Interfaces ---
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

// --- COMPONENTE PRINCIPAL ---
const StockManagement = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("title-asc");
    const [currentPage, setCurrentPage] = useState(1);
  
    const [viewingGroup, setViewingGroup] = useState<GroupDetail | null>(null);
    const [productToManage, setProductToManage] = useState<Product | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
    const fetchAllData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await Promise.all([fetchProducts(), fetchGroups()]);
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const fetchProducts = async () => {
        if (!user) return;
        const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id);
        if (error) { toast.error("Erro ao buscar produtos.", { description: error.message }); return; }
        setProducts(data || []);
    };
    
    const fetchGroups = async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_stock_groups_with_product_count');
        if (error) { toast.error("Erro ao buscar grupos de estoque.", { description: error.message }); return; }
        setGroups(data || []);
    };
    
    const handleCreateGroup = async (name: string): Promise<any | null> => {
        if (!name.trim()) {
            toast.warning("O nome do grupo não pode ser vazio.");
            return null;
        }
        try {
            const { data, error } = await supabase.from('stock_groups').insert({ group_name: name, user_id: user?.id }).select().single();
            if (error) throw error;
            toast.success(`Grupo "${name}" criado com sucesso!`);
            fetchGroups();
            return data;
        } catch (error: any) {
            toast.error("Falha ao criar grupo.", { description: error.message });
            return null;
        }
    };

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

    const handleSyncProducts = async () => { /* ... (seu código funcional) ... */ };
    const filteredAndSortedProducts = useMemo(() => { /* ... (seu código funcional) ... */ }, [products, searchTerm, sortOrder]);
    const pageCount = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => { /* ... (seu código funcional) ... */ }, [filteredAndSortedProducts, currentPage]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder]);
  
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
    
                <TabsContent value="products">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Seus Produtos</CardTitle>
                                    <CardDescription>Lista de todos os seus produtos sincronizados.</CardDescription>
                                </div>
                                <Button onClick={handleSyncProducts} disabled={syncing}>
                                    {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                    Sincronizar Produtos
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input placeholder="Pesquisar por título..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger className="w-[220px]"><SelectValue placeholder="Ordenar por..." /></SelectTrigger>
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
                                            <TableHead className="text-right">Estoque</TableHead>
                                            <TableHead className="w-[50px] text-center">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell><img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-md" /></TableCell>
                                                <TableCell className="font-medium max-w-sm truncate" title={product.title}>{product.title}</TableCell>
                                                <TableCell><Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{product.status === 'active' ? 'Ativo' : 'Pausado'}</Badge></TableCell>
                                                <TableCell className="text-right">{product.stock_quantity}</TableCell>
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
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {pageCount > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} /></PaginationItem>
                                            <PaginationItem><span className="px-4 py-2 text-sm">Página {currentPage} de {pageCount}</span></PaginationItem>
                                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(pageCount, p + 1)); }} /></PaginationItem>
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
                                <Card key={group.id} className="flex flex-col hover:shadow-md transition-shadow">
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
  
// --- Componentes Filhos (GroupDetailView, AddToGroupModal, CreateGroupDialog) ---
// Cole aqui as versões completas desses componentes que eu forneci anteriormente.

export default StockManagement;
