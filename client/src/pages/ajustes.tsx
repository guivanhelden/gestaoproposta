import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiRequest, queryClient } from "@/lib/queryClient";

// Formulário de configurações da empresa
const companySettingsSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres"),
  contactEmail: z.string().email("E-mail inválido"),
  logoUrl: z.string().optional(),
  emailSignature: z.string().optional(),
  autoEmailEnabled: z.boolean().default(true)
});

// Formulário de configurações de e-mail
const emailSettingsSchema = z.object({
  smtpServer: z.string().min(1, "Servidor SMTP é obrigatório"),
  smtpPort: z.string().min(1, "Porta SMTP é obrigatória"),
  smtpUser: z.string().min(1, "Usuário SMTP é obrigatório"),
  smtpPassword: z.string().min(1, "Senha SMTP é obrigatória"),
  fromEmail: z.string().email("E-mail de envio inválido"),
  fromName: z.string().min(1, "Nome de envio é obrigatório")
});

// Formulário de alteração de senha
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação de senha é obrigatória")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

export default function Ajustes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("empresa");

  // Formulário de configurações da empresa
  const companyForm = useForm<z.infer<typeof companySettingsSchema>>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: "VH Saúde",
      contactEmail: "contato@vhsaude.com.br",
      logoUrl: "",
      emailSignature: "Atenciosamente,\nEquipe VH Saúde",
      autoEmailEnabled: true
    }
  });

  // Formulário de configurações de e-mail
  const emailForm = useForm<z.infer<typeof emailSettingsSchema>>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpServer: "smtp.vhsaude.com.br",
      smtpPort: "587",
      smtpUser: "sistema@vhsaude.com.br",
      smtpPassword: "",
      fromEmail: "noreply@vhsaude.com.br",
      fromName: "Sistema VH Saúde"
    }
  });

  // Formulário de alteração de senha
  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Mutação para salvar configurações da empresa
  const saveCompanySettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySettingsSchema>) => {
      // Aqui seria implementada a chamada à API para salvar as configurações
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações da empresa foram salvas com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutação para salvar configurações de e-mail
  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailSettingsSchema>) => {
      // Aqui seria implementada a chamada à API para salvar as configurações
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de e-mail foram salvas com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordChangeSchema>) => {
      // Aqui seria implementada a chamada à API para alterar a senha
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso"
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Função para enviar formulário de configurações da empresa
  const onSaveCompanySettings = (data: z.infer<typeof companySettingsSchema>) => {
    saveCompanySettingsMutation.mutate(data);
  };

  // Função para enviar formulário de configurações de e-mail
  const onSaveEmailSettings = (data: z.infer<typeof emailSettingsSchema>) => {
    saveEmailSettingsMutation.mutate(data);
  };

  // Função para enviar formulário de alteração de senha
  const onChangePassword = (data: z.infer<typeof passwordChangeSchema>) => {
    changePasswordMutation.mutate(data);
  };

  // Função para testar conexão SMTP
  const handleTestSmtpConnection = () => {
    const data = emailForm.getValues();
    
    if (!emailForm.formState.isValid) {
      emailForm.trigger();
      return;
    }
    
    toast({
      title: "Testando conexão",
      description: "Enviando e-mail de teste para " + data.fromEmail
    });
    
    // Aqui seria implementada a chamada à API para testar a conexão
    setTimeout(() => {
      toast({
        title: "Teste concluído",
        description: "E-mail de teste enviado com sucesso"
      });
    }, 2000);
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Ajustes</h2>
          <p className="text-gray-600">Configure o sistema de acordo com suas necessidades</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="usuario">Usuário</TabsTrigger>
            <TabsTrigger value="integracao">Integrações</TabsTrigger>
          </TabsList>
          
          {/* Configurações da Empresa */}
          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações de identificação da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onSaveCompanySettings)} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail de Contato</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Logo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            URL para o logo da empresa que será usado nos e-mails e relatórios
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="emailSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assinatura de E-mail</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={4} 
                              placeholder="Assinatura padrão para os e-mails enviados" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="autoEmailEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel>E-mails Automáticos</FormLabel>
                              <FormDescription>
                                Ativar envio automático de e-mails para clientes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={saveCompanySettingsMutation.isPending}
                    >
                      {saveCompanySettingsMutation.isPending 
                        ? "Salvando..." 
                        : "Salvar Configurações"
                      }
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Configurações de E-mail */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de E-mail</CardTitle>
                <CardDescription>
                  Configure o servidor SMTP para envio de e-mails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSaveEmailSettings)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="smtpServer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servidor SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Porta SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="587" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário SMTP</FormLabel>
                            <FormControl>
                              <Input placeholder="usuario@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha SMTP</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={emailForm.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail de Envio</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="fromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Envio</FormLabel>
                            <FormControl>
                              <Input placeholder="Sistema VH Saúde" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 md:justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleTestSmtpConnection}
                      >
                        Testar Conexão
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={saveEmailSettingsMutation.isPending}
                      >
                        {saveEmailSettingsMutation.isPending 
                          ? "Salvando..." 
                          : "Salvar Configurações"
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Configurações de Usuário */}
          <TabsContent value="usuario">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Altere sua senha de acesso ao sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending 
                          ? "Alterando..." 
                          : "Alterar Senha"
                        }
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Usuário</CardTitle>
                  <CardDescription>
                    Suas informações de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="text-base font-medium">{user?.name || "Usuário"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">E-mail</p>
                      <p className="text-base font-medium">{user?.email || "-"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Cargo</p>
                      <p className="text-base font-medium capitalize">{user?.role || "Usuário"}</p>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      Editar Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Configurações de Integração */}
          <TabsContent value="integracao">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Configure integrações com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">WhatsApp API</h3>
                        <p className="text-sm text-gray-500">Integração para envio de mensagens via WhatsApp</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">API Key</label>
                        <Input type="password" placeholder="••••••••••••••••" value="" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Número de Telefone</label>
                        <Input placeholder="+55 11 99999-9999" value="" />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Consulta CNPJ (ReceitaWS)</h3>
                        <p className="text-sm text-gray-500">Integração para consulta automática de CNPJ</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">API Key</label>
                        <Input type="password" placeholder="••••••••••••••••" value="API-KEY-SAMPLE" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Limite Diário</label>
                        <Input placeholder="3" value="3" />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">n8n Workflow Automation</h3>
                        <p className="text-sm text-gray-500">Integração para automação de fluxos de trabalho</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Webhook URL</label>
                        <Input placeholder="https://n8n.exemplo.com/webhook/..." value="" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Token de Autenticação</label>
                        <Input type="password" placeholder="••••••••••••••••" value="" />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full md:w-auto">Salvar Integrações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
