use tauri::State;
use sqlx::{QueryBuilder, Sqlite};

use crate::db::Db;
use crate::models::{
    Page,
    Supplier, SupplierCreate, SupplierUpdate,
    PurchaseEntry, PurchaseCreate, PurchaseUpdate, PurchaseFilters, PurchaseItem, PurchaseItemPayload,
    User, UserCreate, LoginPayload, LoginResponse, ReportSummary, PurchasesBySupplier,
};
use calamine::{Reader, Xlsx, open_workbook};
use rust_xlsxwriter::{Workbook, Worksheet};

#[tauri::command]
pub async fn get_suppliers(
    db: State<'_, Db>,
    page: Option<i64>,
    page_size: Option<i64>,
    name_filter: Option<String>,
) -> Result<Page<Supplier>, String> {
    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(20).clamp(1, 200);
    let offset = (page - 1) * page_size;

    let filter = name_filter.unwrap_or_default();
    let like = if filter.is_empty() { "%".to_string() } else { format!("%{}%", filter) };

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) as cnt FROM suppliers WHERE name LIKE ?1",
    )
    .bind(&like)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let rows: Vec<Supplier> = sqlx::query_as::<_, Supplier>(
        "SELECT id, name, gst_no, state_code, tds_flag, tds_rate, contact, email
         FROM suppliers
         WHERE name LIKE ?1
         ORDER BY name ASC
         LIMIT ?2 OFFSET ?3",
    )
    .bind(&like)
    .bind(page_size)
    .bind(offset)
    .fetch_all(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Page { data: rows, total: total.0, page, page_size })
}

// Purchases & Items

