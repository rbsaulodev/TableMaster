// src/app/components/kitchen-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, AlertTriangle, ChefHat, Package, Eye, Timer, Users, LogOut, Edit, Trash2, BookText, CookingPot, ToggleRight, ToggleLeft, Plus } from "lucide-react" // Adicionado ToggleRight/Left
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

const BASE_URL = "http://localhost:8080/api"

// Define types based on API documentation
interface OrderItemDTO {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItemName: string;
  menuItemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: "PENDING" | "PREPARING" | "READY" | "DELIVERED";
  createdAt: string;
}

interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS";
  drinkType?: "WATER" | "SODA" | "NATURAL_JUICE" | "BEER" | "WINE" | "COCKTAIL";
  preparationTime?: number;
  difficulty?: "easy" | "medium" | "difficult";
  available?: boolean; // Este campo é crucial
  ingredients?: string[];
  allergens?: { name: string; severity: "low" | "medium" | "high" }[];
}

interface Recipe {
    id: number;
    name: string;
    description: string;
    ingredients: { name: string; quantity: string }[];
    instructions: string[];
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    difficulty: "Fácil" | "Média" | "Difícil";
    category: "Entradas" | "Pratos Principais" | "Sobremesas" | "Bebidas";
}

interface KitchenDashboardProps {
  onLogout: () => void;
  authToken: string;
}

