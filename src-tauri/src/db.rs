use std::path::Path;

use sqlx::{
    migrate::MigrateError,
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    Pool, Sqlite,
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Migrate(#[from] MigrateError),
}

pub type DbPool = Pool<Sqlite>;

#[derive(Clone)]
pub struct Db(pub DbPool);

/// Initialize SQLite connection pool and run migrations.
pub async fn init(db_file: &Path) -> Result<DbPool, DbError> {
    // create parent directory if needed
    if let Some(parent) = db_file.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    // Prefer ConnectOptions to avoid URL parsing issues across platforms
    let opts = SqliteConnectOptions::new()
        .filename(db_file)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal);

    eprintln!("[DB] Opening SQLite at path: {:?}", db_file);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await?;

    // Run migrations embedded from the crate's migrations directory
    // This path is relative to the Cargo manifest dir (src-tauri)
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
