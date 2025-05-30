// app/components/admin-dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import { useToast } from "@/hooks/use-toast";
import { AuthResponseData } from "@/app/types/auth"
import {
  LogOut,
  Users,
  Settings,
  Table, // Ícone para Mesas
  UtensilsCrossed, // Ícone para Itens de Cardápio (ou Menu)
  AlertTriangle, // Ícone de alerta para erros
  Plus, // Ícone para adicionar
  Edit, // Ícone para editar
  Trash2, // Ícone para deletar
  Eye // Ícone para visualizar
} from "lucide-react";

// DTOs necessários para o frontend do AdminDashboard
// IMPORTANTE: Ajuste os caminhos para seus DTOs reais
interface UserDTO {
  cpf: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  // password não é recebido do backend no DTO, mas pode ser enviado em createUser/updateUser
}

interface RestaurantTableDTO {
  id: number;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED"; // Usando literais ou importar de um tipo global
  capacity: number;
  orders?: any[]; // Simplificado para o frontend, pode ser uma lista de OrderDTOs
}

interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS"; // Usando literais ou importar de um tipo global
  drinkType?: "WATER" | "SODA" | "NATURAL_JUICE" | "BEER" | "WINE" | "COCKTAIL"; // Usando literais ou importar de um tipo global
}

// Funções auxiliares para nomes amigáveis de enums
const getTableStatusDisplayName = (status: RestaurantTableDTO['status']) => {
  switch (status) {
    case "AVAILABLE": return "Disponível";
    case "OCCUPIED": return "Ocupada";
    case "RESERVED": return "Reservada";
    default: return status;
  }
};

const getMenuItemCategoryDisplayName = (category: MenuItemDTO['category']) => {
  switch (category) {
    case "APPETIZERS": return "Entradas";
    case "MAIN_COURSES": return "Pratos Principais";
    case "DESSERTS": return "Sobremesas";
    case "DRINKS": return "Bebidas";
    default: return category;
  }
};

const getDrinkTypeDisplayName = (drinkType: MenuItemDTO['drinkType']) => {
  if (!drinkType) return "N/A";
  switch (drinkType) {
    case "WATER": return "Água";
    case "SODA": return "Refrigerante";
    case "NATURAL_JUICE": return "Suco Natural";
    case "BEER": return "Cerveja";
    case "WINE": return "Vinho";
    case "COCKTAIL": return "Drink";
    default: return drinkType;
  }
};


interface AdminDashboardProps {
  onLogout: () => void;
  authToken: string;
  currentUserData: AuthResponseData;
}

