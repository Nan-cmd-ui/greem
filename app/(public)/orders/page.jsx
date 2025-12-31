'use client'

import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react"
import OrderItem from "@/components/OrderItem"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"

export default function Orders() {
  const { user } = useUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  /* ---------------- FETCH ORDERS ---------------- */
  const fetchOrders = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*") // adjust to join related tables if needed
        .eq("clerk_user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (err) {
      console.error("FETCH ORDERS ERROR 👉", err)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  if (loading) return <Loading />

  return (
    <div className="min-h-[70vh] mx-6">
      {orders.length > 0 ? (
        <div className="my-20 max-w-7xl mx-auto">
          <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

          <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
            <thead>
              <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                <th className="text-left">Product</th>
                <th className="text-center">Total Price</th>
                <th className="text-left">Address</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderItem order={order} key={order.id} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
          <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
        </div>
      )}
    </div>
  )
}
