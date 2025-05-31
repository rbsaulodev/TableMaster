// app/components/client-dashboard.tsx
"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LogOut,
  MapPin,
  Menu,
  ShoppingCart,
  History,
  Plus,
  Minus,
  Trash2,
  Clock,
  CheckCircle,
  User,
  Utensils,
  Star,
  Search,
} from "lucide-react"

const BASE_URL = "http://localhost:8080/api"

interface RestaurantTableDTO {
  id: number;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  capacity: number;
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
  reservedTime?: string; // Incluir reservedTime no OrderDTO do frontend
}

interface OrderItemDTO {
  id?: number;
  orderId?: number;
  menuItemId: number;
  menuItemName?: string;
  menuItemDescription?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: "PENDING" | "PREPARING" | "READY" | "DELIVERED";
}

interface AuthResponseData {
  token: string;
  username: string;
  fullName: string;
  role: string;
  message: string;
  cpf?: string;
}

interface ClientDashboardProps {
  cpf: string;
  fullName: string;
  authToken: string;
  onLogout: () => void;
}

const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case "APPETIZERS": return "Entradas";
    case "MAIN_COURSES": return "Pratos Principais";
    case "DESSERTS": return "Sobremesas";
    case "DRINKS": return "Bebidas";
    default: return category;
  }
};

