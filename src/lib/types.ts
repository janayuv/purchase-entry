// Shared types mirrored from Rust models

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Supplier {
  id: number;
  name: string;
  gst_no?: string | null;
  state_code?: string | null; // 2-digit state code
  tds_flag: number; // 1 or 0
  tds_rate?: number | null; // percent
  contact?: string | null;
  email?: string | null;
}

export interface SupplierCreate {
  name: string;
  gst_no?: string | null;
  state_code?: string | null; // 2-digit state code
  tds_flag: boolean; // backend expects boolean
  tds_rate?: number | null; // percent
  contact?: string | null;
  email?: string | null;
}

export interface SupplierUpdate {
  id: number;
  name?: string | null;
  gst_no?: string | null;
  state_code?: string | null; // 2-digit state code
  tds_flag?: boolean | null;
  tds_rate?: number | null;
  contact?: string | null;
  email?: string | null;
}

export interface PurchaseEntry {
  id: number;
  supplier_id: number;
  invoice_no: string;
  date: string; // YYYY-MM-DD
  entry_date: string; // ISO timestamp or YYYY-MM-DD HH:MM:SS
  gst_rate: number;
  basic_value: number;
  sgst: number;
  cgst: number;
  igst: number;
  invoice_value: number;
  tds_value: number;
  narration?: string | null;
  status: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  part_no?: string | null;
  description: string;
  qty: number;
  unit?: string | null;
  price: number;
  amount: number;
}

export interface PurchaseItemPayload {
  id?: number | null;
  part_no?: string | null;
  description: string;
  qty: number;
  unit?: string | null;
  price: number;
  amount?: number | null;
}

export interface PurchaseCreate {
  supplier_id: number;
  invoice_no: string;
  date: string;
  entry_date?: string | null;
  gst_rate: number;
  basic_value: number;
  sgst: number;
  cgst: number;
  igst: number;
  invoice_value: number;
  tds_value: number;
  narration?: string | null;
  status: string;
  items: PurchaseItemPayload[];
}

export interface PurchaseUpdate {
  id: number;
  supplier_id?: number;
  invoice_no?: string;
  date?: string;
  entry_date?: string | null;
  gst_rate?: number;
  basic_value?: number;
  sgst?: number;
  cgst?: number;
  igst?: number;
  invoice_value?: number;
  tds_value?: number;
  narration?: string | null;
  status?: string;
  items?: PurchaseItemPayload[];
}

export interface ReportSummary {
  total_purchases: number;
  total_gst: number;
  total_suppliers: number;
  total_items: number;
}

export interface PurchasesBySupplier {
  supplier_name: string;
  total_purchases: number;
}

export interface PurchaseFilters {
  supplier_id?: number;
  date_from?: string; // inclusive
  date_to?: string;   // inclusive
  gst_rate?: number;
  invoice_no?: string;
  status?: string;
}

export interface User {
  id: number;
  username: string;
  role: "admin" | "user";
  created_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
