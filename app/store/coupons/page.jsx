'use client'

import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon, EditIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"

export default function Coupons() {
    const { user } = useUser()

    const [loading, setLoading] = useState(true)
    const [storeId, setStoreId] = useState(null)
    const [coupons, setCoupons] = useState([])

    const [newCoupon, setNewCoupon] = useState({
        id: null, // for edit
        code: '',
        description: '',
        discount: '',
        expiresAt: format(new Date(), 'yyyy-MM-dd'),
    })

    /* ---------------- FETCH STORE + COUPONS ---------------- */
    const fetchCoupons = async () => {
        if (!user?.id) return

        setLoading(true)

        const { data: store, error: storeError } = await supabase
            .from("stores")
            .select("id")
            .eq("clerk_user_id", user.id)
            .single()

        if (storeError || !store) {
            toast.error("Store not found")
            setLoading(false)
            return
        }

        setStoreId(store.id)

        const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("store_id", store.id)
            .order("created_at", { ascending: false })

        if (error) toast.error("Failed to fetch coupons")
        else setCoupons(data || [])

        setLoading(false)
    }

    /* ---------------- ADD OR EDIT COUPON ---------------- */
    const handleAddOrEditCoupon = async () => {
        if (!storeId) throw "Store not ready"
        if (!newCoupon.code || !newCoupon.discount) throw "Missing required fields"

        // EDIT
        if (newCoupon.id) {
            const { error } = await supabase
                .from("coupons")
                .update({
                    code: newCoupon.code.toUpperCase(),
                    description: newCoupon.description || null,
                    discount: Number(newCoupon.discount),
                    expires_at: new Date(newCoupon.expiresAt),
                })
                .eq("id", newCoupon.id)

            if (error) throw error.message
            toast.success("Coupon updated")
        } else { // ADD
            if (coupons.some(c => c.code.toUpperCase() === newCoupon.code.toUpperCase())) {
                throw "Coupon code already exists"
            }

            const { error } = await supabase
                .from("coupons")
                .insert({
                    store_id: storeId,
                    code: newCoupon.code.toUpperCase(),
                    description: newCoupon.description || null,
                    discount: Number(newCoupon.discount),
                    expires_at: new Date(newCoupon.expiresAt),
                })

            if (error) throw error.message
            toast.success("Coupon added")
        }

        setNewCoupon({
            id: null,
            code: '',
            description: '',
            discount: '',
            expiresAt: format(new Date(), 'yyyy-MM-dd'),
        })

        await fetchCoupons()
    }

    /* ---------------- DELETE COUPON ---------------- */
    const deleteCoupon = async (id) => {
        const { error } = await supabase
            .from("coupons")
            .delete()
            .eq("id", id)

        if (error) throw error.message
        setCoupons(prev => prev.filter(c => c.id !== id))
    }

    /* ---------------- PREFILL FORM FOR EDIT ---------------- */
    const editCoupon = (coupon) => {
        setNewCoupon({
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount: coupon.discount,
            expiresAt: format(new Date(coupon.expires_at), 'yyyy-MM-dd'),
        })
    }

    useEffect(() => {
        fetchCoupons()
    }, [user])

    if (loading) return <p className="text-slate-400">Loading coupons…</p>

    return (
        <div className="text-slate-500 mb-40">

            {/* Add/Edit Coupon */}
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    toast.promise(handleAddOrEditCoupon(), {
                        loading: newCoupon.id ? "Updating coupon..." : "Adding coupon...",
                        success: "Success",
                        error: (err) => err,
                    })
                }}
                className="max-w-sm text-sm"
            >
                <h2 className="text-2xl">{newCoupon.id ? "Edit" : "Add"} <span className="text-slate-800 font-medium">Coupon</span></h2>
                <div className="flex gap-2 max-sm:flex-col mt-2">
                    <input type="text" placeholder="Coupon Code" className="w-full mt-2 p-2 border border-slate-200 rounded-md"
                        value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} required />
                    <input type="number" placeholder="Discount (%)" min={1} max={100} className="w-full mt-2 p-2 border border-slate-200 rounded-md"
                        value={newCoupon.discount} onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })} required />
                </div>
                <input type="text" placeholder="Description" className="w-full mt-2 p-2 border border-slate-200 rounded-md"
                    value={newCoupon.description} onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })} />
                <label className="block mt-3">
                    <p>Coupon Expiry Date</p>
                    <input type="date" className="w-full mt-1 p-2 border border-slate-200 rounded-md"
                        value={newCoupon.expiresAt} onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} required />
                </label>
                <button className="mt-4 p-2 px-10 rounded bg-slate-700 text-white active:scale-95 transition">
                    {newCoupon.id ? "Update Coupon" : "Add Coupon"}
                </button>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl">List <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200 max-w-4xl">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Expires At</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-400">No coupons yet</td>
                                </tr>
                            ) : (
                                coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-slate-800">{coupon.code}</td>
                                        <td className="py-3 px-4 text-slate-800">{coupon.description}</td>
                                        <td className="py-3 px-4 text-slate-800">{coupon.discount}%</td>
                                        <td className="py-3 px-4 text-slate-800">{format(new Date(coupon.expires_at), 'yyyy-MM-dd')}</td>
                                        <td className="py-3 px-4 text-slate-800 flex gap-2">
                                            <EditIcon className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                                                onClick={() => editCoupon(coupon)} />
                                            <DeleteIcon className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-800"
                                                onClick={() => toast.promise(deleteCoupon(coupon.id), { loading: "Deleting...", success: "Deleted", error: "Failed" })} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
