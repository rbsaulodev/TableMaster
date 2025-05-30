"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, AlertTriangle, ChefHat, Package, Eye, Timer, Users, LogOut, BarChart3, Edit, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast" // Import useToast

const BASE_URL = "http://localhost:8080/api" //

// Define types based on API documentation
interface OrderItemDTO {
  id: number; //
  orderId: number; //
  menuItemId: number; //
  menuItemName: string; //
  menuItemDescription: string; //
  quantity: number; //
  unitPrice: number; // BigDecimal
  totalPrice: number; // BigDecimal
  status: "PENDING" | "PREPARING" | "READY" | "DELIVERED";
  createdAt: string //
  // Additional fields from original frontend that are not in API DTO will be omitted or handled as mock
  // table: number; // This needs to be fetched from OrderDTO if needed
  // priority: "urgent" | "normal"; // This needs to be determined based on custom logic or added to API DTO
  // orderTime: string; // This needs to be fetched from OrderDTO createdAt
  // estimatedTime?: number; // Not in API DTO
  // notes?: string; // Not in API DTO
  // waiter: string; // This needs to be fetched from OrderDTO userName (waiter or client)
}

interface MenuItemDTO {
  id: number; //
  name: string; //
  description: string; //
  price: number; // BigDecimal
  imageUrl?: string; //
  category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS"; //
  drinkType?: "WATER" | "SODA" | "NATURAL_JUICE" | "BEER" | "WINE" | "COCKTAIL"; //
  // Add these properties if they are part of your backend MenuItemDTO, otherwise they are dummy
  preparationTime?: number;
  difficulty?: "easy" | "medium" | "difficult";
  available?: boolean;
  ingredients?: string[]; // Assuming this is part of MenuItemDTO for kitchen display
  allergens?: { name: string; severity: "low" | "medium" | "high" }[]; // Assuming this is part of MenuItemDTO for kitchen display
}

interface KitchenDashboardProps {
  onLogout: () => void;
  authToken: string;
}

