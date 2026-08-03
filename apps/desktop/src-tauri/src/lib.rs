//! Fidus de escritorio.
//!
//! Envuelve la misma PWA que se sirve en el navegador (`apps/web`), así que no
//! hay una tercera interfaz que mantener: lo que se arregla en la web se
//! arregla aquí. El servidor al que apunta se elige con las variables
//! `VITE_API_URL` / `VITE_AUTH_URL` al construir la web.

/// Devuelve la versión de la app para mostrarla en Ajustes.
#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_os::init());

    // Recuerda tamaño y posición de la ventana entre sesiones.
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![app_version])
        .run(tauri::generate_context!())
        .expect("error al arrancar la aplicación de Fidus");
}