#[tauri::command]
pub async fn get_purchases(
    db: State<'_, Db>,
    filters: Option<PurchaseFilters>,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<Page<PurchaseEntry>, String> {
    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(20).clamp(1, 200);
    let offset = (page - 1) * page_size;

    let f = filters.unwrap_or(PurchaseFilters {
        supplier_id: None,
        date_from: None,
        date_to: None,
        gst_rate: None,
        invoice_no: None,
        status: None,
    });

    // Build WHERE clause dynamically using QueryBuilder
    let mut where_added = false;
    let mut count_q = QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM purchase_entries ");
    let mut sel_q = QueryBuilder::<Sqlite>::new(
        "SELECT id, supplier_id, invoice_no, date, entry_date, gst_rate, basic_value, sgst, cgst, igst, invoice_value, tds_value, narration, status FROM purchase_entries ",
    );

    let mut push_filter = |qb: &mut QueryBuilder<Sqlite>, cond: &str| {
        if !where_added {
            qb.push(" WHERE ");
            where_added = true;
        } else {
            qb.push(" AND ");
        }
        qb.push(cond);
    };

    if let Some(supplier_id) = f.supplier_id {
        push_filter(&mut count_q, "supplier_id = ");
        count_q.push_bind(supplier_id);
        push_filter(&mut sel_q, "supplier_id = ");
        sel_q.push_bind(supplier_id);
    }
    if let Some(df) = f.date_from {
        push_filter(&mut count_q, "date >= ");
        count_q.push_bind(df.clone());
        push_filter(&mut sel_q, "date >= ");
        sel_q.push_bind(df);
    }
    if let Some(dt) = f.date_to {
        push_filter(&mut count_q, "date <= ");
        count_q.push_bind(dt.clone());
        push_filter(&mut sel_q, "date <= ");
        sel_q.push_bind(dt);
    }
    if let Some(g) = f.gst_rate {
        push_filter(&mut count_q, "gst_rate = ");
        count_q.push_bind(g);
        push_filter(&mut sel_q, "gst_rate = ");
        sel_q.push_bind(g);
    }
    if let Some(inv) = f.invoice_no {
        push_filter(&mut count_q, "invoice_no LIKE ");
        count_q.push_bind(format!("%{}%", inv));
        push_filter(&mut sel_q, "invoice_no LIKE ");
        sel_q.push_bind(format!("%{}%", inv));
    }
    if let Some(st) = f.status {
        push_filter(&mut count_q, "status = ");
        count_q.push_bind(st.clone());
        push_filter(&mut sel_q, "status = ");
        sel_q.push_bind(st);
    }

    let total: (i64,) = count_q
        .build_query_as()
        .fetch_one(&db.0)
        .await
        .map_err(|e| e.to_string())?;

    sel_q.push(" ORDER BY entry_date DESC, date DESC, id DESC ");
    sel_q.push(" LIMIT ");
    sel_q.push_bind(page_size);
    sel_q.push(" OFFSET ");
    sel_q.push_bind(offset);

    let rows: Vec<PurchaseEntry> = sel_q
        .build_query_as()
        .fetch_all(&db.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(Page { data: rows, total: total.0, page, page_size })
}

#[tauri::command]
pub async fn get_items_by_purchase(db: State<'_, Db>, purchase_id: i64) -> Result<Vec<PurchaseItem>, String> {
    let rows: Vec<PurchaseItem> = sqlx::query_as::<_, PurchaseItem>(
        "SELECT id, purchase_id, part_no, description, qty, unit, price, amount FROM purchase_items WHERE purchase_id = ?1 ORDER BY id ASC",
    )
    .bind(purchase_id)
    .fetch_all(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn add_purchase(db: State<'_, Db>, payload: PurchaseCreate) -> Result<PurchaseEntry, String> {
    let mut tx = db.0.begin().await.map_err(|e| e.to_string())?;

    let rec: (i64,) = sqlx::query_as(
        "INSERT INTO purchase_entries (supplier_id, invoice_no, date, entry_date, gst_rate, basic_value, sgst, cgst, igst, invoice_value, tds_value, narration, status)
         VALUES (?1, ?2, ?3, COALESCE(?4, datetime('now')), ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
         RETURNING id",
    )
    .bind(payload.supplier_id)
    .bind(&payload.invoice_no)
    .bind(&payload.date)
    .bind(&payload.entry_date)
    .bind(payload.gst_rate)
    .bind(payload.basic_value)
    .bind(payload.sgst)
    .bind(payload.cgst)
    .bind(payload.igst)
    .bind(payload.invoice_value)
    .bind(payload.tds_value)
    .bind(&payload.narration)
    .bind(&payload.status)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let pid = rec.0;
    for it in payload.items {
        let amount = it.amount.unwrap_or(it.qty * it.price);
        sqlx::query(
            "INSERT INTO purchase_items (purchase_id, part_no, description, qty, unit, price, amount)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        )
        .bind(pid)
        .bind(it.part_no)
        .bind(it.description)
        .bind(it.qty)
        .bind(it.unit)
        .bind(it.price)
        .bind(amount)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    let entry = sqlx::query_as::<_, PurchaseEntry>(
        "SELECT id, supplier_id, invoice_no, date, entry_date, gst_rate, basic_value, sgst, cgst, igst, invoice_value, tds_value, narration, status FROM purchase_entries WHERE id = ?1",
    )
    .bind(pid)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(entry)
}

#[tauri::command]
pub async fn update_purchase(db: State<'_, Db>, payload: PurchaseUpdate) -> Result<PurchaseEntry, String> {
    let mut tx = db.0.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE purchase_entries SET
            supplier_id = COALESCE(?2, supplier_id),
            invoice_no = COALESCE(?3, invoice_no),
            date = COALESCE(?4, date),
            entry_date = COALESCE(?5, entry_date),
            gst_rate = COALESCE(?6, gst_rate),
            basic_value = COALESCE(?7, basic_value),
            sgst = COALESCE(?8, sgst),
            cgst = COALESCE(?9, cgst),
            igst = COALESCE(?10, igst),
            invoice_value = COALESCE(?11, invoice_value),
            tds_value = COALESCE(?12, tds_value),
            narration = COALESCE(?13, narration),
            status = COALESCE(?14, status)
         WHERE id = ?1",
    )
    .bind(payload.id)
    .bind(payload.supplier_id)
    .bind(payload.invoice_no)
    .bind(payload.date)
    .bind(payload.entry_date)
    .bind(payload.gst_rate)
    .bind(payload.basic_value)
    .bind(payload.sgst)
    .bind(payload.cgst)
    .bind(payload.igst)
    .bind(payload.invoice_value)
    .bind(payload.tds_value)
    .bind(payload.narration)
    .bind(payload.status)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(items) = payload.items {
        // Replace strategy: delete existing and insert provided items
        sqlx::query("DELETE FROM purchase_items WHERE purchase_id = ?1")
            .bind(payload.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        for it in items {
            let amount = it.amount.unwrap_or(it.qty * it.price);
            sqlx::query(
                "INSERT INTO purchase_items (purchase_id, part_no, description, qty, unit, price, amount)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            )
            .bind(payload.id)
            .bind(it.part_no)
            .bind(it.description)
            .bind(it.qty)
            .bind(it.unit)
            .bind(it.price)
            .bind(amount)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    let entry = sqlx::query_as::<_, PurchaseEntry>(
        "SELECT id, supplier_id, invoice_no, date, entry_date, gst_rate, basic_value, sgst, cgst, igst, invoice_value, tds_value, narration, status FROM purchase_entries WHERE id = ?1",
    )
    .bind(payload.id)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(entry)
}

#[tauri::command]
pub async fn delete_purchase(db: State<'_, Db>, id: i64) -> Result<bool, String> {
    let res = sqlx::query("DELETE FROM purchase_entries WHERE id = ?1")
        .bind(id)
        .execute(&db.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(res.rows_affected() > 0)
}

#[tauri::command]
pub async fn add_item(db: State<'_, Db>, purchase_id: i64, item: PurchaseItemPayload) -> Result<bool, String> {
    let amount = item.amount.unwrap_or(item.qty * item.price);
    sqlx::query(
        "INSERT INTO purchase_items (purchase_id, part_no, description, qty, unit, price, amount)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    )
    .bind(purchase_id)
    .bind(item.part_no)
    .bind(item.description)
    .bind(item.qty)
    .bind(item.unit)
    .bind(item.price)
    .bind(amount)
    .execute(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn update_item(db: State<'_, Db>, id: i64, item: PurchaseItemPayload) -> Result<bool, String> {
    sqlx::query(
        "UPDATE purchase_items SET
            part_no = COALESCE(?2, part_no),
            description = COALESCE(?3, description),
            qty = COALESCE(?4, qty),
            unit = COALESCE(?5, unit),
            price = COALESCE(?6, price),
            amount = COALESCE(?7, amount)
         WHERE id = ?1",
    )
    .bind(id)
    .bind(item.part_no)
    .bind(Some(item.description))
    .bind(Some(item.qty))
    .bind(item.unit)
    .bind(Some(item.price))
    .bind(item.amount)
    .execute(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn add_supplier(db: State<'_, Db>, payload: SupplierCreate) -> Result<Supplier, String> {
    let tds_flag = if payload.tds_flag { 1_i64 } else { 0_i64 };

    let rec: (i64,) = sqlx::query_as(
        "INSERT INTO suppliers (name, gst_no, state_code, tds_flag, tds_rate, contact, email)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         RETURNING id",
    )
    .bind(&payload.name)
    .bind(&payload.gst_no)
    .bind(&payload.state_code)
    .bind(tds_flag)
    .bind(&payload.tds_rate)
    .bind(&payload.contact)
    .bind(&payload.email)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let supplier = sqlx::query_as::<_, Supplier>(
        "SELECT id, name, gst_no, state_code, tds_flag, tds_rate, contact, email FROM suppliers WHERE id = ?1",
    )
    .bind(rec.0)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(supplier)
}

#[tauri::command]
pub async fn update_supplier(db: State<'_, Db>, payload: SupplierUpdate) -> Result<Supplier, String> {
    // Build dynamic update for optional fields
    // For simplicity, we coalesce to existing values
    sqlx::query(
        "UPDATE suppliers SET
            name = COALESCE(?2, name),
            gst_no = COALESCE(?3, gst_no),
            state_code = COALESCE(?4, state_code),
            tds_flag = COALESCE(?5, tds_flag),
            tds_rate = COALESCE(?6, tds_rate),
            contact = COALESCE(?7, contact),
            email = COALESCE(?8, email)
         WHERE id = ?1",
    )
    .bind(payload.id)
    .bind(payload.name)
    .bind(payload.gst_no)
    .bind(payload.state_code)
    .bind(payload.tds_flag.map(|b| if b { 1_i64 } else { 0_i64 }))
    .bind(payload.tds_rate)
    .bind(payload.contact)
    .bind(payload.email)
    .execute(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let supplier = sqlx::query_as::<_, Supplier>(
        "SELECT id, name, gst_no, state_code, tds_flag, tds_rate, contact, email FROM suppliers WHERE id = ?1",
    )
    .bind(payload.id)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(supplier)
}

// Auth

#[tauri::command]
pub async fn register(db: State<'_, Db>, payload: UserCreate) -> Result<User, String> {
    if payload.username.is_empty() {
        return Err("Username cannot be empty".to_string());
    }
    if payload.password.is_empty() {
        return Err("Password cannot be empty".to_string());
    }

    let existing_user: Option<(i64,)> = sqlx::query_as("SELECT id FROM users WHERE username = ?1")
        .bind(&payload.username)
        .fetch_optional(&db.0)
        .await
        .map_err(|e| e.to_string())?;

    if existing_user.is_some() {
        return Err("Username is already taken".to_string());
    }

    // TODO: hash password
    let password_hash = payload.password;
    let role = payload.role.unwrap_or_else(|| "user".to_string());

    let rec: (i64,) = sqlx::query_as(
        "INSERT INTO users (username, password_hash, role)
         VALUES (?1, ?2, ?3)
         RETURNING id",
    )
    .bind(&payload.username)
    .bind(&password_hash)
    .bind(&role)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash, role, created_at FROM users WHERE id = ?1",
    )
    .bind(rec.0)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(user)
}

#[tauri::command]
pub async fn login(db: State<'_, Db>, payload: LoginPayload) -> Result<LoginResponse, String> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?1",
    )
    .bind(&payload.username)
    .fetch_optional(&db.0)
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "Invalid username or password".to_string())?;

    // TODO: verify password hash
    if user.password_hash != payload.password {
        return Err("Invalid username or password".to_string());
    }

    // TODO: generate a real JWT token
    let token = "fake-jwt-token".to_string();

    Ok(LoginResponse { user, token })
}

// Reports

#[tauri::command]
pub async fn get_report_summary(db: State<'_, Db>, date_from: Option<String>, date_to: Option<String>) -> Result<ReportSummary, String> {
    let total_purchases: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(invoice_value), 0) FROM purchase_entries WHERE date >= ?1 AND date <= ?2",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let total_gst: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(sgst + cgst + igst), 0) FROM purchase_entries WHERE date >= ?1 AND date <= ?2",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let total_suppliers: (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT supplier_id) FROM purchase_entries WHERE date >= ?1 AND date <= ?2",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    let total_items: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchase_entries WHERE date >= ?1 AND date <= ?2)",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_one(&db.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(ReportSummary {
        total_purchases: total_purchases.0,
        total_gst: total_gst.0,
        total_suppliers: total_suppliers.0,
        total_items: total_items.0,
    })
}

#[tauri::command]
pub async fn get_purchases_by_supplier(db: State<'_, Db>, date_from: Option<String>, date_to: Option<String>) -> Result<Vec<PurchasesBySupplier>, String> {
    let rows: Vec<PurchasesBySupplier> = sqlx::query_as(
        "SELECT s.name as supplier_name, SUM(pe.invoice_value) as total_purchases
         FROM purchase_entries pe
         JOIN suppliers s ON pe.supplier_id = s.id
         WHERE pe.date >= ?1 AND pe.date <= ?2
         GROUP BY s.name
         ORDER BY total_purchases DESC",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_all(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn export_purchases(db: State<'_, Db>, date_from: Option<String>, date_to: Option<String>) -> Result<Vec<PurchaseEntry>, String> {
    let rows: Vec<PurchaseEntry> = sqlx::query_as(
        "SELECT id, supplier_id, invoice_no, date, entry_date, gst_rate, basic_value, sgst, cgst, igst, invoice_value, tds_value, narration, status FROM purchase_entries WHERE date >= ?1 AND date <= ?2 ORDER BY date DESC",
    )
    .bind(&date_from)
    .bind(&date_to)
    .fetch_all(&db.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn delete_supplier(db: State<'_, Db>, id: i64) -> Result<bool, String> {
    let res = sqlx::query("DELETE FROM suppliers WHERE id = ?1")
        .bind(id)
        .execute(&db.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(res.rows_affected() > 0)
}

#[tauri::command]
pub async fn import_suppliers_from_excel(db: State<'_, Db>, path: String) -> Result<usize, String> {
    let mut workbook: Xlsx<_> = open_workbook(path).map_err(|e| e.to_string())?;
    let sheet = workbook.worksheet_range("Sheet1").ok_or_else(|| "Sheet1 not found".to_string())??;

    let mut count = 0;
    for row in sheet.rows().skip(1) {
        let name = row.get(0).and_then(|c| c.get_string()).unwrap_or_default().to_string();
        if name.is_empty() {
            continue;
        }

        let supplier = SupplierCreate {
            name,
            gst_no: row.get(1).and_then(|c| c.get_string()).map(|s| s.to_string()),
            state_code: row.get(2).and_then(|c| c.get_string()).map(|s| s.to_string()),
            tds_flag: row.get(3).and_then(|c| c.get_bool()).unwrap_or(false),
            tds_rate: row.get(4).and_then(|c| c.get_f64()),
            contact: row.get(5).and_then(|c| c.get_string()).map(|s| s.to_string()),
            email: row.get(6).and_then(|c| c.get_string()).map(|s| s.to_string()),
        };

        add_supplier(db.clone(), supplier).await?;
        count += 1;
    }

    Ok(count)
}

#[tauri::command]
pub async fn generate_supplier_template(path: String) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let headers = ["Name", "GST No", "State Code", "TDS Flag", "TDS Rate", "Contact", "Email"];
    for (i, header) in headers.iter().enumerate() {
        worksheet.write_string(0, i as u16, header).map_err(|e| e.to_string())?;
    }

    workbook.save(&path).map_err(|e| e.to_string())?;
    Ok(())
}

