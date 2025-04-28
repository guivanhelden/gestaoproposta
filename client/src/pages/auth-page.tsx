import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SupabaseTest } from "@/components/supabase-test";
import { Checkbox } from "@/components/ui/checkbox";
import { type CheckedState } from "@radix-ui/react-checkbox";
import { LockIcon, MailIcon, UserIcon, KeyIcon, ArrowRightIcon } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Estado do login
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Estado do registro
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Handler para Checkbox
  const handleTermsChange = (checked: CheckedState) => {
    setAcceptTerms(checked === true);
  };

  // Efeito para partículas
  useEffect(() => {
    // Esta função simula o efeito de partículas no fundo
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles-container');
      if (!particlesContainer) return;
      
      // Limpa partículas existentes
      particlesContainer.innerHTML = '';
      
      // Cria novas partículas
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full bg-white/30 animate-floating';
        
        // Tamanho aleatório
        const size = Math.random() * 10 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posição aleatória
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Opacidade aleatória
        particle.style.opacity = `${Math.random() * 0.5}`;
        
        // Animação com delay aleatório
        particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particlesContainer.appendChild(particle);
      }
    };
    
    createParticles();
    
    // Adicionamos este estilo de animação diretamente no documento
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floating {
        0%, 100% {
          transform: translateY(0) translateX(0);
          opacity: 0.3;
        }
        25% {
          transform: translateY(-20px) translateX(10px);
          opacity: 0.5;
        }
        50% {
          transform: translateY(-10px) translateX(20px);
          opacity: 0.2;
        }
        75% {
          transform: translateY(-30px) translateX(-10px);
          opacity: 0.4;
        }
      }
      
      .animate-floating {
        animation: floating linear infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Manipuladores de eventos de login
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const user = await login({
        email: loginData.email,
        password: loginData.password
      });
      
      if (user) {
        setLocation("/dashboard");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manipuladores de eventos de registro
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "As senhas digitadas não coincidem",
        variant: "destructive",
      });
      return;
    }
    
    if (!acceptTerms) {
      toast({
        title: "Termos e condições",
        description: "Você precisa aceitar os termos e condições para continuar",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    try {
      const user = await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password
      });
      
      if (user) {
        setLocation("/dashboard");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Imagem de fundo */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1718128120413-783e25de9a3b?q=80&w=2153&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Background" 
          className="object-cover w-full h-full opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-purple-900/80 to-black/90 mix-blend-multiply"></div>
      </div>
      
      {/* Container de partículas */}
      <div id="particles-container" className="absolute inset-0 overflow-hidden z-10"></div>
      
      <div className="absolute inset-0 z-10 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-700/40 via-transparent to-transparent"></div>
      
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center max-w-md w-full space-y-8">
          <div className="w-64 h-20 relative">
            <img 
              src="https://doc.vhseguros.com.br/files/public_html/LogoVH%2FVAN-HELDEN-branco.png" 
              alt="VH Seguros Logo" 
              className="object-contain w-64 h-16"
            />
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-3xl md:text-4xl font-light text-white/90 tracking-widest uppercase">
              Sistema de Gestão VH
            </h1>
            
            <p className="text-xl text-purple-200/80 font-light">
              Emissão de Propostas de Planos de Saúde
            </p>
          </div>

          <div className="w-full max-w-md mt-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(91,33,182,0.4)] overflow-hidden">
              <Tabs defaultValue="login" className="w-full">
                <div className="px-7 pt-7">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20 rounded-xl overflow-hidden border border-white/10">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-purple-500/90 data-[state=active]:text-white text-gray-400 py-3 transition-all duration-300"
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-purple-500/90 data-[state=active]:text-white text-gray-400 py-3 transition-all duration-300"
                    >
                      Cadastrar
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="p-7">
                  <TabsContent value="login">
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-gray-200 flex items-center gap-2">
                          <MailIcon size={16} className="text-purple-300" />
                          <span>E-mail</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={loginData.email}
                            onChange={handleLoginChange}
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-gray-200 flex items-center gap-2">
                            <LockIcon size={16} className="text-purple-300" />
                            <span>Senha</span>
                          </Label>
                          <a
                            href="#"
                            className="text-sm text-purple-300 hover:text-white transition-colors"
                          >
                            Esqueceu a senha?
                          </a>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox 
                          id="terms" 
                          checked={acceptTerms} 
                          onCheckedChange={handleTermsChange} 
                          className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" 
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none text-gray-300 hover:text-white cursor-pointer"
                        >
                          Aceito os termos e condições
                        </label>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium h-12 rounded-xl mt-5 flex items-center justify-center gap-2 transition-all transform hover:translate-y-[-2px]"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <span className="flex items-center gap-2">Autenticando<span className="animate-pulse">...</span></span>
                        ) : (
                          <>
                            <span>Entrar</span>
                            <ArrowRightIcon size={18} />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegisterSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-gray-200 flex items-center gap-2">
                          <UserIcon size={16} className="text-purple-300" />
                          <span>Nome Completo</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Seu Nome Completo"
                            value={registerData.name}
                            onChange={handleRegisterChange}
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="register-email" className="text-gray-200 flex items-center gap-2">
                          <MailIcon size={16} className="text-purple-300" />
                          <span>E-mail</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <Label htmlFor="register-password" className="text-gray-200 flex items-center gap-2">
                            <KeyIcon size={16} className="text-purple-300" />
                            <span>Senha</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="register-password"
                              name="password"
                              type="password"
                              placeholder="••••••••"
                              value={registerData.password}
                              onChange={handleRegisterChange}
                              required
                              className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="confirmPassword" className="text-gray-200 flex items-center gap-2">
                            <KeyIcon size={16} className="text-purple-300" />
                            <span>Confirmar Senha</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={registerData.confirmPassword}
                              onChange={handleRegisterChange}
                              required
                              className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-400 focus-visible:ring-purple-400/20 h-12 pl-4 pr-4 rounded-xl transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox 
                          id="register-terms" 
                          checked={acceptTerms} 
                          onCheckedChange={handleTermsChange}
                          className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" 
                        />
                        <label
                          htmlFor="register-terms"
                          className="text-sm font-medium leading-none text-gray-300 hover:text-white cursor-pointer"
                        >
                          Aceito os termos e condições
                        </label>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium h-12 rounded-xl mt-5 flex items-center justify-center gap-2 transition-all transform hover:translate-y-[-2px]"
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <span className="flex items-center gap-2">Processando<span className="animate-pulse">...</span></span>
                        ) : (
                          <>
                            <span>Criar Conta</span>
                            <ArrowRightIcon size={18} />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
              
              <div className="px-7 pb-7 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setShowTester(!showTester)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {showTester ? "Ocultar diagnóstico" : "Diagnóstico de conexão"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showTester && (
          <div className="mt-8 w-full max-w-md bg-white/10 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/20">
            <SupabaseTest />
          </div>
        )}
        
        <div className="mt-8 text-xs text-gray-400">
          © {new Date().getFullYear()} VH Corretora de Seguros. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
