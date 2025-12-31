'use client'

import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"
import { toast } from "react-hot-toast"

export default function StoreOrders() {
    const { user } = useUser()

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    /* ================= FETCH ORDERS ================= */
    const fetchOrders = async () => {
        if (!user?.id) return

        setLoading(true)

        try {
            // 1. Get store
            const { data: store, error: storeError } = await supabase
                .from("stores")
                .select("id")
                .eq("clerk_user_id", user.id)
                .single()

            if (storeError || !store) {
                toast.error("Store not found")
                return
            }

            // 2. Get orders
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    id,
                    total,
                    payment_method,
                    status,
                    is_paid,
                    created_at,
                    users (
                        name,
                        email
                    ),
                    addresses (
                        street,
                        city,
                        state,
                        zip,
                        country,
                        phone
                    ),
                    order_items (
                        quantity,
                        price,
                        products (
                            name,
                            images
                        )
                    ),
                    coupons (
                        code,
                        discount
                    )
                `)
                .eq("store_id", store.id)
                .order("created_at", { ascending: false })

            if (error) {
                console.error(error)
                toast.error("Failed to fetch orders")
                return
            }

            setOrders(data || [])
        } catch (err) {
            console.error(err)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    /* ================= UPDATE STATUS ================= */
    const updateOrderStatus = async (orderId, status) => {
        const prev = orders

        setOrders(prev =>
            prev.map(o => o.id === orderId ? { ...o, status } : o)
        )

        const { error } = await supabase
            .from("orders")
            .update({ status })
            .eq("id", orderId)

        if (error) {
            toast.error("Failed to update order")
            setOrders(prev)
        } else {
            toast.success("Order updated")
        }
    }

    const openModal = (order) => {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setSelectedOrder(null)
        setIsModalOpen(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [user?.id])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">
                Store <span className="text-slate-800 font-medium">Orders</span>
            </h1>

            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <div className="overflow-x-auto max-w-4xl rounded-md shadow border">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase">
                            <tr>
                                {["#", "Customer", "Total", "Payment", "Coupon", "Status", "Date"].map(h => (
                                    <th key={h} className="px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {orders.map((order, i) => (
                                <tr
                                    key={order.id}
                                    onClick={() => openModal(order)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-4 py-3">{i + 1}</td>
                                    <td className="px-4 py-3">{order.users?.name}</td>
                                    <td className="px-4 py-3 font-medium">${order.total}</td>
                                    <td className="px-4 py-3">{order.payment_method}</td>
                                    <td className="px-4 py-3">
                                        {order.coupons?.code || "—"}
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <select
                                            value={order.status}
                                            onChange={e =>
                                                toast.promise(
                                                    updateOrderStatus(order.id, e.target.value),
                                                    { loading: "Updating..." }
                                                )
                                            }
                                            className="border rounded text-sm"
                                        >
                                            <option>ORDER_PLACED</option>
                                            <option>PROCESSING</option>
                                            <option>SHIPPED</option>
                                            <option>DELIVERED</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(order.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ================= MODAL ================= */}
            {isModalOpen && selectedOrder && (
                <div
                    onClick={closeModal}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-lg p-6 max-w-2xl w-full"
                    >
                        <h2 className="text-xl font-semibold mb-4">Order Details</h2>

                        <p><b>Name:</b> {selectedOrder.users?.name}</p>
                        <p><b>Email:</b> {selectedOrder.users?.email}</p>
                        <p><b>Address:</b> {selectedOrder.addresses?.street}</p>

                        <div className="mt-4 space-y-2">
                            {selectedOrder.order_items.map((item, i) => (
                                <div key={i} className="border p-2 rounded">
                                    <p>{item.products?.name}</p>
                                    <p>Qty: {item.quantity}</p>
                                    <p>Price: ${item.price}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={closeModal}
                            className="mt-4 px-4 py-2 bg-slate-200 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
