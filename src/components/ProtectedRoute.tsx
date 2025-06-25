
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle, Phone, Mail, User } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, hasAccess, isAdmin, subscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Se não houver usuário, redireciona programaticamente para a página de login.
    // O 'replace' evita que o usuário possa "voltar" para a página protegida.
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-900">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 p-6">
            <p className="text-gray-600">
              Você não tem permissão para acessar esta área administrativa.
            </p>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full">Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requireAdmin && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
        <Card className="w-full max-w-lg shadow-lg border-0">
          <CardHeader className="text-center bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-lg">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-900">Acesso Suspenso</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 p-6">
            <p className="text-gray-600 text-lg">
              Seu acesso ao Hub de Ferramentas está suspenso.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Status da Conta:</strong> {subscription?.plan_status || 'Pendente'}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Plano:</strong> {subscription?.plan_type || 'Trial'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 text-green-700 mb-2">
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Suporte Técnico</span>
                </div>
                <p className="text-green-800 font-medium">Lucas</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">(11) 9 4897-3101</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold text-sm">hubdeferramentas@gmail.com</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Entre em contato conosco para:</strong>
              </p>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• Ativar seu plano</li>
                <li>• Esclarecer dúvidas sobre pagamento</li>
                <li>• Suporte técnico especializado</li>
                <li>• Configuração de integrações</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;