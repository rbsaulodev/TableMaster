// app/page.tsx
"use client"

import { useState, useEffect } from "react" // Importe useEffect
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Utensils, UserPlus, CheckCircle } from "lucide-react"
import ClientDashboard from "./components/client-dashboard"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster" // Importe Toaster aqui para o root layout

const BASE_URL = "http://localhost:8080/api"

// Interface para os dados de resposta de autenticação (reproduzida aqui)
interface AuthResponseData {
  token: string;
  username: string;
  fullName: string;
  role: string;
  message: string;
  cpf?: string;
}

// --- Funções para gerenciar o token e dados no localStorage ---
const saveAuthData = (data: AuthResponseData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_role', data.role);
    localStorage.setItem('user_full_name', data.fullName);
    localStorage.setItem('user_username', data.username);
    localStorage.setItem('user_message', data.message);
    if (data.cpf) {
      localStorage.setItem('user_cpf', data.cpf);
    }
  }
};

const getAuthData = (): AuthResponseData | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    const fullName = localStorage.getItem('user_full_name');
    const username = localStorage.getItem('user_username');
    const message = localStorage.getItem('user_message');
    const cpf = localStorage.getItem('user_cpf');

    if (token && role && fullName && username && message) {
      return { token, role, fullName, username, message, cpf: cpf || undefined };
    }
  }
  return null;
};

const removeAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('user_username');
    localStorage.removeItem('user_message');
    localStorage.removeItem('user_cpf');
  }
};
// -----------------------------------------------------------------


