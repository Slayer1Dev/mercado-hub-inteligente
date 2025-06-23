// src/components/AppHeader.tsx

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { Badge } from "@/components/ui/badge";
import { Zap, Settings, Shield } from "lucide-react";

const AppHeader = () => {
  const { profile, subscription, isAdmin } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:inline">Hub Ferramentas</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="font-semibold text-sm text-gray-800">{profile?.name || profile?.email}</p>
              <Badge variant={subscription?.plan_status === 'active' ? 'default' : 'secondary'}>
                Plano {subscription?.plan_type || 'N/A'}
              </Badge>
            </div>

            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="icon" title="Painel Admin">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link to="/settings">
               <Button variant="outline" size="icon" title="Configurações">
                  <Settings className="h-4 w-4" />
                </Button>
            </Link>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;