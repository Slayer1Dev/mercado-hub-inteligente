
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
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
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <a href="#features" onClick={scrollToFeatures} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              Recursos
            </a>
            <a href="#pricing" onClick={scrollToPricing} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              Preços
            </a>
            
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <SignInButton>
                  <Button variant="outline">Entrar</Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Começar Agora</Button>
                </SignUpButton>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className="block px-3 py-2 text-gray-700">Home</Link>
              <a href="#features" onClick={scrollToFeatures} className="block px-3 py-2 text-gray-700 cursor-pointer">Recursos</a>
              <a href="#pricing" onClick={scrollToPricing} className="block px-3 py-2 text-gray-700 cursor-pointer">Preços</a>
              {isSignedIn ? (
                <div className="flex flex-col space-y-2 px-3 py-2">
                  <Link to="/dashboard">
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <div className="flex flex-col space-y-2 px-3 py-2">
                  <SignInButton>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button className="w-full">Começar Agora</Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