export default function AdminDashboard({ onLogout, authToken, currentUserData }: AdminDashboardProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Estados para dados de usuários
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Estados para dados de mesas
  const [tables, setTables] = useState<RestaurantTableDTO[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [newTableData, setNewTableData] = useState({ number: '', capacity: '' });
  const [tableFormError, setTableFormError] = useState<string | null>(null);
  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false); // Controlar diálogo de nova mesa

  // Estados para dados de itens de cardápio
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(true);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  const [newMenuItemData, setNewMenuItemData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '', // Será um string temporariamente, mapeado para enum
    drinkType: '' // Será um string temporariamente, mapeado para enum
  });
  const [menuItemFormError, setMenuItemFormError] = useState<string | null>(null);
  const [isNewMenuItemDialogOpen, setIsNewMenuItemDialogOpen] = useState(false); // Controlar diálogo de novo item

  // --- Funções de Fetch ---

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await fetch("http://localhost:8080/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao buscar usuários.");
      }

      const data = await response.json();
      setUsers(data.content);
    } catch (err: any) {
      setUsersError(err.message);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setTablesError(null);
    try {
      const response = await fetch("http://localhost:8080/api/admin/tables", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao buscar mesas.");
      }

      const data: RestaurantTableDTO[] = await response.json();
      setTables(data);
    } catch (err: any) {
      setTablesError(err.message);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchMenuItems = async () => {
    setLoadingMenuItems(true);
    setMenuItemsError(null);
    try {
      const response = await fetch("http://localhost:8080/api/admin/menu-items", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao buscar itens do cardápio.");
      }

      const data: MenuItemDTO[] = await response.json();
      setMenuItems(data);
    } catch (err: any) {
      setMenuItemsError(err.message);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // --- Funções de CRUD ---

  const handleCreateTable = async () => {
    setTableFormError(null);
    if (!newTableData.number || !newTableData.capacity) {
      setTableFormError("Número e capacidade da mesa são obrigatórios.");
      return;
    }
    if (isNaN(Number(newTableData.number)) || isNaN(Number(newTableData.capacity)) || Number(newTableData.number) <= 0 || Number(newTableData.capacity) <= 0) {
      setTableFormError("Número e capacidade da mesa devem ser números positivos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          number: Number(newTableData.number),
          capacity: Number(newTableData.capacity),
          status: "AVAILABLE" // Mesas novas geralmente começam como disponíveis
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTableFormError(errorData.message || "Erro ao criar mesa.");
        return;
      }

      toast({ title: "Sucesso", description: "Mesa criada com sucesso!" });
      setNewTableData({ number: '', capacity: '' });
      setIsNewTableDialogOpen(false); // Fecha o diálogo
      fetchTables(); // Recarrega a lista de mesas
    } catch (err: any) {
      setTableFormError(err.message || "Erro ao criar mesa.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateMenuItem = async () => {
    setMenuItemFormError(null);
    if (!newMenuItemData.name || !newMenuItemData.description || !newMenuItemData.price || !newMenuItemData.imageUrl || !newMenuItemData.category) {
      setMenuItemFormError("Todos os campos de item do cardápio são obrigatórios.");
      return;
    }
    if (isNaN(Number(newMenuItemData.price)) || Number(newMenuItemData.price) <= 0) {
      setMenuItemFormError("O preço deve ser um número positivo.");
      return;
    }
    if (newMenuItemData.category === "DRINKS" && !newMenuItemData.drinkType) {
        setMenuItemFormError("O tipo de bebida é obrigatório para a categoria 'Bebidas'.");
        return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/admin/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newMenuItemData.name,
          description: newMenuItemData.description,
          price: Number(newMenuItemData.price),
          imageUrl: newMenuItemData.imageUrl,
          category: newMenuItemData.category,
          drinkType: newMenuItemData.category === "DRINKS" ? newMenuItemData.drinkType : null // Envia null se não for bebida
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMenuItemFormError(errorData.message || "Erro ao criar item do cardápio.");
        return;
      }

      toast({ title: "Sucesso", description: "Item do cardápio criado com sucesso!" });
      setNewMenuItemData({ name: '', description: '', price: '', imageUrl: '', category: '', drinkType: '' });
      setIsNewMenuItemDialogOpen(false); // Fecha o diálogo
      fetchMenuItems(); // Recarrega a lista de itens
    } catch (err: any) {
      setMenuItemFormError(err.message || "Erro ao criar item do cardápio.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };


  // --- Efeitos e Renderização ---

  useEffect(() => {
    if (authToken) {
      fetchUsers();
      fetchTables(); // Buscar mesas ao carregar o dashboard
      fetchMenuItems(); // Buscar itens ao carregar o dashboard
    }
  }, [authToken]);

  const sidebarItems = [
    { key: "dashboard", label: "Visão Geral", icon: Users },
    { key: "users", label: "Gerenciar Usuários", icon: Users },
    { key: "tables", label: "Gerenciar Mesas", icon: Table }, // Nova seção
    { key: "menu-items", label: "Gerenciar Cardápio", icon: UtensilsCrossed }, // Nova seção
    { key: "settings", label: "Configurações", icon: Settings },
    { key: "logout", label: "Sair", icon: LogOut },
  ];

  const handleSidebarClick = (key: string) => {
    if (key === "logout") {
      onLogout();
      return;
    }
    setActiveSection(key);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo, {currentUserData.fullName} (Admin)!</h2>
            <p>Este é o dashboard de administração. Aqui você pode visualizar métricas e acessar as ferramentas de gestão.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <Card>
                    <CardHeader><CardTitle>Total de Usuários</CardTitle></CardHeader>
                    <CardContent>{loadingUsers ? "Carregando..." : users.length}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total de Mesas</CardTitle></CardHeader>
                    <CardContent>{loadingTables ? "Carregando..." : tables.length}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total de Itens</CardTitle></CardHeader>
                    <CardContent>{loadingMenuItems ? "Carregando..." : menuItems.length}</CardContent>
                </Card>
            </div>
          </div>
        );
      case "users":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gerenciar Usuários</h2>
            {loadingUsers && <p>Carregando usuários...</p>}
            {usersError && <p className="text-red-500">Erro: {usersError}</p>}
            {!loadingUsers && !usersError && (
              <div className="space-y-4">
                {users.length === 0 ? (
                    <p>Nenhum usuário encontrado.</p>
                ) : (
                    users.map((user) => (
                        <Card key={user.cpf} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{user.fullName}</p>
                                <p className="text-sm text-gray-600">{user.username} - {user.role}</p>
                            </div>
                            <Badge variant={user.active ? "default" : "destructive"}>
                                {user.active ? "Ativo" : "Inativo"}
                            </Badge>
                        </Card>
                    ))
                )}
              </div>
            )}
          </div>
        );
      case "tables":
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Mesas</h2>
              <Dialog open={isNewTableDialogOpen} onOpenChange={setIsNewTableDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Mesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Mesa</DialogTitle>
                    <DialogDescription>Preencha os detalhes para adicionar uma nova mesa ao restaurante.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="table-number">Número da Mesa</Label>
                      <Input
                        id="table-number"
                        type="number"
                        value={newTableData.number}
                        onChange={(e) => setNewTableData({ ...newTableData, number: e.target.value })}
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="table-capacity">Capacidade</Label>
                      <Input
                        id="table-capacity"
                        type="number"
                        value={newTableData.capacity}
                        onChange={(e) => setNewTableData({ ...newTableData, capacity: e.target.value })}
                        placeholder="Ex: 4 pessoas"
                      />
                    </div>
                    {tableFormError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{tableFormError}</p>
                        </div>
                    )}
                    <Button onClick={handleCreateTable} className="w-full bg-emerald-800 hover:bg-emerald-700">
                      Criar Mesa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingTables && <p>Carregando mesas...</p>}
            {tablesError && <p className="text-red-500">Erro: {tablesError}</p>}
            {!loadingTables && !tablesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.length === 0 ? (
                    <p>Nenhuma mesa encontrada.</p>
                ) : (
                    tables.map((table) => (
                        <Card key={table.id} className="p-4">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-medium">Mesa {table.number}</CardTitle>
                                <Badge className={table.status === "AVAILABLE" ? "bg-green-100 text-green-800" : table.status === "OCCUPIED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                                    {getTableStatusDisplayName(table.status)}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{table.capacity} pessoas</div>
                                {/* Adicione botões de Editar/Deletar Mesa aqui */}
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="secondary"><Eye className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
              </div>
            )}
          </div>
        );
      case "menu-items":
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Cardápio</h2>
              <Dialog open={isNewMenuItemDialogOpen} onOpenChange={setIsNewMenuItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Item do Cardápio</DialogTitle>
                    <DialogDescription>Preencha os detalhes para adicionar um novo item ao cardápio.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="item-name">Nome</Label>
                      <Input
                        id="item-name"
                        value={newMenuItemData.name}
                        onChange={(e) => setNewMenuItemData({ ...newMenuItemData, name: e.target.value })}
                        placeholder="Ex: Pizza Calabresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-description">Descrição</Label>
                      <Input
                        id="item-description"
                        value={newMenuItemData.description}
                        onChange={(e) => setNewMenuItemData({ ...newMenuItemData, description: e.target.value })}
                        placeholder="Ex: Molho de tomate, queijo, calabresa..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-price">Preço</Label>
                      <Input
                        id="item-price"
                        type="number"
                        value={newMenuItemData.price}
                        onChange={(e) => setNewMenuItemData({ ...newMenuItemData, price: e.target.value })}
                        placeholder="Ex: 45.90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-image-url">URL da Imagem</Label>
                      <Input
                        id="item-image-url"
                        value={newMenuItemData.imageUrl}
                        onChange={(e) => setNewMenuItemData({ ...newMenuItemData, imageUrl: e.target.value })}
                        placeholder="Ex: https://exemplo.com/pizza.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-category">Categoria</Label>
                      <Select
                        value={newMenuItemData.category}
                        onValueChange={(value) => setNewMenuItemData({ ...newMenuItemData, category: value, drinkType: value === "DRINKS" ? newMenuItemData.drinkType : '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPETIZERS">Entradas</SelectItem>
                          <SelectItem value="MAIN_COURSES">Pratos Principais</SelectItem>
                          <SelectItem value="DESSERTS">Sobremesas</SelectItem>
                          <SelectItem value="DRINKS">Bebidas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newMenuItemData.category === "DRINKS" && (
                      <div>
                        <Label htmlFor="item-drink-type">Tipo de Bebida</Label>
                        <Select
                          value={newMenuItemData.drinkType}
                          onValueChange={(value) => setNewMenuItemData({ ...newMenuItemData, drinkType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o Tipo de Bebida" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WATER">Água</SelectItem>
                            <SelectItem value="SODA">Refrigerante</SelectItem>
                            <SelectItem value="NATURAL_JUICE">Suco Natural</SelectItem>
                            <SelectItem value="BEER">Cerveja</SelectItem>
                            <SelectItem value="WINE">Vinho</SelectItem>
                            <SelectItem value="COCKTAIL">Drink</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {menuItemFormError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{menuItemFormError}</p>
                        </div>
                    )}
                    <Button onClick={handleCreateMenuItem} className="w-full bg-emerald-800 hover:bg-emerald-700">
                      Criar Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingMenuItems && <p>Carregando itens do cardápio...</p>}
            {menuItemsError && <p className="text-red-500">Erro: {menuItemsError}</p>}
            {!loadingMenuItems && !menuItemsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.length === 0 ? (
                    <p>Nenhum item do cardápio encontrado.</p>
                ) : (
                    menuItems.map((item) => (
                        <Card key={item.id} className="p-4">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-medium">{item.name}</CardTitle>
                                <Badge className="bg-blue-100 text-blue-800">
                                    {getMenuItemCategoryDisplayName(item.category)}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                                <p className="text-xl font-bold text-emerald-800 mt-2">R$ {item.price.toFixed(2)}</p>
                                {item.category === "DRINKS" && item.drinkType && (
                                    <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-800">
                                        {getDrinkTypeDisplayName(item.drinkType)}
                                    </Badge>
                                )}
                                {/* Adicione botões de Editar/Deletar Item aqui */}
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="secondary"><Eye className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
              </div>
            )}
          </div>
        );
      case "settings":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações do Sistema</h2>
            <p>Gerencie as configurações gerais da aplicação.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TableMaster</h1>
              <p className="text-sm text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-6">
          {sidebarItems.map((item) => (
            <Button
              key={item.key}
              onClick={() => handleSidebarClick(item.key)}
              className={`w-full justify-start ${
                activeSection === item.key ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
              }`}
              variant="ghost"
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard do Administrador</h1>
              <p className="text-sm text-gray-500">Gerenciamento completo do sistema</p>
            </div>
            <Button variant="ghost" onClick={onLogout} className="text-gray-600 hover:text-gray-900">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
        <div className="flex-1 p-6">{renderContent()}</div>
      </div>
    </div>
  );
}