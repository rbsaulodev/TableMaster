// app/staff-login/page.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Utensils, Briefcase, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Importe a interface AuthResponseData do novo arquivo
import { AuthResponseData } from "@/app/types/auth" // <--- CAMINHO AJUSTADO CONFORME SUA ESTRUTURA

// IMPORTANTE: Ajuste os caminhos para seus componentes de dashboard reais
import AdminDashboard from "../components/admin-dashboard"
import WaiterDashboard from "../components/waiter-dashboard"
import ChefDashboard from "../components/kitchen-dashboard"

const BASE_URL = "http://localhost:8080/api"

export default function StaffLogin() {
  const { toast } = useToast()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [currentUserData, setCurrentUserData] = useState<AuthResponseData | null>(null) // Tipado com AuthResponseData

  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, digite seu usuário e senha para continuar.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao fazer login.")
      }

      const data: AuthResponseData = await response.json()
      setAuthToken(data.token)
      setCurrentUserData(data)
      toast({
        title: "Login realizado com sucesso! 🎉",
        description: `Bem-vindo(a), ${data.fullName}.`,
      })
    } catch (error: any) {
      toast({
        title: "Erro de Login",
        description: error.message || "Ocorreu um erro ao tentar fazer login. Verifique suas credenciais.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    setCurrentUserData(null)
    setLoginUsername("")
    setLoginPassword("")
  }

  if (authToken && currentUserData) {
    switch (currentUserData.role) {
      case "ADMIN":
        // PASSANDO currentUserData AQUI
        return <AdminDashboard currentUserData={currentUserData} authToken={authToken} onLogout={handleLogout} />;
      case "WAITER":
        // PASSANDO currentUserData AQUI
        return <WaiterDashboard currentUserData={currentUserData} authToken={authToken} onLogout={handleLogout} />;
      case "CHEF":
        // PASSANDO currentUserData AQUI
        return <ChefDashboard currentUserData={currentUserData} authToken={authToken} onLogout={handleLogout} />;
      case "CUSTOMER":
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso Restrito</CardTitle>
                  <CardDescription>Esta página é exclusiva para funcionários. Por favor, use a página de login do cliente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleLogout}>Voltar</Button>
                </CardContent>
              </Card>
            </div>
          );
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
            <Card>
              <CardHeader>
                <CardTitle>Acesso Negado</CardTitle>
                <CardDescription>Sua função ({currentUserData.role}) não possui um dashboard implementado neste frontend para funcionários.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout}>Voltar ao Login</Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  }

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
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
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
                <Briefcase className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-semibold text-emerald-800">Para Funcionários</h3>
                <p className="text-sm text-emerald-600">Acesso a todas as ferramentas</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <Tabs value="login" className="w-full">
              <div className="grid w-full grid-cols-1 bg-emerald-100/80 backdrop-blur-sm">
                <h2 className="p-3 text-center text-lg font-semibold text-emerald-800 flex items-center justify-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Login de Funcionários
                </h2>
              </div>

              <TabsContent value="login" className="mt-0">
                <CardHeader className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Acesso de Funcionários
                  </CardTitle>
                  <CardDescription className="text-emerald-100">Digite seu usuário e senha para acessar o painel</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="login-username" className="text-emerald-800 font-medium">
                        Usuário
                      </Label>
                      <Input
                        id="login-username"
                        placeholder="Seu nome de usuário"
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
                      <Briefcase className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <footer className="bg-emerald-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-emerald-100">© 2024 TableMaster - Sistema de Gestão de Restaurante</p>
        </div>
      </footer>
    </div>
  )
}