import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const { isAuth, token } = useAuth()

  const fetchCart = useCallback(async () => {
    if (!isAuth) { setCartItems([]); return }
    setCartLoading(true)
    try {
      const res = await api.get('/cart')
      setCartItems(res.data)
    } catch {
      setCartItems([])
    } finally {
      setCartLoading(false)
    }
  }, [isAuth])

  useEffect(() => { fetchCart() }, [fetchCart, token])

  const addToCart = async (item_id, quantity = 1) => {
    await api.post('/cart/add', { item_id, quantity })
    await fetchCart()
  }

  const updateQty = async (cart_id, quantity) => {
    await api.put(`/cart/update/${cart_id}`, { quantity })
    await fetchCart()
  }

  const removeFromCart = async (cart_id) => {
    await api.delete(`/cart/remove/${cart_id}`)
    await fetchCart()
  }

  const clearCart = async () => {
    await api.delete('/cart/clear')
    setCartItems([])
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems, cartLoading, cartCount, cartTotal,
      addToCart, updateQty, removeFromCart, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
