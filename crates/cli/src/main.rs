use metal_solver_core::model::{escape_json_string, AvailableTransitions, SolveState};
use metal_solver_core::solver::solve_lp;
use std::env;

enum OutputMode {
    Human,
    Json { use_names: bool, pretty_values: bool },
    NoSpoilers,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let (mode, positional) = parse_args(&args);
    if positional.len() != 3 {
        print_usage(&args[0]);
        std::process::exit(2);
    }

    let initial_state = match SolveState::from_input(&positional[0]) {
        Ok(state) => state,
        Err(err) => {
            eprintln!("Invalid inputs: {err}");
            std::process::exit(2);
        }
    };
    let target_state = match SolveState::from_input(&positional[1]) {
        Ok(state) => state,
        Err(err) => {
            eprintln!("Invalid outputs: {err}");
            std::process::exit(2);
        }
    };
    let available_transitions = match AvailableTransitions::from_input(&positional[2]) {
        Ok(transitions) => transitions,
        Err(err) => {
            eprintln!("Invalid transitions: {err}");
            std::process::exit(2);
        }
    };

    match solve_lp(&initial_state, &target_state, &available_transitions) {
        Ok(solution) => match mode {
            OutputMode::Human => println!("{solution:?}"),
            OutputMode::Json { use_names, pretty_values } => println!("{}", solution.to_json_string(use_names, pretty_values)),
            OutputMode::NoSpoilers => println!("Final ratio: {}", solution.ratio),
        },
        Err(err) => match mode {
            OutputMode::Human | OutputMode::NoSpoilers => eprintln!("Solve failed: {err}"),
            OutputMode::Json { .. } => {
                eprintln!("{{\"error\":\"{}\"}}", escape_json_string(&err));
                std::process::exit(1);
            }
        },
    }
}

fn parse_args(args: &[String]) -> (OutputMode, Vec<String>) {
    let mut mode = OutputMode::Json { use_names: false, pretty_values: false };
    let mut positional = Vec::new();
    for arg in args.iter().skip(1) {
        if arg.starts_with("--") {
            match arg.as_str() {
                "--human" => mode = OutputMode::Human,
                "--use-names" => {
                    if let OutputMode::Json { use_names, .. } = &mut mode {
                        *use_names = true;
                    }
                }
                "--pretty-values" => {
                    if let OutputMode::Json { pretty_values, .. } = &mut mode {
                        *pretty_values = true;
                    }
                }
                "--no-spoilers" => mode = OutputMode::NoSpoilers,
                _ => {
                    eprintln!("Unknown option: {arg}");
                    print_usage(&args[0]);
                    std::process::exit(2);
                }
            }
        } else if arg.starts_with("-") {
            for ch in arg.chars().skip(1) {
                match ch {
                    'h' => mode = OutputMode::Human,
                    'n' => {
                        if let OutputMode::Json { use_names, .. } = &mut mode {
                            *use_names = true;
                        }
                    }
                    'p' => {
                        if let OutputMode::Json { pretty_values, .. } = &mut mode {
                            *pretty_values = true;
                        }
                    }
                    's' => mode = OutputMode::NoSpoilers,
                    _ => {
                        eprintln!("Unknown option: -{ch}");
                        print_usage(&args[0]);
                        std::process::exit(2);
                    }
                }
            }
        } else {
            positional.push(arg.clone());
        }
    }
    (
        mode,
        positional,
    )
}

fn print_usage(program: &str) {
    eprintln!("Usage: {program} <inputs> <outputs> <transitions>");
    eprintln!("Example (json with names and pretty values): {program} \"2 2 0 0 0 0 0\" \"0 2 0 1 0 0 0\" \"1 0 0 1\" -np");
    eprintln!("Almost any format you can imagine is supported for the inputs, outputs, and transitions");
    eprintln!("This includes json (names or list), comma or space seperated values, and boolean-like words");
    eprintln!("Options:");
    eprintln!("  --human, -h: Human-optimized output (default is JSON)");
    eprintln!("  --use-names, -n: Use metal and transition names in JSON output instead of indices. Overriden by -h and -s");
    eprintln!("  --pretty-values, -p: Format values in JSON output as fractions. Overriden by -h and -s");
    eprintln!("  --no-spoilers, -s: Only output the final best possible ratio, with no details about the solution steps.");
}


