// src/components/Pricing.tsx

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const allPlans = [
  {
    name: 'Mensal',
    price: 'R$ 150',
    period: '/mês',
    description: 'Ideal para começar a automatizar e crescer suas vendas.',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Gestão de estoque ilimitada',
      'Respostas automáticas com IA',
      'Integração com Mercado Livre',
      'Analytics básicos',
      'Suporte por WhatsApp',
    ],
    popular: false,
    buttonText: 'Começar Agora',
    plan_type: 'monthly',
  },
  {
    name: 'Trimestral',
    price: 'R$ 397',
    period: '/3 meses',
    description: 'Economia e mais tempo para focar no seu negócio.',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Tudo do plano mensal',
      '12% de desconto',
      'Analytics avançados',
      'Suporte prioritário',
    ],
    popular: true,
    buttonText: 'Melhor Oferta',
    plan_type: 'quarterly',
  },
  {
    name: 'Anual',
    price: 'R$ 1.497',
    period: '/ano',
    description: 'Máximo valor e economia para o seu negócio.',
    icon: <Rocket className="w-6 h-6" />,
    features: [
      'Tudo dos planos anteriores',
      '17% de desconto',
      'Suporte VIP 24/7',
      'Consultoria mensal gratuita',
    ],
    popular: false,
    buttonText: 'Investir no Sucesso',
    plan_type: 'annual',
  },
  // NOVO PLANO ADMIN ADICIONADO AQUI
  {
    name: 'Admin',
    price: 'Gratuito',
    period: 'Vitalício',
    description: 'Acesso completo para administração da plataforma.',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Acesso total e irrestrito',
      'Uso interno e de gerenciamento',
      'Não contabilizado como receita',
    ],
    popular: false,
    buttonText: 'Acesso Interno',
    plan_type: 'admin_lifetime', // Identificador único para o plano
    isAdminOnly: true, // Flag para controle de visibilidade
  },
];

interface PricingProps {
  isAdminView?: boolean;
}

const Pricing = ({ isAdminView = false }: PricingProps) => {

  const handleWhatsAppContact = () => {
    window.open('https://wa.me/qr/LMAV2IFGFOFFF1', '_blank');
  };

  // FILTRA OS PLANOS A SEREM EXIBIDOS
  const plansToShow = isAdminView
    ? allPlans // Se for admin, mostra todos
    : allPlans.filter(plan => plan.plan_type === 'monthly'); // Se não for, mostra apenas o mensal

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
            Plano <span className="text-gradient">Ideal</span> para Seu Negócio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comece a automatizar suas vendas e a maximizar seus resultados hoje mesmo.
          </p>
        </motion.div>

        <div className="flex justify-center">
            {plansToShow.map((plan, index) => (
                <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="w-full max-w-md"
                >
                    <Card className={`relative h-full flex flex-col border-2 border-purple-500 shadow-2xl`}>
                        <CardHeader className="text-center pb-8">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600`}>
                            {plan.icon}
                        </div>
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="text-gray-600">{plan.description}</CardDescription>
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
                            <Button className={`w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600`}>
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
      </div>
    </section>
  );
};

export default Pricing;