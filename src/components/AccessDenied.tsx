
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Lock, Phone, Mail, ArrowLeft } from "lucide-react";

const AccessDenied = () => {
  const phoneNumber = "(11) 99999-9999"; // Substitua pelo seu número

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      "Olá! Acabei de me cadastrar no Hub Ferramentas e gostaria de liberar meu acesso. Meu email cadastrado é: [SEU_EMAIL_AQUI]"
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Hub Ferramentas</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Site
                </Button>
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Acesso Pendente</CardTitle>
              <CardDescription className="text-lg">
                Sua conta foi criada com sucesso! Para liberar o acesso às ferramentas, 
                entre em contato conosco.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Como liberar seu acesso:</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-800">1</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Entre em contato pelo WhatsApp ou telefone abaixo
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-800">2</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Informe seu email cadastrado e realize o pagamento
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-800">3</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Seu acesso será liberado em até 2 horas úteis
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleWhatsAppContact}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `tel:${phoneNumber}`}
                  className="flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{phoneNumber}</span>
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>Suporte: suporte@hubferramentas.com</span>
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Valor da Mensalidade</h4>
                <div className="text-3xl font-bold text-gradient mb-2">R$ 149,90</div>
                <p className="text-sm text-gray-600">
                  Acesso completo a todas as ferramentas • Suporte prioritário
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AccessDenied;
