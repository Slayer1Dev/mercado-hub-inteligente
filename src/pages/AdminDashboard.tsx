
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Database,
  Activity,
  Settings,
  Search,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  is_online: boolean;
  notes: string | null;
  subscription: {
    plan_type: string;
    plan_status: string;
    expires_at: string | null;
  } | null;
  integrations: Array<{
    integration_type: string;
    is_connected: boolean;
    last_sync: string | null;
  }>;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    onlineUsers: 0,
    monthlyRevenue: 0
  });

  // Load users and stats
  useEffect(() => {
    loadUsers();
    loadStats();
    
    // Real-time updates
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers();
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, () => {
        loadUsers();
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions (plan_type, plan_status, expires_at),
          user_integrations (integration_type, is_connected, last_sync)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
        last_login: profile.last_login,
        is_online: profile.is_online,
        notes: profile.notes,
        subscription: profile.user_subscriptions?.[0] || null,
        integrations: profile.user_integrations || []
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: profilesCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      const { data: activeCount } = await supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact' })
        .eq('plan_status', 'active');

      const { data: pendingCount } = await supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact' })
        .eq('plan_status', 'pending');

      const { data: onlineCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('is_online', true);

      setStats({
        totalUsers: profilesCount?.length || 0,
        activeUsers: activeCount?.length || 0,
        pendingUsers: pendingCount?.length || 0,
        onlineUsers: onlineCount?.length || 0,
        monthlyRevenue: (activeCount?.length || 0) * 97 // Assumindo R$ 97 por usuário ativo
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateUserSubscription = async (userId: string, planType: string, planStatus: string, expiresAt?: string) => {
    try {
      const updateData: any = {
        plan_type: planType,
        plan_status: planStatus,
        updated_at: new Date().toISOString()
      };

      if (expiresAt) {
        updateData.expires_at = expiresAt;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_user_id: user?.id,
        action: 'update_subscription',
        target_user_id: userId,
        details: { planType, planStatus, expiresAt }
      });

      toast.success('Assinatura atualizada com sucesso');
      loadUsers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Erro ao atualizar assinatura');
    }
  };

  const updateUserNotes = async (userId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notes })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('admin_logs').insert({
        admin_user_id: user?.id,
        action: 'update_notes',
        target_user_id: userId,
        details: { notes }
      });

      toast.success('Observações atualizadas');
      loadUsers();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Erro ao atualizar observações');
    }
  };

  const sendMassEmail = async (emails: string[], subject: string, message: string) => {
    // Esta funcionalidade requerirá uma Edge Function
    toast.info('Funcionalidade de email em massa será implementada em breve');
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadge = (subscription: any) => {
    if (!subscription) return <Badge variant="secondary">Sem plano</Badge>;
    
    const statusColors = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      cancelled: 'outline'
    } as const;

    return (
      <Badge variant={statusColors[subscription.plan_status as keyof typeof statusColors] || 'secondary'}>
        {subscription.plan_type} - {subscription.plan_status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-red-600 text-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8" />
              <span className="text-xl font-bold">Admin Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-red-600">
                  Dashboard Usuario
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gestão completa do sistema Hub de Ferramentas</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.onlineUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.monthlyRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Gerencie todos os usuários do sistema</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Mail className="w-4 h-4 mr-2" />
                    Email em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Email em Massa</DialogTitle>
                    <DialogDescription>
                      Envie emails para todos os usuários ou grupos específicos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Assunto</Label>
                      <Input placeholder="Assunto do email" />
                    </div>
                    <div>
                      <Label>Mensagem</Label>
                      <Textarea placeholder="Conteúdo do email..." rows={5} />
                    </div>
                    <div>
                      <Label>Destinatários</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os usuários</SelectItem>
                          <SelectItem value="active">Usuários ativos</SelectItem>
                          <SelectItem value="pending">Usuários pendentes</SelectItem>
                          <SelectItem value="trial">Usuários em trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Enviar Email</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Integrações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${userData.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="font-medium">{userData.name || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                          <div className="text-xs text-gray-400">
                            Criado em {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {userData.is_online ? (
                          <Badge variant="default">Online</Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(userData.subscription)}</TableCell>
                    <TableCell>
                      {userData.last_login ? (
                        <div className="text-sm">
                          {new Date(userData.last_login).toLocaleString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userData.integrations.map((integration, idx) => (
                          <Badge 
                            key={idx} 
                            variant={integration.is_connected ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {integration.integration_type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(userData)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>
                              Gerencie as configurações do usuário {userData.email}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <UserEditForm 
                              user={selectedUser} 
                              onUpdate={() => {
                                loadUsers();
                                setSelectedUser(null);
                              }}
                              onUpdateSubscription={updateUserSubscription}
                              onUpdateNotes={updateUserNotes}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// User Edit Form Component
const UserEditForm = ({ user, onUpdate, onUpdateSubscription, onUpdateNotes }: {
  user: UserData;
  onUpdate: () => void;
  onUpdateSubscription: (userId: string, planType: string, planStatus: string, expiresAt?: string) => void;
  onUpdateNotes: (userId: string, notes: string) => void;
}) => {
  const [notes, setNotes] = useState(user.notes || '');
  const [planType, setPlanType] = useState(user.subscription?.plan_type || 'trial');
  const [planStatus, setPlanStatus] = useState(user.subscription?.plan_status || 'pending');
  const [expiresAt, setExpiresAt] = useState(
    user.subscription?.expires_at ? 
    new Date(user.subscription.expires_at).toISOString().split('T')[0] : 
    ''
  );

  const handleUpdateSubscription = () => {
    const expirationDate = expiresAt ? new Date(expiresAt).toISOString() : undefined;
    onUpdateSubscription(user.id, planType, planStatus, expirationDate);
    onUpdate();
  };

  const handleUpdateNotes = () => {
    onUpdateNotes(user.id, notes);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Informações do Usuário</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Nome:</strong> {user.name || 'Não informado'}</div>
          <div><strong>Cadastrado:</strong> {new Date(user.created_at).toLocaleString('pt-BR')}</div>
          <div><strong>Último acesso:</strong> {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}</div>
          <div className="flex items-center space-x-2">
            <strong>Status:</strong>
            <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>{user.is_online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="space-y-4">
        <h4 className="font-medium">Gerenciar Assinatura</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo do Plano</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial (7 dias)</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={planStatus} onValueChange={setPlanStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Data de Expiração</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <Button onClick={handleUpdateSubscription} className="w-full">
          Atualizar Assinatura
        </Button>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h4 className="font-medium">Observações</h4>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações sobre este usuário..."
          rows={4}
        />
        <Button onClick={handleUpdateNotes} variant="outline" className="w-full">
          Salvar Observações
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
