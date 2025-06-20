
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Package, Bot, BarChart3, Shield, Zap, Users } from "lucide-react";

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: Package,
      title: "Gestão Inteligente de Estoque",
      description: "Conecte múltiplos anúncios ao mesmo estoque físico. Evite vendas em excesso e mantenha controle total sobre seus produtos.",
      color: "bg-blue-500"
    },
    {
      icon: Bot,
      title: "Respostas Automáticas com IA",
      description: "Nossa IA analisa perguntas, dados do anúncio e histórico para gerar respostas precisas. Você aprova ou edita antes do envio.",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description: "Visualize métricas importantes, vendas, estoque e performance dos seus anúncios em tempo real.",
      color: "bg-green-500"
    },
    {
      icon: Shield,
      title: "Integração Segura",
      description: "Conexão oficial com APIs do Mercado Livre. Seus dados estão seguros e a integração é confiável.",
      color: "bg-red-500"
    },
    {
      icon: Zap,
      title: "Automação Inteligente",
      description: "Reduza tempo gasto em tarefas repetitivas. Foque no que importa: fazer mais vendas.",
      color: "bg-yellow-500"
    },
    {
      icon: Users,
      title: "Suporte Especializado",
      description: "Nossa equipe entende o Mercado Livre e está pronta para ajudar você a crescer.",
      color: "bg-indigo-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Recursos <span className="text-gradient">Poderosos</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tudo que você precisa para automatizar e escalar suas vendas no Mercado Livre
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
