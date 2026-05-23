"use client"

import { useEffect, useState, useRef, useTransition } from "react"
import { MessageSquare, X, Send, Sparkles, Facebook, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { commerce } from "@/lib/commerce"
import type { Product } from "@/lib/api/types"
import { AppLink } from "@/components/app-link"
import { formatDisplayMoney } from "@/lib/currency"

interface Message {
  role: "user" | "model"
  text: string
  slugs?: string[]
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"ai" | "messenger">("ai")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Xin chào! Mình là **AI Stylist** của XuThi. Bạn đang tìm kiếm một đôi giày cho dịp gì (ví dụ: đi tiệc prom, đi chơi biển, đi làm)? Hãy chia sẻ để mình tư vấn nhé! 💖",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change or open status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("xuthi_chat_history")
      if (saved) {
        setMessages(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load chat history from localStorage:", e)
    }
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      if (messages.length > 1) {
        localStorage.setItem("xuthi_chat_history", JSON.stringify(messages))
      }
    } catch (e) {
      console.error("Failed to save chat history to localStorage:", e)
    }
  }, [messages])

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện không?")) {
      const initial = [
        {
          role: "model" as const,
          text: "Xin chào! Mình là **AI Stylist** của XuThi. Bạn đang tìm kiếm một đôi giày cho dịp gì (ví dụ: đi tiệc prom, đi chơi biển, đi làm)? Hãy chia sẻ để mình tư vấn nhé! 💖",
        },
      ]
      setMessages(initial)
      localStorage.removeItem("xuthi_chat_history")
    }
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || isPending) return

    setInputValue("")
    const newMessages = [...messages, { role: "user" as const, text }]
    setMessages(newMessages)

    startTransition(async () => {
      try {
        const history = newMessages.slice(1, -1).map((m) => ({
          role: m.role,
          text: m.text,
        }))

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            history,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // Parse recommended slugs out of AI response
          const jsonMatch = data.text.match(/```json\s*([\s\S]*?)\s*```/)
          let slugs: string[] = []
          let cleanText = data.text
          
          if (jsonMatch) {
            try {
              slugs = JSON.parse(jsonMatch[1])
              cleanText = data.text.replace(jsonMatch[0], "").trim()
            } catch (e) {
              console.error("Failed to parse recommended slugs:", e)
            }
          }

          setMessages((prev) => [
            ...prev,
            { role: "model" as const, text: cleanText, slugs },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "model" as const,
              text: "Xin lỗi bạn, mình gặp chút sự cố khi kết nối hệ thống. Bạn có thể thử lại sau nhé!",
            },
          ])
        }
      } catch (err) {
        console.error("AI Chat error:", err)
        setMessages((prev) => [
          ...prev,
          {
            role: "model" as const,
            text: "Đã xảy ra lỗi kết nối. Vui lòng kiểm tra mạng của bạn.",
          },
        ])
      }
    })
  }

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Dialog Widget */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[380px] h-[520px] bg-card text-card-foreground border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">Trợ lý mua sắm XuThi</h3>
                <p className="text-[10px] opacity-85">Phục vụ 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 1 && (
                <button
                  onClick={handleClearHistory}
                  title="Xóa lịch sử trò chuyện"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "ai"
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tư vấn AI Stylist
            </button>
            <button
              onClick={() => setActiveTab("messenger")}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "messenger"
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Facebook className="h-3.5 w-3.5" />
              Messenger Chat
            </button>
          </div>

          {/* Tab Content: AI Stylist Chatbot */}
          {activeTab === "ai" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-secondary/15">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card text-foreground border border-border/40 rounded-tl-none"
                      }`}
                    >
                      {/* Very basic custom markdown parser for bold styling */}
                      {m.text.split("\n").map((line, lIdx) => (
                        <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                          {line.split("**").map((part, pIdx) =>
                            pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold">{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Shoppable suggestion cards */}
                    {m.slugs && m.slugs.length > 0 && (
                      <div className="w-full mt-3 grid grid-cols-2 gap-2 pl-4">
                        {m.slugs.map((slug) => (
                          <SuggestedCard key={slug} slug={slug} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isPending && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs pl-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    AI Stylist đang suy nghĩ...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border/40 bg-muted/10">
                <button
                  onClick={() => handleQuickPrompt("Tìm giày đi tiệc cưới cao gót sang chảnh 👠")}
                  className="text-[10px] px-2 py-1 bg-card hover:bg-secondary border border-border/60 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  Giày đi tiệc cưới 👠
                </button>
                <button
                  onClick={() => handleQuickPrompt("Mình muốn mua đôi sandal đi biển năng động 🏖️")}
                  className="text-[10px] px-2 py-1 bg-card hover:bg-secondary border border-border/60 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sandal đi biển 🏖️
                </button>
                <button
                  onClick={() => handleQuickPrompt("Gợi ý giày bệt đi làm êm chân 👟")}
                  className="text-[10px] px-2 py-1 bg-card hover:bg-secondary border border-border/60 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  Giày đi làm 👟
                </button>
              </div>

              {/* Input Form */}
              <div className="p-3 border-t border-border flex gap-2 bg-card">
                <Input
                  placeholder="Hỏi AI Stylist bất cứ điều gì..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isPending}
                  className="text-xs focus-visible:ring-1"
                />
                <Button onClick={handleSend} size="icon" disabled={isPending} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tab Content: Facebook Messenger */}
          {activeTab === "messenger" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-secondary/15 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Facebook className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-bold text-sm">Chat trực tiếp qua Messenger</h4>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Kết nối trực tiếp với đội ngũ Chăm sóc khách hàng của XuThi để được giải quyết thắc mắc về đơn hàng, đổi trả nhanh nhất.
              </p>
              <Button asChild size="sm" className="mt-2 font-semibold">
                <a href="https://m.me/huavanlyy" target="_blank" rel="noopener noreferrer">
                  Mở Messenger Chat
                </a>
              </Button>
              <p className="text-[10px] text-gray-400">Hoặc inbox fanpage: fb.com/huavanlyy</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 bg-primary hover:bg-primary/95 text-primary-foreground"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  )
}

/* Helper Component: Shoppable suggestion card rendering from slug */
function SuggestedCard({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    commerce.productGet({ idOrSlug: slug })
      .then((res) => {
        setProduct(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="border border-border/40 rounded-xl bg-card p-2 flex flex-col justify-between h-28 animate-pulse">
        <div className="h-12 w-full bg-muted rounded-md" />
        <div className="h-3 w-16 bg-muted rounded mt-2" />
      </div>
    )
  }

  if (!product) return null

  return (
    <AppLink href={`/product/${product.slug}`} className="border border-border/55 rounded-xl bg-card p-2 hover:shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between text-left group h-auto">
      <div>
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted w-full relative">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        <h5 className="font-semibold text-[11px] text-foreground truncate mt-2 group-hover:text-primary transition-colors">
          {product.name}
        </h5>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground mt-1">
        {formatDisplayMoney({ amountInVnd: BigInt(product.variants?.[0]?.price || 0), currency: "VND" })}
      </p>
    </AppLink>
  )
}
