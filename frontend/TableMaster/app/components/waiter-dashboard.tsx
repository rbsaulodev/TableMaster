// app/waiter/components/waiter-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  LogOut,
  MapPin,
  FileText,
  Package,
  Clock,
  Users,
  TrendingUp,
  Minus,
  Star,
  CheckCircle,
  Utensils,
  DollarSign,
  Settings,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  UserPlus,
  Calendar,
  AlertTriangle,
  Timer,
  Coffee,
  Search,
  Award,
  Plus,
  Trash2,
} from "lucide-react"

import { AuthResponseData } from "@/app/types/auth"

const BASE_URL = "http://localhost:8080/api"

// Types from API documentation
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

interface OrderDTO {
  id: number;
  tableId: number;
  tableName: string;
  userCpf: string; // O CPF do usuário (cliente ou funcionário) que abriu a comanda
  userName: string;
  items: OrderItemDTO[];
  createdAt: string;
  status: "OPEN" | "UNPAID" | "PAID";
  totalValue: number;
  paymentMethod?: "CASH" | "CARD" | "PIX";
  closedAt?: string;
}

interface RestaurantTableDTO {
  id: number;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  capacity: number;
  orders?: OrderDTO[];
}

interface MenuItemDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS";
  drinkType?: "WATER" | "SODA" | "NATURAL_JUICE" | "BEER" | "WINE" | "COCKTAIL";
}

interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

type PaymentMethod = "CASH" | "CARD" | "PIX";

interface WaiterDashboardProps {
  onLogout: () => void;
  authToken: string;
  currentUserData: AuthResponseData;
}

