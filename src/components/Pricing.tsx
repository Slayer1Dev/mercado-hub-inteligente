
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const handleWhatsAppContact = () => {
    window.open('https://wa.me/qr/LMAV2IFGFOFFF1', '_blank');
  };

  const plans = [
    {
      name: "Mensal",
      price: "R$ 150",
      period: "/mês",
      description: "Para pequenos negócios",
      icon: <Zap className="w-6 h-6" />,
      features: [
        "Gestão de estoque ilimitada",
        "Respostas automáticas com IA",
        "Integração com Mercado Livre",
        "Analytics básicos",
        "Suporte por WhatsApp",
        "Atualizações automáticas"
      ],
      popular: false,
      buttonText: "Começar Agora"
    },
    {
      name: "Trimestral",
      price: "R$ 397",
      period: "/3 meses",
      description: "3 meses com desconto especial",
      icon: <Crown className="w-6 h-6" />,
      features: [
        "Tudo do plano mensal",
        "12% de desconto",
        "Analytics avançados",
        "Suporte prioritário",
        "Relatórios personalizados",
        "Backup automático"
      ],
      popular: true,
      buttonText: "Melhor Oferta"
    },
    {
      name: "Anual",
      price: "R$ 1.497",
      period: "/ano",
      description: "Máximo valor para seu negócio",
      icon: <Rocket className="w-6 h-6" />,
      features: [
        "Tudo dos planos anteriores",
        "17% de desconto",
        "Suporte VIP 24/7",
        "Consultoria mensal gratuita",
        "Recursos beta exclusivos",
        "API personalizada"
      ],
      popular: false,
      buttonText: "Investir no Sucesso"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planos que <span className="text-gradient">Impulsionam</span> Seu Negócio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Escolha o plano ideal para automatizar suas vendas e maximizar seus resultados
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="h-full"
            >
              <Card className={`relative h-full flex flex-col ${
                plan.popular 
                  ? 'border-2 border-purple-500 shadow-2xl scale-105' 
                  : 'border border-gray-200 shadow-lg'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 space-y-3">
                    <Link to="/auth">
                      <Button 
                        className={`w-full py-6 text-lg font-semibold ${
                          plan.popular
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                            : ''
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {plan.buttonText}
                      </Button>
                    </Link>
                    
                    <Button 
                      onClick={handleWhatsAppContact}
                      variant="outline" 
                      className="w-full py-3 text-sm font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Falar no WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            Todos os planos incluem <strong>suporte completo</strong> e <strong>atualizações gratuitas</strong>
          </p>
          <div className="flex items-center justify-center space-x-4">
            <p className="text-sm text-gray-500">
              Dúvidas sobre os planos?
            </p>
            <Button 
              onClick={handleWhatsAppContact}
              variant="link" 
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Conversar no WhatsApp
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
