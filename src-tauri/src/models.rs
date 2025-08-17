use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Supplier {
    pub id: i64,
    pub name: String,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
    pub tds_flag: i64,
    pub tds_rate: Option<f64>,
    pub contact: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupplierCreate {
    pub name: String,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
    pub tds_flag: bool,
    pub tds_rate: Option<f64>,
    pub contact: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupplierUpdate {
    pub id: i64,
    pub name: Option<String>,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
    pub tds_flag: Option<bool>,
    pub tds_rate: Option<f64>,
    pub contact: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Page<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

// Users

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserCreate {
    pub username: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

// Reports

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct ReportSummary {
    pub total_purchases: f64,
    pub total_gst: f64,
    pub total_suppliers: i64,
    pub total_items: i64,
}

// Reports

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PurchasesBySupplier {
    pub supplier_name: String,
    pub total_purchases: f64,
}

// Purchases

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PurchaseEntry {
    pub id: i64,
    pub supplier_id: i64,
    pub invoice_no: String,
    pub date: String,
    pub entry_date: String,
    pub gst_rate: f64,
    pub basic_value: f64,
    pub sgst: f64,
    pub cgst: f64,
    pub igst: f64,
    pub invoice_value: f64,
    pub tds_value: f64,
    pub narration: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseItemPayload {
    pub id: Option<i64>,
    pub part_no: Option<String>,
    pub description: String,
    pub qty: f64,
    pub unit: Option<String>,
    pub price: f64,
    pub amount: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseCreate {
    pub supplier_id: i64,
    pub invoice_no: String,
    pub date: String, // YYYY-MM-DD
    pub entry_date: Option<String>, // ISO timestamp or YYYY-MM-DD HH:MM:SS
    pub gst_rate: f64,
    pub basic_value: f64,
    pub sgst: f64,
    pub cgst: f64,
    pub igst: f64,
    pub invoice_value: f64,
    pub tds_value: f64,
    pub narration: Option<String>,
    pub status: String,
    pub items: Vec<PurchaseItemPayload>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseUpdate {
    pub id: i64,
    pub supplier_id: Option<i64>,
    pub invoice_no: Option<String>,
    pub date: Option<String>,
    pub entry_date: Option<String>,
    pub gst_rate: Option<f64>,
    pub basic_value: Option<f64>,
    pub sgst: Option<f64>,
    pub cgst: Option<f64>,
    pub igst: Option<f64>,
    pub invoice_value: Option<f64>,
    pub tds_value: Option<f64>,
    pub narration: Option<String>,
    pub status: Option<String>,
    pub items: Option<Vec<PurchaseItemPayload>>, // if provided, replace items
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseFilters {
    pub supplier_id: Option<i64>,
    pub date_from: Option<String>, // inclusive
    pub date_to: Option<String>,   // inclusive
    pub gst_rate: Option<f64>,
    pub invoice_no: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PurchaseItem {
    pub id: i64,
    pub purchase_id: i64,
    pub part_no: Option<String>,
    pub description: String,
    pub qty: f64,
    pub unit: Option<String>,
    pub price: f64,
    pub amount: f64,
}
