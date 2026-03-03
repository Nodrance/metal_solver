mod model;
use macroquad::prelude::{is_mouse_button_pressed, mouse_position, MouseButton};
use macroquad::window::next_frame;
use model::*;

mod solver;

mod ui;
use ui::*;

#[macroquad::main(window_conf)]
async fn main() {
    display_loading_screen().await;
    let initial_state = SolveState::from_input("0 0 0 500 500 500 3560").expect("Invalid hardcoded initial state");
    let target_state = SolveState::from_input("0 0 0 5 3 3 3").expect("Invalid hardcoded target state");
    let available_transitions = AvailableTransitions { //names
        projection: false,
        rejection: true,
        purification: false,
        deposition: true,
    };

    let mut ui = UI {
        text_renderer: CachedTextSizer::new(),
        letter_font: None,
        number_font: None,
        textures: vec![],
        inputs: initial_state,
        target: target_state,
        available_transitions,
        solution: None,
    };

    ui.load_font().await;
    ui.load_textures().await;
    ui.solve();

    loop {
        if is_mouse_button_pressed(MouseButton::Left) {
            let (x, y) = mouse_position();
            ui.handle_click(x, y);
        }

        ui.draw();
        next_frame().await;
    }
}
