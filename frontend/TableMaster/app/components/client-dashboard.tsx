"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast"; 
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
} from "@/components/ui/sidebar"; 
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import {
    LogOut,
    MapPin,
    Menu as MenuIcon, 
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
    Truck,
    Send,
    CreditCard,
    Receipt,
    Timer, 
} from "lucide-react";

import { AuthResponseData } from "@/app/types/auth"; 
import { Client as StompClient, IMessage, IStompSocket } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ScrollArea } from "@/components/ui/scroll-area";


const BASE_URL = "http://localhost:8080/api";
const BASE_URL_WS = "ws://localhost:8080/ws"; 
const BASE_URL_SOCKJS_HTTP = "http://localhost:8080/ws"; 

// --- Interfaces ---
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
    createdAt?: string; 
}

interface OrderDTO {
    id: number;
    tableId: number;
    tableName: string;
    userCpf: string;
    userName: string;
    items: OrderItemDTO[];
    createdAt: string;
    status: "INITIAL" | "OPEN" | "UNPAID" | "PAID"; 
    totalValue: number;
    paymentMethod?: PaymentMethod; 
    requestedPaymentMethod?: PaymentMethod; 
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
    available?: boolean;
}

type PaymentMethod = "CASH" | "CARD" | "PIX";

interface ClientDashboardProps {
    cpf: string;
    fullName: string;
    authToken: string;
    onLogout: () => void;
    currentUserData: AuthResponseData | null; 
}

// --- Funções Utilitárias ---
const getCategoryDisplayName = (category: string): string => {
    switch (category) {
        case "APPETIZERS": return "Entradas";
        case "MAIN_COURSES": return "Pratos Principais";
        case "DESSERTS": return "Sobremesas";
        case "DRINKS": return "Bebidas";
        default: return category;
    }
};