function PageLayout({
  children,
  title,
  breadcrumbs,
  actions,
}: {
  children: React.ReactNode
  title: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  return (
    <SidebarInset>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-800 text-white px-4 py-2 rounded z-50"
      >
        Pular para conteúdo principal
      </a>

      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border mx-2" />

        {breadcrumbs && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href} className="hover:text-emerald-600">
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-emerald-800 font-medium">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </header>

      <main id="main-content" className="flex-1 overflow-auto p-4 bg-gradient-to-br from-emerald-50 to-amber-50">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-emerald-800">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </SidebarInset>
  )
}

function EnhancedCard({
  children,
  status,
  priority,
  className = "",
  ...props
}: {
  children: React.ReactNode
  status?: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "PENDING" | "PREPARING" | "READY"
  priority?: "low" | "normal" | "high" | "urgent"
  className?: string
} & React.ComponentProps<typeof Card>) {
  const getStatusStyles = () => {
    switch (status) {
      case "AVAILABLE":
        return "border-green-200 bg-green-50/50 hover:bg-green-50"
      case "OCCUPIED":
        return "border-red-200 bg-red-50/50 hover:bg-red-50"
      case "RESERVED":
        return "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
      case "PENDING":
        return "border-orange-200 bg-orange-50/50 hover:bg-orange-50"
      case "PREPARING":
        return "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
      case "READY":
        return "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
      default:
        return "border-gray-200 hover:bg-gray-50/50"
    }
  }

  const getPriorityIndicator = () => {
    if (!priority || priority === "normal") return null

    const colors = {
      low: "bg-gray-400",
      high: "bg-amber-400",
      urgent: "bg-red-500 animate-pulse",
    }

    return <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${colors[priority]}`} />
  }

  return (
    <Card
      className={`
        relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
        focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2
        ${getStatusStyles()} ${className}
      `}
      {...props}
    >
      {getPriorityIndicator()}
      {children}
    </Card>
  )
}

export default function ClientDashboard({ cpf, fullName, authToken, onLogout }: ClientDashboardProps) {
  const { toast } = useToast()
  const [selectedItems, setSelectedItems] = useState<OrderItemDTO[]>([])
  const [reservedTable, setReservedTable] = useState<number | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null)
  const [reservationTime, setReservationTime] = useState<string>("")
  const [comandaFinalized, setComandaFinalized] = useState(false)
  const [orderStatus, setOrderStatus] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeView, setActiveView] = useState("reservas")

  const [availableTables, setAvailableTables] = useState<RestaurantTableDTO[]>([])
  const [menuCategories, setMenuCategories] = useState<{ [key: string]: MenuItemDTO[] }>({})
  const [comandaHistory, setComandaHistory] = useState<OrderDTO[]>([])

  const fetchAvailableTables = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/client/tables/available`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar mesas (raw response):", errorText);
        let errorMessage = "Erro ao carregar mesas disponíveis.";
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
            // Se não for JSON, use a mensagem padrão ou log a resposta bruta
        }
        throw new Error(errorMessage);
      }
      const data: RestaurantTableDTO[] = await response.json();
      setAvailableTables(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mesas",
        description: error.message || "Não foi possível carregar as mesas disponíveis.",
        variant: "destructive",
      });
    }
  }, [authToken, toast]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/menu`, {
        headers: {
          // O endpoint /api/menu é publico. Não precisa de token.
          // Se for necessário, descomente a linha abaixo e garanta que o backend está configurado.
          // "Authorization": `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar cardápio (raw response):", errorText);
        let errorMessage = "Erro ao carregar itens do cardápio.";
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
            // Se não for JSON, use a mensagem padrão ou log a resposta bruta
        }
        throw new Error(errorMessage);
      }
      const data: MenuItemDTO[] = await response.json();
      const grouped: { [key: string]: MenuItemDTO[] } = {};
      data.forEach(item => {
        const categoryName = getCategoryDisplayName(item.category);
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(item);
      });
      setMenuCategories(grouped);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cardápio",
        description: error.message || "Não foi possível carregar os itens do cardápio.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchClientOrders = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/client/orders`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao carregar histórico (raw response):", errorText);
        let errorMessage = "Erro ao carregar histórico de pedidos.";
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
            // Se a resposta não for um JSON válido, usamos a mensagem padrão ou a raw response.
        }
        throw new Error(errorMessage);
      }
      const data: OrderDTO[] = await response.json();
      setComandaHistory(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: error.message || "Não foi possível carregar o histórico de pedidos.",
        variant: "destructive",
      });
    }
  }, [authToken, toast]);

  useEffect(() => {
    if (authToken) {
      fetchAvailableTables();
      fetchMenuItems();
      fetchClientOrders();
    }
  }, [authToken, fetchAvailableTables, fetchMenuItems, fetchClientOrders]);

  const formatCpfDisplay = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };


  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
  }

  const addToComanda = (item: MenuItemDTO) => {
    if (!reservedTable || currentOrderId === null) {
      toast({
        title: "Reserve uma mesa e inicie um pedido",
        description: "Você precisa reservar uma mesa e ter um pedido ativo antes de adicionar itens.",
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = selectedItems.findIndex((i) => i.menuItemId === item.id);

    if (existingItemIndex > -1) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      const newItem: OrderItemDTO = {
        orderId: currentOrderId,
        menuItemId: item.id,
        menuItemName: item.name,
        unitPrice: item.price,
        quantity: 1,
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    toast({
      title: "Item adicionado! 🍽️",
      description: `${item.name} foi adicionado à sua comanda.`,
    });
  };


  const updateQuantity = (menuItemId: number, change: number) => {
    setSelectedItems((items) =>
      items
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromComanda = (menuItemId: number) => {
    setSelectedItems((items) => items.filter((item) => item.menuItemId !== menuItemId));
    toast({
      title: "Item removido",
      description: "Item removido da comanda.",
    });
  };

  const reserveTable = async (tableId: number, tableNumber: number, time: string) => {
    if (!time) {
      toast({
        title: "Selecione um horário",
        description: "Por favor, selecione um horário para a reserva.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reserveResponse = await fetch(`${BASE_URL}/client/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tableId: tableId, reservedTime: time }),
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        throw new Error(errorData.message || "Erro ao reservar mesa.");
      }
      const reservedOrder: OrderDTO = await reserveResponse.json();
      setCurrentOrderId(reservedOrder.id);
      setReservedTable(tableNumber);
      setReservationTime(time);
      setActiveView("cardapio");
      toast({
        title: "Mesa Reservada! 🎉",
        description: `Mesa ${tableNumber} reservada para ${time}. Agora você pode fazer seus pedidos!`,
      });
      fetchAvailableTables();
    } catch (error: any) {
      toast({
        title: "Erro na Reserva",
        description: error.message || "Ocorreu um erro ao tentar reservar a mesa. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  const finalizeOrder = async () => {
    if (!currentOrderId || selectedItems.length === 0) {
      toast({
        title: "Nenhum item para enviar",
        description: "Adicione itens à comanda antes de finalizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemsPayload = selectedItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      const addItemsResponse = await fetch(`${BASE_URL}/client/order/${currentOrderId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(itemsPayload),
      });

      if (!addItemsResponse.ok) {
        const errorData = await addItemsResponse.json();
        throw new Error(errorData.message || "Erro ao adicionar itens ao pedido.");
      }

      setComandaFinalized(true);
      setOrderStatus("preparing");
      toast({
        title: "Pedido enviado! 🍽️",
        description: "Seu pedido foi enviado para a cozinha e está sendo preparado.",
        duration: 5000,
      });

      setSelectedItems([]);
      fetchClientOrders();
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message || "Ocorreu um erro ao tentar finalizar o pedido.",
        variant: "destructive",
      });
    }
  };

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 18; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const filteredMenuItems = () => {
    const allItems: (MenuItemDTO & { popular?: boolean; rating?: number })[] = Object.values(menuCategories).flat().map((item) => ({
      ...item,
      popular: Math.random() > 0.7,
      rating: parseFloat((Math.random() * 1 + 4).toFixed(1)),
    }));

    return allItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || getCategoryDisplayName(item.category) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const currentComandaTotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);

  const navigationItems = [
    {
      title: "Reservas",
      icon: MapPin,
      key: "reservas",
      description: "Reserve sua mesa",
      badge: !reservedTable ? "Necessário" : null,
    },
    {
      title: "Cardápio",
      icon: Menu,
      key: "cardapio",
      description: "Explore nossos pratos",
      badge: null,
    },
    {
      title: "Minha Comanda",
      icon: ShoppingCart,
      key: "comanda",
      description: "Seus pedidos atuais",
      badge: selectedItems.length > 0 ? selectedItems.reduce((sum, item) => sum + item.quantity, 0) : null,
    },
    {
      title: "Histórico",
      icon: History,
      key: "historico",
      description: "Pedidos anteriores",
      badge: null,
    },
  ];

  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: "TableMaster" }]

    switch (activeView) {
      case "reservas":
        breadcrumbs.push({ label: "Reservas" })
        break
      case "cardapio":
        breadcrumbs.push({ label: "Cardápio" })
        break
      case "comanda":
        breadcrumbs.push({ label: "Minha Comanda" })
        break
      case "historico":
        breadcrumbs.push({ label: "Histórico" })
        break
    }

    return breadcrumbs
  }

  const renderContent = () => {
    switch (activeView) {
      case "reservas":
        return (
          <div className="space-y-6">
            {reservedTable && currentOrderId ? (
              <EnhancedCard status="RESERVED" className="border-emerald-300">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-emerald-800 mb-2">
                    Mesa {reservedTable} reservada para {reservationTime}
                  </h3>
                  <p className="text-emerald-600 mb-4">Agora você pode fazer seus pedidos no cardápio!</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReservedTable(null)
                      setReservationTime("")
                      setCurrentOrderId(null);
                      fetchAvailableTables();
                      setSelectedItems([])
                      toast({
                        title: "Reserva cancelada",
                        description: "Mesa liberada com sucesso.",
                      })
                    }}
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-100"
                  >
                    Cancelar Reserva
                  </Button>
                </CardContent>
              </EnhancedCard>
            ) : (
              <div className="space-y-6">
                <EnhancedCard>
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Selecione o Horário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {generateTimeSlots().map((time) => (
                        <Button
                          key={time}
                          variant={reservationTime === time ? "default" : "outline"}
                          onClick={() => setReservationTime(time)}
                          className={
                            reservationTime === time
                              ? "bg-emerald-800 text-white"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </EnhancedCard>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTables
                    .filter((table) => table.status === "AVAILABLE")
                    .map((table) => (
                      <EnhancedCard key={table.id} status="AVAILABLE" className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-emerald-800">Mesa {table.number}</CardTitle>
                          <CardDescription>Capacidade: {table.capacity} pessoas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center mb-4">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              {table.capacity} lugares
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                          </div>
                          <Button
                            onClick={() => reserveTable(table.id, table.number, reservationTime)}
                            className="w-full bg-emerald-800 hover:bg-emerald-700"
                            disabled={!reservationTime}
                          >
                            Reservar Mesa
                          </Button>
                        </CardContent>
                      </EnhancedCard>
                    ))}
                </div>
              </div>
            )}
          </div>
        )

      case "cardapio":
        return (
          <div className="space-y-6">
            {/* Filtros e Busca */}
            <EnhancedCard>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar pratos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      onClick={() => setSelectedCategory("all")}
                      size="sm"
                    >
                      Todos
                    </Button>
                    {Object.keys(menuCategories).map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        size="sm"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </EnhancedCard>

            {/* Itens do Cardápio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems().map((item) => {
                const itemInComanda = selectedItems.find((i) => i.menuItemId === item.id)

                return (
                  <EnhancedCard
                    key={item.id}
                    className="hover:shadow-lg transition-all duration-200"
                    priority={item.popular ? "high" : "normal"}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-emerald-800 flex items-center gap-2">
                          {item.name}
                          {item.popular && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Star className="h-4 w-4 text-amber-500 fill-current" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Prato popular!</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {getCategoryDisplayName(item.category)}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-amber-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{item.rating || 'N/A'}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-amber-600">R$ {item.price.toFixed(2)}</span>
                        {itemInComanda && (
                          <Badge className="bg-emerald-100 text-emerald-800">{itemInComanda.quantity} na comanda</Badge>
                        )}
                      </div>

                      {itemInComanda ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 p-0"
                            disabled={comandaFinalized}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{itemInComanda.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 p-0"
                            disabled={comandaFinalized}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromComanda(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 ml-2"
                            disabled={comandaFinalized}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToComanda(item)}
                          className="w-full bg-emerald-800 hover:bg-emerald-700"
                          disabled={!reservedTable || currentOrderId === null}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      )}
                    </CardContent>
                  </EnhancedCard>
                )
              })}
            </div>
          </div>
        )

      case "comanda":
        return (
          <div className="space-y-6">
            <EnhancedCard status={comandaFinalized ? "PREPARING" : "PENDING"}>
              <CardHeader>
                <CardTitle className="text-emerald-800">
                  Comanda #{currentOrderId?.toString().slice(-4) || "N/A"}
                  {reservedTable && ` - Mesa ${reservedTable}`}
                  {reservationTime && ` - ${reservationTime}`}
                </CardTitle>
                {orderStatus && (
                  <div className="flex items-center gap-2">
                    {orderStatus === "preparing" ? (
                      <Badge className="bg-amber-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Sendo Preparado
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pronto para Entrega
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum item adicionado ainda</p>
                    <p className="text-sm text-emerald-600">
                      {!reservedTable
                        ? "Reserve uma mesa primeiro para fazer pedidos"
                        : "Vá ao cardápio para adicionar itens"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItems.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-emerald-800">{item.menuItemName}</h4>
                          <p className="text-sm text-emerald-600">R$ {(item.unitPrice || 0).toFixed(2)} cada</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItemId, -1)}
                              className="h-8 w-8 p-0"
                              disabled={comandaFinalized}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItemId, 1)}
                              className="h-8 w-8 p-0"
                              disabled={comandaFinalized}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <span className="font-bold text-amber-600">
                              R$ {((item.unitPrice || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromComanda(item.menuItemId)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            disabled={comandaFinalized}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span className="text-emerald-800">Total:</span>
                        <span className="text-amber-600">R$ {currentComandaTotal.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={finalizeOrder}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={comandaFinalized || !reservedTable || selectedItems.length === 0}
                      >
                        {comandaFinalized ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Pedido Enviado
                          </>
                        ) : (
                          <>
                            <Utensils className="h-4 w-4 mr-2" />
                            Finalizar Pedido
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </EnhancedCard>
          </div>
        )

      case "historico":
        return (
          <div className="space-y-4">
            {comandaHistory.length === 0 ? (
                <div className="text-center py-8">
                    <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum pedido no histórico</p>
                </div>
            ) : (
                comandaHistory.map((comanda) => (
                <EnhancedCard key={comanda.id}>
                    <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-emerald-800">Pedido #{comanda.id.toString().slice(-4)}</CardTitle>
                        <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800">Mesa {comanda.tableName}</Badge>
                        <span className="text-sm text-emerald-600">
                            {new Date(comanda.createdAt).toLocaleDateString()} - {new Date(comanda.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-2">
                        {comanda.items.map((item: OrderItemDTO, index: number) => (
                        <div key={item.id || item.menuItemId || index} className="flex justify-between text-sm">
                            <span className="text-emerald-700">
                            {item.quantity}x {item.menuItemName}
                            </span>
                            <span className="text-amber-600">R$ {((item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-bold">
                        <span className="text-emerald-800">Total:</span>
                        <span className="text-amber-600">R$ {comanda.totalValue.toFixed(2)}</span>
                        </div>
                        {comanda.paymentMethod && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Método de Pagamento:</span>
                                <span className="font-medium">{comanda.paymentMethod}</span>
                            </div>
                        )}
                        <Badge className={comanda.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {comanda.status === "PAID" ? "Pago" : "Não Pago"}
                        </Badge>
                    </div>
                    </CardContent>
                </EnhancedCard>
                ))
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-50 to-amber-50">
          <Sidebar className="border-r border-emerald-200">
            <SidebarHeader className="border-b border-emerald-200 bg-emerald-800 text-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="p-2 bg-amber-400 rounded-lg">
                  <Utensils className="h-6 w-6 text-emerald-800" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">TableMaster</h2>
                  <p className="text-emerald-100 text-sm">Cliente</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="bg-white">
              <SidebarGroup>
                <SidebarGroupLabel className="text-emerald-800">Perfil</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2 bg-emerald-50 rounded-lg mx-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-200 rounded-full">
                        <User className="h-4 w-4 text-emerald-800" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">Olá, {fullName}</p>
                        <p className="text-sm text-emerald-600">{formatCpfDisplay(cpf)}</p>
                        {reservedTable && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-amber-400 text-emerald-900 text-xs">Mesa {reservedTable}</Badge>
                            <span className="text-xs text-emerald-600">{reservationTime}</span>
                          </div>
                        )}
                        {orderStatus && (
                          <Badge
                            className={
                              orderStatus === "preparing" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                            }
                          >
                            {orderStatus === "preparing" ? "Preparando" : "Pronto"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-emerald-800">Navegação</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              onClick={() => setActiveView(item.key)}
                              isActive={activeView === item.key}
                              className="w-full justify-start"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge className="ml-auto bg-amber-400 text-emerald-900">{item.badge}</Badge>
                              )}
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {selectedItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-emerald-800">Resumo da Comanda</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <div className="px-3 py-2 bg-amber-50 rounded-lg mx-2">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Itens:</span>
                          <span className="font-medium">
                            {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Total:</span>
                          <span className="font-bold text-amber-600">R$ {currentComandaTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="border-t border-emerald-200 bg-white">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onLogout}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <PageLayout
            title={navigationItems.find((item) => item.key === activeView)?.title || "TableMaster"}
            breadcrumbs={getBreadcrumbs()}
            actions={
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} itens
                  </Badge>
                )}
                {reservedTable && <Badge className="bg-amber-100 text-amber-800">Mesa {reservedTable}</Badge>}
              </div>
            }
          >
            {renderContent()}
          </PageLayout>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}