import {
  Briefcase,
  Layers,
  BarChart,
  Gift,
  ShoppingBag,
  Home as HomeIcon,
  Coffee,
  Car,
  CreditCard,
  ReceiptText,
  Tag,
  Wallet,
  Heart,
  Smartphone,
  Plane,
  Shirt,
  Music,
  GraduationCap,
  Utensils,
  PiggyBank,
  Landmark,
  HeartHandshake,
  Package,
  Box,
  Archive,
  AlertTriangle,
  Siren,
  Stethoscope,
  Pill,
} from 'lucide-react';

// Re-export komponen individual untuk dipakai di luar IconMap.
// (FinanceContext pakai ini untuk fallback heuristic injectIcon.)
export {
  Briefcase,
  Layers,
  BarChart,
  Gift,
  ShoppingBag,
  HomeIcon,
  Coffee,
  Car,
  CreditCard,
  ReceiptText,
  Tag,
  Wallet,
  Heart,
  Smartphone,
  Plane,
  Shirt,
  Music,
  GraduationCap,
  Utensils,
  PiggyBank,
  Landmark,
  HeartHandshake,
  Package,
  Box,
  Archive,
  AlertTriangle,
  Siren,
  Stethoscope,
  Pill,
};

/**
 * Mapping nama icon (string di Firestore) -> komponen Lucide.
 *
 * Setiap kali menambah opsi icon untuk kategori custom, tambahkan
 * entri di sini. Lihat AGENTS.md Section 4.4 (menambah kategori default).
 */
export const IconMap = {
  Briefcase,
  Layers,
  BarChart,
  Gift,
  ShoppingBag,
  Home: HomeIcon,
  Coffee,
  Car,
  CreditCard,
  ReceiptText,
  Tag,
  Wallet,
  Heart,
  Smartphone,
  Plane,
  Shirt,
  Music,
  GraduationCap,
  Utensils,
  PiggyBank,
  Landmark,
  HeartHandshake,
  Package,
  Box,
  Archive,
  AlertTriangle,
  Siren,
  Stethoscope,
  Pill,
};

/**
 * Resolve icon component berdasarkan nama. Mengembalikan null jika
 * nama tidak ditemukan di IconMap.
 *
 * @param {string} iconName
 * @returns {React.ComponentType | null}
 */
export function getIcon(iconName) {
  return IconMap[iconName] || null;
}