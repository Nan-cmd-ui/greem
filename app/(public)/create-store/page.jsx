'use client'

import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function CreateStore() {
  const { user } = useUser()
  const router = useRouter()
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(5) // added countdown state

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: null
  })

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
  }

  const fetchSellerStatus = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("stores")
      .select("status")
      .eq("clerk_user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      toast.error(error.message)
    }

    if (data) {
      setAlreadySubmitted(true)
      setStatus(data.status)
      setMessage(
        data.status === "approved"
          ? "Your store is approved 🎉"
          : "Your store is under review"
      )
    }

    setLoading(false)
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!user) throw new Error("Not authenticated")

    if (
      !storeInfo.username.trim() ||
      !storeInfo.name.trim() ||
      !storeInfo.email.trim() ||
      !storeInfo.contact.trim() ||
      !storeInfo.address.trim()
    ) {
      toast.error("Please fill all required fields")
      return
    }

    const { data: existing, error: checkError } = await supabase
      .from("stores")
      .select("id")
      .eq("username", storeInfo.username.trim())
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      toast.error(checkError.message)
      return
    }

    if (existing) {
      toast.error("This username is already taken. Please choose another one.")
      return
    }

    let logoUrl = null
    if (storeInfo.image) {
      try {
        const fileExt = storeInfo.image.name.split(".").pop()
        const filePath = `${user.id}-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("store-logos")
          .upload(filePath, storeInfo.image)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from("store-logos")
          .getPublicUrl(filePath)

        logoUrl = data.publicUrl
      } catch (err) {
        console.error("Logo upload failed:", err)
        toast.error(`Logo upload failed: ${err.message}. Store will be created without it.`)
        logoUrl = null
      }
    }

    const { error } = await supabase.from("stores").insert({
      clerk_user_id: user.id,
      name: storeInfo.name.trim(),
      username: storeInfo.username.trim(),
      description: storeInfo.description?.trim() || null,
      email: storeInfo.email.trim(),
      contact: storeInfo.contact.trim(),
      address: storeInfo.address.trim(),
      logo: logoUrl,
      status: "pending",
      is_active: false
    })

    if (error) {
      console.error("Store insert failed:", error.message)
      toast.error(error.message)
      return
    }

    setAlreadySubmitted(true)
    setMessage("Your store has been submitted for review 🚀")
  }

  useEffect(() => {
    fetchSellerStatus()
  }, [user])

  // countdown and redirect
  useEffect(() => {
    if (status === "approved") {
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)

      const timeout = setTimeout(() => {
        router.push("/store")
      }, 5000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [status, router])

  if (loading) return <Loading />

  return (
    <>
      {!alreadySubmitted ? (
        <div className="mx-6 min-h-[70vh] my-16">
          <form
            onSubmit={(e) =>
              toast.promise(onSubmitHandler(e), {
                loading: "Submitting data...",
                success: "Store submitted successfully",
                error: (err) => err.message
              })
            }
            className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500"
          >
            <div>
              <h1 className="text-3xl ">
                Add Your <span className="text-slate-800 font-medium">Store</span>
              </h1>
              <p className="max-w-lg">
                To become a seller on GoCart, submit your store details for review. Your store will be activated after admin verification.
              </p>
            </div>

            <label className="mt-10 cursor-pointer">
              Store Logo
              <Image
                src={storeInfo.image ? URL.createObjectURL(storeInfo.image) : assets.upload_area}
                className="rounded-lg mt-2 h-16 w-auto"
                alt=""
                width={150}
                height={100}
              />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })}
              />
            </label>

            <p>Username</p>
            <input
              name="username"
              onChange={onChangeHandler}
              value={storeInfo.username}
              type="text"
              required
              placeholder="Enter your store username"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Name</p>
            <input
              name="name"
              onChange={onChangeHandler}
              value={storeInfo.name}
              type="text"
              required
              placeholder="Enter your store name"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Description</p>
            <textarea
              name="description"
              onChange={onChangeHandler}
              value={storeInfo.description}
              rows={5}
              placeholder="Enter your store description"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <p>Email</p>
            <input
              name="email"
              onChange={onChangeHandler}
              value={storeInfo.email}
              type="email"
              required
              placeholder="Enter your store email"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Contact Number</p>
            <input
              name="contact"
              onChange={onChangeHandler}
              value={storeInfo.contact}
              type="text"
              required
              placeholder="Enter your store contact number"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Address</p>
            <textarea
              name="address"
              onChange={onChangeHandler}
              value={storeInfo.address}
              rows={5}
              required
              placeholder="Enter your store address"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">
              Submit
            </button>
          </form>
        </div>
      ) : (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
          {status === "approved" && (
            <p className="mt-5 text-slate-400">
              Redirecting to store in <span className="font-semibold">{countdown}</span> seconds
            </p>
          )}
        </div>
      )}
    </>
  )
}
