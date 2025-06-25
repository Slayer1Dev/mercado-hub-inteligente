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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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

    const fetchProducts = async () => { /* ... (código existente, sem alterações) ... */ };
    const fetchGroups = async () => { /* ... (código existente, sem alterações) ... */ };
    const handleCreateGroup = async (name: string) => { /* ... (código existente, sem alterações) ... */ };
    const handleSyncProducts = async () => { /* ... (código existente, sem alterações) ... */ };
    const handleViewGroup = async (group: StockGroup) => { /* ... (código existente, sem alterações) ... */ };
    
    const filteredAndSortedProducts = useMemo(() => { /* ... (código existente, sem alterações) ... */ }, [products, searchTerm, sortOrder]);
    const pageCount = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => { /* ... (código existente, sem alterações) ... */ }, [filteredAndSortedProducts, currentPage]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder]);
  
    if (loading) {
        return <div className="flex flex-col min-h-screen bg-gray-50"><AppHeader /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div></div>
    }

    if (viewingGroup) {
      return <GroupDetailView group={viewingGroup} onBack={() => { setViewingGroup(null); fetchGroups(); }} onGroupUpdate={() => handleViewGroup(viewingGroup)} />
    }
  
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AppHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ... (Todo o JSX do return principal) ... */}
        </main>
        {productToManage && ( <AddToGroupModal /* ... */ /> )}
        <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} onCreate={handleCreateGroup}/>
      </div>
    );
};
  
// --- COMPONENTES FILHOS (VIEWS E MODAIS) ---
const GroupDetailView = ({ group, onBack, onGroupUpdate }: { group: GroupDetail; onBack: () => void; onGroupUpdate: () => void }) => { /* ... (código completo deste componente) ... */ };
const AddToGroupModal = ({ product, groups, onClose, onCreateGroup, onAssociationSuccess }: { /* ... */ }) => { /* ... (código completo deste componente) ... */ };
const CreateGroupDialog = ({ open, onOpenChange, onCreate }: { /* ... */ }) => { /* ... (código completo deste componente) ... */ };

export default StockManagement;