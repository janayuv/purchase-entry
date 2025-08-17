import { invoke } from "@tauri-apps/api/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Page,
  PurchaseEntry,
  PurchaseFilters,
  PurchaseCreate,
  PurchaseUpdate,
  PurchaseItem,
  PurchaseItemPayload,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
} from "./types";

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Page<Supplier>> => {
      // get_suppliers supports pagination and filter; keep defaults here
      return await invoke("get_suppliers");
    },
  });
}

export function useAddSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SupplierCreate): Promise<Supplier> => {
      return await invoke("add_supplier", { payload });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SupplierUpdate): Promise<Supplier> => {
      return await invoke("update_supplier", { payload });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<boolean> => {
      return await invoke("delete_supplier", { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function usePurchases(
  filters: Partial<PurchaseFilters>,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ["purchases", { filters, page, pageSize }],
    queryFn: async (): Promise<Page<PurchaseEntry>> => {
      return await invoke("get_purchases", { filters, page, pageSize });
    },
  });
}

export function useItemsByPurchase(purchaseId: number) {
  return useQuery({
    queryKey: ["purchase-items", purchaseId],
    queryFn: async (): Promise<PurchaseItem[]> => {
      return await invoke("get_items_by_purchase", { purchaseId });
    },
    enabled: !!purchaseId,
  });
}

export function useAddPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PurchaseCreate): Promise<PurchaseEntry> => {
      return await invoke("add_purchase", { payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PurchaseUpdate): Promise<PurchaseEntry> => {
      return await invoke("update_purchase", { payload });
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["purchase-items", entry.id] });
    },
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<boolean> => {
      return await invoke("delete_purchase", { id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      purchaseId,
      item,
    }: {
      purchaseId: number;
      item: PurchaseItemPayload;
    }): Promise<boolean> => {
      return await invoke("add_item", { purchaseId, item });
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["purchase-items", vars.purchaseId] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      item,
    }: {
      id: number;
      item: PurchaseItemPayload;
    }): Promise<boolean> => {
      return await invoke("update_item", { id, item });
    },
    onSuccess: () => {
      // Could invalidate purchases list if totals are derived on the fly
      qc.invalidateQueries();
    },
  });
}
