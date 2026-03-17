import init, { solve_ratio, get_metal_names, get_transition_names } from './metal_solver_wasm.js';

const statusEl = document.getElementById('status');

async function run() {
    try {
        await init();
    } catch (err) {
        console.error(err);
        return;
    }

    const METAL_NAMES = JSON.parse(get_metal_names());
    const TRANSITION_NAMES = JSON.parse(get_transition_names());
    generateTable(METAL_NAMES, TRANSITION_NAMES);
    populate_initial_values();
    refreshTableWithValues();
}

function generateTable(metalNames, transitionNames) {
    const table = document.getElementById('the-table');

    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.textContent = 'Metal';
    headerRow.appendChild(cornerCell);
    metalNames.forEach(metal => {
        const th = document.createElement('th');
        const image = document.createElement('img');
        image.src = `src/assets/${metal.toLowerCase()}_symbol.png`;
        image.classList.add('metal-symbol');
        th.appendChild(image);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    const rowLabels = ['Input', 'Target', 'Output', ...transitionNames];
    rowLabels.forEach((label, rowIndex) => {
        const row = document.createElement('tr');
        if (rowIndex < 2) { // Input, Target
            row.className = 'input-row';
        } else if (rowIndex === 2) {
            row.className = 'output-row';
        } else if (rowIndex >= 3) {
            row.className = 'transformation-row';
            row.onclick = () => {
                row_clicked(rowIndex);
            };
        }
        const labelCell = document.createElement('td');
        labelCell.textContent = label;
        labelCell.className = 'row-label';
        row.appendChild(labelCell);
        metalNames.forEach((metal, cellIndex) => {
            const cell = document.createElement('td');
            if (rowIndex < 2) { // Input, Target
                const input_cell = document.createElement('input');
                input_cell.inputMode = 'numeric';
                input_cell.value = 0;
                input_cell.oninput = () => {
                    if (parseInt(input_cell.value) < 0) {
                        input_cell.value = Math.abs(parseInt(input_cell.value))
                    }
                    refreshTableWithValues();
                }
                input_cell.onkeydown = (event) => {
                    if (event.key == "ArrowUp" || event.key == "ArrowDown") {
                        if (event.key == "ArrowUp") {
                            input_cell.value = parseInt(input_cell.value) + 1
                        }
                        if (event.key == "ArrowDown") {
                            input_cell.value = Math.max(parseInt(input_cell.value) - 1, 0)
                        }
                        input_cell.oninput()
                        event.preventDefault() //prevents focus from moving to the start/end of the input
                    }
                }
                input_cell.onmouseenter = () => {
                    input_cell.focus()
                    input_cell.select()
                }
                cell.appendChild(input_cell);
            } else {
                cell.textContent = '0';
            }
            cell.dataset.metal = metal;
            cell.dataset.field = label;
            cell.dataset.row = rowIndex;
            cell.dataset.col = cellIndex;
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
}

function populate_initial_values() {
    // 2 2 0 0 0 0 0
    // 0 2 0 1 0 0 0
    // true false false true
    let table = document.getElementById('the-table');
    let rows = table.querySelectorAll('tr');
    rows[1].querySelectorAll('input').forEach((input, index) => {
        input.value = index < 2 ? '2' : '0';
    });
    rows[2].querySelectorAll('input').forEach((input, index) => {
        input.value = index === 1 ? '2' : (index === 3 ? '1' : '0');
    });
    rows[5].classList.add('disabled-row'); // Rejection off
    rows[6].classList.add('disabled-row'); // Purification off
    rows[8].classList.add('disabled-row'); // Proliferation off
}

function refreshTable(inputs, targets, transitions) {
    let solve = JSON.parse(solve_ratio(inputs, targets, transitions));
    if (solve.error) {
        const ratioBox = document.getElementById('ratio-box');
        document.querySelectorAll('.output-row td:not(.row-label), .transformation-row td:not(.row-label)').forEach(cell => {
            cell.textContent = '/';
        });
        ratioBox.textContent = solve.error;
        return;
    }
    const table = document.getElementById('the-table');
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, rowIndex) => {
        if (rowIndex < 3) return;
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, cellIndex) => {
            if (cellIndex === 0) return;
            const metal = cell.dataset.metal;
            const field = cell.dataset.field;
            if (field === 'Output') {
                cell.textContent = solve.outputs[cellIndex - 1];
            } else { 
                cell.textContent = solve.transitions[rowIndex - 4][cellIndex - 1];
            }
        });
    });
    const ratioBox = document.getElementById('ratio-box');
    ratioBox.innerHTML = `Best Ratio:<span id="ratio-number">${solve.ratio}</span>`;
}

function refreshTableWithValues() {
    const table = document.getElementById('the-table');
    const rows = table.querySelectorAll('tr');
    let inputs = [];
    let targets = [];
    let transitions = [];
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, cellIndex) => {
            if (cellIndex === 0) return;
            const field = cell.dataset.field;
            if (field === 'Input') {
                inputs.push(cell.querySelector('input').value);
            } else if (field === 'Target') {
                targets.push(cell.querySelector('input').value);
            }
        });
        if (rowIndex >= 4) { // Transition rows
            if (row.classList.contains('disabled-row')) {
                transitions.push("false");
            } else {
                transitions.push("true");
            }
        }
    });
    inputs = inputs.map(v => isNaN(v) || v === '' ? '0' : v);
    targets = targets.map(v => isNaN(v) || v === '' ? '0' : v);
    refreshTable(inputs.join(" "), targets.join(" "), transitions.join(" "));
}

function row_clicked(rowIndex) {
    const table = document.getElementById('the-table');
    const rows = table.querySelectorAll('tr');
    const row = rows[rowIndex+1];
    if (row.classList.contains('disabled-row')) {
        row.classList.remove('disabled-row');
    } else {
        row.classList.add('disabled-row');
    }
    refreshTableWithValues();
}

function toggle_font() {
    const root = document.documentElement;
    if (root.style.getPropertyValue('--numbers-font').includes('Arial')) {
        root.style.setProperty('--letters-font', 'English Font, serif');
        root.style.setProperty('--numbers-font', 'French Script, cursive');
    } else {
        root.style.setProperty('--letters-font', 'Arial, Helvetica, sans-serif');
        root.style.setProperty('--numbers-font', 'Arial, Helvetica, sans-serif');
    }
}

function toggle_spoilers() {
    const table = document.getElementById('the-table');
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
        if (index >= 4) {
            row.style.visibility = row.style.visibility === 'hidden' ? '' : 'hidden';
        }
    });
}

run().catch((err) => {
    let ratioBox = document.getElementById('ratio-box');
    ratioBox.textContent = "Error initializing WebAssembly: " + err;
    console.error(err);
});


document.getElementById("font-button").addEventListener("click", toggle_font)
document.getElementById("spoilers-button").addEventListener("click", toggle_spoilers)