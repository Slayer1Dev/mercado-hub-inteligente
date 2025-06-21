
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SignUpButton } from "@clerk/clerk-react";

const Pricing = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Preço <span className="text-gradient">Simples</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Um plano completo com tudo que você precisa para transformar suas vendas
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl shadow-2xl border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-bl-2xl">
              <span className="text-sm font-semibold">MAIS POPULAR</span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Completo</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="text-5xl font-bold text-gradient">R$ 149</span>
                <span className="text-gray-600 ml-2">,90/mês</span>
              </div>
              <p className="text-gray-600">Tudo que você precisa para escalar suas vendas</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Gestão ilimitada de estoque",
                "Respostas automáticas com IA",
                "Dashboard completo com métricas",
                "Integração com Mercado Livre",
                "Suporte prioritário",
                "Atualizações automáticas",
                "Relatórios detalhados",
                "Configurações avançadas"
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <SignUpButton>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl">
                Começar Agora
              </Button>
            </SignUpButton>

            <p className="text-center text-sm text-gray-500 mt-4">
              Entre em contato para ativação • Cancele quando quiser
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
