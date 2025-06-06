"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { LogOut, MapPin, FileText, Package, Clock, Users, Star, CheckCircle, Utensils, DollarSign, Settings, CreditCard, UserPlus, Calendar, Timer, Plus, Trash2, ListOrdered, ChefHat, Receipt } from "lucide-react"
import { AuthResponseData } from "@/app/types/auth"
import { Client as StompClient, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ScrollArea } from "@/components/ui/scroll-area";

const BASE_URL = "http://localhost:8080/api"
const BASE_URL_WS = "ws://localhost:8080/ws"
const BASE_URL_SOCKJS_HTTP = "http://localhost:8080/ws"

// --- Interfaces ---
interface OrderItemDTO {
    id: number; orderId: number; menuItemId: number; menuItemName: string; menuItemDescription: string; quantity: number; unitPrice: number; totalPrice: number; status: "PENDING" | "PREPARING" | "READY" | "DELIVERED"; createdAt: string;
}
interface OrderDTO {
    id: number; tableId: number; tableName: string; userCpf: string; userName: string; items: OrderItemDTO[]; createdAt: string; status: "OPEN" | "UNPAID" | "PAID"; totalValue: number; paymentMethod?: PaymentMethod; requestedPaymentMethod?: PaymentMethod; closedAt?: string; reservedTime?: string;
}
interface RestaurantTableDTO {
    id: number; number: number; status: "AVAILABLE" | "OCCUPIED" | "RESERVED"; capacity: number; orders?: OrderDTO[];
}
interface MenuItemDTO {
    id: number; name: string; description: string; price: number; imageUrl?: string; category: "APPETIZERS" | "MAIN_COURSES" | "DESSERTS" | "DRINKS";
}
type PaymentMethod = "CASH" | "CARD" | "PIX";
interface AccountRequestNotificationDTO {
    id: number; orderId: number; tableId: number; tableNumber: string; userName: string; requestedPaymentMethod: PaymentMethod; timestamp: string; message: string; isRead: boolean; notificationType?: string;
}
interface WaiterDashboardProps {
    onLogout: () => void; authToken: string; currentUserData: AuthResponseData;
}

// --- Funções Auxiliares (Fora do Componente) ---
const getPaymentMethodText = (method?: PaymentMethod): string => {
    if (!method) return "N/A";
    const map: Record<PaymentMethod, string> = { CASH: "Dinheiro", CARD: "Cartão", PIX: "PIX" };
    return map[method] || "N/A";
};
const getOrderItemStatusText = (status: OrderItemDTO["status"]) => ({PENDING: "Novo", PREPARING: "Em Preparo", READY: "Pronto", DELIVERED: "Entregue"}[status] || status);
const getOrderItemStatusColor = (status: OrderItemDTO["status"]) => ({PENDING: "bg-blue-500", PREPARING: "bg-amber-500", READY: "bg-green-500", DELIVERED: "bg-green-600"}[status] || "bg-gray-400");
const getTableStatusText = (status: RestaurantTableDTO["status"]) => ({AVAILABLE: "Disponível", OCCUPIED: "Ocupada", RESERVED: "Reservada"}[status] || status);
const formatSafeDate = (dateString: string | undefined | null, includeTime: boolean = true) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return includeTime ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('pt-BR');
    } catch { return 'N/A'; }
}
const getElapsedTime = (createdAt: string | undefined) => {
    if (!createdAt) return 0;
    try {
        const itemDate = new Date(createdAt);
        if (isNaN(itemDate.getTime())) return 0;
        return Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60));
    } catch { return 0; }
}


