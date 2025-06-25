// src/components/Hero.tsx

import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth"; // Alterado aqui
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Package, TrendingUp } from "lucide-react";

const Hero = () => {
  const { user } = useAuth(); // Alterado aqui

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ... o resto do seu código de animação que não precisa mudar ... */}
      <div className="absolute inset-0 parallax-bg"></div>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" />
        <motion.div animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-32 right-20 w-24 h-24 bg-white/10 rounded-full backdrop-blur-sm" />
        <motion.div animate={{ y: [0, -15, 0], x: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 left-1/4 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transforme suas vendas no <span className="block text-yellow-300">Mercado Livre</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Gerencie estoque inteligentemente e responda clientes automaticamente com IA. A plataforma completa para vendedores que querem escalar.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          {user ? ( // Alterado aqui de isSignedIn
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Acessar Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth"> {/* Alterado aqui */}
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </motion.div>
        
        {/* ... resto do componente ... */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="glass-effect p-6 rounded-2xl text-center"> <Package className="w-12 h-12 text-yellow-300 mx-auto mb-4" /> <h3 className="text-white font-semibold text-lg mb-2">Gestão de Estoque</h3> <p className="text-white/80">Controle inteligente de produtos em múltiplos anúncios</p> </div>
          <div className="glass-effect p-6 rounded-2xl text-center"> <Bot className="w-12 h-12 text-yellow-300 mx-auto mb-4" /> <h3 className="text-white font-semibold text-lg mb-2">Respostas IA</h3> <p className="text-white/80">Atendimento automatizado com inteligência artificial</p> </div>
          <div className="glass-effect p-6 rounded-2xl text-center"> <TrendingUp className="w-12 h-12 text-yellow-300 mx-auto mb-4" /> <h3 className="text-white font-semibold text-lg mb-2">Analytics</h3> <p className="text-white/80">Métricas detalhadas para otimizar suas vendas</p> </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;