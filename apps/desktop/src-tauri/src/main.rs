// En Windows, sin esto se abre una consola detrás de la ventana en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pastortools_desktop_lib::run()
}