const formatCpfDisplay = (value: string | null | undefined): string => {
    if (!value) return "N/A";
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatSafeDate = (dateString?: string, includeTime: boolean = false): string => {
    if (!dateString) return "Data N/A";
    try {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    } catch (e) { return "Data Inválida"; }
};

const getOrderItemStatusText = (status?: OrderItemDTO["status"]): string => {
    if (!status) return "Pendente";
    switch (status) {
        case "PENDING": return "Pendente";
        case "PREPARING": return "Em Preparo";
        case "READY": return "Pronto";
        case "DELIVERED": return "Entregue";
        default: return status;
    }
};

// --- Componente PageLayout (Auxiliar) ---
function PageLayout({ children, title, breadcrumbs, actions }: { children: React.ReactNode; title: string; breadcrumbs?: { label: string; href?: string }[]; actions?: React.ReactNode; }) {
    return (
        <SidebarInset>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-800 text-white px-4 py-2 rounded z-50">Pular para conteúdo</a>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <SidebarTrigger className="-ml-1" /> <div className="h-4 w-px bg-border mx-2" />
                {breadcrumbs && (<Breadcrumb><BreadcrumbList>{breadcrumbs.map((c, i) => (<div key={i} className="flex items-center">{i > 0 && <BreadcrumbSeparator />}<BreadcrumbItem>{c.href ? <BreadcrumbLink href={c.href} className="hover:text-emerald-600">{c.label}</BreadcrumbLink> : <BreadcrumbPage className="text-emerald-800 font-medium">{c.label}</BreadcrumbPage>}</BreadcrumbItem></div>))}</BreadcrumbList></Breadcrumb>)}
                <div className="ml-auto flex items-center gap-2">{actions}</div>
            </header>
            <main id="main-content" className="flex-1 overflow-auto p-4 bg-gradient-to-br from-emerald-50 to-amber-50">
                <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl font-bold text-emerald-800">{title}</h1></div>{children}</div>
            </main>
        </SidebarInset>
    );
}

// --- Componente EnhancedCard (Auxiliar) ---
function EnhancedCard({ children, status, className = "", ...props }: { children: React.ReactNode; status?: OrderDTO["status"] | RestaurantTableDTO["status"] | OrderItemDTO["status"]; className?: string; } & React.ComponentProps<typeof Card>) {
    const getStatusStyles = () => {
        switch (status) {
            case "AVAILABLE": return "border-green-200 bg-green-50/50 hover:bg-green-50";
            case "OCCUPIED": return "border-red-200 bg-red-50/50 hover:bg-red-50";
            case "RESERVED": return "border-amber-200 bg-amber-50/50 hover:bg-amber-50";
            case "INITIAL": return "border-blue-200 bg-blue-50/50 hover:bg-blue-50";
            case "PENDING": return "border-orange-200 bg-orange-50/50 hover:bg-orange-50";
            case "PREPARING": return "border-purple-200 bg-purple-50/50 hover:bg-purple-50";
            case "READY": return "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50";
            case "DELIVERED": case "PAID": return "border-sky-200 bg-sky-50/50 hover:bg-sky-50";
            case "OPEN": return "border-amber-300 bg-amber-50/50 hover:bg-amber-50";
            case "UNPAID": return "border-red-300 bg-red-50/50 hover:bg-red-50";
            default: return "border-gray-200 hover:bg-gray-50/50";
        }
    };
    return ( <Card className={`relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 ${getStatusStyles()} ${className}`} {...props}>{children}</Card> );
}

// --- Componente Principal ClientDashboard ---
export default function ClientDashboard({ cpf, fullName, authToken, onLogout }: ClientDashboardProps) {
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeView, setActiveView] = useState("reservas");

    const [selectedItems, setSelectedItems] = useState<OrderItemDTO[]>([]);
    const [reservedTable, setReservedTable] = useState<RestaurantTableDTO | null>(null);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderDTO | null>(null); 
    const [reservationTime, setReservationTime] = useState<string>("");
    const [isOrderConfirmed, setIsOrderConfirmed] = useState(false); 
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const [availableTables, setAvailableTables] = useState<RestaurantTableDTO[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
    const [menuCategories, setMenuCategories] = useState<{ [key: string]: MenuItemDTO[] }>({});
    const [comandaHistory, setComandaHistory] = useState<OrderDTO[]>([]);

    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    const stompClient = useRef<StompClient | null>(null);
    const [isRequestAccountDialogOpen, setIsRequestAccountDialogOpen] = useState(false);
    const [paymentMethodForClosure, setPaymentMethodForClosure] = useState<PaymentMethod | "">("");

    const fetchAPIData = useCallback(async (endpoint: string, setter: Function, errorMessage: string, isArrayExpected: boolean = true) => {
        if (!authToken) { console.warn("Auth token ausente para fetchAPIData:", endpoint); return; }
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, { headers: { Authorization: `Bearer ${authToken}` } });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erro ao buscar ${endpoint}: Status ${response.status}, ${errorText}`);
                throw new Error(`${errorMessage} (Status: ${response.status})`);
            }
            const data = await response.json();
            setter(isArrayExpected ? (Array.isArray(data) ? data : []) : (data || null));
        } catch (e: any) {
            toast({ title: `Erro em ${endpoint.split('/').pop()?.split('?')[0]}`, description: e.message, variant: "destructive" });
            setter(isArrayExpected ? [] : null);
        }
    }, [authToken, toast]);

    const fetchAvailableTables = useCallback(() => fetchAPIData("/client/tables/available", setAvailableTables, "Falha ao buscar mesas."), [fetchAPIData]);
    const fetchFullMenuItems = useCallback(async () => {
        try {
            const response = await fetch(`${BASE_URL}/menu`, {}); 
            if (!response.ok) throw new Error("Erro ao carregar cardápio.");
            const data: MenuItemDTO[] = await response.json();
            setMenuItems(data); 
            const activeItems = data.filter(item => item.available !== false);
            const grouped: { [key: string]: MenuItemDTO[] } = {};
            activeItems.forEach(item => {
                const categoryName = getCategoryDisplayName(item.category);
                if (!grouped[categoryName]) grouped[categoryName] = [];
                grouped[categoryName].push(item);
            });
            setMenuCategories(grouped);
        } catch (e:any) { toast({ title: "Erro Cardápio", description: e.message, variant: "destructive" });}
    }, [toast]);
    const fetchClientOrders = useCallback(() => {
        if (!cpf || !authToken) { setComandaHistory([]); return; }
        fetchAPIData(`/client/orders`, setComandaHistory, "Falha ao buscar histórico.");
    }, [fetchAPIData, cpf, authToken]);
    
    const fetchInitialData = useCallback(async () => {
        if (!authToken || !cpf) { setDashboardLoading(false); setDashboardError("Autenticação ou CPF ausente."); return; }
        setDashboardLoading(true); setDashboardError(null);
        try {
            await Promise.all([fetchAvailableTables(), fetchFullMenuItems(), fetchClientOrders()]);
        } catch (error) { setDashboardError("Erro ao carregar dados. Tente recarregar."); } 
        finally { setDashboardLoading(false); }
    }, [authToken, cpf, fetchAvailableTables, fetchFullMenuItems, fetchClientOrders]);

    const getPaymentMethodText = useCallback((method?: PaymentMethod): string => {
        if (!method) return "N/A";
        const map: Record<PaymentMethod, string> = { CASH: "Dinheiro", CARD: "Cartão", PIX: "PIX" };
        return map[method] || "N/A";
    }, []);

    const connectWebSocket = useCallback(() => {
        if (!authToken || !cpf || stompClient.current?.connected) return () => {};
        const client = new StompClient({
            brokerURL: BASE_URL_WS, connectHeaders: { 'Authorization': `Bearer ${authToken}` },
            debug: (str) => console.log('STOMP (Cliente):', str), reconnectDelay: 5000,
            heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
            onConnect: () => {
                stompClient.current = client;
                console.log('Cliente conectado ao WebSocket!');
                
                client.subscribe('/topic/tables', (message: IMessage) => {
                    const updatedTable: RestaurantTableDTO = JSON.parse(message.body);
                    setAvailableTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t).filter(t => t.status === "AVAILABLE"));
                    if (reservedTable && updatedTable.id === reservedTable.id && updatedTable.status !== "RESERVED" && updatedTable.status !== "OCCUPIED") {
                        toast({ title: "Reserva de Mesa", description: `Status da mesa ${updatedTable.number} mudou para ${updatedTable.status}.`});
                         if(currentOrderId && currentOrder?.status !== "PAID" && currentOrder?.status !== "UNPAID") {
                            toast({title: "Atenção!", description: "Sua reserva foi liberada. Pedido atual pode ter sido afetado.", variant: "destructive", duration: 7000});
                        }
                        setCurrentOrderId(null); setSelectedItems([]); setReservedTable(null); 
                        setReservationTime(""); setIsOrderConfirmed(false); setCurrentOrder(null);
                    }
                });

                client.subscribe(`/user/${cpf}/queue/orders`, (message: IMessage) => {
                    const updatedOrder: OrderDTO = JSON.parse(message.body);
                    console.log(`[WS CLIENT] Pedido Recebido/Atualizado: ID ${updatedOrder.id}, Status ${updatedOrder.status}, Cliente CPF ${updatedOrder.userCpf}`);

                    setComandaHistory(prevHistory => {
                        const index = prevHistory.findIndex(o => o.id === updatedOrder.id);
                        const newHistory = index > -1 ? prevHistory.map((o, idx) => idx === index ? updatedOrder : o) : [...prevHistory, updatedOrder];
                        return newHistory.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    });

                    if (currentOrderId === updatedOrder.id) {
                        console.log(`[WS CLIENT] Atualização para o pedido ativo #${currentOrderId}. Novo status: ${updatedOrder.status}`);
                        setCurrentOrder(updatedOrder); 
                        setSelectedItems(updatedOrder.items || []);
                        setIsOrderConfirmed(updatedOrder.status === "OPEN" || updatedOrder.status === "UNPAID" || updatedOrder.status === "PAID");

                        if (updatedOrder.status === "PAID") {
                            toast({
                                title: "Pagamento Confirmado! ✅",
                                description: `Pedido #${updatedOrder.id} (Mesa ${updatedOrder.tableName}) pago com ${getPaymentMethodText(updatedOrder.paymentMethod)}. Obrigado!`,
                                duration: 8000,
                                className: "bg-green-100 border-green-300 text-green-800"
                            });
                            setCurrentOrderId(null);
                            setSelectedItems([]);
                            setReservedTable(null); 
                            setReservationTime("");
                            setIsOrderConfirmed(false);
                            setCurrentOrder(null); 
                            setActiveView("reservas"); 
                            fetchAvailableTables();
                        } else if (updatedOrder.status === "UNPAID") {
                            toast({ title: "Conta Solicitada 🧾", description: `Sua conta para o pedido #${updatedOrder.id} aguarda pagamento.` });
                            setIsRequestAccountDialogOpen(false);
                        }
                    } else if (updatedOrder.userCpf === cpf && updatedOrder.status === "PAID") {
                        console.log(`Pedido histórico ${updatedOrder.id} do cliente (CPF: ${cpf}) foi pago.`);
                    }
                });
            },
            onStompError: (frame) => { toast({title:"Erro WS", description:frame.headers['message'],variant:"destructive"})},
            onWebSocketError: () => { toast({title:"Erro Conexão WS",variant:"destructive"})},
            onDisconnect: () => { stompClient.current = null; console.log('Cliente desconectado.');}
        });
        client.webSocketFactory = () => new SockJS(BASE_URL_SOCKJS_HTTP) as IStompSocket;
        client.activate();
        return () => { if (stompClient.current?.deactivate) stompClient.current.deactivate(); };
    }, [authToken, cpf, toast, currentOrderId, reservedTable, getPaymentMethodText, fetchAvailableTables, currentOrder?.status]);

    useEffect(() => { if (authToken && cpf) { fetchInitialData(); const wsCleanup = connectWebSocket(); return () => { if (wsCleanup) wsCleanup(); }; } }, [authToken, cpf, fetchInitialData, connectWebSocket]);
    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
    useEffect(() => { /* ... cálculo dailySales ... */ }, [comandaHistory]);


    const handleCategorySelect = (category: string) => setSelectedCategory(category);

    const reserveTableAction = async (table: RestaurantTableDTO, time: string) => {
        if (!time) { toast({ title: "Selecione um horário", variant: "destructive" }); return; }
        try {
            const response = await fetch(`${BASE_URL}/client/reserve`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({ tableId: table.id, reservedTime: time }),
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao reservar mesa.");
            const reservedOrderData: OrderDTO = await response.json();
            
            setCurrentOrderId(reservedOrderData.id);
            setCurrentOrder(reservedOrderData);
            setReservedTable(table); 
            setReservationTime(time);
            setIsOrderConfirmed(false); 
            setSelectedItems(reservedOrderData.items || []); 
            setActiveView("cardapio");
            toast({ title: "Mesa Reservada! 🎉", description: `Mesa ${table.number} reservada para ${time}.` });
            fetchAvailableTables(); 
            fetchClientOrders();
        } catch (e:any) { toast({ title: "Erro Reserva", description: e.message, variant: "destructive" });}
    };
    
    const addToComanda = async (menuItem: MenuItemDTO) => {
        if (!cpf) { toast({ title: "Erro Perfil", variant: "destructive" }); return; }
        if (!currentOrderId) { 
            toast({ title: "Pedido não iniciado", description: "Finalize sua reserva para iniciar um pedido.", variant: "default" }); 
            return;
        }
        if (currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID") {
             toast({ title: "Comanda Fechada", description: "Não é possível adicionar itens.", variant: "default" }); return;
        }
        
        const existingItem = selectedItems.find(i => i.menuItemId === menuItem.id);
        const quantity = existingItem ? existingItem.quantity + 1 : 1;

        try {
            // Usando o endpoint do ClientController: POST /api/client/order/{orderId}/items
            // O backend espera uma lista de OrderItemDTO
            const itemsPayload: Partial<OrderItemDTO>[] = [{ menuItemId: menuItem.id, quantity }];

            const response = await fetch(`${BASE_URL}/client/order/${currentOrderId}/items`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify(itemsPayload),
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao adicionar item.");
            
            const updatedOrder: OrderDTO = await response.json();
            setSelectedItems(updatedOrder.items || []);
            setCurrentOrder(updatedOrder);
            toast({ title: "Item Adicionado! 😋", description: `${menuItem.name} (x${quantity}) na comanda.`});
        } catch (e:any) { toast({ title: "Erro Item", description: e.message, variant: "destructive" }); }
    };

    const updateQuantity = async (menuItemId: number, change: number) => {
        if (!currentOrderId || currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN" && change < 0 && selectedItems.find(i=>i.menuItemId === menuItemId)?.quantity ===1) ){
            if(isOrderConfirmed && currentOrder?.status === "OPEN") toast({title: "Pedido Enviado", description: "Não é possível alterar itens já enviados.", variant: "default"});
            return;
        }
        const itemToUpdate = selectedItems.find(item => item.menuItemId === menuItemId);
        if (!itemToUpdate) return;
        const newQuantity = itemToUpdate.quantity + change;
        if (newQuantity <= 0) { await removeFromComanda(menuItemId); return; }

        try {
            // Assume que o endpoint de adicionar/atualizar itens lida com isso
             const itemsPayload: Partial<OrderItemDTO>[] = [{ menuItemId: menuItemId, quantity: newQuantity }];
            const response = await fetch(`${BASE_URL}/client/order/${currentOrderId}/items`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify(itemsPayload),
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao atualizar quantidade.");
            const updatedOrder: OrderDTO = await response.json();
            setSelectedItems(updatedOrder.items || []);
            setCurrentOrder(updatedOrder);
        } catch (e:any) { toast({ title: "Erro Quantidade", description: e.message, variant: "destructive" });}
    };
    
    const removeFromComanda = async (menuItemId: number) => {
        if (!currentOrderId || currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")) {
             if(isOrderConfirmed && currentOrder?.status === "OPEN") toast({title: "Pedido Enviado", description: "Não é possível remover itens já enviados.", variant: "default"});
            return;
        }
        const updatedItemsListPayload = selectedItems
            .filter(item => item.menuItemId !== menuItemId)
            .map(item => ({menuItemId: item.menuItemId, quantity: item.quantity}));
        try {
             const response = await fetch(`${BASE_URL}/client/order/${currentOrderId}/items`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify(updatedItemsListPayload.length > 0 ? updatedItemsListPayload : []), // Envia lista vazia se for o último item
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao remover item.");
            const updatedOrder: OrderDTO = await response.json();
            setSelectedItems(updatedOrder.items || []);
            setCurrentOrder(updatedOrder);
            toast({ title: "Item Removido" });
        } catch (e:any) { toast({ title: "Erro Remover", description: e.message, variant: "destructive" });}
    };

    const finalizeOrderAndSendToKitchen = async () => {
        if (!currentOrderId || selectedItems.length === 0) { toast({ title: "Comanda Vazia", variant: "default" }); return; }
        if (isOrderConfirmed && currentOrder?.status === "OPEN") { toast({ title: "Pedido Já Enviado", variant: "default" }); return; }
        if (currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID") { toast({ title: "Ação não permitida", variant: "destructive"}); return; }

        try {
            // Certifique-se que este endpoint existe no ClientController
            const response = await fetch(`${BASE_URL}/client/order/${currentOrderId}/confirm`, { 
                method: "PATCH", headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao enviar pedido.");
            const confirmedOrderData: OrderDTO = await response.json();
            setIsOrderConfirmed(true);
            setCurrentOrder(confirmedOrderData); 
            setSelectedItems(confirmedOrderData.items);
            toast({ title: "Pedido Enviado! 🍽️", description: "Sua comanda foi enviada para a cozinha." });
        } catch (e:any) { toast({ title: "Erro ao Enviar", description: e.message, variant: "destructive" }); }
    };

    const handleRequestAccountClosure = async () => {
        if (!currentOrderId || !paymentMethodForClosure) {
            toast({ title: "Seleção Necessária", description: "Selecione uma forma de pagamento.", variant: "default" }); return;
        }
        if (currentOrder?.status !== "OPEN" || !isOrderConfirmed) {
            toast({ title: "Ação Inválida", description: "Envie seu pedido para a cozinha antes de solicitar a conta.", variant: "default" }); return;
        }
        try {
            const response = await fetch(`${BASE_URL}/client/order/${currentOrderId}/request-account?paymentMethod=${paymentMethodForClosure}`, {
                method: "POST", headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || "Erro ao solicitar conta.");
            const updatedOrderData: OrderDTO = await response.json();
            setCurrentOrder(updatedOrderData); 
            setSelectedItems(updatedOrderData.items || []);
            toast({ title: "Conta Solicitada! 🧾", description: `Aguarde o garçom para pagamento em ${getPaymentMethodText(paymentMethodForClosure)}.`, duration: 7000 });
            setIsRequestAccountDialogOpen(false);
            setPaymentMethodForClosure("");
            fetchClientOrders(); 
        } catch (e: any) { toast({ title: "Erro ao Fechar Conta", description: e.message, variant: "destructive" }); }
    };

    const generateTimeSlots = useCallback(() => {
        const slots = []; const now = new Date(); let h = now.getHours(); let m = Math.ceil(now.getMinutes() / 15) * 15;
        if (m >= 60) { h = (h + 1) % 24; m = 0; }
        const openH = 10, closeH = 23; if (h < openH) { h = openH; m = 0; }
        if (h >= closeH) return ["Restaurante fechado"];
        for (let count = 0; h < closeH && count < 16; h++) { for (let currentM = (h === now.getHours() ? m : 0); currentM < 60 && count < 16; currentM += 15) { slots.push(`${String(h).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`); count++; } }
        return slots.length > 0 ? slots : ["Nenhum horário disponível"];
    }, []);

    const filteredMenuItems = useCallback((): MenuItemDTO[] => {
        let itemsToFilter: MenuItemDTO[] = [];
        if (!menuCategories || Object.keys(menuCategories).length === 0) itemsToFilter = menuItems;
        else if (selectedCategory === "all") itemsToFilter = Object.values(menuCategories).flat();
        else if (menuCategories[selectedCategory]) itemsToFilter = menuCategories[selectedCategory];
        else itemsToFilter = menuItems;
        if (searchTerm) return itemsToFilter.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        return itemsToFilter;
    }, [menuItems, menuCategories, selectedCategory, searchTerm]);

    const currentComandaTotal = selectedItems.reduce((sum, item) => sum + (item.totalPrice || (menuItems.find(mi => mi.id === item.menuItemId)?.price || 0) * item.quantity), 0);

    const navigationItems = [
        { title: "Reservas", icon: MapPin, key: "reservas", description: "Reserve sua mesa", badge: (!reservedTable && !currentOrderId) ? "Inicie Aqui" : null },
        { title: "Cardápio", icon: MenuIcon, key: "cardapio", description: "Explore nossos pratos", badge: null },
        { title: "Minha Comanda", icon: ShoppingCart, key: "comanda", description: "Seus pedidos atuais", badge: selectedItems.reduce((s, i) => s + i.quantity, 0) || null },
        { title: "Histórico", icon: History, key: "historico", description: "Pedidos anteriores", badge: null },
    ];
    const getBreadcrumbs = () => [{ label: "TableMaster Cliente" }, { label: navigationItems.find(item => item.key === activeView)?.title || "" }];
    
    const renderContent = () => {
        if (dashboardLoading) return ( <div className="flex flex-col items-center justify-center h-full min-h-[500px]"><Clock className="h-24 w-24 text-emerald-300 animate-spin mb-6" /><h2 className="text-xl font-semibold text-emerald-700">Carregando dados...</h2></div> );
        if (dashboardError) return ( <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-red-500"><div className="p-4 bg-red-100 border border-red-400 rounded-lg text-center"><h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado:</h2><p>{dashboardError}</p><Button onClick={fetchInitialData} className="mt-4 bg-red-600 hover:bg-red-700 text-white">Tentar Recarregar</Button></div></div> );

        switch (activeView) {
            case "reservas":
                 return (
                    <div className="space-y-6">
                        {reservedTable && currentOrderId && currentOrder?.status !== "PAID" && currentOrder?.status !== "UNPAID" ? (
                            <EnhancedCard status="RESERVED" className="border-emerald-300">
                                <CardContent className="p-6 text-center">
                                    <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-emerald-800 mb-2"> Mesa {reservedTable.number} reservada para {reservationTime} </h3>
                                    <p className="text-emerald-600 mb-4">Sua comanda #{currentOrderId.toString().slice(-4)} está ativa. Vá ao cardápio para pedir!</p>
                                    <Button variant="outline" onClick={() => {
                                        setReservedTable(null); setReservationTime(""); setCurrentOrderId(null);
                                        setSelectedItems([]); setIsOrderConfirmed(false); setCurrentOrder(null);
                                        fetchAvailableTables();
                                        toast({title: "Reserva Cancelada (Localmente)", description:"A mesa foi liberada na sua visão."});
                                    }} className="border-red-600 text-red-700 hover:bg-red-100">
                                        Cancelar Reserva Atual
                                    </Button>
                                </CardContent>
                            </EnhancedCard>
                        ) : (
                            <div className="space-y-6">
                                <EnhancedCard>
                                    <CardHeader><CardTitle className="text-emerald-800 flex items-center gap-2"><Clock className="h-5 w-5" />Selecione o Horário para Reserva</CardTitle></CardHeader>
                                    <CardContent><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">{generateTimeSlots().map((time) => (<Button key={time} variant={reservationTime === time ? "default" : "outline"} onClick={() => setReservationTime(time)} className={reservationTime === time ? "bg-emerald-800 text-white" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"} disabled={time.includes("fechado") || time.includes("disponível")}>{time}</Button>))}</div></CardContent>
                                </EnhancedCard>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableTables.filter((table) => table.status?.toUpperCase() === "AVAILABLE").map((table) => (
                                        <EnhancedCard key={table.id} status="AVAILABLE" className="hover:shadow-lg transition-shadow">
                                            <CardHeader><CardTitle className="text-emerald-800">Mesa {table.number}</CardTitle><CardDescription>Capacidade: {table.capacity} pessoas</CardDescription></CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center mb-4"><Badge variant="secondary" className="bg-amber-100 text-amber-800">{table.capacity} lugares</Badge><Badge className="bg-green-100 text-green-800">Disponível</Badge></div>
                                                <Button onClick={() => reserveTableAction(table, reservationTime)} className="w-full bg-emerald-800 hover:bg-emerald-700" disabled={!reservationTime || reservationTime.includes("fechado") || reservationTime.includes("disponível")}>Reservar Mesa</Button>
                                            </CardContent>
                                        </EnhancedCard>
                                    ))}
                                    {availableTables.filter((table) => table.status?.toUpperCase() === "AVAILABLE").length === 0 && <p className="text-gray-500 md:col-span-2 lg:col-span-3 text-center py-8">Nenhuma mesa disponível no momento.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case "cardapio":
                return (
                    <div className="space-y-6">
                        <EnhancedCard>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /><Input placeholder="Buscar pratos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div></div>
                                    <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                                        <Button variant={selectedCategory === "all" ? "default" : "outline"} onClick={() => handleCategorySelect("all")} size="sm" className={selectedCategory === "all" ? "bg-emerald-700 text-white" : ""}>Todos</Button>
                                        {Object.keys(menuCategories).map((category) => (<Button key={category} variant={selectedCategory === category ? "default" : "outline"} onClick={() => handleCategorySelect(category)} size="sm" className={selectedCategory === category ? "bg-emerald-700 text-white" : ""}>{category}</Button>))}
                                    </div>
                                </div>
                            </CardContent>
                        </EnhancedCard>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredMenuItems().map((item) => {
                                const itemInComanda = selectedItems.find((i) => i.menuItemId === item.id);
                                return (
                                    <EnhancedCard key={item.id} className="hover:shadow-lg" status={item.available ? undefined : "PENDING"}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-emerald-800 flex items-center gap-2">{item.name} {(item as any).popular && <Star className="h-4 w-4 text-amber-500 fill-current" />}</CardTitle>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">{getCategoryDisplayName(item.category)}</Badge>
                                            </div>
                                            <CardDescription className="text-sm h-10 overflow-hidden text-ellipsis">{item.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-2xl font-bold text-amber-600">R$ {item.price.toFixed(2)}</span>
                                                {itemInComanda && (<Badge className="bg-emerald-100 text-emerald-800">{itemInComanda.quantity} na comanda</Badge>)}
                                            </div>
                                            {itemInComanda ? (
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 p-0" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Minus className="h-4 w-4" /></Button>
                                                    <span className="w-8 text-center font-medium">{itemInComanda.quantity}</span>
                                                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 p-0" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Plus className="h-4 w-4" /></Button>
                                                    <Button size="sm" variant="outline" onClick={() => removeFromComanda(item.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 ml-2" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            ) : (
                                                <Button onClick={() => addToComanda(item)} className="w-full bg-emerald-800 hover:bg-emerald-700" disabled={(!reservedTable && !currentOrderId) || item.available === false || currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN" && !item.available )}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
                                            )}
                                        </CardContent>
                                    </EnhancedCard>
                                );
                            })}
                            {filteredMenuItems().length === 0 && <p className="text-gray-500 md:col-span-full text-center py-10 text-lg">Nenhum item encontrado.</p>}
                        </div>
                    </div>
                );
            case "comanda":
                return (
                    <div className="space-y-6">
                        <EnhancedCard status={currentOrder?.status || "INITIAL"}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-emerald-800">
                                        Comanda {currentOrder?.id ? `#${currentOrder.id.toString().slice(-4)}` : "(Nenhuma comanda ativa)"}
                                        {currentOrder?.tableName && ` - Mesa ${currentOrder.tableName}`}
                                    </CardTitle>
                                    {currentOrder?.status && (
                                        <Badge className={ currentOrder.status === "PAID" ? "bg-green-500 text-white" : currentOrder.status === "UNPAID" ? "bg-red-500 text-white" : currentOrder.status === "OPEN" ? "bg-amber-500 text-white" : "bg-blue-500 text-white" }>
                                            {currentOrder.status === "PAID" ? <><CheckCircle className="h-3 w-3 mr-1"/>PAGO</> :
                                             currentOrder.status === "UNPAID" ? <><Clock className="h-3 w-3 mr-1"/>AG. PAGAMENTO</> :
                                             currentOrder.status === "OPEN" ? <><Send className="h-3 w-3 mr-1"/>ENVIADO P/ COZINHA</> :
                                             <><Clock className="h-3 w-3 mr-1"/>EM ABERTO</>
                                            }
                                        </Badge>
                                    )}
                                </div>
                                {currentOrder?.reservedTime && <CardDescription>Reserva: {formatSafeDate(currentOrder.reservedTime, true)}</CardDescription>}
                                {currentOrder?.requestedPaymentMethod && currentOrder?.status === "UNPAID" && (
                                    <CardDescription className="mt-1 text-sm">Forma de pagamento solicitada: <span className="font-semibold">{getPaymentMethodText(currentOrder.requestedPaymentMethod)}</span></CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                {(!currentOrder || selectedItems.length === 0) ? (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">{!currentOrderId ? "Nenhuma comanda ativa. Faça uma reserva ou selecione uma mesa para iniciar." : "Sua comanda está vazia."}</p>
                                        <Button onClick={() => setActiveView(!currentOrderId ? "reservas" : "cardapio")} className="bg-emerald-600 hover:bg-emerald-700">{!currentOrderId ? "Fazer Reserva" : "Ver Cardápio"}</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <ScrollArea className="h-[calc(100vh-550px)] min-h-[200px] pr-3 border rounded-md p-2 bg-slate-50">
                                            {selectedItems.map((item) => (
                                                <div key={item.menuItemId || item.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-200 mb-2 shadow-sm">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-emerald-800">{item.menuItemName || menuItems.find(mi => mi.id === item.menuItemId)?.name || `Item ${item.menuItemId}`}</h4>
                                                        <p className="text-xs text-emerald-600">R$ {(item.unitPrice || menuItems.find(mi => mi.id === item.menuItemId)?.price || 0).toFixed(2)} cada</p>
                                                        {item.status && item.status !== "PENDING" && (<Badge variant="outline" className={`mt-1 text-xs ${ item.status === "READY" ? "border-green-500 text-green-700 bg-green-50" : item.status === "PREPARING" ? "border-purple-500 text-purple-700 bg-purple-50" : item.status === "DELIVERED" ? "border-sky-500 text-sky-700 bg-sky-50" : ""}`}>{item.status === "READY" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}{getOrderItemStatusText(item.status)}</Badge>)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.menuItemId, -1)} className="h-8 w-8" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Minus className="h-4 w-4" /></Button>
                                                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                                                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.menuItemId, 1)} className="h-8 w-8" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Plus className="h-4 w-4" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => removeFromComanda(item.menuItemId)} className="h-8 w-8 text-red-500 hover:text-red-700" disabled={currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID" || (isOrderConfirmed && currentOrder?.status === "OPEN")}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                    <div className="text-right min-w-[80px] font-medium text-amber-700 text-lg">R$ {(item.totalPrice || (menuItems.find(mi => mi.id === item.menuItemId)?.price || 0) * item.quantity).toFixed(2)}</div>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex justify-between items-center text-xl font-bold mb-4">
                                                <span className="text-emerald-800">Total da Comanda:</span>
                                                <span className="font-bold text-amber-600">R$ {currentComandaTotal.toFixed(2)}</span>
                                            </div>
                                            {(currentOrder?.status === "INITIAL" || (currentOrder?.status === "OPEN" && !isOrderConfirmed)) && selectedItems.length > 0 && (
                                                <Button onClick={finalizeOrderAndSendToKitchen} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-base">
                                                    <Send className="h-5 w-5 mr-2" /> Enviar Pedido para Cozinha
                                                </Button>
                                            )}
                                            {currentOrder?.status === "OPEN" && isOrderConfirmed && (
                                                <Dialog open={isRequestAccountDialogOpen} onOpenChange={setIsRequestAccountDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base">
                                                            <CreditCard className="h-5 w-5 mr-2" /> Solicitar Fechamento da Conta
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle>Fechar Conta</DialogTitle><DialogDescription>Selecione a forma de pagamento desejada.</DialogDescription></DialogHeader>
                                                        <div className="py-4 space-y-3">
                                                            <Label htmlFor="paymentMethodClosure">Forma de Pagamento</Label>
                                                            <Select value={paymentMethodForClosure} onValueChange={(value: PaymentMethod | "") => setPaymentMethodForClosure(value as PaymentMethod)}>
                                                                <SelectTrigger id="paymentMethodClosure"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent> <SelectItem value="CASH">Dinheiro 💵</SelectItem> <SelectItem value="CARD">Cartão 💳</SelectItem> <SelectItem value="PIX">PIX 📲</SelectItem> </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleRequestAccountClosure} disabled={!paymentMethodForClosure}>Confirmar Solicitação</Button></DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                            {(currentOrder?.status === "UNPAID" || currentOrder?.status === "PAID") && (
                                                <div className="text-center text-emerald-700 mt-4 p-4 bg-emerald-50 rounded-md border border-emerald-200">
                                                    <h3 className="font-semibold text-lg mb-2">{currentOrder?.status === "UNPAID" ? "Conta Solicitada! ⏳" : "Pedido Finalizado! ✅"}</h3>
                                                    <p>{currentOrder?.status === "UNPAID" ? `Sua conta com pagamento em ${getPaymentMethodText(currentOrder?.requestedPaymentMethod)} foi solicitada. Aguarde o garçom.` : `Este pedido foi pago com ${getPaymentMethodText(currentOrder?.paymentMethod)}. Agradecemos a preferência!`}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </EnhancedCard>
                    </div>
                );

            case "historico": // Implementação completa para histórico
                return (
                    <div className="space-y-4">
                        {comandaHistory.length === 0 ? (
                            <EnhancedCard><CardContent className="p-8 text-center text-gray-500"><History className="w-16 h-16 mx-auto mb-4 text-gray-300"/>Nenhum pedido no seu histórico ainda.</CardContent></EnhancedCard>
                        ) : (
                            comandaHistory.map((comanda) => (
                                <EnhancedCard key={comanda.id} status={comanda.status}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-emerald-800">Pedido #{comanda.id.toString().padStart(4, '0')} (Mesa {comanda.tableName})</CardTitle>
                                            <Badge className={ comanda.status === "PAID" ? "bg-green-100 text-green-800" : comanda.status === "UNPAID" ? "bg-red-100 text-red-800" : comanda.status === "OPEN" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800" }>
                                                {comanda.status === "PAID" ? "Pago" : comanda.status === "UNPAID" ? "Aguardando Pagamento" : comanda.status === "OPEN" ? "Enviado à Cozinha" : "Em Aberto"}
                                            </Badge>
                                        </div>
                                        <CardDescription>Criado em: {formatSafeDate(comanda.createdAt, true)} {comanda.closedAt && ` - Fechado em: ${formatSafeDate(comanda.closedAt, true)}`} </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {comanda.items.length > 0 && (
                                            <ScrollArea className="max-h-40 mb-3 pr-3 border-b pb-2">
                                                <ul className="list-disc list-inside text-sm space-y-1">
                                                    {comanda.items.map((item, index) => (
                                                        <li key={item.id || item.menuItemId || index} className="text-emerald-700">
                                                            {item.quantity}x {item.menuItemName || menuItems.find(mi => mi.id === item.menuItemId)?.name || `Item ID ${item.menuItemId}`}
                                                            <span className="text-xs text-gray-500"> (R$ {(item.totalPrice || (menuItems.find(mi => mi.id === item.menuItemId)?.price || 0) * item.quantity).toFixed(2)})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </ScrollArea>
                                        )}
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between items-center font-semibold">
                                                <span className="text-emerald-800">Total do Pedido:</span>
                                                <span className="text-amber-600 text-lg">R$ {comanda.totalValue.toFixed(2)}</span>
                                            </div>
                                            {comanda.paymentMethod && comanda.status === "PAID" && (<div className="text-xs text-gray-500 mt-1">Pago com: {getPaymentMethodText(comanda.paymentMethod)}</div>)}
                                            {comanda.requestedPaymentMethod && comanda.status === "UNPAID" && (<div className="text-xs text-gray-500 mt-1">Pagamento solicitado: {getPaymentMethodText(comanda.requestedPaymentMethod)}</div>)}
                                        </div>
                                    </CardContent>
                                </EnhancedCard>
                            ))
                        )}
                    </div>
                );

            default:
                return <div className="text-center p-10 text-gray-500">Selecione uma opção no menu lateral para começar.</div>;
        }
    };

    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-50 to-amber-50">
                    <Sidebar className="border-r border-emerald-200">
                        <SidebarHeader className="border-b border-emerald-200 bg-emerald-800 text-white">
                            <div className="flex items-center gap-3 px-4 py-3">
                                <div className="p-2 bg-amber-400 rounded-lg"><Utensils className="h-6 w-6 text-emerald-800" /></div>
                                <div> <h2 className="font-bold text-lg">TableMaster</h2> <p className="text-emerald-100 text-sm">Área do Cliente</p> </div>
                            </div>
                        </SidebarHeader>
                        <SidebarContent className="bg-white">
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-emerald-800">Seu Perfil</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <div className="px-3 py-2 bg-emerald-50 rounded-lg mx-2 my-1 border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-200 rounded-full"><User className="h-4 w-4 text-emerald-800" /></div>
                                            <div>
                                                <p className="font-medium text-emerald-800">Olá, {fullName.split(" ")[0]}!</p>
                                                <p className="text-sm text-emerald-600">{formatCpfDisplay(cpf)}</p>
                                                {reservedTable?.number && currentOrderId && currentOrder?.status !== "PAID" && currentOrder?.status !== "UNPAID" && (<div className="flex items-center gap-1 mt-1"><Badge className="bg-amber-400 text-emerald-900 text-xs">Mesa {reservedTable.number}</Badge><span className="text-xs text-emerald-600">({reservationTime})</span></div>)}
                                                {currentOrder?.status && (currentOrder.status === "OPEN" || currentOrder.status === "UNPAID" || currentOrder.status === "PAID") && (
                                                    <Badge className={`mt-1 text-xs ${currentOrder.status === "OPEN" ? "bg-amber-500" : currentOrder.status === "UNPAID" ? "bg-red-500" : "bg-green-500"} text-white`}>
                                                        {currentOrder.status === "OPEN" ? <><Send className="h-3 w-3 mr-1" /> Pedido na Cozinha</> : currentOrder.status === "UNPAID" ? <><Clock className="h-3 w-3 mr-1" /> Aguardando Pgto.</> : <><CheckCircle className="h-3 w-3 mr-1" /> Pedido Pago</>}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SidebarGroupContent>
                            </SidebarGroup>
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-emerald-800">Navegação Principal</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {navigationItems.map((item) => (
                                            <SidebarMenuItem key={item.key}>
                                                <Tooltip><TooltipTrigger asChild>
                                                    <SidebarMenuButton onClick={() => setActiveView(item.key)} isActive={activeView === item.key} className="w-full justify-start">
                                                        <item.icon className="h-4 w-4" /> <span>{item.title}</span>
                                                        {item.badge !== null && (<Badge variant="default" className="ml-auto bg-amber-500 text-white px-1.5 py-0.5 text-xs">{item.badge}</Badge>)}
                                                    </SidebarMenuButton>
                                                </TooltipTrigger><TooltipContent side="right"><p>{item.description}</p></TooltipContent></Tooltip>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                            {currentOrderId && selectedItems.length > 0 && currentOrder?.status !== "PAID" && currentOrder?.status !== "UNPAID" && (
                                <SidebarGroup>
                                    <SidebarGroupLabel className="text-emerald-800">Resumo da Comanda Atual</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <div className="px-3 py-2 bg-amber-50 rounded-lg mx-2 my-1 border border-amber-100">
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between"><span className="text-emerald-700">Itens na comanda:</span><span className="font-medium text-emerald-800">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
                                                <div className="flex justify-between"><span className="text-emerald-700">Valor Total:</span><span className="font-bold text-amber-600">R$ {currentComandaTotal.toFixed(2)}</span></div>
                                            </div>
                                        </div>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            )}
                        </SidebarContent>
                        <SidebarFooter className="border-t border-emerald-200 bg-white">
                            <SidebarMenu><SidebarMenuItem>
                                <SidebarMenuButton onClick={onLogout} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"> <LogOut className="h-4 w-4" /> <span>Sair da Conta</span> </SidebarMenuButton>
                            </SidebarMenuItem></SidebarMenu>
                        </SidebarFooter>
                        <SidebarRail /> 
                    </Sidebar>
                    <PageLayout title={navigationItems.find((item) => item.key === activeView)?.title || "TableMaster"} breadcrumbs={getBreadcrumbs()} actions={
                        <div className="flex items-center gap-2">
                            {currentOrderId && selectedItems.length > 0 && (<Badge className="bg-emerald-100 text-emerald-800">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} itens na comanda</Badge>)}
                            {reservedTable?.number && currentOrderId && <Badge className="bg-amber-100 text-amber-800">Mesa Ativa: {reservedTable.number}</Badge>}
                        </div>
                    }>
                        {renderContent()}
                    </PageLayout>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}