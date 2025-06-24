// src/pages/StockGroups.tsx

import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Package, Boxes, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface StockGroup {
  id: string;
  group_name: string;
  // Futuramente adicionaremos os produtos aqui
}

const StockGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_groups')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast.error("Erro ao buscar grupos de estoque.", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.warning("O nome do grupo não pode ser vazio.");
      return;
    }
    setSaving(true);
    try {
      const { data, error }_ = await supabase
        .from('stock_groups')
        .insert({ group_name: newGroupName, user_id: user?.id })
        .select();

      if (error) throw error;

      toast.success(`Grupo "${newGroupName}" criado com sucesso!`);
      setGroups([...groups, data[0]]);
      setNewGroupName("");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Falha ao criar grupo.", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Grupos de Estoque</h1>
                <p className="text-gray-600">Sincronize o estoque de anúncios idênticos.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Grupo de Estoque</DialogTitle>
                  <DialogDescription>
                    Dê um nome para seu grupo. Ex: "Projetor Hy320" ou "Kit Ferramentas 150 peças".
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="col-span-3"
                      placeholder="Nome do grupo"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateGroup} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        {loading ? (
          <p>Carregando grupos...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
              <Boxes className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
              <h3 className="font-semibold text-lg">Nenhum grupo encontrado</h3>
              <p className="text-sm mt-2">Clique em "Criar Novo Grupo" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2 text-purple-600"/>{group.group_name}</CardTitle>
                  <CardDescription>0 produtos neste grupo</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Futuramente, a lista de produtos virá aqui */}
                  <Button variant="outline" className="w-full" disabled>Adicionar Produto (em breve)</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StockGroups;