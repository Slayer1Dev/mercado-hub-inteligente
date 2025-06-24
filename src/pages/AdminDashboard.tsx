
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
      // Chama a função RPC que acabamos de criar no Supabase
      const { data, error } = await supabase.rpc('get_admin_users_data');
  
      if (error) throw error;
  
      // Os dados agora vêm no formato correto, prontos para uso
      const formattedUsers: UserData[] = data?.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
        last_login: profile.last_login,
        is_online: profile.is_online,
        notes: profile.notes,
        subscription: profile.subscription, // O objeto subscription já vem pronto
        integrations: profile.integrations || [] // O array de integrations já vem pronto
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
        monthlyRevenue: (activeCount?.length || 0) * 150
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <span className="text-xl font-bold">Painel Administrativo</span>
                <p className="text-blue-100 text-sm">Hub de Ferramentas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">(11) 9 4897-3101</span>
              </div>
              <Link to="/dashboard">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 font-medium px-4 py-2"
                >
                  Dashboard Usuário
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, Administrador</h1>
                <p className="text-gray-600">Gestão completa do sistema Hub de Ferramentas</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Suporte Técnico</p>
                <p className="font-semibold text-blue-600">Lucas - hubdeferramentas@gmail.com</p>
                <p className="text-sm text-gray-600">(11) 9 4897-3101</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Usuários Totais</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Total de contas criadas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Usuários Ativos</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Planos ativos pagos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                <Clock className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.pendingUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Aguardando ativação</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Online Agora</CardTitle>
                <Activity className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.onlineUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Conectados agora</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  R$ {stats.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Faturamento estimado</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-gray-900">Gestão de Usuários</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gerencie todos os usuários e suas configurações do sistema
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    placeholder="Buscar usuários por email ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Usuário</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Plano</TableHead>
                      <TableHead className="font-semibold">Último Acesso</TableHead>
                      <TableHead className="font-semibold">Integrações</TableHead>
                      <TableHead className="font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${userData.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div>
                              <div className="font-medium text-gray-900">{userData.name || 'Sem nome'}</div>
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
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                Offline
                              </Badge>
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
                            <span className="text-gray-400 text-sm">Nunca</span>
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
                            {userData.integrations.length === 0 && (
                              <span className="text-xs text-gray-400">Nenhuma</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(userData)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
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
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-3 text-gray-900">Informações do Usuário</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{user.email}</span></div>
          <div><strong className="text-gray-700">Nome:</strong> <span className="text-gray-900">{user.name || 'Não informado'}</span></div>
          <div><strong className="text-gray-700">Cadastrado:</strong> <span className="text-gray-900">{new Date(user.created_at).toLocaleString('pt-BR')}</span></div>
          <div><strong className="text-gray-700">Último acesso:</strong> <span className="text-gray-900">{user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}</span></div>
          <div className="flex items-center space-x-2 col-span-2">
            <strong className="text-gray-700">Status:</strong>
            <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`font-medium ${user.is_online ? 'text-green-600' : 'text-gray-600'}`}>
              {user.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Gerenciar Assinatura</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700">Tipo do Plano</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial (7 dias)</SelectItem>
                <SelectItem value="monthly">Mensal - R$ 150</SelectItem>
                <SelectItem value="quarterly">Trimestral - R$ 397</SelectItem>
                <SelectItem value="annual">Anual - R$ 1.497</SelectItem>
                <SelectItem value="lifetime">Vitalício - R$ 2.997</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-700">Status</Label>
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
          <Label className="text-gray-700">Data de Expiração</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <Button onClick={handleUpdateSubscription} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          Atualizar Assinatura
        </Button>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Observações Administrativas</h4>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações sobre este usuário (histórico de pagamentos, suporte, etc.)..."
          rows={4}
          className="resize-none"
        />
        <Button onClick={handleUpdateNotes} variant="outline" className="w-full hover:bg-gray-50">
          Salvar Observações
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