export default function KitchenDashboard({ onLogout, authToken }: KitchenDashboardProps) {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSection, setActiveSection] = useState("all-orders") // Changed default to match sidebar

  // States populated by API
  const [pendingItems, setPendingItems] = useState<OrderItemDTO[]>([])
  const [preparingItems, setPreparingItems] = useState<OrderItemDTO[]>([])
  const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([])
  const [deliveredItems, setDeliveredItems] = useState<OrderItemDTO[]>([]) // For "completed" view
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])

  // Dummy data for sections not yet covered by API
  const [stockItems, setStockItems] = useState<any[]>([
    { id: 1, name: "Tomate", category: "Vegetais", currentStock: 15, minStock: 10, unit: "kg", cost: 5.00, supplier: "Hortifruti A", lastUpdate: "2024-05-28" },
    { id: 2, name: "Frango", category: "Carnes", currentStock: 5, minStock: 8, unit: "kg", cost: 12.00, supplier: "Frigorífico B", lastUpdate: "2024-05-28" },
    { id: 3, name: "Farinha", category: "Grãos", currentStock: 20, minStock: 5, unit: "kg", cost: 3.50, supplier: "Atacadão C", lastUpdate: "2024-05-27" },
  ])
  const [kitchenCategories, setKitchenCategories] = useState<any[]>([
    { id: "entradas", name: "Entradas", icon: "🥗", color: "bg-green-500" },
    { id: "principais", name: "Pratos Principais", icon: "🍝", color: "bg-blue-500" },
    { id: "sobremesas", name: "Sobremesas", icon: "🍰", color: "bg-pink-500" },
    { id: "bebidas", name: "Bebidas", icon: "🍹", color: "bg-cyan-500" },
  ])

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
      const data: OrderItemDTO[] = await response.json() //
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
      const data: OrderItemDTO[] = await response.json() //
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
      const data: OrderItemDTO[] = await response.json() //
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
      const data: MenuItemDTO[] = await response.json() //
      setMenuItems(data)
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
      // You might want to fetch delivered items from a separate API call if available
      // For now, deliveredItems is managed locally on status change
    }
  }

  useEffect(() => {
    fetchInitialData()
    // Set up a polling interval for kitchen orders
    const interval = setInterval(fetchInitialData, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [authToken])

  const handleStatusChange = async (itemId: number, currentStatus: OrderItemDTO["status"], targetStatus: OrderItemDTO["status"]) => {
    let endpoint = "";
    if (targetStatus === "PREPARING") { //
      endpoint = `/kitchen/items/${itemId}/start`; //
    } else if (targetStatus === "READY") { //
      endpoint = `/kitchen/items/${itemId}/ready`; //
    } else {
      // For "DELIVERED" status, this is handled by Waiter Service, so we'll just update locally
      // or you might have a different kitchen-specific endpoint for "complete" if needed.
      // For now, it will be a local state change on the frontend.
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

    try {
      const response = await fetch(`<span class="math-inline">\{BASE\_URL\}</span>{endpoint}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update item status to ${targetStatus}.`);
      }
      toast({ title: "Status Atualizado", description: `Item ${itemId} agora está ${targetStatus}.` });
      fetchInitialData(); // Re-fetch all lists to ensure consistency
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Status", description: error.message, variant: "destructive" });
    }
  }

  const getStatusColor = (status: OrderItemDTO["status"]) => { //
    switch (status) {
      case "PENDING": //
        return "bg-blue-500"
      case "PREPARING": //
        return "bg-yellow-500"
      case "READY": //
        return "bg-green-500"
      case "DELIVERED": //
        return "bg-gray-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: OrderItemDTO["status"]) => { //
    switch (status) {
      case "PENDING": //
        return "Novo"
      case "PREPARING": //
        return "Em Preparo"
      case "READY": //
        return "Pronto"
      case "DELIVERED": //
        return "Finalizado"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: "urgent" | "normal") => { // This is a frontend-only concept from previous code
    return priority === "urgent" ? "bg-red-500" : "bg-blue-500"
  }

  const getElapsedTime = (createdAt: string) => { // Assuming createdAt is LocalDateTime string
    try {
      const itemDate = new Date(createdAt);
      const elapsed = Math.floor((currentTime.getTime() - itemDate.getTime()) / (1000 * 60));
      return elapsed;
    } catch (e) {
      return 0; // Or handle error appropriately
    }
  }

  const OrderCard = ({ order, showActions = true }: { order: OrderItemDTO; showActions?: boolean }) => {
    // Attempt to find related menu item for details like preparation time
    const relatedMenuItem = menuItems.find(item => item.id === order.menuItemId); //
    // Mock data for table number and waiter, as OrderItemDTO doesn't contain this directly
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
              <div>Iniciado: {new Date(order.createdAt).toLocaleTimeString()}</div> {/* */}
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
                {order.menuItemDescription && <li className="text-xs text-gray-500">{order.menuItemDescription}</li>} {/* */}
                {relatedMenuItem?.preparationTime && <li className="text-xs text-gray-500">Tempo de preparo estimado: {relatedMenuItem.preparationTime} min</li>}
                {/* Add ingredients and allergens here if needed from MenuItemDTO */}
              </ul>
            </div>

            {/* order.notes and order.estimatedTime are not in OrderItemDTO or MenuItemDTO, keep as dummy/mock if critical */}
            {/* {order.notes && (
              <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                <p className="text-sm">
                  <strong>Observações:</strong> {order.notes}
                </p>
              </div>
            )} */}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Garçom: {mockWaiter}</span>
            </div>

            {showActions && (
              <div className="flex gap-2 pt-2">
                {order.status === "PENDING" && ( //
                  <Button
                    onClick={() => handleStatusChange(order.id, order.status, "PREPARING")} //
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Iniciar Preparo
                  </Button>
                )}
                {order.status === "PREPARING" && ( //
                  <Button onClick={() => handleStatusChange(order.id, order.status, "READY")} className="bg-green-500 hover:bg-green-600"> {/* */}
                    <Package className="w-4 h-4 mr-2" />
                    Marcar como Pronto
                  </Button>
                )}
                {order.status === "READY" && ( //
                  <Button
                    onClick={() => handleStatusChange(order.id, order.status, "DELIVERED")} // Frontend "Finalizar" moves to delivered state
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
        { key: "urgent-orders", label: "Urgentes", count: pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente"))).length, icon: AlertTriangle }, // Mock urgency
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
        { key: "categories", label: "Categorias", count: kitchenCategories.length, icon: Package },
        {
          key: "stock",
          label: "Estoque",
          count: stockItems.filter((item) => item.currentStock <= item.minStock).length,
          icon: AlertTriangle,
        },
        { key: "recipes", label: "Receitas", count: null, icon: ChefHat },
      ],
    },
    {
      category: "Relatórios",
      items: [
        { key: "sales-report", label: "Vendas por Categoria", count: null, icon: BarChart3 },
        { key: "stock-report", label: "Relatório de Estoque", count: null, icon: Package },
        { key: "performance", label: "Performance", count: null, icon: Timer },
      ],
    },
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

  const getDifficultyColor = (difficulty: string) => { // Dummy data
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "difficult":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => { //
    switch (category) {
      case "APPETIZERS": //
        return "bg-green-100 text-green-800"
      case "MAIN_COURSES": //
        return "bg-blue-100 text-blue-800"
      case "DESSERTS": //
        return "bg-pink-100 text-pink-800"
      case "DRINKS": //
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryDisplayName = (category: string) => { //
    switch (category) {
      case "APPETIZERS": return "Entradas"; //
      case "MAIN_COURSES": return "Pratos Principais"; //
      case "DESSERTS": return "Sobremesas"; //
      case "DRINKS": return "Bebidas"; //
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
                : pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente"))) // Mock urgency
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
                    <p className="text-2xl font-bold text-red-600">{pendingItems.filter(item => (item.quantity > 5 || item.menuItemName.includes("Urgente"))).length}</p> {/* Mock urgency */}
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
              const categoryItemsCount = menuItems.filter((item) =>
                item.category.toLowerCase().includes(category.id === "principais" ? "main_courses" : category.name.toLowerCase()) // Adjust to API categories
              ).length
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
                  const categoryItems = menuItems.filter((item) =>
                    item.category.toLowerCase().includes(category.id === "principais" ? "main_courses" : category.name.toLowerCase()) // Adjust to API categories
                  )
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
                              {/* Assuming 'available' would be a field in MenuItemDTO if it were manageable by kitchen */}
                              <Badge
                                className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {item.available ? "Disponível" : "Indisponível"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">R$ {item.price.toFixed(2)}</p> {/* */}
                            {/* Assuming preparationTime and difficulty are part of MenuItemDTO or derived */}
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
            <Button className="bg-blue-600 hover:bg-blue-700"> {/* Add item functionality would go here, similar to admin */}
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
                      {menuItems.filter((item) => item.available).length} {/* Assuming available is a field */}
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
                      R$ {(menuItems.length > 0 ? menuItems.reduce((acc, item) => acc + item.price, 0) / menuItems.length : 0).toFixed(2)} {/* */}
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
                          <h4 className="font-semibold text-lg">{item.name}</h4> {/* */}
                          <Badge className={`${getCategoryColor(item.category)}`}>{getCategoryDisplayName(item.category)}</Badge> {/* */}
                          <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}> {/* Assuming 'available' field */}
                            {item.available ? "Disponível" : "Indisponível"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p> {/* */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>R$ {item.price.toFixed(2)}</span> {/* */}
                          {/* Assuming preparationTime and difficulty are part of MenuItemDTO or derived */}
                          <span>{item.preparationTime || 0} min</span>
                          <span className={getDifficultyColor(item.difficulty || "medium")}>
                            {item.difficulty === "easy" ? "Fácil" : item.difficulty === "medium" ? "Médio" : item.difficulty === "difficult" ? "Difícil" : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" /> {/* Edit action not implemented fully here */}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={item.available ? "text-red-600" : "text-green-600"}
                          // onClick={() => handleToggleMenuItemAvailability(item.id, item.available)} // Implement this if API supports
                        >
                          {item.available ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          // onClick={() => handleDeleteMenuItem(item.id, item.name)} // Implement this if API supports
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

    if (activeSection === "stock") {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Controle de Estoque</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Itens</p>
                    <p className="text-2xl font-bold text-blue-600">{stockItems.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stockItems.filter((item) => item.currentStock <= item.minStock).length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {stockItems.reduce((acc, item) => acc + item.currentStock * item.cost, 0).toFixed(2)}
                    </p>
                  </div>
                  <Timer className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fornecedores</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(stockItems.map((item) => item.supplier)).size}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Itens em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <Badge className="bg-blue-100 text-blue-800">{item.category}</Badge>
                          {item.currentStock <= item.minStock && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Estoque Baixo
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Estoque Atual:</span>
                            <p className="font-semibold">
                              {item.currentStock} {item.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Estoque Mínimo:</span>
                            <p className="font-semibold">
                              {item.minStock} {item.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Custo Unitário:</span>
                            <p className="font-semibold">R$ {item.cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor Total:</span>
                            <p className="font-semibold">R$ {(item.currentStock * item.cost).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Fornecedor: {item.supplier}</span>
                          <span className="ml-4">Última atualização: {item.lastUpdate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-green-600">
                          Repor
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nível do Estoque</span>
                        <span>{Math.round((item.currentStock / (item.minStock * 3)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.currentStock <= item.minStock
                              ? "bg-red-500"
                              : item.currentStock <= item.minStock * 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((item.currentStock / (item.minStock * 3)) * 100, 100)}%` }}
                        ></div>
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

    if (activeSection === "sales-report") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Relatório de Vendas por Categoria</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kitchenCategories.map((category) => {
              const categoryItems = menuItems.filter((item) =>
                item.category.toLowerCase().includes(category.id === "principais" ? "main_courses" : category.name.toLowerCase()), //
              )
              const totalSales = Math.floor(Math.random() * 50) + 10 // Simulado
              const revenue =
                categoryItems.reduce((acc, item) => acc + item.price, 0) * (totalSales / (categoryItems.length || 1))

              return (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${category.color} text-white text-2xl`}>{category.icon}</div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{totalSales}</p>
                        <p className="text-sm text-gray-600">vendas</p>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Receita: R$ {revenue.toFixed(2)}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{categoryItems.length} itens</span>
                      <span>+{Math.floor(Math.random() * 20)}% vs ontem</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Itens Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuItems.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{item.name}</p> {/* */}
                          <p className="text-sm text-gray-600">{getCategoryDisplayName(item.category)}</p> {/* */}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Math.floor(Math.random() * 20) + 5} vendas</p>
                        <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</p> {/* */}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Horário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { period: "Manhã (06:00-12:00)", sales: 23, percentage: 25 },
                    { period: "Almoço (12:00-15:00)", sales: 45, percentage: 50 },
                    { period: "Tarde (15:00-18:00)", sales: 12, percentage: 15 },
                    { period: "Jantar (18:00-23:00)", sales: 38, percentage: 42 },
                  ].map((period, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{period.period}</span>
                        <span className="text-sm">{period.sales} vendas</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${period.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

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
        </div>

        {renderMainContent()}
      </div>
    </div>
  )
}