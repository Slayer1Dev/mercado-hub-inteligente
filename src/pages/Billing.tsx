// src/pages/Billing.tsx

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { UserButton } from "@clerk/clerk-react"; // LINHA REMOVIDA
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Download, Calendar } from "lucide-react";
import AppHeader from "@/components/AppHeader"; // Header correto importado

const Billing = () => {
  // Mock billing data
  const subscription = {
    plan: "Plano Completo",
    status: "Ativo",
    amount: 149.90,
    nextBilling: "2024-02-15",
    paymentMethod: "**** 1234"
  };

  const invoices = [
    { id: "INV-001", date: "2024-01-15", amount: 149.90, status: "Pago" },
    { id: "INV-002", date: "2023-12-15", amount: 149.90, status: "Pago" },
    { id: "INV-003", date: "2023-11-15", amount: 149.90, status: "Pago" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Usando o AppHeader padronizado */}
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Assinatura Atual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Assinatura Atual</CardTitle>
                <CardDescription>
                  Gerencie sua assinatura e métodos de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-green-900">{subscription.plan}</h3>
                    <p className="text-sm text-green-700">R$ {subscription.amount}/mês</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {subscription.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Próxima Cobrança</Label>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-900">{new Date(subscription.nextBilling).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Método de Pagamento</Label>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-900">Cartão {subscription.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1" disabled>
                    Gerenciar Assinatura
                    <span className="ml-2 text-xs">(Em breve)</span>
                  </Button>
                  <Button variant="outline" className="flex-1" disabled>
                    Alterar Forma de Pagamento
                    <span className="ml-2 text-xs">(Em breve)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Histórico de Faturas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Faturas</CardTitle>
                <CardDescription>
                  Visualize e baixe suas faturas anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invoice.id}</p>
                          <p className="text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">R$ {invoice.amount.toFixed(2)}</p>
                          <Badge variant={invoice.status === "Pago" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Informações de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
                <CardDescription>
                  Entre em contato conosco para questões sobre cobrança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-900 mb-2">
                    Tem dúvidas sobre sua cobrança ou assinatura?
                  </p>
                  <p className="text-blue-700 text-sm mb-4">
                    Nossa equipe de suporte está pronta para ajudar você com qualquer questão relacionada à cobrança.
                  </p>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Entrar em Contato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper component for labels
const Label = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

export default Billing;