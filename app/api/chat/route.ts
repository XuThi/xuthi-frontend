import { NextResponse } from "next/server"
import { api } from "@/lib/api/client"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

export const runtime = "nodejs"
export const preferredRegion = "sin1"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history = [] } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // 1. Fetch active products from the C# backend API
    const browseResult = await api.productBrowse({ active: true, limit: 50 })
    const activeProducts = browseResult.data || []

    const catalogSummary = activeProducts.map((p) => ({
      name: p.name,
      slug: p.slug,
      summary: p.summary || p.name,
      price: p.variants?.[0]?.price ? `${Number(p.variants[0].price).toLocaleString("vi-VN")}đ` : "Liên hệ",
    }))

    // 2. Prepare system instructions
    const systemInstruction = `
You are XuThi AI Assistant, an expert Vietnamese fashion stylist and shopper assistant for XuThi Store.
Your job is to help the user find the perfect shoes from our store catalog for their needs (e.g. holidays, prom, weddings, night out, casual wear).
Guidelines:
1. Always respond politely, enthusiastically, and professionally.
2. Respond in the same language as the user (default to Vietnamese).
3. Recommend exactly 1-3 products from the catalog that match their request. Give a very short reason (maximum 1 sentence) for each product recommended.
4. Keep your answer highly readable using markdown (bullet points).
5. Be extremely concise. Keep the total conversational text response to a maximum of 2-3 sentences. Do not write long paragraphs.
6. Crucial: At the very end of your response, you MUST output a structured JSON block enclosed in \`\`\`json and \`\`\` that lists the recommended product slugs. The UI will parse this JSON to render interactive shoppable product cards!
Example:
\`\`\`json
[
  "holiday-shoe-black",
  "night-prom-shoe-white"
]
\`\`\`

Here is our active product catalog:
${JSON.stringify(catalogSummary, null, 2)}
`

    // 3. Fallback mock response if GEMINI_API_KEY is not configured
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to trial simulator.")
      // Simulator logic
      const promptLower = message.toLowerCase()
      let suggestions = activeProducts.slice(0, 2)
      
      if (promptLower.includes("prom") || promptLower.includes("tiệc") || promptLower.includes("tối")) {
        const found = activeProducts.filter(p => p.name.toLowerCase().includes("tiệc") || p.name.toLowerCase().includes("prom") || p.name.toLowerCase().includes("cao gót"))
        if (found.length > 0) suggestions = found.slice(0, 2)
      } else if (promptLower.includes("holiday") || promptLower.includes("du lịch") || promptLower.includes("đi chơi")) {
        const found = activeProducts.filter(p => p.name.toLowerCase().includes("sandal") || p.name.toLowerCase().includes("bệt") || p.name.toLowerCase().includes("holiday"))
        if (found.length > 0) suggestions = found.slice(0, 2)
      }

      const slugList = suggestions.map(s => s.slug)
      const mockText = `Chào bạn! Mình gợi ý các sản phẩm phù hợp cho bạn từ bộ sưu tập của XuThi:
${suggestions.map(s => `* **${s.name}**: ${Number(s.variants?.[0]?.price).toLocaleString("vi-VN")}đ.`).join("\n")}
Nhấp vào thẻ bên dưới để xem chi tiết nhé!

\`\`\`json
${JSON.stringify(slugList, null, 2)}
\`\`\`
`
      return NextResponse.json({ text: mockText })
    }

    // 4. Build message contents for Gemini API (including history)
    const contents = []
    
    // Add history
    for (const turn of history) {
      contents.push({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.text }]
      })
    }

    // Add current message with system instruction
    contents.push({
      role: "user",
      parts: [{ text: `${systemInstruction}\n\nUser request: "${message}"` }]
    })

    // 5. Call the official Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình gặp lỗi nhỏ khi xử lý thông tin."

    return NextResponse.json({ text: responseText })
  } catch (err) {
    console.error("AI Chat BFF error:", err)
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình xử lý câu hỏi." },
      { status: 500 }
    )
  }
}