export default function KitchenDashboard({ onLogout, authToken }: KitchenDashboardProps) {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSection, setActiveSection] = useState("all-orders")

  // States populated by API
  const [pendingItems, setPendingItems] = useState<OrderItemDTO[]>([])
  const [preparingItems, setPreparingItems] = useState<OrderItemDTO[]>([])
  const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([])
  const [deliveredItems, setDeliveredItems] = useState<OrderItemDTO[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])

  // Hardcoded recipes for now
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 1,
      name: "Risoto de Funghi Secchi",
      description: "Um risoto cremoso e saboroso com cogumelos funghi secchi reidratados.",
      ingredients: [
        { name: "Arroz arbóreo", quantity: "300g" },
        { name: "Funghi secchi", quantity: "50g" },
        { name: "Cebola", quantity: "1 unidade" },
        { name: "Alho", quantity: "2 dentes" },
        { name: "Vinho branco seco", quantity: "100ml" },
        { name: "Caldo de legumes", quantity: "1 litro" },
        { name: "Manteiga", quantity: "50g" },
        { name: "Queijo parmesão ralado", quantity: "50g" },
        { name: "Azeite", quantity: "a gosto" },
        { name: "Sal e pimenta", quantity: "a gosto" },
      ],
      instructions: [
        "Reidrate o funghi secchi em água morna por 20 minutos. Reserve a água.",
        "Refogue a cebola e o alho picados no azeite até ficarem translúcidos.",
        "Adicione o arroz arbóreo e refogue por 2 minutos.",
        "Despeje o vinho branco e mexa até evaporar.",
        "Adicione o funghi picado. Comece a adicionar o caldo de legumes (incluindo a água do funghi) aos poucos, mexendo sempre, até o arroz ficar al dente.",
        "Finalize com a manteiga e o queijo parmesão ralado. Acerte o sal e a pimenta."
      ],
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      servings: 2,
      difficulty: "Média",
      category: "Pratos Principais"
    },
    {
        id: 2,
        name: "Salmão Grelhado com Aspargos",
        description: "Filé de salmão grelhado com aspargos frescos e limão.",
        ingredients: [
            { name: "Filé de salmão", quantity: "2 unidades" },
            { name: "Aspargos", quantity: "1 maço" },
            { name: "Limão siciliano", quantity: "1 unidade" },
            { name: "Azeite de oliva extra virgem", quantity: "a gosto" },
            { name: "Sal e pimenta do reino", quantity: "a gosto" }
        ],
        instructions: [
            "Tempere o salmão com sal, pimenta e suco de limão.",
            "Grelhe o salmão em fogo médio-alto por 4-5 minutos de cada lado, ou até o ponto desejado.",
            "Em outra frigideira, salteie os aspargos no azeite com sal e pimenta até ficarem tenros e crocantes.",
            "Sirva o salmão com os aspargos e rodelas de limão."
        ],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: "Fácil",
        category: "Pratos Principais"
    },
    {
        id: 3,
        name: "Brownie de Chocolate com Sorvete",
        description: "Um brownie denso e úmido de chocolate, servido com sorvete de creme.",
        ingredients: [
            { name: "Chocolate meio amargo", quantity: "200g" },
            { name: "Manteiga", quantity: "150g" },
            { name: "Açúcar", quantity: "1 xícara" },
            { name: "Ovos", quantity: "3 unidades" },
            { name: "Farinha de trigo", quantity: "1/2 xícara" },
            { name: "Cacau em pó", quantity: "1/4 xícara" },
            { name: "Essência de baunilha", quantity: "1 colher de chá" },
            { name: "Sorvete de creme", quantity: "a gosto" }
        ],
        instructions: [
            "Derreta o chocolate com a manteiga em banho-maria ou micro-ondas.",
            "Em outro recipiente, bata os ovos com o açúcar e a baunilha.",
            "Misture o chocolate derretido aos ovos. Adicione a farinha e o cacau, misturando até incorporar.",
            "Despeje a massa em uma forma untada e enfarinhada.",
            "Asse em forno pré-aquecido a 180°C por 20-25 minutos. O centro deve parecer ligeiramente mole.",
            "Deixe esfriar, corte em pedaços e sirva com sorvete de creme."
        ],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 8,
        difficulty: "Fácil",
        category: "Sobremesas"
    },
    {
        id: 4,
        name: "Caipirinha Clássica",
        description: "A tradicional bebida brasileira com cachaça, limão, açúcar e gelo.",
        ingredients: [
            { name: "Limão Taiti", quantity: "1 unidade" },
            { name: "Açúcar", quantity: "2 colheres de sopa" },
            { name: "Cachaça", quantity: "50ml" },
            { name: "Gelo", quantity: "a gosto" }
        ],
        instructions: [
            "Corte o limão em 4 ou 8 partes. Remova a parte branca central para evitar amargor.",
            "Em um copo, coloque o limão e o açúcar. Macerere (esprema) suavemente o limão com o açúcar.",
            "Adicione a cachaça e o gelo. Misture bem.",
            "Sirva imediatamente."
        ],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        difficulty: "Fácil",
        category: "Bebidas"
    }
  ]);

  // Define o mapeamento de categorias para as que vêm da API
  const categoryMapping = {
    "entradas": "APPETIZERS",
    "principais": "MAIN_COURSES",
    "sobremesas": "DESSERTS",
    "bebidas": "DRINKS",
  };

  // Definição das categorias da cozinha para uso nas seções de categorias
  interface KitchenCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
  }

  const kitchenCategories: KitchenCategory[] = [
    {
      id: "entradas",
      name: "Entradas",
      icon: <Package className="w-5 h-5" />,
      color: "bg-green-500"
    },
    {
      id: "principais",
      name: "Pratos Principais",
      icon: <ChefHat className="w-5 h-5" />,
      color: "bg-blue-500"
    },
    {
      id: "sobremesas",
      name: "Sobremesas",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-pink-500"
    },
    {
      id: "bebidas",
      name: "Bebidas",
      icon: <CookingPot className="w-5 h-5" />,
      color: "bg-cyan-500"
    }
  ];

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch functions
  const fetchPendingItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/pending`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch pending items.")
      const data: OrderItemDTO[] = await response.json()
      setPendingItems(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchPreparingItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/preparing`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch preparing items.")
      const data: OrderItemDTO[] = await response.json()
      setPreparingItems(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchReadyItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/ready`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch ready items.")
      const data: OrderItemDTO[] = await response.json()
      setReadyItems(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/menu`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch menu items.")
      const data: MenuItemDTO[] = await response.json()
      // Garante que o campo 'available' existe, mesmo que não venha da API
      setMenuItems(data.map(item => ({ ...item, available: item.available !== undefined ? item.available : true })));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchInitialData = async () => {
    if (authToken) {
      await fetchPendingItems()
      await fetchPreparingItems()
      await fetchReadyItems()
      await fetchMenuItems()
    }
  }

  useEffect(() => {
    fetchInitialData()
    const interval = setInterval(fetchInitialData, 15000);
    return () => clearInterval(interval);
  }, [authToken])

  const handleStatusChange = async (itemId: number, currentStatus: OrderItemDTO["status"], targetStatus: OrderItemDTO["status"]) => {
    let endpoint = "";
    if (targetStatus === "PREPARING") {
      endpoint = `/kitchen/item/${itemId}/start-preparing`;
    } else if (targetStatus === "READY") {
      endpoint = `/kitchen/item/${itemId}/mark-ready`;
    } else {
      if (targetStatus === "DELIVERED") {
        const itemToMove = pendingItems.find(item => item.id === itemId) ||
                           preparingItems.find(item => item.id === itemId) ||
                           readyItems.find(item => item.id === itemId);
        if (itemToMove) {
          setDeliveredItems(prev => [...prev, { ...itemToMove, status: "DELIVERED" }]);
          setPendingItems(prev => prev.filter(item => item.id !== itemId));
          setPreparingItems(prev => prev.filter(item => item.id !== itemId));
          setReadyItems(prev => prev.filter(item => item.id !== itemId));
          toast({ title: "Item Finalizado", description: `${itemToMove.menuItemName} marcado como finalizado.` });
        }
        return;
      }
    }

    console.log(`Attempting to send PATCH to: ${BASE_URL}${endpoint}`);
    console.log(`Auth Token: ${authToken ? 'Present' : 'Missing'}`);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
      })
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to update item status to ${targetStatus}.`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            console.error("Failed to parse error response as JSON:", errorText);
            errorMessage = errorText || errorMessage;
        }
        console.error(`Error response for ${endpoint}:`, response.status, errorText);
        throw new Error(errorMessage);
      }
      toast({ title: "Status Atualizado", description: `Item ${itemId} agora está ${getStatusText(targetStatus)}. ✅` });
      fetchInitialData();
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Status", description: error.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
      console.error("Full error object:", error);
    }
  }

  // NOVO: Função para alternar a disponibilidade do item do menu
  const handleToggleMenuItemAvailability = async (id: number, currentAvailable: boolean) => {
    const newAvailableStatus = !currentAvailable;
    try {
      const response = await fetch(`${BASE_URL}/kitchen/menu-item/${id}/toggle-availability?available=${newAvailableStatus}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json" // Pode ser necessário para PATCH
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to toggle availability for item ${id}.`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response as JSON:", errorText);
          errorMessage = errorText || errorMessage;
        }
        console.error(`Error response for toggle availability:`, response.status, errorText);
        throw new Error(errorMessage);
      }

      const updatedItem: MenuItemDTO = await response.json();
      setMenuItems(prev => prev.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ));
      toast({
        title: "Disponibilidade Atualizada",
        description: `${updatedItem.name} agora está ${updatedItem.available ? 'disponível' : 'indisponível'}.`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Atualizar Disponibilidade",
        description: error.message || "Ocorreu um erro desconhecido ao alterar a disponibilidade.",
        variant: "destructive"
      });
      console.error("Full error object for toggle availability:", error);
    }
  };


  const getStatusColor = (status: OrderItemDTO["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-500"
      case "PREPARING":
        return "bg-yellow-500"
      case "READY":
        return "bg-green-500"
      case "DELIVERED":
        return "bg-gray-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: OrderItemDTO["status"]) => {
    switch (status) {
      case "PENDING":
        return "Novo"
      case "PREPARING":
        return "Em Preparo"
      case "READY":
        return "Pronto"
      case "DELIVERED":
        return "Finalizado"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: "urgent" | "normal") => {
    return priority === "urgent" ? "bg-red-500" : "bg-blue-500"
  }

  const getElapsedTime = (createdAt: string) => {
    try {
      const itemDate = new Date(createdAt);
      const elapsed = Math.floor((currentTime.getTime() - itemDate.getTime()) / (1000 * 60));
      return elapsed;
    } catch (e) {
      return 0;
    }
  }

  const OrderCard = ({ order, showActions = true }: { order: OrderItemDTO; showActions?: boolean }) => {
    const relatedMenuItem = menuItems.find(item => item.id === order.menuItemId);
    const mockTable = order.orderId % 10;
    const mockWaiter = `Garçom ${order.orderId % 5 + 1}`;
    const mockPriority: "urgent" | "normal" = (order.quantity > 5 || order.menuItemName.includes("Urgente")) ? "urgent" : "normal";


    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Pedido #{order.orderId} - Mesa {mockTable}</CardTitle>
              <Badge className={`${getPriorityColor(mockPriority)} text-white`}>
                {mockPriority === "urgent" ? "Urgente" : "Normal"}
              </Badge>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusText(order.status)}
              </Badge>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Item: {order.menuItemName} ({order.quantity})</div>
              <div>Iniciado: {new Date(order.createdAt).toLocaleTimeString()}</div>
              <div className="flex items-center gap-1 justify-end">
                <Timer className="w-3 h-3" />
                {getElapsedTime(order.createdAt)} min
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Detalhes do Item:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-sm">
                  {order.menuItemName} (x{order.quantity})
                </li>
                {order.menuItemDescription && <li className="text-xs text-gray-500">{order.menuItemDescription}</li>}
                {relatedMenuItem?.preparationTime && <li className="text-xs text-gray-500">Tempo de preparo estimado: {relatedMenuItem.preparationTime} min</li>}
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Garçom: {mockWaiter}</span>
            </div>

            {showActions && (
              <div className="flex gap-2 pt-2">
                {order.status === "PENDING" && (
                  <Button
                    onClick={() => handleStatusChange(order.id, order.status, "PREPARING")}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Iniciar Preparo
                  </Button>
                )}
                {order.status === "PREPARING" && (
                  <Button onClick={() => handleStatusChange(order.id, order.status, "READY")} className="bg-green-500 hover:bg-green-600">
                    <Package className="w-4 h-4 mr-2" />
                    Marcar como Pronto
                  </Button>
                )}
                {order.status === "READY" && (
                  <Button
                    onClick={() => handleStatusChange(order.id, order.status, "DELIVERED")}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const sidebarItems = [
    {
      category: "Pedidos",
      items: [
        { key: "all-orders", label: "Todos os Pedidos", count: pendingItems.length + preparingItems.length + readyItems.length + deliveredItems.length, icon: Package },
        { key: "urgent-orders", label: "Urgentes", count: pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente"))).length, icon: AlertTriangle },
        { key: "new-orders", label: "Novos", count: pendingItems.length, icon: Package },
        { key: "preparing-orders", label: "Em Preparo", count: preparingItems.length, icon: ChefHat },
        { key: "ready-orders", label: "Prontos", count: readyItems.length, icon: CheckCircle },
        { key: "completed-orders", label: "Finalizados", count: deliveredItems.length, icon: Eye },
      ],
    },
    {
      category: "Cardápio",
      items: [
        { key: "menu-management", label: "Gerenciar Cardápio", count: menuItems.length, icon: Package },
        { key: "categories", label: "Categorias", count: Object.keys(categoryMapping).length, icon: Package },
        { key: "recipes", label: "Receitas", count: recipes.length, icon: CookingPot }, // Receitas
      ],
    },
    // Removendo a categoria "Relatórios" e "Estoque"
    // {
    //   category: "Relatórios",
    //   items: [
    //     { key: "sales-report", label: "Vendas por Categoria", count: null, icon: BarChart3 },
    //     { key: "stock-report", label: "Relatório de Estoque", count: null, icon: Package },
    //     { key: "performance", label: "Performance", count: null, icon: Timer },
    //   ],
    // },
    {
      category: "Sistema",
      items: [{ key: "logout", label: "Sair", count: null, icon: LogOut }],
    },
  ]

  const handleSidebarClick = (key: string) => {
    if (key === "logout") {
      onLogout()
      return
    }
    setActiveSection(key)
  }

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TableMaster</h1>
            <p className="text-sm text-gray-500">Cozinha</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {sidebarItems.map((section, index) => (
          <div key={index}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{section.category}</h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleSidebarClick(item.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${activeSection === item.key ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.count !== null && <Badge className="bg-gray-200 text-gray-800 text-xs">{item.count}</Badge>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-100 text-green-800"
      case "Média":
        return "bg-yellow-100 text-yellow-800"
      case "Difícil":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "APPETIZERS":
        return "bg-green-100 text-green-800"
      case "MAIN_COURSES":
        return "bg-blue-100 text-blue-800"
      case "DESSERTS":
        return "bg-pink-100 text-pink-800"
      case "DRINKS":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "APPETIZERS": return "Entradas";
      case "MAIN_COURSES": return "Pratos Principais";
      case "DESSERTS": return "Sobremesas";
      case "DRINKS": return "Bebidas";
      default: return category;
    }
  }

  const renderMainContent = () => {
    if (activeSection === "all-orders" || activeSection === "new-orders" || activeSection === "preparing-orders" || activeSection === "ready-orders" || activeSection === "urgent-orders" || activeSection === "completed-orders") {
      const displayOrders = activeSection === "all-orders"
        ? [...pendingItems, ...preparingItems, ...readyItems, ...deliveredItems]
        : activeSection === "new-orders"
          ? pendingItems
          : activeSection === "preparing-orders"
            ? preparingItems
            : activeSection === "ready-orders"
              ? readyItems
              : activeSection === "completed-orders"
                ? deliveredItems
                : pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente")))
      return (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Novos Pedidos</p>
                    <p className="text-2xl font-bold text-blue-600">{pendingItems.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Preparo</p>
                    <p className="text-2xl font-bold text-yellow-600">{preparingItems.length}</p>
                  </div>
                  <ChefHat className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prontos</p>
                    <p className="text-2xl font-bold text-green-600">{readyItems.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Urgentes</p>
                    <p className="text-2xl font-bold text-red-600">{pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente"))).length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Finalizados Hoje</p>
                    <p className="text-2xl font-bold text-gray-600">{deliveredItems.length}</p>
                  </div>
                  <Eye className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all-orders">Todos</TabsTrigger>
              <TabsTrigger value="urgent-orders" className="text-red-600">
                Urgentes
              </TabsTrigger>
              <TabsTrigger value="new-orders" className="text-blue-600">
                Novos
              </TabsTrigger>
              <TabsTrigger value="preparing-orders" className="text-yellow-600">
                Em Preparo
              </TabsTrigger>
              <TabsTrigger value="ready-orders" className="text-green-600">
                Prontos
              </TabsTrigger>
              <TabsTrigger value="completed-orders" className="text-gray-600">
                Finalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeSection} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayOrders.length === 0 ? (
                  <Card className="lg:col-span-3">
                    <CardContent className="p-8 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum pedido nesta categoria.</p>
                    </CardContent>
                  </Card>
                ) : (
                  displayOrders.map((order) => <OrderCard key={order.id} order={order} showActions={order.status !== "DELIVERED"} />)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    if (activeSection === "categories") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Categorias</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kitchenCategories.map((category) => {
              // Correção aqui: Usando o mapeamento de categorias
              const apiCategory = categoryMapping[category.id as keyof typeof categoryMapping];
              const categoryItemsCount = menuItems.filter((item) =>
                item.category === apiCategory
              ).length;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${category.color} text-white text-2xl`}>{category.icon}</div>
                      <Badge className="bg-gray-100 text-gray-800">
                        {categoryItemsCount}{" "}
                        itens
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Gerencie os itens da categoria {category.name.toLowerCase()}
                    </p>
                    <Button className="w-full" variant="outline" onClick={() => setActiveSection("menu-management")}>
                      Ver Itens
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Itens por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kitchenCategories.map((category) => {
                  // Correção aqui: Usando o mapeamento de categorias
                  const apiCategory = categoryMapping[category.id as keyof typeof categoryMapping];
                  const categoryItems = menuItems.filter((item) =>
                    item.category === apiCategory
                  );
                  return (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{category.icon}</span>
                        <h4 className="font-semibold">{category.name}</h4>
                        <Badge>{categoryItems.length} itens</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryItems.map((item) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{item.name}</h5>
                              <Badge
                                className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {item.available ? "Disponível" : "Indisponível"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">R$ {item.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{item.preparationTime || 0} min</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeSection === "menu-management") {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Cardápio</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Package className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Itens</p>
                    <p className="text-2xl font-bold text-blue-600">{menuItems.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Itens Disponíveis</p>
                    <p className="text-2xl font-bold text-green-600">
                      {menuItems.filter((item) => item.available).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Preço Médio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      R$ {(menuItems.length > 0 ? menuItems.reduce((acc, item) => acc + item.price, 0) / menuItems.length : 0).toFixed(2)}
                    </p>
                  </div>
                  <Timer className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Itens do Cardápio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <Badge className={`${getCategoryColor(item.category)}`}>{getCategoryDisplayName(item.category)}</Badge>
                          <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {item.available ? "Disponível" : "Indisponível"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>R$ {item.price.toFixed(2)}</span>
                          <span>{item.preparationTime || 0} min</span>
                          <span className={getDifficultyColor(item.difficulty || "medium")}>
                            {item.difficulty === "easy" ? "Fácil" : item.difficulty === "medium" ? "Média" : item.difficulty === "difficult" ? "Difícil" : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* BOTÃO DE ATIVAR/DESATIVAR ITEM */}
                        <Button
                          variant="outline"
                          size="sm"
                          className={item.available ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                          onClick={() => handleToggleMenuItemAvailability(item.id, item.available || false)} // Passe o status atual
                        >
                          {item.available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {item.available ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          // onClick={() => handleDeleteMenuItem(item.id, item.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Ingredients and Allergens are not in current MenuItemDTO, so they remain dummy/frontend only */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Ingredientes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {item.ingredients?.map((ingredient, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Alérgenos:</h5>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens?.map((allergen, index) => (
                            <Badge key={index} className={`${
                              allergen.severity === "high"
                                ? "bg-red-100 text-red-800"
                                : allergen.severity === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}>
                              {allergen.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeSection === "recipes") { // Nova seção de Receitas
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Livro de Receitas</h2>
          <p className="text-sm text-gray-600">Receitas salvas para consulta rápida.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
                <Card className="lg:col-span-3">
                    <CardContent className="p-8 text-center">
                        <BookText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma receita cadastrada. Adicione uma nova!</p>
                    </CardContent>
                </Card>
            ) : (
                recipes.map((recipe) => (
                    <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge className={`${getCategoryColor(categoryMapping[recipe.category as keyof typeof categoryMapping])}`}>{recipe.category}</Badge>
                                <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-gray-700">{recipe.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <p><span className="font-semibold">Preparo:</span> {recipe.prepTimeMinutes} min</p>
                                <p><span className="font-semibold">Cozimento:</span> {recipe.cookTimeMinutes} min</p>
                                <p><span className="font-semibold">Porções:</span> {recipe.servings}</p>
                            </div>
                            <h4 className="font-medium text-sm mb-1">Ingredientes:</h4>
                            <ul className="list-disc list-inside text-xs text-gray-700">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.quantity} de {ing.name}</li>
                                ))}
                            </ul>
                            <h4 className="font-medium text-sm mb-1">Instruções:</h4>
                            <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1">
                                {recipe.instructions.map((inst, i) => (
                                    <li key={i}>{inst}</li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                ))
            )}
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Nova Receita (Em breve)
          </Button>
        </div>
      );
    }
    
    // As seções "stock", "sales-report" e "performance" foram removidas.
    // Se você precisar de lógica para esses itens no futuro, eles precisarão
    // ser re-adicionados aqui e na sidebarItems.

    return (
      <div className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Selecione uma opção no menu lateral</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Painel da Cozinha</h1>
              <p className="text-sm text-gray-500">Gerencie todos os pedidos em tempo real</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-mono">{currentTime.toLocaleTimeString()}</div>
                <div className="text-sm text-gray-600">{currentTime.toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-100px)]"> 
            {renderMainContent()}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}