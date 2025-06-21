
import { useUser } from "@clerk/clerk-react";

// Simulação de usuários com acesso liberado
// Em produção, isso viria de uma API/banco de dados
const APPROVED_USERS = [
  // Adicione emails de usuários aprovados aqui
  // "usuario@exemplo.com"
];

export const useAccessControl = () => {
  const { user, isLoaded } = useUser();
  
  const hasAccess = () => {
    if (!isLoaded || !user) return false;
    
    const userEmail = user.emailAddresses[0]?.emailAddress;
    return APPROVED_USERS.includes(userEmail || "");
  };

  const getUserEmail = () => {
    if (!user) return null;
    return user.emailAddresses[0]?.emailAddress || null;
  };

  return {
    hasAccess: hasAccess(),
    isLoaded,
    userEmail: getUserEmail()
  };
};