// --- Componente ---
export default function WaiterDashboard({ onLogout, authToken, currentUserData }: WaiterDashboardProps) {
    const { toast } = useToast()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [activeSection, setActiveSection] = useState("dashboard")
    const [selectedPaymentMethodForOrder, setSelectedPaymentMethodForOrder] = useState<Record<number, PaymentMethod | ''>>({});
    const [newOrderTableId, setNewOrderTableId] = useState<number | null>(null)
    const [newOrderItems, setNewOrderItems] = useState<Array<{ id: number; name: string; price: number; quantity: number }>>([])
    const [selectedMenuItemId, setSelectedMenuItemId] = useState("")
    const [tables, setTables] = useState<RestaurantTableDTO[]>([])
    const [activeOrders, setActiveOrders] = useState<OrderDTO[]>([])
    const [pendingItems, setPendingItems] = useState<OrderItemDTO[]>([])
    const [preparingItems, setPreparingItems] = useState<OrderItemDTO[]>([])
    const [readyItems, setReadyItems] = useState<OrderItemDTO[]>([])
    const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])
    const [accountRequestNotifications, setAccountRequestNotifications] = useState<AccountRequestNotificationDTO[]>([]);
    const [deliveredOrders, setDeliveredOrders] = useState<OrderDTO[]>([])
    const [dailySales, setDailySales] = useState({
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        cashSales: 0,
        cardSales: 0,
        pixSales: 0,
        myCommission: 0,
        commissionRate: 5 // default commission rate of 5%
    })

    const stompClientRef = useRef<StompClient | null>(null);

    const fetchAPIData = useCallback(async (endpoint: string, setter: Function, errorMessage: string) => {
        if (!authToken) return;
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, { headers: { Authorization: `Bearer ${authToken}` } });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => "Erro desconhecido");
                throw new Error(`${errorMessage} (Status: ${response.status} - ${errorText})`);
            }
            const data = await response.json();
            setter(Array.isArray(data) ? data : []);
        } catch (e: any) {
            toast({ title: `Erro ao buscar dados`, description: e.message, variant: "destructive" });
            setter([]);
        }
    }, [authToken, toast]);

    const sortOrderItemFn = (a: OrderItemDTO, b: OrderItemDTO) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    // Funções de fetch HTTP
    const fetchTables = useCallback(() => fetchAPIData("/waiter/tables", setTables, "Falha ao buscar mesas."), [fetchAPIData]);
    const fetchMenuItems = useCallback(() => fetchAPIData("/menu", setMenuItems, "Falha ao buscar cardápio."), [fetchAPIData]); 
    const fetchAccountRequestNotifications = useCallback(() => fetchAPIData("/waiter/notifications/account-requests", setAccountRequestNotifications, "Falha ao buscar solicitações de conta."), [fetchAPIData]);
    const fetchPaidOrders = useCallback(() => fetchAPIData("/orders/paid", setDeliveredOrders, "Falha ao buscar pedidos pagos."), [fetchAPIData]);
    
    // ATENÇÃO: fetchActiveOrders agora também popula as listas de itens
    const fetchActiveOrders = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await fetch(`${BASE_URL}/waiter/orders/active`, { headers: { Authorization: `Bearer ${authToken}` } });
            if (!response.ok) {
                const errorText = await response.text().catch(() => "Erro desconhecido");
                throw new Error(`Falha ao buscar pedidos ativos. (Status: ${response.status} - ${errorText})`);
            }
            const data: OrderDTO[] = await response.json();
            setActiveOrders(data);

            const pending: OrderItemDTO[] = [];
            const preparing: OrderItemDTO[] = [];
            const ready: OrderItemDTO[] = [];

            data.forEach(order => {
                order.items.forEach(item => {
                    if (item.status === "PENDING") {
                        pending.push(item);
                    } else if (item.status === "PREPARING") {
                        preparing.push(item);
                    } else if (item.status === "READY") {
                        ready.push(item);
                    }
                });
            });
            setPendingItems(pending.sort(sortOrderItemFn));
            setPreparingItems(preparing.sort(sortOrderItemFn));
            setReadyItems(ready.sort(sortOrderItemFn));
            
        } catch (e: any) {
            toast({ title: `Erro ao buscar dados`, description: e.message, variant: "destructive" });
            setActiveOrders([]);
            setPendingItems([]);
            setPreparingItems([]);
            setReadyItems([]);
        }
    }, [authToken, toast]);

    // As chamadas HTTP para /kitchen/pending, /kitchen/preparing, /kitchen/ready podem ser removidas daqui
    // se você confiar totalmente na extração de itens de `fetchActiveOrders` e nos WebSockets.
    // Para simplificar e evitar chamadas HTTP redundantes, podemos removê-las se a extração de OrderItems
    // do OrderDTO for a principal fonte.
    // Se você ainda quiser que elas busquem explicitamente (por exemplo, para resync forçado), mantenha.
    // Por enquanto, vamos manter a chamada consolidada em fetchActiveOrders.
    // Removendo as chamadas diretas para getPendingItems, getPreparingItems, getReadyItemsAPI do Promise.all
    // para confiar na extração de OrderItems do OrderDTO principal e nos WebSockets.

    // --- EFEITOS (LIFECYCLE) ---

    // 1. Busca de dados iniciais via HTTP
    useEffect(() => {
        if (!authToken) return;
        const fetchAllData = async () => {
            await Promise.all([
                fetchTables(), 
                fetchActiveOrders(), // Esta função agora também popula pending/preparing/ready items
                fetchMenuItems(), 
                fetchAccountRequestNotifications(), 
                fetchPaidOrders() 
            ]).catch(e => { 
                console.error("Erro ao buscar dados iniciais (Garçom):", e); 
                toast({ title: "Erro de Conexão", description: "Não foi possível carregar os dados iniciais.", variant: "destructive" });
            });
        }
        fetchAllData();
    }, [authToken, fetchTables, fetchActiveOrders, fetchMenuItems, fetchAccountRequestNotifications, fetchPaidOrders, toast]);


    // 2. Gerenciamento da conexão WebSocket
    useEffect(() => {
        if (!authToken) return;
        
        if (stompClientRef.current && stompClientRef.current.connected) {
            console.log('STOMP (Garçom): Cliente já conectado. Ignorando nova ativação.');
            return;
        }

        const client = new StompClient({
            webSocketFactory: () => new SockJS(BASE_URL_SOCKJS_HTTP) as any, 
            connectHeaders: { 'Authorization': `Bearer ${authToken}` },
            debug: (str) => console.log('STOMP (Garçom):', str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Garçom conectado ao WebSocket!');
                stompClientRef.current = client;

                const sortOrderItemFn = (a: OrderItemDTO, b: OrderItemDTO) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                const sortOrderFn = (a: OrderDTO, b: OrderDTO) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                // --- Order Items Subscription ---
                client.subscribe('/topic/order-items', (message: IMessage) => {
                    try {
                        const updatedItem: OrderItemDTO = JSON.parse(message.body);
                        console.log("--- WS /topic/order-items Debug ---");
                        console.log("RECEIVED RAW MESSAGE BODY:", message.body); 
                        console.log("PARSED updatedItem:", updatedItem);
                        console.log("updatedItem.id:", updatedItem.id, "updatedItem.status:", updatedItem.status);
                        
                        const updateList = (setter: React.Dispatch<React.SetStateAction<OrderItemDTO[]>>, expectedStatus: OrderItemDTO['status'], listName: string) => {
                            setter(prev => {
                                console.log(`[WS Debug] Updating ${listName}. Previous state length: ${prev.length}`);
                                const filtered = Array.isArray(prev) ? prev.filter(item => item.id !== updatedItem.id) : [];
                                
                                if (updatedItem.status === expectedStatus) {
                                    const newList = [...filtered, updatedItem].sort(sortOrderItemFn);
                                    console.log(`[WS Debug] ${listName}: Added/Updated item ${updatedItem.id}. New list length: ${newList.length}. Current item status: ${updatedItem.status}`);
                                    return newList;
                                } else {
                                    console.log(`[WS Debug] ${listName}: Item ${updatedItem.id} status is ${updatedItem.status}, filtering out. New list length: ${filtered.length}`);
                                    return filtered;
                                }
                            });
                        };

                        updateList(setPendingItems, "PENDING", "Pending Items");
                        updateList(setPreparingItems, "PREPARING", "Preparing Items");
                        updateList(setReadyItems, "READY", "Ready Items");

                        // CORREÇÃO: Atrasar o toast para fora do ciclo de renderização imediato
                        if (updatedItem.status === "READY") {
                            setTimeout(() => { // <--- Adicionado setTimeout
                                toast({ title: "Item Pronto! 🍽️", description: `${updatedItem.menuItemName} está pronto.` });
                            }, 0); 
                        }

                    } catch (error) {
                        console.error("[WS GARÇOM] Error parsing or processing /topic/order-items message:", error, message.body);
                        toast({ title: "Erro de processamento WS", description: "Problema ao atualizar dados em tempo real.", variant: "destructive" });
                    }
                });

                // ... (o restante do código do useEffect, incluindo os outros subscribes)
                // Lembre-se de aplicar setTimeout em *todas* as chamadas toast() dentro dos subscribes.

                // --- Orders Subscription ---
                client.subscribe('/topic/orders', (message: IMessage) => {
                    try {
                        const updatedOrder: OrderDTO = JSON.parse(message.body);
                        console.log("--- WS /topic/orders Debug ---");
                        console.log("RECEIVED RAW MESSAGE BODY:", message.body); 
                        console.log("PARSED updatedOrder:", updatedOrder);
                        console.log("updatedOrder.id:", updatedOrder.id, "updatedOrder.status:", updatedOrder.status);
                        
                        const sortOrderFn = (a: OrderDTO, b: OrderDTO) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                        if (message.body.includes("\"deleted\": true")) { 
                            const deletedOrderInfo = JSON.parse(message.body);
                            if (deletedOrderInfo.deleted && deletedOrderInfo.id) {
                                setActiveOrders(prev => {
                                    const filtered = Array.isArray(prev) ? prev.filter(o => o.id !== deletedOrderInfo.id) : [];
                                    console.log(`[WS Debug] Active Orders: Removed deleted order ${deletedOrderInfo.id}. New list length: ${filtered.length}`);
                                    return filtered;
                                });
                                setDeliveredOrders(prev => { 
                                    const filtered = Array.isArray(prev) ? prev.filter(o => o.id !== deletedOrderInfo.id) : [];
                                    console.log(`[WS Debug] Delivered Orders: Removed deleted order ${deletedOrderInfo.id}. New list length: ${filtered.length}`);
                                    return filtered;
                                });
                                setPendingItems(prev => prev.filter(item => item.orderId !== deletedOrderInfo.id));
                                setPreparingItems(prev => prev.filter(item => item.orderId !== deletedOrderInfo.id));
                                setReadyItems(prev => prev.filter(item => item.orderId !== deletedOrderInfo.id));

                                setTimeout(() => { // <--- Adicionado setTimeout
                                    toast({ title: "Pedido Removido", description: `Pedido #${deletedOrderInfo.id} foi removido.`, variant: "default" });
                                }, 0);
                                return; 
                            }
                        }

                        setActiveOrders(prev => {
                            console.log(`[WS Debug] Updating Active Orders. Previous state length: ${prev.length}`);
                            const filtered = Array.isArray(prev) ? prev.filter(o => o.id !== updatedOrder.id) : [];
                            let newList = filtered;

                            if (updatedOrder.status === "OPEN" || updatedOrder.status === "UNPAID") {
                                newList = [...filtered, updatedOrder].sort(sortOrderFn);
                                console.log(`[WS Debug] Active Orders: Added/Updated order ${updatedOrder.id}. New list length: ${newList.length}. Current order status: ${updatedOrder.status}`);
                                
                                setPendingItems(currentPendingItems => {
                                    const newPending = updatedOrder.items.filter(item => item.status === "PENDING");
                                    const combined = Array.isArray(currentPendingItems) ? currentPendingItems.filter(item => item.orderId !== updatedOrder.id) : [];
                                    return [...combined, ...newPending].sort(sortOrderItemFn);
                                });

                                setPreparingItems(currentPreparingItems => {
                                    const newPreparing = updatedOrder.items.filter(item => item.status === "PREPARING");
                                    const combined = Array.isArray(currentPreparingItems) ? currentPreparingItems.filter(item => item.orderId !== updatedOrder.id) : [];
                                    return [...combined, ...newPreparing].sort(sortOrderItemFn);
                                });

                                setReadyItems(currentReadyItems => {
                                    const newReady = updatedOrder.items.filter(item => item.status === "READY");
                                    const combined = Array.isArray(currentReadyItems) ? currentReadyItems.filter(item => item.orderId !== updatedOrder.id) : [];
                                    return [...combined, ...newReady].sort(sortOrderItemFn);
                                });

                            } else {
                                console.log(`[WS Debug] Active Orders: Order ${updatedOrder.id} status is ${updatedOrder.status}, filtering out. New list length: ${filtered.length}`);
                                setPendingItems(prevItems => prevItems.filter(item => item.orderId !== updatedOrder.id));
                                setPreparingItems(prevItems => prevItems.filter(item => item.orderId !== updatedOrder.id));
                                setReadyItems(prevItems => prevItems.filter(item => item.orderId !== updatedOrder.id));
                            }
                            return newList;
                        });
        
                        if (updatedOrder.status === "PAID") {
                            setDeliveredOrders(prev => {
                                console.log(`[WS Debug] Updating Delivered Orders. Previous state length: ${prev.length}`);
                                const filtered = Array.isArray(prev) ? prev.filter(o => o.id !== updatedOrder.id) : [];
                                const newList = [...filtered, updatedOrder].sort(sortOrderFn);
                                console.log(`[WS Debug] Delivered Orders: Added/Updated order ${updatedOrder.id}. New list length: ${newList.length}`);
                                return newList;
                            });
                            setAccountRequestNotifications(prev => prev.filter(n => n.orderId !== updatedOrder.id));
                            // Adicionar toast para pedido pago, se desejar
                            // setTimeout(() => {
                            //     toast({ title: "Pedido Pago!", description: `Pedido #${updatedOrder.id} foi pago.`, variant: "success" });
                            // }, 0);
                        }
                    } catch (error) {
                        console.error("[WS GARÇOM] Error parsing or processing /topic/orders message:", error, message.body);
                        setTimeout(() => { // <--- Adicionado setTimeout
                            toast({ title: "Erro de processamento WS", description: "Problema ao atualizar dados em tempo real.", variant: "destructive" });
                        }, 0);
                    }
                });

                // --- Notifications/Account Requests Subscription ---
                client.subscribe('/topic/notifications/account-requests', (message: IMessage) => {
                    try {
                        const notification: AccountRequestNotificationDTO = JSON.parse(message.body);
                        console.log("--- WS /topic/notifications/account-requests Debug ---");
                        console.log("RECEIVED RAW MESSAGE BODY:", message.body);
                        console.log("PARSED notification:", notification);

                        setAccountRequestNotifications(prev => {
                            const currentNotifications = Array.isArray(prev) ? prev : [];
                            if (!currentNotifications.some(req => req.id === notification.id)) {
                                setTimeout(() => { // <--- Adicionado setTimeout
                                    toast({ title: "Conta Solicitada! 💳", description: `Mesa ${notification.tableNumber} pediu a conta.`, duration: 7000 });
                                }, 0);
                                const newList = [...currentNotifications, notification].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                                console.log(`[WS Debug] Account Requests: Added notification ${notification.id}. New list length: ${newList.length}`);
                                return newList;
                            }
                            console.log(`[WS Debug] Account Requests: Notification ${notification.id} already exists or is read. No change.`);
                            return currentNotifications;
                        });
                        fetchActiveOrders(); 
                    } catch (error) {
                        console.error("[WS GARÇOM] Error parsing or processing /topic/notifications/account-requests message:", error, message.body);
                        setTimeout(() => { // <--- Adicionado setTimeout
                            toast({ title: "Erro de processamento WS", description: "Problema ao atualizar dados em tempo real.", variant: "destructive" });
                        }, 0);
                    }
                });

                // --- Tables Subscription ---
                client.subscribe('/topic/tables', (message: IMessage) => {
                    try {
                        const updatedTable: RestaurantTableDTO = JSON.parse(message.body);
                        console.log("--- WS /topic/tables Debug ---");
                        console.log("RECEIVED RAW MESSAGE BODY:", message.body);
                        console.log("PARSED updatedTable:", updatedTable);

                        setTables(prev => {
                            const currentTables = Array.isArray(prev) ? prev : [];
                            const idx = currentTables.findIndex(t => t.id === updatedTable.id);
                            const newList = [...currentTables];
                            if (idx > -1) {
                                newList[idx] = updatedTable;
                                console.log(`[WS Debug] Tables: Updated table ${updatedTable.id}. Status: ${updatedTable.status}.`);
                            } else {
                                newList.push(updatedTable);
                                console.log(`[WS Debug] Tables: Added new table ${updatedTable.id}. Status: ${updatedTable.status}.`);
                            }
                            return newList.sort((a, b) => a.number - b.number);
                        });
                    } catch (error) {
                        console.error("[WS GARÇOM] Error parsing or processing /topic/tables message:", error, message.body);
                        setTimeout(() => { // <--- Adicionado setTimeout
                            toast({ title: "Erro de processamento WS", description: "Problema ao atualizar dados em tempo real.", variant: "destructive" });
                        }, 0);
                    }
                });

            }, 
            onStompError: (frame: any) => { 
                setTimeout(() => { // <--- Adicionado setTimeout
                    toast({title:"Erro WS STOMP", description: frame.headers['message'], variant: "destructive"});
                }, 0);
            },
            onWebSocketError: () => { 
                setTimeout(() => { // <--- Adicionado setTimeout
                    toast({title:"Erro Conexão WS", description: "Não foi possível conectar ao servidor em tempo real.", variant: "destructive"});
                }, 0);
            },
            onDisconnect: () => { console.log('Garçom desconectado do WebSocket.'); }
        });

        client.activate();

        return () => {
            if (stompClientRef.current?.connected) {
                console.log("STOMP (Garçom): Desativando cliente WebSocket.");
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [authToken, toast, fetchActiveOrders]); // Continua com as dependências

    // 3. Atualização do relógio
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 4. Cálculo de estatísticas de vendas
    useEffect(() => {
        const paidOrders = deliveredOrders;
        const totalSales = paidOrders.reduce((sum, order) => sum + order.totalValue, 0);
        const totalOrders = paidOrders.length;
        let cash = 0, card = 0, pix = 0;
        paidOrders.forEach(order => {
            if (order.paymentMethod === "CASH") cash += order.totalValue;
            else if (order.paymentMethod === "CARD") card += order.totalValue;
            else if (order.paymentMethod === "PIX") pix += order.totalValue;
        });
        setDailySales(prev => ({ ...prev, totalSales, totalOrders, avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0, cashSales: cash, cardSales: card, pixSales: pix, myCommission: totalSales * (prev.commissionRate / 100) }));
    }, [deliveredOrders]);


    const finishedOrders = [...activeOrders.filter(o => o.status === "UNPAID"), ...deliveredOrders]
        .sort((a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime());

    const stats = {
        totalTables: tables.length,
        occupiedTables: tables.filter(t => t.status === "OCCUPIED").length,
        availableTables: tables.filter(t => t.status === "AVAILABLE").length,
        reservedTables: tables.filter(t => t.status === "RESERVED").length,
        totalComandas: activeOrders.filter(o => o.status === "OPEN" || o.status === "UNPAID").length, 
        newOrders: pendingItems.length,
        preparingOrders: preparingItems.length,
        readyOrders: readyItems.length,
        finishedOrdersCount: finishedOrders.length, 
        totalRevenue: dailySales.totalSales,
        accountRequests: accountRequestNotifications.length,
    };

    const handleStatusChange = async (itemId: number, targetStatus: OrderItemDTO["status"]) => {
        let endpoint = "";
        if (targetStatus === "PREPARING") endpoint = `/kitchen/item/${itemId}/start-preparing`;
        else if (targetStatus === "READY") endpoint = `/kitchen/item/${itemId}/mark-ready`;
        else if (targetStatus === "DELIVERED") endpoint = `/kitchen/item/${itemId}/mark-delivered`;
        else return;

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, { method: "PATCH", headers: { "Authorization": `Bearer ${authToken}` }});
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(errorBody || `Falha ao mudar status para ${targetStatus}.`);
            }
            
            toast({ title: "Status Atualizado!", description: `Item ${itemId} foi para: ${getOrderItemStatusText(targetStatus)}.`, variant: "default" });

        } catch (e:any) { 
            toast({ title: "Erro ao Mudar Status", description: e.message, variant: "destructive" });
        }
    };
    
    const markOrderAsPaidAndDeliverItems = async (order: OrderDTO, paymentMethodValue: PaymentMethod, notificationIdToRemove?: number) => {
        if (!paymentMethodValue) { 
            toast({ title: "Forma de Pagamento", description: "Selecione uma forma de pagamento para continuar.", variant: "destructive" }); 
            return; 
        }
        try {
            const payResponse = await fetch(`${BASE_URL}/waiter/order/${order.id}/pay?paymentMethod=${paymentMethodValue}`, { method: "PATCH", headers: { Authorization: `Bearer ${authToken}` }});
            if (!payResponse.ok) {
                const errorData = await payResponse.json().catch(() => ({ message: "Erro desconhecido ao processar pagamento." }));
                throw new Error(errorData.message);
            }
            
            toast({ title: "Pedido Pago!", description: `Pagamento para a Mesa ${order.tableName} processado com sucesso.`});
            setSelectedPaymentMethodForOrder(prev => { const newState = {...prev}; delete newState[order.id]; return newState; });
            
            if (notificationIdToRemove) {
                setAccountRequestNotifications(prev => prev.filter(n => n.id !== notificationIdToRemove));
            }
        } catch (e:any) { 
            toast({ title: "Erro ao Finalizar Pedido", description: e.message, variant: "destructive" });
        }
    };

    const updateTableStatus = async (tableId: number, newStatus: RestaurantTableDTO["status"]) => {
        const table = tables.find(t=>t.id===tableId); 
        if(!table) return;

        try {
            const res = await fetch(`${BASE_URL}/table/${tableId}`, {method:"PUT",headers:{"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json"},body:JSON.stringify({...table, status:newStatus})});
            if(!res.ok) throw new Error(await res.text() || "Erro ao atualizar status da mesa.");
            toast({title:"Mesa Atualizada", description:`Status da Mesa ${table.number} mudou para ${getTableStatusText(newStatus)}`});
        } catch(e:any) {
            toast({title:"Erro ao Atualizar Mesa",description:e.message,variant:"destructive"})
        }
    };

    const createNewOrder = async () => {
        if(!newOrderTableId || newOrderItems.length === 0) {
            toast({title:"Pedido Incompleto", description:"Por favor, selecione uma mesa e adicione pelo menos um item.", variant:"destructive"}); 
            return;
        }

        try {
            const table = tables.find(t=>t.id===newOrderTableId); 
            if(!table) throw new Error("Mesa selecionada não foi encontrada.");

            const orderPayload = {
                tableId: newOrderTableId,
                userCpf: currentUserData.cpf, 
            };

            const orderRes = await fetch(`${BASE_URL}/orders/create-for-table`, {
                method:"POST",
                headers:{"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json"},
                body:JSON.stringify(orderPayload)
            });

            if(!orderRes.ok) throw new Error(await orderRes.text() || "Erro ao criar o container do pedido.");
            
            const createdOrder:OrderDTO = await orderRes.json();
            
            const itemsPayload = newOrderItems.map(i => ({menuItemId: i.id, quantity: i.quantity}));
            
            const addItemsEndpoint = `${BASE_URL}/orders/${createdOrder.id}/items`; 
            
            const addItemsRes = await fetch(addItemsEndpoint, {
                method:"PATCH", 
                headers:{"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json"},
                body:JSON.stringify(itemsPayload)
            });

            if(!addItemsRes.ok) {
                throw new Error(`Falha ao adicionar itens: ${await addItemsRes.text()}`);
            }

            await updateTableStatus(newOrderTableId, "OCCUPIED");
            
            setNewOrderTableId(null);
            setNewOrderItems([]);
            setSelectedMenuItemId('');
            toast({title:"Pedido Criado!", description:`Novo pedido para Mesa ${table.number} foi enviado com sucesso.`});
            
        } catch(e:any) {
            toast({title:"Erro ao Criar Pedido", description:e.message, variant:"destructive"});
        }
    };

    const OrderItemCard = ({ item }: { item: OrderItemDTO }) => {
        const order = activeOrders.find(o => o.id === item.orderId) || deliveredOrders.find(o => o.id === item.orderId);
        return (
            <Card className="mb-4 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Mesa {order?.tableName || 'N/A'} - Item: {item.menuItemName} (x{item.quantity})</CardTitle>
                        <Badge className={`${getOrderItemStatusColor(item.status)} text-white`}>{getOrderItemStatusText(item.status)}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1"> <Timer className="h-3 w-3"/> {formatSafeDate(item.createdAt)} ({getElapsedTime(item.createdAt)} min) </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{item.menuItemDescription}</p>
                    {item.status === "PENDING" && <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleStatusChange(item.id, "PREPARING")}><ChefHat className="w-4 h-4 mr-2"/>Iniciar Preparo</Button>}
                    {item.status === "PREPARING" && <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => handleStatusChange(item.id, "READY")}><CheckCircle className="w-4 h-4 mr-2"/>Marcar Pronto</Button>}
                    {item.status === "READY" && <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleStatusChange(item.id, "DELIVERED")}><Package className="h-4 w-4 mr-2"/>Marcar Entregue</Button>}
                    {item.status === "DELIVERED" && <Button size="sm" className="w-full bg-green-600 text-white cursor-default" disabled><CheckCircle className="h-4 w-4 mr-2"/>Entregue</Button>}
                </CardContent>
            </Card>
        );
    };

    const sidebarItems = [
        { category: "Pedidos", items: [
            { key: "dashboard", label: "Dashboard", icon: ListOrdered, count: null },
            { key: "new-orders", label: "Novos Itens", icon: FileText, count: stats.newOrders },
            { key: "preparing", label: "Itens em Preparo", icon: Clock, count: stats.preparingOrders },
            { key: "ready", label: "Itens Prontos", icon: CheckCircle, count: stats.readyOrders },
            { key: "finished-orders", label: "Pedidos Finalizados", icon: Receipt, count: finishedOrders.length }, 
            { key: "account-requests", label: "Contas Solicitadas", icon: CreditCard, count: stats.accountRequests },
        ]},
        { category: "Mesas", items: [
            { key: "occupied-tables", label: "Mesas Ocupadas", icon: Users, count: stats.occupiedTables },
            { key: "available-tables", label: "Mesas Livres", icon: MapPin, count: stats.availableTables },
        ]},
        { category: "Sistema", items: [ { key: "logout", label: "Sair", icon: LogOut, count: null } ]},
    ];

    const handleSidebarClick = (key: string) => { if (key === "logout") onLogout(); else setActiveSection(key); };

    const renderMainContent = useCallback(() => {
        switch (activeSection) {
            case "dashboard":
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Mesas Ocupadas</p><p className="text-2xl font-bold text-red-600">{stats.occupiedTables}</p></div><Users className="w-8 h-8 text-red-600" /></div></CardContent></Card>
                            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Contas Solicitadas</p><p className="text-2xl font-bold text-blue-600">{stats.accountRequests}</p></div><CreditCard className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
                            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Itens Prontos</p><p className="text-2xl font-bold text-green-600">{stats.readyOrders}</p></div><CheckCircle className="w-8 h-8 text-green-600" /></div></CardContent></Card>
                            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Receita (Dia)</p><p className="text-2xl font-bold text-amber-600">R$ {stats.totalRevenue.toFixed(2)}</p></div><DollarSign className="w-8 h-8 text-amber-600" /></div></CardContent></Card>
                        </div>
                    </div>
                );
            case "new-orders": case "preparing": case "ready":
                let itemsToDisplay: OrderItemDTO[] = [];
                let sectionTitle = "";
                let currentItemCount = 0;
                if (activeSection === "new-orders") { itemsToDisplay = pendingItems; sectionTitle = "Novos Itens de Pedidos"; currentItemCount = stats.newOrders; }
                else if (activeSection === "preparing") { itemsToDisplay = preparingItems; sectionTitle = "Itens em Preparo"; currentItemCount = stats.preparingOrders; }
                else if (activeSection === "ready") { itemsToDisplay = readyItems; sectionTitle = "Itens Prontos para Entrega"; currentItemCount = stats.readyOrders; }
                return ( <div className="space-y-6"> <h2 className="text-2xl font-bold">{sectionTitle} ({currentItemCount})</h2> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {itemsToDisplay.length === 0 ? <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-6 text-center text-gray-500">Nenhum item nesta categoria.</CardContent></Card> : itemsToDisplay.map(item => <OrderItemCard key={item.id} item={item} />)} </div> </div> );
            
            case "finished-orders":
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Pedidos Finalizados ({finishedOrders.length})</h2>
                        {finishedOrders.length === 0 ? (
                            <Card><CardContent className="p-8 text-center text-gray-500"><Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400"/>Nenhum pedido finalizado encontrado.</CardContent></Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {finishedOrders.map(order => (
                                    <Card key={order.id} className={`shadow-md border-l-4 ${order.status === "PAID" ? 'border-green-500' : 'border-amber-500'}`}>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-lg">Mesa {order.tableName} - Pedido #{order.id}</CardTitle>
                                                <Badge className={`${order.status === "PAID" ? 'bg-green-100 text-green-700 border-green-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                                                    {order.status === "PAID" ? `Pago (${getPaymentMethodText(order.paymentMethod)})` : "Aguardando Pagamento"}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <p>Cliente: {order.userName} (CPF: {order.userCpf || 'N/A'})</p>
                                                <p>Iniciado: {formatSafeDate(order.createdAt)}</p>
                                                {order.status === "PAID" && order.closedAt && (<p>Finalizado: {formatSafeDate(order.closedAt)}</p>)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-medium mb-1">Itens da Comanda:</p>
                                            <ul className="list-disc list-inside text-sm space-y-0.5 max-h-28 overflow-y-auto bg-slate-50 p-2 rounded">
                                                {order.items.map(item => (<li key={item.id}>{item.quantity}x {item.menuItemName}</li>))}
                                            </ul>
                                            <p className="text-right font-bold mt-2 text-xl">Total: R$ {order.totalValue.toFixed(2)}</p>
                                            {order.status === "UNPAID" && (
                                                <Button variant="outline" size="sm" className="mt-3 w-full border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => {
                                                    const notificationForOrder = accountRequestNotifications.find(n => n.orderId === order.id);
                                                    if (notificationForOrder) { 
                                                        setSelectedPaymentMethodForOrder(prev => ({...prev, [order.id]: notificationForOrder.requestedPaymentMethod || ''})); 
                                                    }
                                                    setActiveSection("account-requests");
                                                }}>
                                                    <CreditCard className="h-4 w-4 mr-2" /> Processar Pagamento
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "account-requests":
                const ordersForPaymentProcessing = accountRequestNotifications
                    .map(notification => { 
                        const order = activeOrders.find(o => o.id === notification.orderId && o.status === "UNPAID"); 
                        return order ? { ...order, notificationDetails: notification } : null; 
                    })
                    .filter(Boolean) as (OrderDTO & { notificationDetails: AccountRequestNotificationDTO })[];
                return ( <div className="space-y-6"> <h2 className="text-2xl font-bold text-gray-900">Contas Solicitadas ({ordersForPaymentProcessing.length})</h2> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {ordersForPaymentProcessing.length === 0 ? ( <Card className="lg:col-span-3"><CardContent className="p-8 text-center"><CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">Nenhuma conta solicitada no momento.</p></CardContent></Card> ) : ( ordersForPaymentProcessing.map((orderWithNotification) => { const order = orderWithNotification; const notification = order.notificationDetails; const currentSelectedPayMethod = selectedPaymentMethodForOrder[order.id] || notification.requestedPaymentMethod || ''; return ( <Card key={notification.id} className="border-blue-300 border-2"> <CardHeader> <div className="flex justify-between items-center"> <CardTitle className="text-lg">Mesa {order.tableName} (Ped: #{order.id})</CardTitle> <Badge variant="outline">Cliente: {notification.userName}</Badge> </div> <p className="text-sm text-blue-600 font-semibold"> Pgto. Solicitado: {getPaymentMethodText(notification.requestedPaymentMethod)} </p> </CardHeader> <CardContent className="space-y-3"> <div className="text-center p-3 bg-blue-50 rounded-md"> <p className="text-sm text-blue-700">Total da Conta</p> <p className="text-2xl font-bold text-blue-800">R$ {order.totalValue.toFixed(2)}</p> </div> <div> <Label htmlFor={`payment-method-select-${order.id}`}>Confirmar Pagamento:</Label> <Select value={currentSelectedPayMethod} onValueChange={(value: PaymentMethod | '') => setSelectedPaymentMethodForOrder(prev => ({...prev, [order.id]: value as PaymentMethod}))} > <SelectTrigger id={`payment-method-select-${order.id}`}><SelectValue placeholder="Selecione..." /></SelectTrigger> <SelectContent> <SelectItem value="CARD">Cartão</SelectItem> <SelectItem value="CASH">Dinheiro</SelectItem> <SelectItem value="PIX">PIX</SelectItem> </SelectContent> </Select> </div> <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => markOrderAsPaidAndDeliverItems(order, currentSelectedPayMethod as PaymentMethod, notification.id)} disabled={!currentSelectedPayMethod} > <CreditCard className="h-4 w-4 mr-2" /> Processar Pagamento </Button> </CardContent> </Card> )}) )} </div> </div> );
            case "occupied-tables":
                const occupiedTables = tables.filter(t => t.status === "OCCUPIED");
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Mesas Ocupadas ({occupiedTables.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {occupiedTables.length === 0 ? (
                                <Card className="md:col-span-2"><CardContent className="p-6 text-center text-gray-500">Nenhuma mesa ocupada.</CardContent></Card>
                            ) : (
                                occupiedTables.map(table => {
                                    const orderOnTable = activeOrders.find(o => o.tableId === table.id && (o.status === "OPEN" || o.status === "UNPAID"));
                                    return (
                                        <Card key={table.id} className="border-red-300 shadow-md">
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <CardTitle>Mesa {table.number}</CardTitle>
                                                    <Badge variant="destructive">{getTableStatusText(table.status)}</Badge>
                                                </div>
                                                {orderOnTable && (
                                                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                                        <p><span className="font-medium">Cliente:</span> {orderOnTable.userName || "N/A"}</p>
                                                        <p><span className="font-medium">CPF:</span> {orderOnTable.userCpf || "N/A"}</p>
                                                    </div>
                                                )}
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-1">
                                                <p><span className="font-medium">Capacidade:</span> {table.capacity} pessoas</p>
                                                {orderOnTable ? (
                                                    <>
                                                        <p className="mt-2"><span className="font-medium">Comanda Ativa:</span> #{orderOnTable.id}</p>
                                                        <p className="font-bold text-base mt-1">Total: R$ {orderOnTable.totalValue.toFixed(2)}</p>
                                                        {orderOnTable.status === "UNPAID" && (
                                                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setActiveSection("account-requests")}>
                                                                <CreditCard className="h-4 w-4 mr-2" /> Ver Conta Solicitada
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-gray-500 italic mt-2">Sem comanda ativa nesta mesa.</p>
                                                )}
                                                {!orderOnTable && table.status === "OCCUPIED" && (
                                                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => updateTableStatus(table.id, "AVAILABLE")}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Liberar Mesa (Forçar)
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </div>
                );
            case "available-tables":
                const availableTables = tables.filter(t => t.status === "AVAILABLE");
                return ( <div className="space-y-6"> <h2 className="text-2xl font-bold">Mesas Livres ({availableTables.length})</h2> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {availableTables.length === 0 ? <Card className="sm:col-span-2 md:col-span-3 lg:col-span-4"><CardContent className="p-6 text-center text-gray-500">Nenhuma mesa livre.</CardContent></Card> : availableTables.map(table => (
                    <Dialog key={table.id} onOpenChange={(open) => { if(open) setNewOrderTableId(table.id); else {setNewOrderTableId(null); setNewOrderItems([]); setSelectedMenuItemId('');} }}>
                        <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-green-300">
                                <CardHeader className="text-center"> <CardTitle>Mesa {table.number}</CardTitle> <Badge variant="secondary" className="bg-green-100 text-green-700">{getTableStatusText(table.status)}</Badge> </CardHeader>
                                <CardContent className="text-center"> <Users className="mx-auto h-8 w-8 text-gray-400 mb-1" /> <p>{table.capacity} Lugares</p> </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent> <DialogHeader><DialogTitle>Novo Pedido - Mesa {table.number}</DialogTitle><DialogDescription>Adicione itens para iniciar um novo pedido para a Mesa {table.number}.</DialogDescription></DialogHeader> <div className="space-y-4 py-4"> <div> <Label htmlFor={`menuItemSelect-${table.id}`}>Adicionar Item</Label> <div className="flex gap-2"> <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}> <SelectTrigger id={`menuItemSelect-${table.id}`}><SelectValue placeholder="Selecione um item..." /></SelectTrigger> <SelectContent>{menuItems.map(mi => <SelectItem key={mi.id} value={mi.id.toString()}>{mi.name} (R${mi.price.toFixed(2)})</SelectItem>)}</SelectContent> </Select> <Button onClick={() => { const item = menuItems.find(mi => mi.id === Number(selectedMenuItemId)); if (item) setNewOrderItems(prev => { const existing = prev.find(i => i.id === item.id); return existing ? prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i) : [...prev, {...item, quantity: 1}]; }); }} disabled={!selectedMenuItemId} aria-label="Adicionar item selecionado"><Plus className="h-4 w-4"/></Button> </div> </div> {newOrderItems.length > 0 && ( <div className="border p-3 rounded-md max-h-48 overflow-y-auto bg-slate-50"> <h4 className="text-sm font-medium mb-2 text-gray-700">Itens do Pedido:</h4> {newOrderItems.map(item => ( <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-b-0"> <div> <span>{item.quantity}x {item.name}</span> <span className="text-xs text-gray-500 ml-2">(R$ {(item.price * item.quantity).toFixed(2)})</span> </div> <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewOrderItems(prev => prev.filter(i => i.id !== item.id))} aria-label={`Remover ${item.name}`}> <Trash2 className="h-4 w-4 text-red-500"/> </Button> </div> ))} <div className="font-bold text-right mt-2 pt-2 border-t"> Total: R$ {newOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)} </div> </div> )} </div> <div className="flex justify-end gap-2 mt-4"> <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose> <Button onClick={createNewOrder} disabled={newOrderItems.length === 0 || newOrderTableId !== table.id} >Criar Pedido</Button> </div> </DialogContent>
                    </Dialog>
                ))} </div> </div> );
            default:
                return <div className="text-center p-10 text-gray-500">Selecione uma opção no menu lateral para começar.</div>;
        }
    }, [ activeSection, tables, activeOrders, pendingItems, preparingItems, readyItems, stats, deliveredOrders, accountRequestNotifications, menuItems, dailySales, currentUserData, authToken, selectedPaymentMethodForOrder, newOrderItems, newOrderTableId, selectedMenuItemId, toast, handleStatusChange, markOrderAsPaidAndDeliverItems, updateTableStatus, createNewOrder, finishedOrders ]);
    
    return (
        <div className="min-h-screen bg-gray-100 flex">
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 h-full z-20">
                <div className="p-5 border-b border-gray-200"> <div className="flex items-center gap-3"> <div className="p-2 bg-orange-500 rounded-lg"><Utensils className="h-6 w-6 text-white" /></div> <div> <h1 className="text-lg font-bold text-gray-900">TableMaster</h1> <p className="text-xs text-gray-500">Painel do Garçom</p> </div> </div> </div>
                <ScrollArea className="flex-1">
                    <nav className="p-4 space-y-1">
                        {sidebarItems.map((category) => (
                            <div key={category.category} className="mb-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">{category.category}</h3>
                                {category.items.map((item) => (
                                    <button key={item.key} onClick={() => handleSidebarClick(item.key)} className={`w-full flex items-center justify-between p-3 rounded-md text-sm transition-colors ${ activeSection === item.key ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900" }`} >
                                        <div className="flex items-center gap-3"><item.icon className="h-5 w-5" />{item.label}</div>
                                        {item.count !== null && item.count > 0 && <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0.5 tabular-nums">{item.count}</Badge>}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </ScrollArea>
            </div>
            <div className="flex-1 flex flex-col ml-64">
                <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10"> <div className="flex items-center justify-between"> <div> <h1 className="text-xl font-semibold text-gray-800"> {sidebarItems.flatMap(cat => cat.items).find(it => it.key === activeSection)?.label || "Dashboard"} </h1> </div> <div className="text-right"> <div className="text-base font-medium text-gray-700">{currentTime.toLocaleTimeString('pt-BR')}</div> <div className="text-xs text-gray-500">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div> </div> </div> </header>
                <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
}