export default function TableMaster() {
  const { toast } = useToast();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<AuthResponseData | null>(null); // Tipado corretamente
  const [activeTab, setActiveTab] = useState("login");
  const [loadingAuth, setLoadingAuth] = useState(true); // Novo estado para controlar o carregamento inicial

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerData, setRegisterData] = useState({
    fullName: "",
    cpf: "",
    username: "",
    password: "",
    email: "",
  });

  // Carregar dados de autenticação do localStorage ao iniciar
  useEffect(() => {
    const data = getAuthData();
    if (data && data.token) { // Verifica se há um token
      setAuthToken(data.token);
      setCurrentUserData(data);
    }
    setLoadingAuth(false); // Marca como carregado
  }, []);

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, digite seu usuário e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao fazer login.");
      }

      const data: AuthResponseData = await response.json(); // Garante que data é do tipo AuthResponseData
      
      saveAuthData(data); // Salva os dados no localStorage
      setAuthToken(data.token);
      setCurrentUserData(data);
      toast({
        title: "Login realizado com sucesso! 🎉",
        description: `Bem-vindo(a), ${data.fullName}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro de Login",
        description: error.message || "Ocorreu um erro ao tentar fazer login. Verifique suas credenciais.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async () => {
    if (
      !registerData.fullName ||
      !registerData.cpf ||
      !registerData.username ||
      !registerData.password ||
      !registerData.email
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (registerData.cpf.replace(/\D/g, "").length !== 11) {
      toast({
        title: "CPF inválido",
        description: "O CPF deve conter 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: registerData.cpf.replace(/\D/g, ""),
          username: registerData.username,
          password: registerData.password,
          fullName: registerData.fullName,
          email: registerData.email,
          role: "CUSTOMER", // Garante que o role seja CUSTOMER no registro
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao registrar usuário.");
      }

      // const data = await response.json(); // Resposta de registro pode ser diferente do login
      toast({
        title: "Cadastro realizado com sucesso! 🎉",
        description: "Agora você pode fazer login com seu usuário e senha.",
      });
      setLoginUsername(registerData.username);
      setLoginPassword(registerData.password);
      setActiveTab("login");
      setRegisterData({ fullName: "", cpf: "", username: "", password: "", email: "" });
    } catch (error: any) {
      toast({
        title: "Erro de Cadastro",
        description: error.message || "Ocorreu um erro ao tentar cadastrar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCPF = (value: string) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleLogout = () => {
    removeAuthData(); // Remove os dados do localStorage
    setAuthToken(null);
    setCurrentUserData(null);
    setActiveTab("login");
    setLoginUsername("");
    setLoginPassword("");
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    });
  };

  // Se estiver carregando, mostra um spinner ou mensagem
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
        <div className="flex flex-col items-center">
            <Utensils className="h-12 w-12 text-emerald-600 animate-pulse" />
            <p className="mt-4 text-emerald-700">Carregando autenticação...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  // Se o usuário está autenticado
  if (authToken && currentUserData) {
    if (currentUserData.role === "CUSTOMER") {
      // Certifique-se de passar o CPF como string (pode ser vazia se indefinido)
      return (
        <>
          <ClientDashboard
            cpf={currentUserData.cpf || ""} 
            fullName={currentUserData.fullName}
            authToken={authToken}
            onLogout={handleLogout}
            currentUserData={currentUserData} // Passa os dados completos
          />
          <Toaster /> {/* Renderize o Toaster aqui para o dashboard */}
        </>
      );
    }
    // Se o usuário não é um cliente, mostre a mensagem de acesso negado
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Sua função não é de cliente. Por favor, acesse a página de login para funcionários.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout}>Voltar ao Login</Button>
          </CardContent>
        </Card>
        <Toaster /> {/* Renderize o Toaster aqui também */}
      </div>
    );
  }

  // Se o usuário não está autenticado, mostre a tela de Login/Cadastro
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-emerald-800 rounded-xl shadow-lg">
              <Utensils className="h-8 w-8 text-amber-400" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-emerald-800">TableMaster</h1>
              <p className="text-emerald-600 text-sm font-medium">Sistema de Gestão de Restaurante</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-emerald-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-semibold text-emerald-800">Fácil de Usar</h3>
                <p className="text-sm text-emerald-600">Interface intuitiva e moderna</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Utensils className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-semibold text-emerald-800">Gestão Completa</h3>
                <p className="text-sm text-emerald-600">Controle total do restaurante</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-semibold text-emerald-800">Para Todos</h3>
                <p className="text-sm text-emerald-600">Clientes e funcionários</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-100/80 backdrop-blur-sm">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  Fazer Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar-se
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <CardHeader className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Acesso do Cliente
                  </CardTitle>
                  <CardDescription className="text-emerald-100">Digite seu usuário e senha para acessar o sistema</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="login-username" className="text-emerald-800 font-medium">
                        Usuário
                      </Label>
                      <Input
                        id="login-username"
                        placeholder="Seu usuário ou CPF"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password" className="text-emerald-800 font-medium">
                        Senha
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Sua senha"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>

                    <Button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg transition-all duration-200"
                      disabled={!loginUsername || !loginPassword}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Entrar como Cliente
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <CardHeader className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Cadastro de Cliente
                  </CardTitle>
                  <CardDescription className="text-emerald-100">Preencha seus dados para se cadastrar</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-fullname" className="text-emerald-800 font-medium">
                        Nome Completo *
                      </Label>
                      <Input
                        id="register-fullname"
                        placeholder="Seu nome completo"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-username" className="text-emerald-800 font-medium">
                        Nome de Usuário *
                      </Label>
                      <Input
                        id="register-username"
                        placeholder="Nome de usuário para login"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-cpf" className="text-emerald-800 font-medium">
                        CPF *
                      </Label>
                      <Input
                        id="register-cpf"
                        placeholder="000.000.000-00"
                        value={formatCPF(registerData.cpf)}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          setRegisterData({ ...registerData, cpf: rawValue });
                        }}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                        maxLength={14}
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-email" className="text-emerald-800 font-medium">
                        E-mail *
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="register-password" className="text-emerald-800 font-medium">
                        Senha * (mínimo 6 caracteres)
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Sua senha"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="border-emerald-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">Informações Importantes:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Todos os campos são obrigatórios</li>
                      <li>• Seu usuário e senha serão usados para fazer login</li>
                      <li>• Mantenha seus dados atualizados</li>
                      <li>• Você poderá reservar mesas e fazer pedidos</li>
                    </ul>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      onClick={() => setRegisterData({ fullName: "", cpf: "", username: "", password: "", email: "" })}
                      variant="outline"
                      className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-all duration-200"
                    >
                      Limpar Formulário
                    </Button>
                    <Button
                      onClick={handleRegister}
                      className="flex-1 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg transition-all duration-200"
                      disabled={!registerData.fullName || !registerData.cpf || !registerData.username || !registerData.password || !registerData.email}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar-se
                    </Button>
                  </div>

                  <p className="text-sm text-emerald-600 text-center mt-4">Já tem cadastro? Use a aba "Fazer Login"</p>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-emerald-100">© 2024 TableMaster - Sistema de Gestão de Restaurante</p>
        </div>
      </footer>
      <Toaster /> {/* O Toaster precisa estar no componente raiz para ser usado pelos hooks */}
    </div>
  );
}