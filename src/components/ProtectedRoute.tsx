
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle, Phone } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, hasAccess, isAdmin, subscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Acesso Necessário</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Você precisa estar logado para acessar esta página.
            </p>
            <Link to="/auth">
              <Button className="w-full">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Acesso Suspenso</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 mb-4">
              Seu acesso ao Hub de Ferramentas está suspenso.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Status da Conta:</strong> {subscription?.plan_status || 'Pendente'}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Plano:</strong> {subscription?.plan_type || 'Trial'}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <Phone className="w-5 h-5" />
              <span className="font-semibold">(11) 99999-9999</span>
            </div>
            <p className="text-sm text-gray-600">
              Entre em contato conosco para ativar seu acesso
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
