'use client'

import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"

export default function AdminStores() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    /* ================= FETCH STORES ================= */
    const fetchStores = async () => {
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from("stores")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error

            setStores(data || [])
        } catch (err) {
            console.error("FETCH STORES ERROR 👉", err)
            toast.error("Failed to load stores")
        } finally {
            setLoading(false)
        }
    }

    /* ================= TOGGLE STORE ACTIVE ================= */
    const toggleIsActive = async (storeId) => {
        try {
            const store = stores.find(s => s.id === storeId)
            if (!store) return

            const { error } = await supabase
                .from("stores")
                .update({ is_active: !store.is_active })
                .eq("id", storeId)

            if (error) throw error

            // Update UI instantly (no refetch needed)
            setStores(prev =>
                prev.map(s =>
                    s.id === storeId
                        ? { ...s, is_active: !s.is_active }
                        : s
                )
            )

            toast.success("Store status updated")
        } catch (err) {
            console.error("TOGGLE STORE ERROR 👉", err)
            toast.error("Failed to update store")
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">
                Live <span className="text-slate-800 font-medium">Stores</span>
            </h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div
                            key={store.id}
                            className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl"
                        >
                            {/* STORE INFO */}
                            <StoreInfo store={store} />

                            {/* ACTIONS */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <p>Active</p>

                                <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={store.is_active}
                                        onChange={() =>
                                            toast.promise(
                                                toggleIsActive(store.id),
                                                { loading: "Updating store..." }
                                            )
                                        }
                                    />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">
                        No stores available
                    </h1>
                </div>
            )}
        </div>
    )
}
