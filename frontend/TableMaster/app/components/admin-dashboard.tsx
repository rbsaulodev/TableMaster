"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AuthResponseData } from "@/app/types/auth"; // Verifique se o caminho está correto
import {
  LogOut,
  Users,
  Settings,
  Table,
  UtensilsCrossed,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";

// DTOs necessários para o frontend do AdminDashboard
interface UserDTO {
  cpf: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface RestaurantTableDTO {
  id: number;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  capacity: number;
  orders?: any[];
}

interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null; // Pode ser null
  category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS";
  drinkType?: "WATER" | "SODA" | "NATURAL_JUICE" | "BEER" | "WINE" | "COCKTAIL" | null; // Pode ser null
  preparationTime?: number | null; // Adicionado e pode ser null
  difficulty?: "EASY" | "MEDIUM" | "DIFFICULT" | null; // Adicionado e pode ser null
  available?: boolean; // Adicionado
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

const getDifficultyDisplayName = (difficulty: string | null | undefined) => {
  switch (difficulty) {
    case "EASY": return "Fácil";
    case "MEDIUM": return "Média";
    case "DIFFICULT": return "Difícil";
    default: return "N/A";
  }
};

// Função utilitária para cor do badge de dificuldade
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "EASY":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "DIFFICULT":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<UserDTO | null>(null);
  const [newUserFormData, setNewUserFormData] = useState({
    cpf: '',
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: '',
    active: true
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Estados para dados de mesas
  const [tables, setTables] = useState<RestaurantTableDTO[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [newTableData, setNewTableData] = useState({ number: '', capacity: '' });
  const [tableFormError, setTableFormError] = useState<string | null>(null);
  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [currentTableToEdit, setCurrentTableToEdit] = useState<RestaurantTableDTO | null>(null);


  // Estados para dados de itens de cardápio
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(true);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  const [newMenuItemData, setNewMenuItemData] = useState<{
    name: string;
    description: string;
    price: string | number;
    imageUrl: string;
    category: string;
    drinkType: string;
    preparationTime: string | number; // String para input, number para envio
    difficulty: string; // String para input, enum para envio
  }>({ // Inicializa com strings vazias para inputs controlados
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    drinkType: '',
    preparationTime: '',
    difficulty: '',
  });
  const [menuItemFormError, setMenuItemFormError] = useState<string | null>(null);
  const [isNewMenuItemDialogOpen, setIsNewMenuItemDialogOpen] = useState(false);
  const [isEditMenuItemDialogOpen, setIsEditMenuItemDialogOpen] = useState(false);
  const [currentMenuItemToEdit, setCurrentMenuItemToEdit] = useState<MenuItemDTO | null>(null);

  // --- Funções de Fetch ---

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await fetch("http://localhost:8080/api/admin/users?size=1000", {
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
      setMenuItems(data.map(item => ({
                ...item,
                // Garante que preparationTime e difficulty são do tipo correto para MenuItemDTO
                preparationTime: item.preparationTime !== undefined && item.preparationTime !== null ? item.preparationTime : null,
                difficulty: item.difficulty !== undefined && item.difficulty !== null ? item.difficulty : null,
                imageUrl: item.imageUrl || '',
                available: item.available !== undefined ? item.available : true
            })));
    } catch (err: any) {
      setMenuItemsError(err.message);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // --- Funções de CRUD de Usuários ---

  const handleCreateUser = async () => {
    setUserFormError(null);
    const { cpf, username, fullName, email, password, role } = newUserFormData;
    if (!cpf || !username || !fullName || !email || !password || !role) {
      setUserFormError("Todos os campos obrigatórios para o usuário devem ser preenchidos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newUserFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setUserFormError(errorData.message || "Erro ao criar usuário.");
        return;
      }

      toast({ title: "Sucesso", description: "Usuário criado com sucesso!" });
      setNewUserFormData({ cpf: '', username: '', fullName: '', email: '', password: '', role: '', active: true });
      setIsNewUserDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserFormError(err.message || "Erro ao criar usuário.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUserToEdit) return;

    setUserFormError(null);
    const { cpf, username, fullName, email, role, active } = currentUserToEdit;
    if (!cpf || !username || !fullName || !email || !role) {
      setUserFormError("Todos os campos obrigatórios para o usuário devem ser preenchidos.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${cpf}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username, fullName, email, role, active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setUserFormError(errorData.message || "Erro ao atualizar usuário.");
        return;
      }

      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso!" });
      setIsEditUserDialogOpen(false);
      setCurrentUserToEdit(null);
      fetchUsers();
    }
    catch (err: any) {
      setUserFormError(err.message || "Erro ao atualizar usuário.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (cpf: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${cpf}? Esta ação é irreversível!`)) return;

    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${cpf}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao deletar usuário.");
      }

      toast({ title: "Sucesso", description: "Usuário deletado com sucesso!" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleUserActiveStatus = async (cpf: string, currentStatus: boolean) => {
    const action = currentStatus ? "deactivate" : "activate";
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${cpf}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao ${action} usuário.`);
      }

      toast({ title: "Sucesso", description: `Usuário ${cpf} ${currentStatus ? 'desativado' : 'ativado'} com sucesso!` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // --- Funções de CRUD de Mesas ---
  const handleCreateTable = async () => {
    setTableFormError(null);
    if (!newTableData.number || !newTableData.capacity) {
      setTableFormError("Número e capacidade da mesa são obrigatórios.");
      return;
    }
    if (isNaN(Number(newTableData.number)) || Number(newTableData.number) <= 0) {
      setTableFormError("O número da mesa deve ser um número positivo.");
      return;
    }
    if (isNaN(Number(newTableData.capacity)) || Number(newTableData.capacity) <= 0) {
      setTableFormError("A capacidade da mesa deve ser um número positivo.");
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
          status: "AVAILABLE"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTableFormError(errorData.message || "Erro ao criar mesa.");
        return;
      }

      toast({ title: "Sucesso", description: "Mesa criada com sucesso!" });
      setNewTableData({ number: '', capacity: '' });
      setIsNewTableDialogOpen(false);
      fetchTables();
    } catch (err: any) {
      setTableFormError(err.message || "Erro ao criar mesa.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateTable = async () => {
    if (!currentTableToEdit) return;

    setTableFormError(null);
    const { id, number, capacity, status } = currentTableToEdit;
    if (!number || !capacity) {
      setTableFormError("Número e capacidade da mesa são obrigatórios.");
      return;
    }
    if (isNaN(Number(number)) || Number(number) <= 0) {
      setTableFormError("O número da mesa deve ser um número positivo.");
      return;
    }
    if (isNaN(Number(capacity)) || Number(capacity) <= 0) {
      setTableFormError("A capacidade da mesa deve ser um número positivo.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/table/${id}`, { // Endpoint PUT está em /api/table/{id}
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, number, capacity, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTableFormError(errorData.message || "Erro ao atualizar mesa.");
        return;
      }

      toast({ title: "Sucesso", description: `Mesa ${number} atualizada com sucesso!` });
      setIsEditTableDialogOpen(false);
      setCurrentTableToEdit(null);
      fetchTables();
    } catch (err: any) {
      setTableFormError(err.message || "Erro ao atualizar mesa.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteTable = async (id: number, number: number) => {
    if (!confirm(`Tem certeza que deseja deletar a Mesa ${number}? Esta ação é irreversível!`)) return;

    try {
      const response = await fetch(`http://localhost:8080/api/table/${id}`, { // Endpoint DELETE está em /api/table/{id}
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao deletar mesa.");
      }

      toast({ title: "Sucesso", description: `Mesa ${number} deletada com sucesso!` });
      fetchTables();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };


  // --- Funções de CRUD de Itens de Cardápio ---
  const handleCreateMenuItem = async () => {
    setMenuItemFormError(null);
    // Campos que serão validados e enviados
    const { name, description, price, imageUrl, category, drinkType, preparationTime, difficulty } = newMenuItemData;

    if (!name || !description || !price || !category || !preparationTime || !difficulty) {
        setMenuItemFormError("Nome, descrição, preço, categoria, tempo de preparo e dificuldade são obrigatórios.");
        return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
        setMenuItemFormError("O preço deve ser um número positivo.");
        return;
    }
    if (isNaN(Number(preparationTime)) || Number(preparationTime) <= 0) {
        setMenuItemFormError("O tempo de preparo deve ser um número positivo.");
        return;
    }
    if (category === "DRINKS" && !drinkType) {
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
          name: name,
          description: description,
          price: Number(price),
          imageUrl: imageUrl || null, // Garante null se for string vazia
          category: category,
          drinkType: category === "DRINKS" ? drinkType : null, // Garante null se não for bebida
          preparationTime: Number(preparationTime), // Converte para número
          difficulty: difficulty,
          available: true // Novos itens geralmente começam como disponíveis
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMenuItemFormError(errorData.message || "Erro ao criar item do cardápio.");
        return;
      }

      toast({ title: "Sucesso", description: "Item do cardápio criado com sucesso!" });
      // Limpa o formulário e fecha o diálogo
      setNewMenuItemData({ name: '', description: '', price: '', imageUrl: '', category: '', drinkType: '', preparationTime: '', difficulty: '' });
      setIsNewMenuItemDialogOpen(false);
      fetchMenuItems(); // Recarrega a lista
    } catch (err: any) {
      setMenuItemFormError(err.message || "Erro ao criar item do cardápio.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!currentMenuItemToEdit) return;

    setMenuItemFormError(null);
    // Campos do item a ser editado
    const { id, name, description, price, imageUrl, category, drinkType, preparationTime, difficulty, available } = currentMenuItemToEdit;

    if (!name || !description || !price || !category || !preparationTime || !difficulty) {
        setMenuItemFormError("Nome, descrição, preço, categoria, tempo de preparo e dificuldade são obrigatórios.");
        return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
        setMenuItemFormError("O preço deve ser um número positivo.");
        return;
    }
    if (isNaN(Number(preparationTime)) || Number(preparationTime) <= 0) {
        setMenuItemFormError("O tempo de preparo deve ser um número positivo.");
        return;
    }
    if (category === "DRINKS" && !drinkType) {
        setMenuItemFormError("O tipo de bebida é obrigatório para a categoria 'Bebidas'.");
        return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/menu-items/${id}`, { // Endpoint PUT está em /api/admin/menu-items/{id}
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
            id: id, // Certifica que o ID é enviado
            name: name,
            description: description,
            price: Number(price),
            imageUrl: imageUrl || null, // Garante null se for string vazia
            category: category,
            drinkType: category === "DRINKS" ? drinkType : null, // Garante null se não for bebida
            preparationTime: Number(preparationTime),
            difficulty: difficulty,
            available: available // Mantenha o status 'available'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMenuItemFormError(errorData.message || "Erro ao atualizar item do cardápio.");
        return;
      }

      toast({ title: "Sucesso", description: `${name} atualizado com sucesso!` });
      setIsEditMenuItemDialogOpen(false);
      setCurrentMenuItemToEdit(null);
      fetchMenuItems(); // Recarrega a lista
    } catch (err: any) {
      setMenuItemFormError(err.message || "Erro ao atualizar item do cardápio.");
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

// ... dentro de AdminDashboard
// No seu admin-dashboard.tsx
const handleDeleteMenuItem = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o item "${name}"? Esta ação é irreversível!`)) return;

    try {
        // A URL deve ser EXATAMENTE ${BASE_URL}/menu/${id}
        const BASE_URL = "http://localhost:8080/api/";
        const response = await fetch(`${BASE_URL}/menu/${id}`, { // <<-- Verifique se é assim que está
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) {
            // Tente ler a resposta como texto se o JSON falhar, para ver a mensagem de erro
            const errorText = await response.text();
            let errorMessage = `Erro ao deletar item do cardápio.`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage; // Usa o texto bruto se não for JSON
            }
            throw new Error(errorMessage);
        }

        toast({ title: "Sucesso", description: `Item "${name}" deletado com sucesso!` });
        fetchMenuItems();
    } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
};



  // --- Efeitos e Renderização ---

  useEffect(() => {
    if (authToken) {
      fetchUsers();
      fetchTables();
      fetchMenuItems();
    }
  }, [authToken]);

  const sidebarItems = [
    { key: "dashboard", label: "Visão Geral", icon: Eye },
    { key: "users", label: "Gerenciar Usuários", icon: Users },
    { key: "tables", label: "Gerenciar Mesas", icon: Table },
    { key: "menu-items", label: "Gerenciar Cardápio", icon: UtensilsCrossed },
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h2>
              <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>Preencha os detalhes para adicionar um novo usuário.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-cpf">CPF</Label>
                      <Input
                        id="user-cpf"
                        value={newUserFormData.cpf}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, cpf: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-username">Nome de Usuário</Label>
                      <Input
                        id="user-username"
                        value={newUserFormData.username}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, username: e.target.value })}
                        placeholder="Ex: joao.silva"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-fullname">Nome Completo</Label>
                      <Input
                        id="user-fullname"
                        value={newUserFormData.fullName}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, fullName: e.target.value })}
                        placeholder="Ex: João da Silva"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-email">Email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={newUserFormData.email}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, email: e.target.value })}
                        placeholder="Ex: joao.silva@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-password">Senha</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={newUserFormData.password}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, password: e.target.value })}
                        placeholder="********"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-role">Cargo</Label>
                      <Select
                        value={newUserFormData.role}
                        onValueChange={(value) => setNewUserFormData({ ...newUserFormData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o Cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="CLIENT">CLIENT</SelectItem>
                          <SelectItem value="CHEF">CHEF</SelectItem>
                          <SelectItem value="WAITER">WAITER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {userFormError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{userFormError}</p>
                      </div>
                    )}
                    <Button onClick={handleCreateUser} className="w-full bg-emerald-800 hover:bg-emerald-700">
                      Criar Usuário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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
                        <p className="text-sm text-gray-600">CPF: {user.cpf} | Usuário: {user.username} | Email: {user.email}</p>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Dialog open={isEditUserDialogOpen && currentUserToEdit?.cpf === user.cpf} onOpenChange={(open) => {
                            setIsEditUserDialogOpen(open);
                            if (!open) setCurrentUserToEdit(null);
                            else setCurrentUserToEdit(user);
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="hover:bg-blue-50" onClick={() => setCurrentUserToEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {currentUserToEdit && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Usuário: {currentUserToEdit.fullName}</DialogTitle>
                                <DialogDescription>Atualize os detalhes do usuário.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-user-cpf">CPF</Label>
                                    <Input id="edit-user-cpf" value={currentUserToEdit.cpf} disabled />
                                </div>
                                <div>
                                    <Label htmlFor="edit-user-username">Nome de Usuário</Label>
                                    <Input
                                        id="edit-user-username"
                                        value={currentUserToEdit.username}
                                        onChange={(e) => setCurrentUserToEdit({ ...currentUserToEdit, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-user-fullname">Nome Completo</Label>
                                    <Input
                                        id="edit-user-fullname"
                                        value={currentUserToEdit.fullName}
                                        onChange={(e) => setCurrentUserToEdit({ ...currentUserToEdit, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-user-email">Email</Label>
                                    <Input
                                        id="edit-user-email"
                                        type="email"
                                        value={currentUserToEdit.email}
                                        onChange={(e) => setCurrentUserToEdit({ ...currentUserToEdit, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-user-role">Cargo</Label>
                                    <Select
                                        value={currentUserToEdit.role}
                                        onValueChange={(value) => setCurrentUserToEdit({ ...currentUserToEdit, role: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o Cargo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                                            <SelectItem value="CLIENT">CLIENT</SelectItem>
                                            <SelectItem value="CHEF">CHEF</SelectItem>
                                            <SelectItem value="WAITER">WAITER</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-user-status">Status</Label>
                                    <Select
                                        value={currentUserToEdit.active ? "active" : "inactive"}
                                        onValueChange={(value) => setCurrentUserToEdit({ ...currentUserToEdit, active: value === "active" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {userFormError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-sm font-medium">{userFormError}</p>
                                    </div>
                                )}
                                <Button onClick={handleUpdateUser} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Salvar Alterações
                                </Button>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className={user.active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                          onClick={() => handleToggleUserActiveStatus(user.cpf, user.active)}
                        >
                          {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.cpf)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                        <div className="flex gap-2 mt-4">
                            {/* Botão de Editar Mesa */}
                            <Dialog open={isEditTableDialogOpen && currentTableToEdit?.id === table.id} onOpenChange={(open) => {
                                setIsEditTableDialogOpen(open);
                                if (!open) setCurrentTableToEdit(null);
                                else setCurrentTableToEdit(table);
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => setCurrentTableToEdit(table)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                {currentTableToEdit && (
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Mesa: {currentTableToEdit.number}</DialogTitle>
                                            <DialogDescription>Atualize os detalhes da mesa.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="edit-table-number">Número da Mesa</Label>
                                                <Input
                                                    id="edit-table-number"
                                                    type="number"
                                                    value={currentTableToEdit.number}
                                                    onChange={(e) => setCurrentTableToEdit({ ...currentTableToEdit, number: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-table-capacity">Capacidade</Label>
                                                <Input
                                                    id="edit-table-capacity"
                                                    type="number"
                                                    value={currentTableToEdit.capacity}
                                                    onChange={(e) => setCurrentTableToEdit({ ...currentTableToEdit, capacity: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-table-status">Status</Label>
                                                <Select
                                                    value={currentTableToEdit.status}
                                                    onValueChange={(value: "AVAILABLE" | "OCCUPIED" | "RESERVED") => setCurrentTableToEdit({ ...currentTableToEdit, status: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AVAILABLE">Disponível</SelectItem>
                                                        <SelectItem value="OCCUPIED">Ocupada</SelectItem>
                                                        <SelectItem value="RESERVED">Reservada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {tableFormError && (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                                                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                                    <p className="text-sm font-medium">{tableFormError}</p>
                                                </div>
                                            )}
                                            <Button onClick={handleUpdateTable} className="w-full bg-blue-600 hover:bg-blue-700">
                                                Salvar Alterações
                                            </Button>
                                        </div >
                                    </DialogContent>
                                )}
                            </Dialog>
                            {/* Botão de Deletar Mesa */}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTable(table.id, table.number)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
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
                    <div>
                      <Label htmlFor="item-preparationTime">Tempo de Preparo (min)</Label>
                      <Input
                        id="item-preparationTime"
                        type="number"
                        value={newMenuItemData.preparationTime}
                        onChange={(e) => setNewMenuItemData({ ...newMenuItemData, preparationTime: e.target.value })}
                        placeholder="Ex: 15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-difficulty">Dificuldade</Label>
                      <Select
                        value={newMenuItemData.difficulty}
                        onValueChange={(value) => setNewMenuItemData({ ...newMenuItemData, difficulty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a Dificuldade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Fácil</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="DIFFICULT">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2"> {/* Adicionado mt-2 para espaçamento */}
                          <span>{item.preparationTime !== undefined && item.preparationTime !== null ? item.preparationTime : 'N/A'} min</span> {/* Exibe 'N/A' se for null/undefined */}
                          <Badge className={getDifficultyColor(item.difficulty || "MEDIUM")}> {/* Garante valor padrão para cor */}
                            {getDifficultyDisplayName(item.difficulty || "MEDIUM")} {/* Garante valor padrão para exibição */}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                            {/* Botão de Editar Item */}
                            <Dialog open={isEditMenuItemDialogOpen && currentMenuItemToEdit?.id === item.id} onOpenChange={(open) => {
                                setIsEditMenuItemDialogOpen(open);
                                if (!open) setCurrentMenuItemToEdit(null);
                                else setCurrentMenuItemToEdit({
                                    ...item,
                                    // Converte para string ou string vazia para o formulário
                                    imageUrl: item.imageUrl || '',
                                    preparationTime: item.preparationTime !== undefined && item.preparationTime !== null ? item.preparationTime : null,
                                    difficulty: item.difficulty !== undefined && item.difficulty !== null ? item.difficulty : null
                                });
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => setCurrentMenuItemToEdit(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                {currentMenuItemToEdit && (
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Item: {currentMenuItemToEdit.name}</DialogTitle>
                                            <DialogDescription>Atualize os detalhes do item do cardápio.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="edit-item-name">Nome</Label>
                                                <Input
                                                    id="edit-item-name"
                                                    value={currentMenuItemToEdit.name}
                                                    onChange={(e) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, name: e.target.value })}
                                                    placeholder="Nome do prato"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-item-description">Descrição</Label>
                                                <Input
                                                    id="edit-item-description"
                                                    value={currentMenuItemToEdit.description}
                                                    onChange={(e) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, description: e.target.value })}
                                                    placeholder="Uma breve descrição"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-item-price">Preço</Label>
                                                <Input
                                                    id="edit-item-price"
                                                    type="number"
                                                    value={currentMenuItemToEdit.price}
                                                    onChange={(e) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, price: Number(e.target.value) })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-item-image-url">URL da Imagem</Label>
                                                <Input
                                                    id="edit-item-image-url"
                                                    value={currentMenuItemToEdit.imageUrl || ''} // Usar || ''
                                                    onChange={(e) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, imageUrl: e.target.value })}
                                                    placeholder="Ex: https://exemplo.com/pizza.jpg"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-item-category">Categoria</Label>
                                                <Select
                                                    value={currentMenuItemToEdit.category}
                                                    onValueChange={(value: MenuItemDTO['category']) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, category: value, drinkType: value === "DRINKS" ? currentMenuItemToEdit.drinkType : undefined })}
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
                                            {currentMenuItemToEdit.category === "DRINKS" && (
                                                <div>
                                                    <Label htmlFor="edit-item-drink-type">Tipo de Bebida</Label>
                                                    <Select
                                                        value={currentMenuItemToEdit.drinkType || ''} // Usar || ''
                                                        onValueChange={(value: string) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, drinkType: value as MenuItemDTO['drinkType'] })}
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
                                            <div>
                                                <Label htmlFor="edit-item-preparationTime">Tempo de Preparo (min)</Label>
                                                <Input
                                                    id="edit-item-preparationTime"
                                                    type="number"
                                                    value={currentMenuItemToEdit.preparationTime !== undefined && currentMenuItemToEdit.preparationTime !== null ? currentMenuItemToEdit.preparationTime : ''} // Usar ''
                                                    onChange={(e) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, preparationTime: Number(e.target.value) })}
                                                    placeholder="Ex: 15"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-item-difficulty">Dificuldade</Label>
                                                <Select
                                                    value={currentMenuItemToEdit.difficulty || ''} // Usar || ''
                                                    onValueChange={(value: string) => setCurrentMenuItemToEdit({ ...currentMenuItemToEdit, difficulty: value as MenuItemDTO['difficulty'] })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a Dificuldade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="EASY">Fácil</SelectItem>
                                                        <SelectItem value="MEDIUM">Média</SelectItem>
                                                        <SelectItem value="DIFFICULT">Difícil</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {menuItemFormError && (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700">
                                                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                                    <p className="text-sm font-medium">{menuItemFormError}</p>
                                                </div>
                                            )}
                                            <Button onClick={handleUpdateMenuItem} className="w-full bg-blue-600 hover:bg-blue-700">
                                                Salvar Alterações
                                            </Button>
                                        </div>
                                    </DialogContent>
                                )}
                            </Dialog>
                            {/* Botão de Deletar Item */}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMenuItem(item.id, item.name)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
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