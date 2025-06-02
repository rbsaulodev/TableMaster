// src/app/components/waiter-dashboard.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
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
  ListOrdered,
  ChefHat,
} from "lucide-react"

import { AuthResponseData } from "@/app/types/auth"

const BASE_URL = "http://localhost:8080/api"

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
  userCpf: string;
  userName: string;
  items: OrderItemDTO[];
  createdAt: string;
  status: "OPEN" | "UNPAID" | "PAID";
  totalValue: number;
  paymentMethod?: "CASH" | "CARD" | "PIX";
  closedAt?: string;
  reservedTime?: string;
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
  preparationTime?: number;
  difficulty?: "easy" | "medium" | "difficult";
  available?: boolean;
  ingredients?: string[];
  allergens?: { name: string; severity: "low" | "medium" | "high" }[];
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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSection, setActiveSection] = useState("dashboard")

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('')
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderDTO | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [newOrderTableId, setNewOrderTableId] = useState<number | null>(null)
  const [newOrderItems, setNewOrderItems] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([])
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("")

  const [tables, setTables] = useState<RestaurantTableDTO[]>([])
  const [activeOrders, setActiveOrders] = useState<OrderDTO[]>([])
  const [pendingItems, setPendingItems] = useState<OrderItemDTO[]>([])
  const [preparingItems, setPreparingItems] = useState<OrderItemDTO[]>([])
  const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([])

  const [deliveredOrders, setDeliveredOrders] = useState<OrderDTO[]>([])
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

  const formatSafeDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'N/A'
    }
  }

  const getElapsedTime = (createdAt: string | undefined) => {
    if (!createdAt) return 0;
    try {
      const itemDate = new Date(createdAt)
      if (isNaN(itemDate.getTime())) return 0
      const elapsed = Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60))
      return elapsed
    } catch {
      return 0
    }
  }

  // --- FUNÇÕES DE FETCH (Reordenadas para definir antes de fetchInitialData) ---
  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/tables`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar mesas (raw response):", errorText);
        throw new Error("Failed to fetch tables.");
      }
      const data: RestaurantTableDTO[] = await response.json()
      setTables(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }, [authToken, toast])

  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/orders/active`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar pedidos ativos (raw response):", errorText);
        throw new Error("Failed to fetch active orders.");
      }
      const data: OrderDTO[] = await response.json()
      setActiveOrders(data)
      const totalSales = data.filter(o => o.status === "PAID").reduce((sum, order) => sum + order.totalValue, 0)
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
  }, [authToken, toast])

  const fetchPendingItems = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/pending`, { // Kitchen endpoint
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar itens pendentes (raw response):", errorText);
        throw new Error("Failed to fetch pending items.");
      }
      const data: OrderItemDTO[] = await response.json()
      setPendingItems(data)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }, [authToken, toast])

  const fetchPreparingItems = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/preparing`, { // Kitchen endpoint
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (!errorText) {
          throw new Error("O servidor retornou uma resposta vazia para itens em preparo");
        }
        console.error("Erro ao carregar itens em preparo (raw response):", errorText);
        throw new Error("Failed to fetch preparing items.");
      }
      
      const data: OrderItemDTO[] = await response.json();
      if (Array.isArray(data)) {
        setPreparingItems(data);
      } else {
        console.warn("Dados inválidos recebidos para itens em preparo:", data);
        setPreparingItems([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar itens em preparo:", error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao carregar itens em preparo",
        variant: "destructive" 
      });
      setPreparingItems([]);
    }
  }, [authToken, toast]);

  const fetchReadyItemsAPI = useCallback(async () => { // Kitchen endpoint (ready for delivery)
    try {
      const response = await fetch(`${BASE_URL}/kitchen/ready`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (!errorText) {
          throw new Error("O servidor retornou uma resposta vazia para itens prontos");
        }
        console.error("Erro ao carregar itens prontos (raw response):", errorText);
        throw new Error("Failed to fetch ready items.");
      }
      
      const data: OrderItemDTO[] = await response.json();
      if (Array.isArray(data)) {
        setReadyItems(data);
      } else {
        console.warn("Dados inválidos recebidos para itens prontos:", data);
        setReadyItems([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar itens prontos:", error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao carregar itens prontos",
        variant: "destructive" 
      });
      setReadyItems([]);
    }
  }, [authToken, toast]);

  const fetchMenuItems = useCallback(async () => { // MOVIDO PARA CIMA
    try {
      const response = await fetch(`${BASE_URL}/menu`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar cardápio (raw response):", errorText);
        throw new Error("Failed to fetch menu items.");
      }
      const data: MenuItemDTO[] = await response.json()
      setMenuItems(data.map(item => ({ ...item, available: true })));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }, [authToken, toast])

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/waiter/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar notificações (raw response):", errorText);
        throw new Error("Failed to fetch notifications.");
      }
      const data = await response.json()
      setAccountRequests(
        data.map((notif: any) => ({
          id: notif.id,
          tableId: notif.tableId,
          table: notif.tableNumber,
          customerName: `Mesa ${notif.tableNumber}`,
          requestTime: new Date(notif.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          status: "pending",
        })),
      )
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }, [authToken, toast])

  // --- FIM DAS FUNÇÕES DE FETCH ---

  const fetchInitialData = useCallback(async () => {
    if (!authToken) {
        console.warn("No authentication token found. Cannot fetch initial data.");
        toast({
            title: "Erro de autenticação",
            description: "Você não está logado. Por favor, faça login novamente.",
            variant: "destructive"
        });
        return;
    }

    try {
      await Promise.all([
        fetchTables().catch(e => console.error("Erro ao buscar mesas:", e)),
        fetchActiveOrders().catch(e => console.error("Erro ao buscar pedidos ativos:", e)),
        fetchPendingItems().catch(e => console.error("Erro ao buscar itens pendentes:", e)),
        fetchPreparingItems().catch(e => console.error("Erro ao buscar itens em preparo:", e)),
        fetchReadyItemsAPI().catch(e => console.error("Erro ao buscar itens prontos:", e)),
        fetchMenuItems().catch(e => console.error("Erro ao buscar itens do menu:", e)),
        fetchNotifications().catch(e => console.error("Erro ao buscar notificações:", e))
      ]);
    } catch (error) {
      console.error("Erro geral ao buscar dados iniciais:", error);
      toast({
        title: "Erro de conexão",
        description: "Ocorreu um problema ao carregar os dados. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    }
  }, [authToken, fetchTables, fetchActiveOrders, fetchPendingItems, fetchPreparingItems, fetchReadyItemsAPI, fetchMenuItems, fetchNotifications, toast]);

  useEffect(() => {
    fetchInitialData()
    const interval = setInterval(fetchInitialData, 10000)
    return () => clearInterval(interval)
  }, [fetchInitialData])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter((t) => t.status === "OCCUPIED").length,
    availableTables: tables.filter((t) => t.status === "AVAILABLE").length,
    reservedTables: tables.filter((t) => t.status === "RESERVED").length,
    totalComandas: activeOrders.length,
    newOrders: activeOrders.filter((o) => o.status === "OPEN").length,
    preparingOrders: activeOrders.filter((o) => o.items.some(item => item.status === "PREPARING")).length,
    readyOrders: activeOrders.filter((o) => o.items.some(item => item.status === "READY")).length,
    deliveredToday: deliveredOrders.length,
    totalRevenue: activeOrders.filter(o => o.status === "PAID").reduce((sum, order) => sum + order.totalValue, 0),
    avgServiceTime: 0,
    occupancyRate: tables.length > 0 ? Math.round((tables.filter((t) => t.status === "OCCUPIED" || t.status === "RESERVED").length / tables.length) * 100) : 0,
    revenueGrowth: 0,
    serviceTimeChange: 0,
    ordersGrowth: 0,
    accountRequests: accountRequests.length,
  }

  const handleStatusChange = async (itemId: number, currentStatus: OrderItemDTO["status"], targetStatus: "PREPARING" | "READY") => {
    let endpoint = "";
    if (targetStatus === "PREPARING") {
      endpoint = `/kitchen/item/${itemId}/start-preparing`; 
    } else if (targetStatus === "READY") {
      endpoint = `/kitchen/item/${itemId}/mark-ready`; 
    } else {
      toast({ title: "Erro de Status", description: "Status de destino inválido.", variant: "destructive" });
      return;
    }

    console.log(`Attempting to send PATCH to: ${BASE_URL}${endpoint}`);
    console.log(`Auth Token: ${authToken ? 'Present' : 'Missing'}`); // Debugging token presence

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", // Adicionado, pode ser necessário para PATCH
          "Authorization": `Bearer ${authToken}`
        },
      })
      if (!response.ok) {
        const errorText = await response.text(); // Capture raw text for more info
        let errorMessage = `Failed to update item status to ${targetStatus}.`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            // If response is not JSON, use raw text
            console.error("Failed to parse error response as JSON:", errorText);
            errorMessage = errorText || errorMessage;
        }
        console.error(`Error response for ${endpoint}:`, response.status, errorText);
        throw new Error(errorMessage);
      }
      toast({ title: "Status Atualizado", description: `Item ${itemId} agora está ${getOrderItemStatusText(targetStatus as OrderItemDTO["status"])}. ✅` });
      fetchInitialData();
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Status", description: error.message || "Ocorreu um erro desconhecido.", variant: "destructive" });
      console.error("Full error object:", error);
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
      const payResponse = await fetch(`${BASE_URL}/waiter/order/${order.id}/pay?paymentMethod=${selectedPaymentMethod}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!payResponse.ok) {
        const errorData = await payResponse.json()
        throw new Error(errorData.message || "Erro ao processar pagamento do pedido.")
      }

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

      const deliveredOrderUpdated = {
        ...order,
        closedAt: new Date().toISOString(),
        paymentMethod: selectedPaymentMethod,
        status: "PAID" as "PAID"
      }
      setDeliveredOrders((prev) => [deliveredOrderUpdated, ...prev])

      setSelectedPaymentMethod("")
      setSelectedOrderForPayment(null)

      toast({
        title: "Pedido entregue e pago! ✅",
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
      let endpoint = '';
      let body: any = {};

      endpoint = `${BASE_URL}/table/${tableId}`;
      body = {
        id: tableId,
        number: tables.find(t => t.id === tableId)?.number,
        status: newStatus,
        capacity: tables.find(t => t.id === tableId)?.capacity,
      };

      response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
      });


      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update table status to ${getTableStatusText(newStatus)}.`)
      }

      toast({
        title: "Status atualizado ✅",
        description: `Mesa ${tables.find((t) => t.id === tableId)?.number} agora está ${getTableStatusText(newStatus).toLowerCase()}.`,
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
      await updateTableStatus(reservation.tableId, "RESERVED");
      setReservations((prev) => prev.filter((res) => res.id !== reservation.id));
      toast({
        title: "Reserva confirmada! ✅",
        description: `Reserva para Mesa ${reservation.table} foi confirmada.`,
      });
      fetchInitialData();
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
    toast({ title: "Item adicionado!", description: `${menuItem.name} adicionado ao novo pedido.` });
  }

  const removeItemFromOrder = (itemId: number) => {
    setNewOrderItems((prev) => prev.filter((item) => item.id !== itemId))
    toast({ title: "Item removido", description: "Item removido do novo pedido." });
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
      const createOrderResponse = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tableId: newOrderTableId,
          userCpf: currentUserData.cpf,
          userName: currentUserData.fullName,
        } as Partial<OrderDTO>),
      })

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json()
        throw new Error(errorData.message || "Erro ao criar o pedido principal.")
      }
      const newOrder: OrderDTO = await createOrderResponse.json()

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

  const handleAccountRequestDelivery = async (notificationId: number, tableId: number) => {
    setAccountRequests((prev) => prev.filter((req) => req.id !== notificationId))
    toast({
      title: "Conta entregue! 💳",
      description: `Notificação de conta da mesa ${tables.find(t => t.id === tableId)?.number} foi processada.`,
    })
    fetchNotifications();
  }

  const filteredOrders = activeOrders.filter((order) => {
    const matchesSearch =
      searchTerm && (
        order.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) => item.menuItemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return (searchTerm ? matchesSearch : true) && matchesStatus;
  });

  const getOrderItemStatusColor = (status: OrderItemDTO["status"]) => {
    switch (status) {
      case "PENDING": return "bg-blue-500";
      case "PREPARING": return "bg-amber-500";
      case "READY": return "bg-green-500";
      case "DELIVERED": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  const getOrderItemStatusText = (status: OrderItemDTO["status"]) => {
    switch (status) {
      case "PENDING": return "Novo";
      case "PREPARING": return "Em Preparo";
      case "READY": return "Pronto";
      case "DELIVERED": return "Entregue";
      default: return String(status);
    }
  };

  const getTableStatusColor = (status: RestaurantTableDTO["status"]) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-800 border-green-200";
      case "OCCUPIED": return "bg-red-100 text-red-800 border-red-200";
      case "RESERVED": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTableStatusText = (status: RestaurantTableDTO["status"]) => {
    switch (status) {
      case "AVAILABLE": return "Disponível";
      case "OCCUPIED": return "Ocupada";
      case "RESERVED": return "Reservada";
      default: return String(status);
    }
  };

  const getOrderPaymentMethodText = (method: PaymentMethod | undefined) => {
    switch (method) {
      case "CASH": return "Dinheiro";
      case "CARD": return "Cartão";
      case "PIX": return "PIX";
      default: return "N/A";
    }
  };

  const OrderItemCard = ({ item, showActions = true }: { item: OrderItemDTO; showActions?: boolean }) => {
    const relatedOrder = activeOrders.find(order => order.id === item.orderId);
    const orderTableNumber = relatedOrder?.tableName || 'N/A';
    const orderWaiter = relatedOrder?.userName || 'N/A';

    return (
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-gray-900">Mesa {orderTableNumber}</CardTitle>
              <Badge className={`${getOrderItemStatusColor(item.status)} text-white`}>
                {getOrderItemStatusText(item.status)}
              </Badge>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Item: {item.menuItemName} (x{item.quantity})</div>
              <div>Iniciado: {formatSafeDate(item.createdAt)}</div>
              <div className="flex items-center gap-1 justify-end">
                <Timer className="w-3 h-3" />
                {getElapsedTime(item.createdAt)} min
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Detalhes do Item:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>{item.menuItemDescription}</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Garçom/Cliente: {orderWaiter}</span>
            </div>

            {showActions && (
              <div className="flex gap-2 pt-2">
                {item.status === "PENDING" && (
                  <Button
                    onClick={() => handleStatusChange(item.id, item.status, "PREPARING")}
                    className="bg-amber-500 hover:bg-amber-600 w-full"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Iniciar Preparo
                  </Button>
                )}
                {item.status === "PREPARING" && (
                  <Button
                    onClick={() => handleStatusChange(item.id, item.status, "READY")}
                    className="bg-green-500 hover:bg-green-600 w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Pronto
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
        { key: "dashboard", label: "Dashboard", count: null, icon: ListOrdered },
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

  const renderMainContent = useCallback(() => {
    if (activeSection === "dashboard") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Mesas</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalTables}</p>
                  </div>
                  <Utensils className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Mesas Ocupadas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.occupiedTables}</p>
                  </div>
                  <Users className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Mesas Livres</p>
                    <p className="text-2xl font-bold text-green-600">{stats.availableTables}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Comandas Ativas</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalComandas}</p>
                  </div>
                  <ListOrdered className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pedidos Novos</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.newOrders}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prontos Cozinha</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.readyOrders}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Contas Solicitadas</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.accountRequests}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Receita Total (Dia)</p>
                    <p className="text-2xl font-bold text-amber-600">R$ {stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    else if (["new-orders", "preparing", "ready", "delivered"].includes(activeSection)) {
      let itemsToDisplay: OrderItemDTO[] = [];
      let title = "";

      if (activeSection === "new-orders") {
        title = "Novos Pedidos (Aguardando Cozinha)";
        itemsToDisplay = activeOrders.flatMap(order => order.items.filter(item => item.status === "PENDING"));
      } else if (activeSection === "preparing") {
        title = "Pedidos em Preparo (Cozinha)";
        itemsToDisplay = activeOrders.flatMap(order => order.items.filter(item => item.status === "PREPARING"));
      } else if (activeSection === "ready") {
        title = "Pedidos Prontos (Para Entrega)";
        itemsToDisplay = activeOrders.flatMap(order => order.items.filter(item => item.status === "READY"));
      } else if (activeSection === "delivered") {
        title = "Pedidos Entregues (Hoje)";
        itemsToDisplay = deliveredOrders.flatMap(order => order.items.filter(item => item.status === "DELIVERED"));
      }

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsToDisplay.length === 0 ? (
              <Card className="lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum pedido nesta categoria.</p>
                </CardContent>
              </Card>
            ) : (
              itemsToDisplay.map((item) => (
                <OrderItemCard key={item.id} item={item} showActions={activeSection !== "delivered"} />
              ))
            )}
          </div>
        </div>
      );
    }

    else if (activeSection === "account-requests") {
      const ordersWithAccountRequests = activeOrders.filter(order =>
        order.status === "UNPAID" || (order.status === "OPEN" && accountRequests.some(req => req.tableId === order.tableId))
      );

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Contas Solicitadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordersWithAccountRequests.length === 0 ? (
              <Card className="lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma conta solicitada no momento.</p>
                </CardContent>
              </Card>
            ) : (
              ordersWithAccountRequests.map((order) => (
                <Card key={order.id} className="border-0 shadow-sm bg-white border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-gray-900">Mesa {order.tableName}</CardTitle>
                      <Badge className="bg-blue-500 text-white animate-pulse">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Conta Solicitada
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">Total da Conta</p>
                      <p className="text-2xl font-bold text-blue-800">R$ {order.totalValue.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Solicitado às:</span>
                        <span className="font-medium">{formatSafeDate(order.createdAt)}</span>
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
                      onClick={() => markOrderAsDelivered(order)}
                      disabled={!selectedPaymentMethod}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Finalizar e Pagar
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      );
    }

    else if (activeSection === "occupied-tables") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Mesas Ocupadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.filter((table) => table.status === "OCCUPIED").length === 0 ? (
              <Card className="lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma mesa ocupada no momento.</p>
                </CardContent>
              </Card>
            ) : (
              tables
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
                            <p className="font-medium">{currentOrder?.userName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total do Pedido:</span>
                            <p className="font-medium text-orange-600">R$ {currentOrder?.totalValue.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Último pedido:</span>
                            <p className="font-medium">{formatSafeDate(currentOrder?.createdAt)}</p>
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
                })
            )}
          </div>
        </div>
      );
    }

    else if (activeSection === "available-tables") {
      const availableTables = tables.filter((table) => table.status === "AVAILABLE");
      
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Mesas Livres</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableTables.length === 0 ? (
              <Card className="lg:col-span-4">
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma mesa disponível no momento.</p>
                </CardContent>
              </Card>
            ) : (
              availableTables.map((table) => (
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
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => setNewOrderTableId(table.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Ocupar Mesa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Novo Pedido para Mesa {table.number}</DialogTitle>
                          <DialogDescription>
                            Adicione os itens e o número de clientes para esta mesa.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="menuItemSelect">Adicionar Item</Label>
                            <Select
                              value={selectedMenuItemId}
                              onValueChange={setSelectedMenuItemId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um item do cardápio" />
                              </SelectTrigger>
                              <SelectContent>
                                {menuItems.map((menuItem) => (
                                  <SelectItem key={menuItem.id} value={menuItem.id.toString()}>
                                    {menuItem.name} - R$ {menuItem.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button onClick={addItemToOrder} className="mt-2 w-full">
                              Adicionar Item
                            </Button>
                          </div>

                          {newOrderItems.length > 0 && (
                            <div className="border p-3 rounded-lg space-y-2">
                              <h4 className="font-semibold text-gray-900">Itens do Novo Pedido:</h4>
                              {newOrderItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <span>{item.quantity}x {item.name}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeItemFromOrder(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                              <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total:</span>
                                <span>R$ {newOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={createNewOrder} 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            disabled={newOrderItems.length === 0}
                          >
                            Criar Pedido e Ocupar Mesa
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      );
    }

    else if (activeSection === "reservations") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Reservas do Dia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.length === 0 ? (
              <Card className="lg:col-span-2">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma reserva para hoje.</p>
                </CardContent>
              </Card>
            ) : (
              reservations.map((reservation) => (
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
              ))
            )}
          </div>
        </div>
      );
    }

    else if (activeSection === "daily-sales") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Vendas do Dia</h2>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Conteúdo de vendas diárias em desenvolvimento...</p>
              <p className="text-lg font-bold mt-2">Total hoje: R$ {stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    else if (activeSection === "commissions") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Comissões</h2>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Cálculo de comissões em desenvolvimento...</p>
              <p className="text-lg font-bold mt-2">Sua comissão: R$ {dailySales.myCommission.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    else if (activeSection === "settings") {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Configurações do sistema em desenvolvimento...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Selecione uma opção no menu lateral</p>
      </div>
    );
  }, [activeSection, tables, activeOrders, pendingItems, preparingItems, readyItems, deliveredOrders, accountRequests, reservations, menuItems, dailySales, formatSafeDate, getElapsedTime, getOrderItemStatusColor, getOrderItemStatusText, getTableStatusColor, getTableStatusText, getOrderPaymentMethodText, handleStatusChange, markOrderAsDelivered, updateTableStatus, confirmReservation, addItemToOrder, removeItemFromOrder, createNewOrder, selectedPaymentMethod, selectedMenuItemId, setNewOrderTableId, setSelectedMenuItemId, setSelectedOrderForPayment, toast, authToken, currentUserData]);

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
              <h1 className="text-xl font-semibold text-gray-900">Painel do Garçom</h1>
              <p className="text-sm text-gray-500">Gerencie pedidos, mesas e atendimento</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-mono">{currentTime.toLocaleTimeString()}</div>
                <div className="text-sm text-gray-600">{currentTime.toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">{renderMainContent()}</div>
      </div>
    </div>
  )
}