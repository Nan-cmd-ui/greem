'use client'

import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import {
    CircleDollarSignIcon,
    ShoppingBasketIcon,
    StoreIcon,
    TagsIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        {
            title: 'Total Revenue',
            value: currency + dashboardData.revenue.toLocaleString(),
            icon: CircleDollarSignIcon
        },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon },
    ]

    /* ================= FETCH DASHBOARD DATA ================= */
    const fetchDashboardData = async () => {
        setLoading(true)

        try {
            /* PRODUCTS COUNT */
            const { count: productsCount, error: productsError } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })

            if (productsError) throw productsError

            /* STORES COUNT */
            const { count: storesCount, error: storesError } = await supabase
                .from("stores")
                .select("*", { count: "exact", head: true })

            if (storesError) throw storesError

            /* ORDERS + REVENUE */
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("id, total, created_at")
                .order("created_at", { ascending: true })

            if (ordersError) throw ordersError

            const totalRevenue = (orders || []).reduce(
                (sum, order) => sum + Number(order.total || 0),
                0
            )

            setDashboardData({
                products: productsCount || 0,
                stores: storesCount || 0,
                orders: orders.length,
                revenue: totalRevenue,
                allOrders: orders,
            })

        } catch (err) {
            console.error("DASHBOARD ERROR 👉", err)
            toast.error(err.message || "Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">
                Admin <span className="text-slate-800 font-medium">Dashboard</span>
            </h1>

            {/* STATS CARDS */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {dashboardCardsData.map((card, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg"
                    >
                        <div className="flex flex-col gap-3 text-xs">
                            <p>{card.title}</p>
                            <b className="text-2xl font-medium text-slate-700">
                                {card.value}
                            </b>
                        </div>
                        <card.icon
                            size={50}
                            className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full"
                        />
                    </div>
                ))}
            </div>

            {/* ORDERS CHART */}
            <OrdersAreaChart allOrders={dashboardData.allOrders} />
        </div>
    )
}