export default function WaiterDashboard({ onLogout, authToken, currentUserData }: WaiterDashboardProps) {
  const { toast } = useToast()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('')
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderDTO | null>(null)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [newOrderTableId, setNewOrderTableId] = useState<number | null>(null)
  const [newOrderItems, setNewOrderItems] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([])
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("")

  // State populated by API
  const [tables, setTables] = useState<RestaurantTableDTO[]>([])
  const [activeOrders, setActiveOrders] = useState<OrderDTO[]>([])
  const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([]) // Pode refinar este tipo se NotificationDTO vier do backend

  // Mock data
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [dailySales, setDailySales] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    cashSales: 0,
    cardSales: 0,
    pixSales: 0,
    myCommission: 0,
    commissionRate: 5,
    topItems: [],
  })

  // Função para formatar a data de forma segura
  const formatSafeDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'N/A'
    }
  }

  // Função para calcular tempo decorrido de forma segura
  const getElapsedTime = (createdAt: string) => {
    try {
      const itemDate = new Date(createdAt)
      if (isNaN(itemDate.getTime())) return 0
      const elapsed = Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60))
      return elapsed
    } catch {
      return 0
    }
  }

  // Fetch functions - BASE_URL já tem /api, então remove do path
  const fetchTables = async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/tables`, { // Caminho ajustado
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch tables.")
      const data: RestaurantTableDTO[] = await response.json()
      setTables(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/orders/active`, { // Caminho ajustado
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch active orders.")
      const data: OrderDTO[] = await response.json()
      setActiveOrders(data)
      const totalSales = data.reduce((sum, order) => sum + order.totalValue, 0)
      setDailySales((prev) => ({
        ...prev,
        totalOrders: data.length,
        totalSales,
        avgOrderValue: data.length > 0 ? totalSales / data.length : 0,
        myCommission: totalSales * (prev.commissionRate / 100),
      }))
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchReadyItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/items/ready`, { // Caminho ajustado
        headers: { Authorization: `Bearer ${authToken}` },
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
      const response = await fetch(`${BASE_URL}/menu`, { // Caminho ajustado
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch menu items.")
      const data: MenuItemDTO[] = await response.json()
      setMenuItems(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/notifications`, { // Caminho ajustado
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch notifications.")
      const data = await response.json()
      setAccountRequests(
        data.map((notif: any) => ({
          id: notif.itemId || Math.random(),
          table: notif.tableNumber,
          total: 0,
          paymentMethod: "",
          requestTime: new Date(notif.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          customerName: `Mesa ${notif.tableNumber}`,
          status: "pending",
        })),
      )
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const fetchInitialData = async () => {
    if (authToken) {
      await fetchTables()
      await fetchActiveOrders()
      await fetchReadyItems()
      await fetchMenuItems()
      await fetchNotifications()
    }
  }

  useEffect(() => {
    fetchInitialData()
    const interval = setInterval(fetchInitialData, 10000)
    return () => clearInterval(interval)
  }, [authToken])

  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter((t) => t.status === "OCCUPIED").length,
    availableTables: tables.filter((t) => t.status === "AVAILABLE").length,
    reservedTables: tables.filter((t) => t.status === "RESERVED").length,
    totalComandas: activeOrders.length,
    newOrders: activeOrders.filter((c) => c.status === "OPEN").length,
    preparingOrders: readyItems.filter((item) => item.status === "PREPARING").length,
    readyOrders: readyItems.filter((item) => item.status === "READY").length,
    deliveredToday: deliveredOrders.length,
    totalRevenue: dailySales.totalSales,
    avgServiceTime: 0,
    occupancyRate: tables.length > 0 ? Math.round((tables.filter((t) => t.status === "OCCUPIED").length / tables.length) * 100) : 0,
    revenueGrowth: 0,
    serviceTimeChange: 0,
    ordersGrowth: 0,
    accountRequests: accountRequests.filter((req) => req.status === "pending").length,
  }

  const sidebarItems = [
    {
      category: "Pedidos",
      items: [
        { key: "new-orders", label: "Novos Pedidos", count: stats.newOrders, icon: FileText },
        { key: "preparing", label: "Em Preparo", count: stats.preparingOrders, icon: Clock },
        { key: "ready", label: "Prontos", count: stats.readyOrders, icon: CheckCircle },
        { key: "delivered", label: "Entregues", count: stats.deliveredToday, icon: Package },
        {
          key: "account-requests",
          label: "Contas Solicitadas",
          count: stats.accountRequests,
          icon: CreditCard,
        },
      ],
    },
    {
      category: "Mesas",
      items: [
        { key: "occupied-tables", label: "Mesas Ocupadas", count: stats.occupiedTables, icon: Users },
        { key: "available-tables", label: "Mesas Livres", count: stats.availableTables, icon: MapPin },
        { key: "reservations", label: "Reservas", count: reservations.length, icon: Star },
      ],
    },
    {
      category: "Financeiro",
      items: [
        { key: "daily-sales", label: "Vendas do Dia", count: null, icon: DollarSign },
        { key: "commissions", label: "Comissões", count: null, icon: TrendingUp },
      ],
    },
    {
      category: "Sistema",
      items: [
        { key: "settings", label: "Configurações", count: null, icon: Settings },
        { key: "logout", label: "Sair", count: null, icon: LogOut },
      ],
    },
  ]

  const handleSidebarClick = (key: string) => {
    if (key === "logout") {
      onLogout()
      return
    }
    setActiveSection(key)
  }

  const getTableStatusColor = (status: RestaurantTableDTO["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200"
      case "OCCUPIED":
        return "bg-red-100 text-red-800 border-red-200"
      case "RESERVED":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: RestaurantTableDTO["status"] | OrderDTO["status"] | OrderItemDTO["status"] | string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponível"
      case "OCCUPIED":
        return "Ocupada"
      case "RESERVED":
        return "Reservada"
      case "OPEN":
        return "Aberto"
      case "UNPAID":
        return "Não Pago"
      case "PAID":
        return "Pago"
      case "PENDING":
        return "Pendente"
      case "PREPARING":
        return "Preparando"
      case "READY":
        return "Pronto"
      case "DELIVERED":
        return "Entregue"
      default:
        return status
    }
  }

  const getComandaStatusColor = (status: OrderDTO["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800 border-red-200"
      case "UNPAID":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "PAID":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markOrderAsDelivered = async (order: OrderDTO) => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Selecione o método de pagamento",
        description: "É necessário informar como o cliente irá pagar.",
        variant: "destructive",
      })
      return
    }

    try {
      // 1. Pay the order
      const payResponse = await fetch(`${BASE_URL}/orders/${order.id}/pay?paymentMethod=${selectedPaymentMethod}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!payResponse.ok) {
        const errorData = await payResponse.json()
        throw new Error(errorData.message || "Erro ao processar pagamento do pedido.")
      }

      // 2. Deliver each item in the order
      for (const item of order.items) {
        const deliverResponse = await fetch(`${BASE_URL}/waiter/item/${item.id}/deliver`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!deliverResponse.ok) {
          const errorData = await deliverResponse.json()
          console.error(`Failed to deliver item ${item.id}:`, errorData)
          toast({
            title: "Erro ao entregar item",
            description: `Falha ao marcar "${item.menuItemName}" como entregue.`,
            variant: "destructive",
          })
        }
      }

      // Update local state after successful API calls
      const deliveredOrderUpdated = {
        ...order,
        deliveredAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        paymentMethod: selectedPaymentMethod,
        status: "PAID"
      }
      setDeliveredOrders((prev) => [deliveredOrderUpdated, ...prev])

      setSelectedPaymentMethod("")
      setSelectedOrderForPayment(null)

      toast({
        title: "Pedido entregue! ✅",
        description: `Pedido da Mesa ${order.tableName} foi marcado como entregue e pago.`,
      })
      fetchInitialData()

    } catch (error: any) {
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message || "Ocorreu um erro ao finalizar o pedido.",
        variant: "destructive",
      })
    }
  }

  const updateTableStatus = async (tableId: number, newStatus: RestaurantTableDTO["status"], guests?: number) => {
    try {
      let response;
      if (newStatus === "OCCUPIED") {
        response = await fetch(`${BASE_URL}/client/start/${tableId}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
        });
      } else {
        response = await fetch(`${BASE_URL}/table/${tableId}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: tableId,
            number: tables.find(t => t.id === tableId)?.number,
            status: newStatus,
            capacity: tables.find(t => t.id === tableId)?.capacity,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update table status to ${newStatus}.`)
      }

      toast({
        title: "Status atualizado ✅",
        description: `Mesa ${tables.find((t) => t.id === tableId)?.number} agora está ${getStatusText(newStatus).toLowerCase()}.`,
      })
      fetchInitialData()
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar mesa",
        description: error.message || "Ocorreu um erro ao atualizar o status da mesa.",
        variant: "destructive",
      })
    }
  }

  const confirmReservation = async (reservation: any) => {
    try {
      const response = await fetch(`${BASE_URL}/table/${reservation.tableId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: reservation.tableId,
          number: reservation.table,
          status: "RESERVED",
          capacity: reservation.guests,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao confirmar reserva.");
      }

      setReservations((prev) => prev.filter((res) => res.id !== reservation.id));
      toast({
        title: "Reserva confirmada! ✅",
        description: `Reserva para Mesa ${reservation.table} foi confirmada.`,
      });
      fetchTables();
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar reserva",
        description: error.message || "Não foi possível confirmar a reserva.",
        variant: "destructive",
      });
    }
  }

  const addItemToOrder = () => {
    if (!selectedMenuItemId) return

    const menuItem = menuItems.find((item) => item.id === Number.parseInt(selectedMenuItemId))
    if (!menuItem) return

    const existingItem = newOrderItems.find((item) => item.id === menuItem.id)
    if (existingItem) {
      setNewOrderItems((prev) =>
        prev.map((item) => (item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setNewOrderItems((prev) => [...prev, { ...menuItem, quantity: 1 }])
    }

    setSelectedMenuItemId("")
  }

  const removeItemFromOrder = (itemId: number) => {
    setNewOrderItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const createNewOrder = async () => {
    if (!newOrderTableId || newOrderItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma mesa e adicione itens ao pedido.",
        variant: "destructive",
      })
      return
    }

    try {
      // 1. Create the main Order
      const createOrderResponse = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tableId: newOrderTableId,
          userCpf: currentUserData.username, // Usando username para o CPF do usuário (pode ser o próprio garçom ou um cliente genérico)
          userName: currentUserData.fullName, // Usando o nome completo do garçom
        } as Partial<OrderDTO>),
      })

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json()
        throw new Error(errorData.message || "Erro ao criar o pedido principal.")
      }
      const newOrder: OrderDTO = await createOrderResponse.json()

      // 2. Add items to the newly created order
      for (const item of newOrderItems) {
        const orderItemRequest: CreateOrderItemRequest = {
          menuItemId: item.id,
          quantity: item.quantity,
        }
        const addItemsResponse = await fetch(`${BASE_URL}/order-items?orderId=${newOrder.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(orderItemRequest),
        })

        if (!addItemsResponse.ok) {
          const errorData = await addItemsResponse.json()
          console.error(`Failed to add item ${item.name}:`, errorData)
          toast({
            title: "Erro ao adicionar item",
            description: `Falha ao adicionar "${item.name}" ao pedido.`,
            variant: "destructive",
          })
        }
      }

      // Update table status to occupied
      await updateTableStatus(newOrderTableId, "OCCUPIED");

      setNewOrderTableId(null)
      setNewOrderItems([])

      toast({
        title: "Pedido criado! 🎉",
        description: `Novo pedido para Mesa ${tables.find(t => t.id === newOrderTableId)?.number} foi enviado.`,
      })
      fetchInitialData()

    } catch (error: any) {
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Ocorreu um erro ao criar o pedido.",
        variant: "destructive",
      })
    }
  }

  const handleAccountRequestDelivery = (requestId: number) => {
    setAccountRequests((prev) => prev.filter((req) => req.id !== requestId))
    toast({
      title: "Conta entregue! 💳",
      description: `Conta da mesa foi marcada como entregue.`,
    })
    fetchNotifications();
  }


  const filteredComandas = activeOrders.filter((comanda) => {
    const matchesSearch =
      comanda.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comanda.items.some((item) => item.menuItemName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || comanda.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const renderMainContent = () => {
    if (activeSection === "dashboard" || !activeSection) {
      return (
        <div className="space-y-6">
          {/* ... (Seus cards de métricas) ... */}
        </div>
      )
    }

    if (activeSection === "preparing") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pedidos em Preparo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyItems
              .filter((item) => item.status === "PREPARING")
              .map((item) => (
                <Card key={item.id} className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-gray-900">Item: {item.menuItemName}</CardTitle>
                      <Badge className="bg-amber-100 text-amber-800">
                        <Timer className="h-3 w-3 mr-1" />
                        Preparando
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detalhes:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.menuItemName}
                          </span>
                          <span className="font-medium">R$ {item.totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{item.menuItemDescription}</p>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-900">Total do Item:</span>
                        <span className="text-xl font-bold text-orange-600">R$ {item.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span>Tempo de preparo:</span>
                        <span className="font-medium text-amber-600">{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Aguardando finalização da cozinha</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )
    }

    if (activeSection === "ready") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pedidos Prontos para Entrega</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyItems
              .filter((item) => item.status === "READY")
              .map((item) => {
                const order = activeOrders.find(o => o.id === item.orderId);
                return (
                  <Card key={item.id} className="border-0 shadow-sm bg-white border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-gray-900">Mesa {order?.tableName || 'N/A'}</CardTitle>
                        <Badge className="bg-green-500 text-white animate-pulse">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pronto!
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Item Pronto:</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.menuItemName}
                            </span>
                            <span className="font-medium">R$ {item.totalPrice.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.menuItemDescription}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-gray-900">Total do Item:</span>
                          <span className="text-xl font-bold text-orange-600">R$ {item.totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-3">
                          <span>Pronto há:</span>
                          <span className="font-medium text-green-600">{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <Utensils className="h-4 w-4" />
                          <span className="text-sm font-medium">Pronto para entrega</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          try {
                            const response = await fetch(`${BASE_URL}/waiter/item/${item.id}/deliver`, {
                              method: "PATCH",
                              headers: { Authorization: `Bearer ${authToken}` }
                            });

                            if (!response.ok) {
                              throw new Error("Falha ao marcar item como entregue");
                            }

                            setDeliveredOrders(prev => [...prev, {
                              id: item.orderId,
                              customer: `Mesa ${order?.tableName || 'N/A'}`,
                              items: [{
                                name: item.menuItemName,
                                quantity: item.quantity,
                                price: item.unitPrice
                              }],
                              total: item.totalPrice,
                              deliveredAt: new Date().toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit"
                              }),
                              paymentMethod: "N/A",
                              waiter: currentUserData.fullName
                            }]);

                            fetchReadyItems();

                          } catch (error) {
                            toast({
                              title: "Erro ao entregar item",
                              description: "Não foi possível marcar o item como entregue",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Marcar como Entregue
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )
    }

    if (activeSection === "account-requests") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Contas Solicitadas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountRequests
              .filter((req) => req.status === "pending")
              .map((request) => {
                const associatedOrder = activeOrders.find(order => order.tableId === request.tableId);
                return (
                  <Card key={request.id} className="border-0 shadow-sm bg-white border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-gray-900">{request.customerName}</CardTitle>
                        <Badge className="bg-blue-500 text-white animate-pulse">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Conta Solicitada
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700 mb-1">Total da Conta</p>
                        <p className="text-2xl font-bold text-blue-800">R$ {associatedOrder?.totalValue.toFixed(2) || '0.00'}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Solicitado às:</span>
                          <span className="font-medium">{request.requestTime}</span>
                        </div>
                      </div>

                      <div>
                        <Label>Método de Pagamento</Label>
                        <Select value={selectedPaymentMethod} onValueChange={(value: PaymentMethod) => setSelectedPaymentMethod(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARD">Cartão</SelectItem>
                            <SelectItem value="CASH">Dinheiro</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                          <CreditCard className="h-4 w-4" />
                          <span className="text-sm font-medium">Cliente aguardando a conta</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => associatedOrder && markOrderAsDelivered(associatedOrder)}
                        disabled={!selectedPaymentMethod || !associatedOrder}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Finalizar e Pagar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )
    }

    if (activeSection === "delivered") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pedidos Entregues Hoje</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveredOrders.map((order) => (
              <Card key={order.id} className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-900">{order.customer}</CardTitle>
                    <Badge className="bg-gray-100 text-gray-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Entregue
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Itens:</h4>
                    <div className="space-y-1">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">R$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Entregue às:</span>
                        <span>{order.deliveredAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagamento:</span>
                        <span className="font-medium">{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Garçom:</span>
                        <span>{order.waiter}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (activeSection === "occupied-tables") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Mesas Ocupadas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables
              .filter((table) => table.status === "OCCUPIED")
              .map((table) => {
                const currentOrder = activeOrders.find(order => order.tableId === table.id);
                return (
                  <Card key={table.id} className="border-0 shadow-sm bg-white border-red-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl text-gray-900">Mesa {table.number}</CardTitle>
                        <Badge className="bg-red-100 text-red-800">
                          <Users className="h-3 w-3 mr-1" />
                          Ocupada
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Capacidade:</span>
                          <p className="font-medium">{table.capacity} pessoas</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Garçom:</span>
                          <p className="font-medium">{currentOrder?.userName || currentUserData.fullName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total do Pedido:</span>
                          <p className="font-medium text-orange-600">R$ {currentOrder?.totalValue.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Último pedido:</span>
                          <p className="font-medium">{currentOrder ? new Date(currentOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        {currentOrder && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedOrderForPayment(currentOrder)}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Fechar Conta
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Fechar Conta da Mesa {table.number}</DialogTitle>
                                <DialogDescription>Selecione o método de pagamento para o pedido #{currentOrder.id}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-2xl font-bold text-center">Total: R$ {currentOrder.totalValue.toFixed(2)}</p>
                                <div>
                                  <Label>Método de Pagamento</Label>
                                  <Select value={selectedPaymentMethod} onValueChange={(value: PaymentMethod) => setSelectedPaymentMethod(value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="CARD">Cartão</SelectItem>
                                      <SelectItem value="CASH">Dinheiro</SelectItem>
                                      <SelectItem value="PIX">PIX</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={() => markOrderAsDelivered(currentOrder)}
                                  disabled={!selectedPaymentMethod}
                                >
                                  Finalizar Pagamento
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => updateTableStatus(table.id, "AVAILABLE")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Liberar Mesa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )
    }

    if (activeSection === "available-tables") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Mesas Disponíveis</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables
              .filter((table) => table.status === "AVAILABLE")
              .map((table) => (
                <Card key={table.id} className="border-0 shadow-sm bg-white border-green-200">
                  <CardHeader className="pb-3 text-center">
                    <CardTitle className="text-xl text-gray-900">Mesa {table.number}</CardTitle>
                    <Badge className="bg-green-100 text-green-800 mx-auto w-fit">
                      <MapPin className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Capacidade</p>
                      <p className="text-2xl font-bold text-gray-900">{table.capacity}</p>
                      <p className="text-sm text-gray-500">pessoas</p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Ocupar Mesa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ocupar Mesa {table.number}</DialogTitle>
                          <DialogDescription>Informe o número de clientes para ocupar a mesa.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="guests">Número de Clientes</Label>
                            <Select onValueChange={(value) => updateTableStatus(table.id, "OCCUPIED", parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: table.capacity }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {i + 1} {i + 1 === 1 ? "pessoa" : "pessoas"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => { /* A lógica de updateTableStatus já está no Select onValueChange */ }}
                          >
                            Confirmar Ocupação
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )
    }

    if (activeSection === "reservations") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Reservas do Dia</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-900">{reservation.name}</CardTitle>
                    <Badge
                      className={
                        reservation.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {reservation.status === "confirmed" ? "Confirmada" : "Pendente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Mesa:</span>
                      <p className="font-medium">Mesa {reservation.table}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Horário:</span>
                      <p className="font-medium">{reservation.time}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pessoas:</span>
                      <p className="font-medium">{reservation.guests} pessoas</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Telefone:</span>
                      <p className="font-medium">{reservation.phone}</p>
                    </div>
                  </div>

                  {reservation.notes && (
                    <div>
                      <span className="text-gray-500 text-sm">Observações:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{reservation.notes}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    {reservation.status === "pending" && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => confirmReservation(reservation)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Reserva
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const tableToOccupy = tables.find(t => t.number === reservation.table);
                        if (tableToOccupy) {
                          updateTableStatus(tableToOccupy.id, "OCCUPIED", reservation.guests);
                          setReservations(prev => prev.filter(res => res.id !== reservation.id));
                        } else {
                          toast({ title: "Erro", description: "Mesa não encontrada para acomodar.", variant: "destructive" });
                        }
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Acomodar Clientes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (activeSection === "daily-sales") { /* ... */ }
    if (activeSection === "commissions") { /* ... */ }
    if (activeSection === "settings") { /* ... */ }

    // Default fallback
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {sidebarItems
            .flatMap((cat: { items: Array<{ key: string; label: string }> }) => cat.items)
            .find((item: { key: string; label: string }) => item.key === activeSection)?.label || "Seção"}
        </h2>
        <p className="text-gray-600">Conteúdo em desenvolvimento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TableMaster</h1>
              <p className="text-sm text-gray-500">Garçom</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {sidebarItems.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{category.category}</h3>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleSidebarClick(item.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      activeSection === item.key || (item.key === "dashboard" && !activeSection)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">{item.count}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard do Garçom</h1>
              <p className="text-sm text-gray-500">Gerencie pedidos, mesas e atendimento</p>
            </div>
            <div className="flex items-center gap-4">
              {stats.readyOrders > 0 && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats.readyOrders} prontos
                </Badge>
              )}
              {stats.accountRequests > 0 && (
                <Badge className="bg-blue-500 text-white animate-pulse">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {stats.accountRequests} contas
                </Badge>
              )}
              <Button variant="ghost" onClick={onLogout} className="text-gray-600 hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">{renderMainContent()}</div>
      </div>
    </div>
  )
}