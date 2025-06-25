// src/components/Navbar.tsx

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth"; 
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">Hub Ferramentas</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" onClick={scrollToFeatures} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Recursos</a>
            <a href="#pricing" onClick={scrollToPricing} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Preços</a>
            
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline">Acessar Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth"><Button variant="outline">Entrar</Button></Link>
                <Link to="/auth"><Button>Começar Agora</Button></Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;