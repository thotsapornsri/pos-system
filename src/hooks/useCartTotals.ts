import { useMemo } from 'react';
import { usePos } from '../store/PosContext';
import type { Product } from '../types';

export interface CartLine {
  product: Product;
  qty: number;
}

/** Cart lines plus the money maths shared by the sales view and the payment modal. */
export function useCartTotals() {
  const { cart, products, storeSettings } = usePos();

  return useMemo(() => {
    const cartLines: CartLine[] = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
      .filter((line): line is CartLine => line.product !== undefined);

    const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
    // product.price is tax-inclusive (what the customer actually pays per
    // unit) — subtotal/tax below are backed out of it for the receipt
    // breakdown, not added on top.
    const total = cartLines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const taxRate = storeSettings.taxRate;
    const subtotal = total / (1 + taxRate / 100);
    const tax = total - subtotal;

    return { cartLines, cartCount, subtotal, tax, total, taxRate };
  }, [cart, products, storeSettings.taxRate]);
}
