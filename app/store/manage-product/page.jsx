'use client'

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"
import { FiEdit, FiTrash2 } from "react-icons/fi"

export default function StoreManageProducts() {
    const { user } = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])

    const [editingProduct, setEditingProduct] = useState(null)
    const [editInfo, setEditInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        main_image: null,
        images: {},
    })

    /* ================= FETCH PRODUCTS ================= */
    const fetchProducts = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const { data: store, error: storeError } = await supabase
                .from("stores")
                .select("id")
                .eq("clerk_user_id", user.id)
                .single()
            if (storeError || !store) return toast.error("Store not found")

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("store_id", store.id)
                .order("created_at", { ascending: false })
            if (error) return toast.error("Failed to load products")

            setProducts(data || [])
        } catch (err) {
            console.error(err)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    /* ================= TOGGLE STOCK ================= */
    const toggleStock = async (productId) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        const newStatus = !product.in_stock
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: newStatus } : p))

        const { error } = await supabase
            .from("products")
            .update({ in_stock: newStatus })
            .eq("id", productId)

        if (error) {
            toast.error("Failed to update stock")
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: !newStatus } : p))
        } else {
            toast.success("Stock updated")
        }
    }

    /* ================= DELETE PRODUCT ================= */
    const deleteProduct = async (productId) => {
        const ok = confirm("Are you sure you want to delete this product?")
        if (!ok) return

        setProducts(prev => prev.filter(p => p.id !== productId))
        const { error } = await supabase.from("products").delete().eq("id", productId)
        if (error) {
            toast.error("Failed to delete product")
            fetchProducts()
        } else toast.success("Product deleted")
    }

    /* ================= START EDIT ================= */
    const startEditing = (product) => {
        setEditingProduct(product)
        setEditInfo({
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            main_image: null,
            images: {},
        })
    }

    /* ================= SAVE EDIT ================= */
    const saveEdit = async () => {
        if (!editingProduct) return
        setLoading(true)
        try {
            let mainImageUrl = editingProduct.main_image

            // Upload new main image if selected
            if (editInfo.main_image) {
                const ext = editInfo.main_image.name.split('.').pop()
                const filePath = `${editingProduct.store_id}/main-${Date.now()}.${ext}`
                const { error: mainError } = await supabase.storage.from("products").upload(filePath, editInfo.main_image)
                if (mainError) return toast.error("Main image upload failed")
                const { data } = supabase.storage.from("products").getPublicUrl(filePath)
                mainImageUrl = data.publicUrl
            }

            // Upload additional images
            const uploadedImages = editingProduct.images || []
            for (const key of Object.keys(editInfo.images)) {
                const file = editInfo.images[key]
                if (!file) continue
                const ext = file.name.split('.').pop()
                const filePath = `${editingProduct.store_id}/${Date.now()}-${key}.${ext}`
                const { error } = await supabase.storage.from("products").upload(filePath, file)
                if (error) continue
                const { data } = supabase.storage.from("products").getPublicUrl(filePath)
                uploadedImages.push(data.publicUrl)
            }

            const { error } = await supabase
                .from("products")
                .update({
                    name: editInfo.name,
                    description: editInfo.description,
                    mrp: Number(editInfo.mrp),
                    price: Number(editInfo.price),
                    main_image: mainImageUrl,
                    images: uploadedImages,
                })
                .eq("id", editingProduct.id)

            if (error) return toast.error("Failed to update product")
            toast.success("Product updated")
            setEditingProduct(null)
            fetchProducts()
        } catch (err) {
            console.error(err)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [user?.id])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">
                Manage <span className="text-slate-800 font-medium">Products</span>
            </h1>

            {products.length === 0 ? (
                <p className="text-slate-500">No products added yet.</p>
            ) : (
                <table className="w-full max-w-4xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden md:table-cell">Description</th>
                            <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.map(product => (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center">
                                        {product.images?.[0] && (
                                            <Image width={40} height={40} src={product.images[0]} alt="" className="p-1 shadow rounded" />
                                        )}
                                        {product.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell truncate max-w-md">{product.description}</td>
                                <td className="px-4 py-3 hidden md:table-cell">{currency}{product.mrp.toLocaleString()}</td>
                                <td className="px-4 py-3">{currency}{product.price.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={product.in_stock} onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating stock..." })}/>
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-600 transition" />
                                            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition" />
                                        </label>

                                        {/* EDIT */}
                                        <button onClick={() => startEditing(product)} className="text-blue-600 hover:underline text-xs">
                                            <FiEdit size={16} />
                                        </button>

                                        {/* DELETE */}
                                        <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:underline text-xs">
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* EDIT MODAL */}
            {editingProduct && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Product</h2>

                        <input type="text" value={editInfo.name} onChange={e => setEditInfo({ ...editInfo, name: e.target.value })} className="w-full mb-2 p-2 border rounded" />
                        <textarea value={editInfo.description} onChange={e => setEditInfo({ ...editInfo, description: e.target.value })} className="w-full mb-2 p-2 border rounded" />
                        <input type="number" value={editInfo.mrp} onChange={e => setEditInfo({ ...editInfo, mrp: e.target.value })} className="w-full mb-2 p-2 border rounded" />
                        <input type="number" value={editInfo.price} onChange={e => setEditInfo({ ...editInfo, price: e.target.value })} className="w-full mb-2 p-2 border rounded" />

                        {/* MAIN IMAGE */}
                        <label className="block mb-2">
                            Main Image
                            <input type="file" accept="image/*" onChange={e => setEditInfo({ ...editInfo, main_image: e.target.files[0] })} className="w-full mt-1"/>
                        </label>

                        {/* ADDITIONAL IMAGES */}
                        <label className="block mb-2">
                            Additional Images
                            <input type="file" accept="image/*" multiple onChange={e => {
                                const files = Array.from(e.target.files)
                                const imagesObj = {}
                                files.forEach((f, i) => imagesObj[i] = f)
                                setEditInfo({ ...editInfo, images: imagesObj })
                            }} className="w-full mt-1"/>
                        </label>

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
