import { api } from "./api"

// Export our API client as "commerce" for backward compatibility with existing code
export const commerce = api

// Re-export types for components that need them
export type { Product, Category, Cart, Order } from "./api/types"
