'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

    // ✅ SAFE RATINGS (works even if rating doesn't exist)
    const ratings = Array.isArray(product?.rating) ? product.rating : []

    const rating =
        ratings.length > 0
            ? Math.round(
                ratings.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) /
                ratings.length
            )
            : 0

    // ✅ SAFE IMAGES
    const images = Array.isArray(product?.images) ? product.images : []
    const imageSrc =
        product?.main_image ||
        images[0] ||
        '/placeholder.png'

    // ✅ SAFE PRICE (fallback to MRP)
    const price = Number(product?.price ?? product?.mrp ?? 0)

    return (
        <Link
            href={`/product/${product.id}`}
            className="group max-xl:mx-auto"
        >
            <div className="bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                    width={500}
                    height={500}
                    className="max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300"
                    src={imageSrc}
                    alt={product?.name || 'Product'}
                />
            </div>

            <div className="flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60">
                <div>
                    <p className="font-medium">{product?.name}</p>

                    {/* ⭐ RATING */}
                    <div className="flex">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <StarIcon
                                key={index}
                                size={14}
                                className="mt-0.5"
                                fill={rating >= index + 1 ? '#00C950' : '#D1D5DB'}
                                stroke="none"
                            />
                        ))}
                    </div>
                </div>

                <p className="font-semibold">
                    {currency}{price.toLocaleString()}
                </p>
            </div>
        </Link>
    )
}

export default ProductCard
