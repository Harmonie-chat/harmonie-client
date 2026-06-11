#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let updater_builder = tauri_plugin_updater::Builder::new();
                let updater_builder = match option_env!("TAURI_UPDATER_PUBKEY") {
                    Some(pubkey) if !pubkey.trim().is_empty() => updater_builder.pubkey(pubkey),
                    _ => updater_builder,
                };

                app.handle().plugin(updater_builder.build())?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
