mod db;
mod models;
mod commands;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize SQLite (create data dir if missing) and run migrations
            let app_handle = app.handle().clone();
            // Always use OS app data dir to keep DB outside of watched source tree
            let primary_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| {
                    // Fallback to ./data if app_data_dir cannot be resolved
                    std::env::current_dir()
                        .map(|p| p.join("data"))
                        .unwrap_or_else(|_| std::path::PathBuf::from("data"))
                });
            // Ensure primary directory
            if let Err(e) = std::fs::create_dir_all(&primary_dir) {
                eprintln!("[DB] failed to create primary data dir {:?}: {}", &primary_dir, e);
            }
            let primary_db_path = primary_dir.join("app.db");

            // Try primary
            eprintln!("[DB] primary DB path: {:?}", &primary_db_path);
            let pool = match tauri::async_runtime::block_on(async { db::init(&primary_db_path).await }) {
                Ok(p) => p,
                Err(err_primary) => {
                    eprintln!("[DB] primary DB init failed at {:?}: {}", &primary_db_path, err_primary);
                    // Fallback to ./data/app.db
                    let fallback_dir = std::env::current_dir()
                        .map(|p| p.join("data"))
                        .unwrap_or_else(|_| std::path::PathBuf::from("data"));
                    if let Err(e) = std::fs::create_dir_all(&fallback_dir) {
                        return Err(format!("failed to create fallback data dir {:?}: {}", &fallback_dir, e).into());
                    }
                    let fallback_db_path = fallback_dir.join("app.db");
                    eprintln!("[DB] fallback DB path: {:?}", &fallback_db_path);
                    match tauri::async_runtime::block_on(async { db::init(&fallback_db_path).await }) {
                        Ok(p) => p,
                        Err(err_fallback) => return Err(format!("DB init failed. primary: {:?} => {}; fallback: {:?} => {}",
                            &primary_db_path, err_primary, &fallback_db_path, err_fallback).into()),
                    }
                }
            };

            // Proceed to manage state

            // Manage DB state for later command handlers
            app_handle.manage(db::Db(pool));

            Ok(())
        })
        // Tauri plugins
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            // Auth
            crate::commands::register,
            crate::commands::login,
            // Suppliers
            crate::commands::get_suppliers,
            crate::commands::add_supplier,
            crate::commands::update_supplier,
            crate::commands::delete_supplier,
            // Purchases & Items
            crate::commands::get_purchases,
            crate::commands::add_purchase,
            crate::commands::update_purchase,
            crate::commands::delete_purchase,
            crate::commands::get_items_by_purchase,
            crate::commands::add_item,
            crate::commands::update_item,
            // Reports
            crate::commands::get_report_summary,
            crate::commands::get_purchases_by_supplier,
            crate::commands::export_purchases,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
