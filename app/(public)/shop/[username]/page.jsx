'use client'

import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"

export default function StoreShop() {

    const { username } = useParams()

    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    /* ================= FETCH STORE + PRODUCTS ================= */
    const fetchStoreData = async () => {
        setLoading(true)

        try {
            /* -------- GET STORE BY USERNAME -------- */
            const { data: store, error: storeError } = await supabase
                .from("stores")
                .select("*")
                .eq("username", username)
                .eq("is_active", true)
                .single()

            if (storeError || !store) {
                toast.error("Store not found")
                return
            }

            setStoreInfo(store)

            /* -------- GET STORE PRODUCTS -------- */
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select("*")
                .eq("store_id", store.id)
                .eq("in_stock", true)
                .order("created_at", { ascending: false })

            if (productsError) throw productsError

            setProducts(productsData || [])

        } catch (err) {
            console.error("STORE SHOP ERROR 👉", err)
            toast.error("Failed to load store")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (username) fetchStoreData()
    }, [username])

    if (loading) return <Loading />

    return (
        <div className="min-h-[70vh] mx-6">

            {/* STORE INFO BANNER */}
            {storeInfo && (
                <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                    <Image
                        src={storeInfo.logo || "/placeholder.png"}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-slate-800">
                            {storeInfo.name}
                        </h1>

                        <p className="text-sm text-slate-600 mt-2 max-w-lg">
                            {storeInfo.description}
                        </p>

                        <div className="space-y-2 text-sm text-slate-500 mt-4">
                            {storeInfo.address && (
                                <div className="flex items-center">
                                    <MapPinIcon className="w-4 h-4 mr-2" />
                                    <span>{storeInfo.address}</span>
                                </div>
                            )}

                            {storeInfo.email && (
                                <div className="flex items-center">
                                    <MailIcon className="w-4 h-4 mr-2" />
                                    <span>{storeInfo.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCTS */}
            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">
                    Shop <span className="text-slate-800 font-medium">Products</span>
                </h1>

                {products.length ? (
                    <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="h-60 flex items-center justify-center text-slate-400">
                        <h2 className="text-xl">No products available</h2>
                    </div>
                )}
            </div>
        </div>
    )
}
