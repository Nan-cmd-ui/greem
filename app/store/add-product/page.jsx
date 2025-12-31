'use client'

import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"

export default function StoreAddProduct() {
    const { user } = useUser()

    const [mainImage, setMainImage] = useState(null)
    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
    })
    const [loading, setLoading] = useState(false)

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (!user?.id) return toast.error("Not authenticated")

        setLoading(true)

        try {
            /* 1. Get store */
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

            /* 2. Upload main image */
            let mainImageUrl = null
            if (mainImage) {
                const ext = mainImage.name.split('.').pop()
                const filePath = `${store.id}/main-${Date.now()}.${ext}`

                const { error: mainUploadError } = await supabase.storage
                    .from("products")
                    .upload(filePath, mainImage)

                if (mainUploadError) {
                    console.error(mainUploadError)
                    toast.error("Main image upload failed")
                } else {
                    const { data } = supabase.storage
                        .from("products")
                        .getPublicUrl(filePath)
                    mainImageUrl = data.publicUrl
                }
            }

            /* 3. Upload other images */
            const uploadedImages = []
            for (const key of Object.keys(images)) {
                const file = images[key]
                if (!file) continue

                const ext = file.name.split('.').pop()
                const filePath = `${store.id}/${Date.now()}-${key}.${ext}`

                const { error: uploadError } = await supabase.storage
                    .from("products")
                    .upload(filePath, file)

                if (uploadError) {
                    console.error(uploadError)
                    toast.error("Image upload failed")
                    continue
                }

                const { data } = supabase.storage
                    .from("products")
                    .getPublicUrl(filePath)

                uploadedImages.push(data.publicUrl)
            }

            /* 4. Insert product */
            const { error: productError } = await supabase
                .from("products")
                .insert({
                    store_id: store.id,
                    name: productInfo.name,
                    description: productInfo.description,
                    mrp: Number(productInfo.mrp),
                    price: Number(productInfo.price),
                    main_image: mainImageUrl,
                    images: uploadedImages,
                })

            if (productError) {
                console.error(productError)
                toast.error("Failed to create product")
                return
            }

            toast.success("Product created successfully 🎉")

            /* 5. Reset form */
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
            })
            setMainImage(null)
            setImages({ 1: null, 2: null, 3: null, 4: null })

        } catch (err) {
            console.error(err)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={(e) => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })}
            className="text-slate-500 mb-28"
        >
            <h1 className="text-2xl">
                Add New <span className="text-slate-800 font-medium">Products</span>
            </h1>

            {/* MAIN IMAGE */}
            <label className="flex flex-col gap-2 mt-7">
                Main Image
                <Image
                    width={300}
                    height={300}
                    src={mainImage ? URL.createObjectURL(mainImage) : assets.upload_area}
                    className="h-15 w-auto border border-slate-200 rounded cursor-pointer"
                    alt=""
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMainImage(e.target.files[0])}
                    hidden
                />
            </label>

            {/* OTHER IMAGES */}
            <p className="mt-7">Other Images (optional)</p>
            <div className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image
                            width={300}
                            height={300}
                            className="h-15 w-auto border border-slate-200 rounded cursor-pointer"
                            src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area}
                            alt=""
                        />
                        <input
                            type="file"
                            accept="image/*"
                            id={`images${key}`}
                            onChange={(e) =>
                                setImages({ ...images, [key]: e.target.files[0] })
                            }
                            hidden
                        />
                    </label>
                ))}
            </div>

            <label className="flex flex-col gap-2 my-6">
                Name
                <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={productInfo.name}
                    className="w-full max-w-sm p-2 px-4 border rounded"
                    required
                />
            </label>

            <label className="flex flex-col gap-2 my-6">
                Description
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    rows={5}
                    className="w-full max-w-sm p-2 px-4 border rounded resize-none"
                    required
                />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2">
                    Actual Price ($)
                    <input
                        type="number"
                        name="mrp"
                        onChange={onChangeHandler}
                        value={productInfo.mrp}
                        className="w-full p-2 px-4 border rounded"
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    Offer Price ($)
                    <input
                        type="number"
                        name="price"
                        onChange={onChangeHandler}
                        value={productInfo.price}
                        className="w-full p-2 px-4 border rounded"
                        required
                    />
                </label>
            </div>

            <button
                disabled={loading}
                className="bg-slate-800 text-white px-6 mt-7 py-2 rounded hover:bg-slate-900 transition"
            >
                Add Product
            </button>
        </form>
    )
}
