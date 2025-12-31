'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"

export default function AdminApprove() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    /* ---------------- FETCH STORES PENDING APPROVAL ---------------- */
    const fetchStores = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("stores")
                .select("*")
                .eq("status", "pending") // fetch only pending stores
                .order("created_at", { ascending: true })

            if (error) throw error
            setStores(data || [])
        } catch (err) {
            console.error("FETCH STORES ERROR 👉", err)
            toast.error("Failed to load stores")
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- APPROVE OR REJECT STORE ---------------- */
    const handleApprove = async ({ storeId, status }) => {
        try {
            const { error } = await supabase
                .from("stores")
                .update({ status })
                .eq("id", storeId)

            if (error) throw error

            setStores(prev => prev.filter(s => s.id !== storeId)) // remove from pending list
            toast.success(`Store ${status}`)
        } catch (err) {
            console.error("APPROVE STORE ERROR 👉", err)
            toast.error("Failed to update store status")
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl">
                            {/* STORE INFO */}
                            <StoreInfo store={store} />

                            {/* ACTIONS */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button
                                    onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'approved' }), { loading: "Approving..." })}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'rejected' }), { loading: "Rejecting..." })}
                                    className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No Application Pending</h1>
                </div>
            )}
        </div>
    )
}
