// --- IndexedDB constants ---
const DB_NAME = 'ClaimHubDB';
const DB_VERSION = 3; // Bump version to ensure missing object stores are created on upgrade
const STORE = {
    plans: 'plans',
    claims: 'claims',
    specialCases: 'specialCases',
    todos: 'todos',
    followups: 'followups'
};

// --- IndexedDB Initialization and Helpers ---
let db;


// Optional: quick helper to clear all active death claims (for debugging/cleanup)
window.debugClearActiveDeathClaims = async function() {
    try {
        savedCases = {};
        await saveToStorage();
        await loadFromStorage();
        showToast('Cleared all active death claims.');
    } catch (e) {
        console.warn('Failed to clear active death claims', e);
    }
}

// Optional: seed some sample data to test UI quickly
window.debugSeedSampleClaims = async function() {
    try {
        // Seed one active death claim
        const policyNo = '123456789';
        savedCases[policyNo] = {
            policyNo,
            name: 'John Doe',
            commencementDate: '01/01/2020',
            deathDate: '15/03/2023',
            query: 'Initial notes',
            claimType: 'Early'
        };
        savedWorkflowStates[policyNo] = {
            nomineeAvailable: true,
            deathClaimFormDocs: true
        };

        // Seed one active special case
        savedSpecialCases['S-10001'] = {
            name: 'Jane Smith',
            type: 'D/C',
            issue: 'Document verification pending',
            resolved: false
        };

        await saveToStorage();
        await loadFromStorage();
        showToast('Seeded sample active death claim and special case.');
    } catch (e) {
        console.warn('Failed to seed sample data', e);
    }
}
async function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = e => {
            const upgradeDb = e.target.result;
            if (!upgradeDb.objectStoreNames.contains(STORE.plans)) {
                upgradeDb.createObjectStore(STORE.plans, { keyPath: 'plan' });
            }
            if (!upgradeDb.objectStoreNames.contains(STORE.claims)) {
                upgradeDb.createObjectStore(STORE.claims, { keyPath: 'id', autoIncrement: true });
            }
            if (!upgradeDb.objectStoreNames.contains(STORE.specialCases)) {
                upgradeDb.createObjectStore(STORE.specialCases, { keyPath: 'id', autoIncrement: true });
            }
            if (!upgradeDb.objectStoreNames.contains(STORE.todos)) {
                upgradeDb.createObjectStore(STORE.todos, { keyPath: 'id', autoIncrement: true });
            }
            if (!upgradeDb.objectStoreNames.contains(STORE.followups)) {
                upgradeDb.createObjectStore(STORE.followups, { keyPath: 'policyNo' });
            }
        };

        req.onsuccess = async (e) => {
            db = e.target.result;
            console.log('Database initialized successfully.');

            // Bootstrap initial data only after successful connection
            try {
                const plans = await idbGetAll(STORE.plans);
                const planKeys = plans.map(p => p.plan);
                if (!planKeys.includes('111')) await idbPut(STORE.plans, { plan: '111', data: PLAN_111 });
                if (!planKeys.includes('150')) await idbPut(STORE.plans, { plan: '150', data: PLAN_150 });
                if (!planKeys.includes('179')) await idbPut(STORE.plans, { plan: '179', data: PLAN_179 });
                if (!planKeys.includes('174')) await idbPut(STORE.plans, { plan: '174', data: PLAN_174 });
                console.log('Plan data bootstrapped.');
                resolve(db);
            } catch (bootstrapError) {
                console.error('Error bootstrapping data:', bootstrapError);
                reject(bootstrapError);
            }
        };

        req.onerror = e => {
            console.error('Database error:', e.target.error);
            reject(e.target.error);
        };
    });
}

async function idbPut(storeName, value) {
    if (!db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = event => reject(event.target.error);
        tx.objectStore(storeName).put(value);
    });
}

async function idbGetAll(storeName) {
    if (!db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        tx.onerror = event => reject(event.target.error);
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
    });
}

async function idbDelete(storeName, key) {
    if (!db) throw new Error("Database not initialized.");
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = event => reject(event.target.error);
        tx.objectStore(storeName).delete(key);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the database first, then run all dependent code
    initDB().then(() => {
        console.log('DB Ready. Setting up application.');
        
        // All your existing DOMContentLoaded code that depends on the DB goes here
        var particlesContainer = document.getElementById('particles');
        
        // Collapsible functionality
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', function () {
                const target = document.getElementById(this.dataset.target);
                var arrow = this.querySelector('span:last-child');
                
                target.classList.toggle('active');
                arrow.style.transform = target.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });

        var toolsPanel = document.querySelector('.dash-right');
        if (toolsPanel) {
            var tabs = toolsPanel.querySelectorAll('.tool-tab');
            var panels = {
                todo: document.getElementById('todoPanel'),
                requirements: document.getElementById('requirementsPanel'),
                calculator: document.getElementById('calculatorPanel'),
                links: document.getElementById('linksPanel'),
                followups: document.getElementById('followupsPanel')
            };
            var requirementsTypeSelect = document.getElementById('requirementsType');
            var letRequirementsTable = document.getElementById('letRequirementsTable');

            // 1. Tab Switching Logic
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Deactivate all tabs
                    tabs.forEach(t => t.classList.remove('active-tab'));
                    // Hide all panels
                    Object.values(panels).forEach(panel => panel && panel.classList.add('hidden'));

                    // Activate clicked tab
                    tab.classList.add('active-tab');
                    // Show corresponding panel
                    var tabName = tab.dataset.tab;
                    if (panels[tabName]) {
                        panels[tabName].classList.remove('hidden');
                    }
                });
            });

            // 2. To-Do List Logic is handled further down with the rest of the app logic

            // 3. Requirements Dropdown Logic
            if (requirementsTypeSelect && letRequirementsTable) {
                requirementsTypeSelect.addEventListener('change', function(e) {
                    letRequirementsTable.style.display = e.target.value === 'LET' ? 'block' : 'none';
                });
            }

            // 4. Premium Calculator Logic is handled further down
        }

        // Workflow collapsible functionality with disabled state check
        document.querySelectorAll('.workflow-header').forEach(header => {
            header.addEventListener('click', function () {
                // Don't allow clicking if section is disabled
                if (this.style.pointerEvents === 'none') {
                    return;
                }
                
                const target = document.getElementById(this.dataset.target);
                var arrow = this.querySelector('span:last-child');
                
                target.classList.toggle('active');
                arrow.style.transform = target.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });

        // Form functionality
        var deathClaimBtn = document.getElementById('deathClaimBtn');
        var specialCaseBtn = document.getElementById('specialCaseBtn');
        var deathClaimForm = document.getElementById('deathClaimForm');
        var specialCaseForm = document.getElementById('specialCaseForm');
        var cancelForm = document.getElementById('cancelForm');
        var cancelSpecialForm = document.getElementById('cancelSpecialForm');
        deathClaimBtn?.addEventListener('click', function() {
            deathClaimForm?.classList.remove('hidden');
        });
 
        specialCaseBtn?.addEventListener('click', function() {
            specialCaseForm?.classList.remove('hidden');
        });

        cancelForm?.addEventListener('click', function() {
            deathClaimForm?.classList.add('hidden');
            resetForm();
        });

        cancelSpecialForm?.addEventListener('click', function() {
            specialCaseForm?.classList.add('hidden');
            resetSpecialForm();
        });

        // Date calculation
        var commencementDate = document.getElementById('commencementDate');
        var deathDate = document.getElementById('deathDate');
        var durationDisplay = document.getElementById('durationDisplay');
        var durationText = document.getElementById('durationText');

        var suggestionBox = document.getElementById('suggestionBox');
        var suggestionText = document.getElementById('suggestionText');
        var timeBarWarning = document.getElementById('timeBarWarning');
        var manualSelection = document.getElementById('manualSelection');

        // Attach date input listeners now that DOM is ready
        commencementDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });

        deathDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });

        // To-Do List Logic (now safe to run)
        var todoInput = document.getElementById('todoInput');
        var addTodoBtn = document.getElementById('addTodoBtn');
        var todoList = document.getElementById('todoList');

        addTodoBtn?.addEventListener('click', async function() {
            var text = todoInput.value.trim();
            if (text) {
                await idbPut(STORE.todos, { text, completed: false });
                todoInput.value = '';
                renderTodos();
            }
        });

        todoList?.addEventListener('click', async function(e) {
            var id = e.target.dataset.id;
            if (e.target.closest('button')) { // Delete
                await idbDelete(STORE.todos, Number(id));
                renderTodos();
            } else if (e.target.type === 'checkbox') { // Toggle complete
                const todos = await idbGetAll(STORE.todos);
                const todo = todos.find(t => t.id == id);
                if (todo) {
                    todo.completed = e.target.checked;
                    await idbPut(STORE.todos, todo);
                    renderTodos();
                }
            }
        });

        // Initial render calls
        renderTodos();
        loadFromStorage();
        updateCounters();
        setupTableEventListeners();

    // Claims Follow-up: wire up buttons
    setupFollowUpsUI();

    }).catch(error => {
        console.error("Failed to initialize the application:", error);
        // Optionally, show an error message to the user on the UI
    });

    // ... (any other non-DB dependent setup)

});

// --- Main Application Functions ---

async function renderTodos() {
    const todos = await idbGetAll(STORE.todos);
    const todoList = document.getElementById('todoList');
    if (!todoList) return;
    todoList.innerHTML = '';
    if (todos.length === 0) {
        todoList.innerHTML = '<li class="text-gray-500 text-center p-4">No to-do items yet.</li>';
        return;
    }
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 rounded-lg ${todo.completed ? 'bg-gray-700' : 'bg-gray-800'}`;
        li.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" data-id="${todo.id}" class="form-checkbox h-5 w-5 text-blue-500 rounded-md border-gray-600 bg-gray-900 focus:ring-blue-500" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${todo.id}" class="ml-3 text-sm font-medium ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-300'}">${todo.text}</label>
            </div>
            <button data-id="${todo.id}" class="text-gray-500 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        todoList.appendChild(li);
    });
}

// Premium Calculator Logic (NEW, IndexedDB-based)
var calculateBtn = document.getElementById('calculatePremiumBtn');
calculateBtn?.addEventListener('click', async function() {
    const plan = document.querySelector('input[name="plan"]:checked')?.value;
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    const saInput = document.getElementById('saInput'); // in thousands
    const ageInput = document.getElementById('ageInput');
    const premiumPaidTermInput = document.getElementById('premiumPaidTermInput');
    const policyTermInput = document.getElementById('policyTermInput');
    if (!plan || !mode || !saInput || !ageInput || !premiumPaidTermInput || !policyTermInput) {
        showToast('Calculator fields are missing in the page.');
        return;
    }
    const saThousands = parseFloat(saInput.value);
    const age = ageInput.value;
    const premiumPaidTerm = premiumPaidTermInput.value;
    const policyTerm = parseInt(policyTermInput.value, 10);
    if (!plan || !mode || !Number.isFinite(saThousands) || !age || !premiumPaidTerm || !Number.isFinite(policyTerm)) {
        showToast('Please fill all calculator fields with valid numbers.');
        return;
    }
    // Fetch tabular premium per 1000 SA (annual)
    const tabularPremium = await getTabularPremium(plan, age, premiumPaidTerm);
    if (!tabularPremium) {
        showToast('No tabular premium found for this age/term/plan.');
        return;
    }

    // 1) Apply mode rebate/extra first (percentage off the tabular per 1000)
    const modeRebatePct = getModeRebatePercent(plan, mode); // e.g., 0.03 or 0.02, etc.
    const per1000AfterMode = round2(tabularPremium * (1 - modeRebatePct));

    // 2) Apply Sum Assured rebate (absolute units per 1000) for specific plans only
    const saRupees = saThousands * 1000;
    const saRebateUnits = getSARebateUnits(plan, saRupees);
    const per1000AfterSA = Math.max(0, round2(per1000AfterMode - saRebateUnits));

    // 3) Convert to modal premium using the existing mode multipliers
    const multiplier = { YLY: 1, HLY: 0.51, QLY: 0.26, MLY: 0.085 }[mode];
    const modalPremium = round2(per1000AfterSA * saThousands * multiplier);
    const totalPremium = round2(modalPremium * policyTerm);

    // Show results with a clear breakdown
    document.getElementById('premiumResult').classList.remove('hidden');
    document.getElementById('modalPremiumResult').textContent = `₹${modalPremium.toFixed(2)}`;
    document.getElementById('totalPremiumResult').textContent = `₹${totalPremium.toFixed(2)}`;
    const modePctText = `${(modeRebatePct * 100).toFixed(1)}%`;
    const breakdown = [
        `Tabular per 1000: ₹${tabularPremium.toFixed(2)}`,
        `Mode ${mode} rebate: -${modePctText} ⇒ ₹${per1000AfterMode.toFixed(2)} per 1000`,
        `S.A. rebate (${saRebateUnits.toFixed(2)} units): ₹${per1000AfterMode.toFixed(2)} − ${saRebateUnits.toFixed(2)} = ₹${per1000AfterSA.toFixed(2)} per 1000`,
        `Modal conversion: ₹${per1000AfterSA.toFixed(2)} × S.A.: ${saThousands} × Mode Multiplier: ${multiplier} = <b>₹${modalPremium.toFixed(2)}</b>`,
        `Total over term: ₹${modalPremium.toFixed(2)} × Term: ${policyTerm} = <b>₹${totalPremium.toFixed(2)}</b>`
    ];
    document.getElementById('calculationBreakdown').innerHTML = breakdown.join('<br>');
});

function getModeRebatePercent(plan, mode) {
    // Percentages provided by user
    // YLY: 3% for 111/150, 2% for 174/179
    // HLY: 1.5% for 111/150, 1% for 174/179
    // QLY/MLY: assume 0% unless specified
    const p = String(plan);
    if (mode === 'YLY') {
        return (p === '111' || p === '150') ? 0.03 : 0.02;
    }
    if (mode === 'HLY') {
        return (p === '111' || p === '150') ? 0.015 : 0.01;
    }
    return 0;
}

function getSARebateUnits(plan, saRupees) {
    // Units per 1000 SA (absolute amount to subtract), per plan and SA slab
    const p = String(plan);
    if (p === '179') {
        if (saRupees <= 100000) return 0;
        if (saRupees <= 200000) return 5;
        return 7.5;
    }
    if (p === '174') {
        if (saRupees <= 50000) return 0;
        if (saRupees <= 100000) return 2.5;
        return 5;
    }
    return 0;
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

// Custom radio button styling logic
document.querySelectorAll('.option-card input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        // Find all radios in the same group
        document.querySelectorAll(`input[name="${radio.name}"]`).forEach(r => {
            r.parentElement.classList.remove('selected');
        });
        // Add selected class to the parent of the checked radio
        if (radio.checked) {
            radio.parentElement.classList.add('selected');
        }
    });
});

function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}



// Auto-format date inputs
function formatDateInput(input) {
    var value = input.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    input.value = value;
}


// Date input listeners are already attached after DB init; avoid duplicate bindings here.





function calculateDuration() {
    const commencementDate = document.getElementById('commencementDate');
    const deathDate = document.getElementById('deathDate');
    const durationDisplay = document.getElementById('durationDisplay');
    const durationText = document.getElementById('durationText');
    const suggestionBox = document.getElementById('suggestionBox');
    const suggestionText = document.getElementById('suggestionText');
    const timeBarWarning = document.getElementById('timeBarWarning');
    const manualSelection = document.getElementById('manualSelection');

    if (!commencementDate || !deathDate || !durationDisplay || !durationText || !suggestionBox || !suggestionText || !timeBarWarning || !manualSelection) {
        return;
    }

    var commDate = commencementDate.value.replace(/\//g, '');
    var deathDateVal = deathDate.value.replace(/\//g, '');

    if (commDate.length === 8 && deathDateVal.length === 8) {
        var commYear = parseInt(commDate.substring(4, 8));
        var commMonth = parseInt(commDate.substring(2, 4));
        var commDay = parseInt(commDate.substring(0, 2));

       var deathYear = parseInt(deathDateVal.substring(4, 8));
        var deathMonth = parseInt(deathDateVal.substring(2, 4));
        var deathDay = parseInt(deathDateVal.substring(0, 2));

        var commDateObj = new Date(commYear, commMonth - 1, commDay);
        var deathDateObj = new Date(deathYear, deathMonth - 1, deathDay);

        var diffTime = Math.abs(deathDateObj - commDateObj);
        var diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

        durationText.textContent = `${diffYears.toFixed(2)} years`;
        durationDisplay.classList.remove('hidden');

        // Show suggestion
        let suggestion = '';
        let bgColor = '';
        if (diffYears < 3) {
            suggestion = '🟥 Suggested: Early Claim';
            bgColor = 'suggestion-early';
        } else if (diffYears >= 3 && diffYears <= 5) {
            suggestion = '🟦 Suggested: Non-Early (4–5 Yrs)';
            bgColor = 'suggestion-medium';
        } else {
            suggestion = '🟩 Suggested: Non-Early';
            bgColor = 'suggestion-late';
        }


        suggestionText.textContent = suggestion;
        suggestionBox.className = `p-4 rounded-xl ${bgColor}`;
        suggestionBox.classList.remove('hidden');
        manualSelection.classList.remove('hidden');

        // Time-bar check using current date as intimation
        var today = new Date();
        var intimationDiff = (today - deathDateObj) / (1000 * 60 * 60 * 24);
        let timeBarMessage = '';
        if (commDateObj < new Date(2020, 0, 1)) {
            if (intimationDiff > 365 * 3) {
                timeBarMessage = '⚠️ Claim is time barred (death reported after 3 years)';
            }
        } else {
            if (intimationDiff > 90) {
                timeBarMessage = '⚠️ Claim is time barred (death reported after 90 days)';
            }
        }

        if (timeBarMessage) {
            timeBarWarning.textContent = timeBarMessage;
            timeBarWarning.classList.remove('hidden');
        } else {
            timeBarWarning.textContent = '';
            timeBarWarning.classList.add('hidden');
        }
    }
}




function removeRow(button) {
    var row = button.closest('tr');
    var tableBody = row.parentNode;
    const policyNo = row.dataset.policyNo;
    row.remove();
    
    if (tableBody.children.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
    }
    if (policyNo && savedCases[policyNo]) {
        delete savedCases[policyNo];
    }
    saveToStorage();
}

// Store case data for reopening with IndexedDB persistence
let savedCases = {};
let savedWorkflowStates = {};
let completedDeathCases = [];
let savedSpecialCases = {};
let completedSpecialCases = [];

// Save data to IndexedDB
async function saveToStorage() {
    // Save all active death claims as a single record
    await idbPut(STORE.claims, { id: '__savedCases__', data: savedCases });
    // Save workflow states (store as a single object)
    await idbPut(STORE.claims, { id: '__workflowStates__', data: savedWorkflowStates });
    // Save completed death cases
    await idbPut(STORE.claims, { id: '__completedDeathCases__', data: completedDeathCases });
    // Save special cases
    await idbPut(STORE.specialCases, { id: '__savedSpecialCases__', data: savedSpecialCases });
    await idbPut(STORE.specialCases, { id: '__completedSpecialCases__', data: completedSpecialCases });
    updateCounters();
}

// Update counters for all sections
function updateCounters() {
    // Authoritative counts from in-memory state
    const activeDeathCount = Object.keys(savedCases || {}).length;
    document.getElementById('activeDeathClaimsCounter').textContent = activeDeathCount;

    const activeSpecialCount = Object.keys(savedSpecialCases || {}).length;
    document.getElementById('activeSpecialCasesCounter').textContent = activeSpecialCount;


}

// Centralized event handling for all tables using event delegation
function setupTableEventListeners() {
    const tables = {
        'activeDeathClaimsTable': { openFn: openCase, removeFn: removeRow },
        'activeSpecialCasesTable': { openFn: openSpecialCase, removeFn: removeSpecialRow },
        'completedDeathClaimsTable': { openFn: openCaseFromCompleted, removeFn: removeCompletedRow },
        'completedSpecialCasesTable': { openFn: openCompletedSpecialCase, removeFn: removeCompletedSpecialRow }
    };

    for (const tableId in tables) {
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
            tableElement.addEventListener('click', function(e) {
                const row = e.target.closest('tr');
                if (!row) return;

                // Ignore placeholder rows (those with a single TD that has colspan)
                const firstTd = row.querySelector('td');
                if (!firstTd || firstTd.hasAttribute('colspan')) return;

                // Prefer data attribute; fall back to first cell text
                let policyNo = row.dataset.policyNo || firstTd.textContent?.trim();
                if (!policyNo) return;
                // For death claim tables, we no longer enforce numeric-only policy numbers here
                // to ensure rows open even if formatting includes spaces or dashes.
                const config = tables[tableId];

                // Check if a remove button was clicked
                if (e.target.closest('.btn-remove')) {
                    e.stopPropagation();
                    if (config.removeFn) config.removeFn(e.target);
                } 
                // Otherwise, treat the click as an intent to open/view
                else if (config.openFn) {
                    config.openFn(policyNo);
                }
            });
        }
    }
}

function populateCompletedCases(tableId, casesArray, createRowFunction) {
    const tableBody = document.getElementById(tableId);
    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing content

        if (casesArray.length > 0) {
            casesArray.forEach(caseData => {
                // Assuming caseData contains all necessary info, adapt as needed
                const newRow = createRowFunction(caseData);
                tableBody.appendChild(newRow);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed cases</td></tr>';
        }
    }
}

function createCompletedDeathCaseRow(caseData) {
    const row = document.createElement('tr');
    row.className = 'lic-table-row border-t transition-all duration-300';
    row.dataset.policyNo = caseData.policyNo;
    row.innerHTML = `<td class="px-6 py-4 font-semibold text-gray-300">${caseData.policyNo}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.name}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.claimType}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.completionDate}</td><td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>`;
    return row;
}

function createCompletedSpecialCaseRow(caseData) {
    const row = document.createElement('tr');
    row.className = 'lic-table-row border-t transition-all duration-300';
    row.dataset.policyNo = caseData.policyNo;
    row.innerHTML = `<td class="px-6 py-4 font-semibold text-gray-300">${caseData.policyNo}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.name}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.type}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.completionDate || new Date().toLocaleDateString()}</td><td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>`;
    return row;
}

// Load data from IndexedDB
async function loadFromStorage() {
    // Load all claims from IndexedDB
    const allClaims = await idbGetAll(STORE.claims);
    savedCases = {};
    completedDeathCases = [];
    savedWorkflowStates = {};
    const CLAIM_SENTINELS = new Set(['__savedCases__', '__workflowStates__', '__completedDeathCases__']);
    allClaims.forEach(claim => {
        if (claim.id === '__savedCases__') {
            savedCases = claim.data || {};
        } else if (claim.id === '__workflowStates__') {
            savedWorkflowStates = claim.data || {};
        } else if (claim.id === '__completedDeathCases__') {
            completedDeathCases = claim.data || [];
        } else if (!CLAIM_SENTINELS.has(claim.id)) {
            // Hydrate legacy/non-sentinel active claim if possible
            const pno = claim.policyNo || claim.policy || claim.id;
            if (pno && !savedCases[pno]) {
                savedCases[pno] = {
                    policyNo: pno,
                    name: claim.name || '',
                    claimType: claim.claimType || 'Non-Early',
                    commencementDate: claim.commencementDate || '',
                    deathDate: claim.deathDate || '',
                    query: claim.query || ''
                };
            }
        }
    });

    // Rebuild Active Death Claims table from savedCases object
    const activeDeathClaimsTable = document.getElementById('activeDeathClaimsTable');
    if (activeDeathClaimsTable) {
        activeDeathClaimsTable.innerHTML = '';
        const cases = Object.keys(savedCases);
        if (cases.length > 0) {
            cases.forEach(policyNo => {
                const caseData = savedCases[policyNo];
                const stage = getClaimStage(policyNo);
                const newRow = createDeathClaimRow(policyNo, caseData.name, caseData.claimType, stage);
                activeDeathClaimsTable.appendChild(newRow);
            });
        } else {
            activeDeathClaimsTable.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
        }
    }

    // Populate Completed Death Cases Table
    populateCompletedCases('completedDeathClaimsTable', completedDeathCases, createCompletedDeathCaseRow);

    // Load all special cases from IndexedDB
    const allSpecial = await idbGetAll(STORE.specialCases);
    savedSpecialCases = {};
    completedSpecialCases = [];
    const SC_SENTINELS = new Set(['__savedSpecialCases__', '__completedSpecialCases__']);
    allSpecial.forEach(entry => {
        if (entry.id === '__savedSpecialCases__') {
            savedSpecialCases = entry.data || {};
        } else if (entry.id === '__completedSpecialCases__') {
            completedSpecialCases = entry.data || [];
        } else if (!SC_SENTINELS.has(entry.id)) {
            // Hydrate legacy/non-sentinel special case if possible
            const pno = entry.policyNo || entry.policy || entry.id;
            if (pno && !savedSpecialCases[pno]) {
                savedSpecialCases[pno] = {
                    name: entry.name || '',
                    type: entry.type || '',
                    issue: entry.issue || '',
                    resolved: !!entry.resolved
                };
            }
        }
    });

    // Rebuild Active Special Cases table
    const activeSpecialCasesTable = document.getElementById('activeSpecialCasesTable');
    if (activeSpecialCasesTable) {
        activeSpecialCasesTable.innerHTML = '';
        const scases = Object.keys(savedSpecialCases);
        if (scases.length > 0) {
            scases.forEach(policyNo => {
                const caseData = savedSpecialCases[policyNo];
                const newRow = createSpecialCaseRow(policyNo, caseData.name, caseData.type, caseData.issue);
                activeSpecialCasesTable.appendChild(newRow);
            });
        } else {
            activeSpecialCasesTable.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
        }
    }

    // Populate Completed Special Cases Table
    populateCompletedCases('completedSpecialCasesTable', completedSpecialCases, createCompletedSpecialCaseRow);
    // Update counters after rebuilding tables
    updateCounters();
}

// Special Case Save functionality
document.getElementById('saveSpecialCase')?.addEventListener('click', function() {

    var policyNo = document.getElementById('specialPolicyNumber').value;
    var name = document.getElementById('specialName').value;
    var type = document.getElementById('specialType').value;
    var issue = document.getElementById('specialIssue').value;
    var resolved = document.getElementById('specialResolved').checked;

    if (!policyNo || !name || !type || !issue) {
        showToast('Please fill all fields.');
        return;
    }


    if (resolved) {
        // Add to completed special cases
        var completedTableBody = document.getElementById('completedSpecialCasesTable');
        if (completedTableBody.querySelector('td[colspan="5"]')) {
            completedTableBody.innerHTML = '';
        }

    // Save the completed case data
    const completed = { policyNo, name, type, issue, completionDate: new Date().toLocaleDateString() };
        completedSpecialCases.push(completed);
        // Append to completed special cases table immediately
        const completedRow = createCompletedSpecialCaseRow(completed);
        completedTableBody.appendChild(completedRow);

        // Remove from active cases
        var activeTableBody = document.getElementById('activeSpecialCasesTable');
        var rows = activeTableBody.querySelectorAll('tr');
        rows.forEach(function(row) {
            const policyCell = row.querySelector('td:first-child'); // corrected typo here
            if (policyCell && row.dataset.policyNo === policyNo) {
                // Remove the case from savedSpecialCases
                if (savedSpecialCases[policyNo]) {
                    delete savedSpecialCases[policyNo];
                }
                row.remove();
            }
        });

        // Also remove the data object from storage
        if (policyNo && savedSpecialCases[policyNo]) {
            delete savedSpecialCases[policyNo];
        }

        if (activeTableBody.children.length === 0) {
            activeTableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
        }

        saveToStorage();
        showToast('Special case marked as resolved and moved to completed cases!');


    } else {
        // Save to active special cases
        var tableBody = document.getElementById('activeSpecialCasesTable');
       if (tableBody.querySelector('td[colspan="5"]')) {
            tableBody.innerHTML = '';
        }

        // Check if case already exists
        let existingRow = null;
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(function(row) {
            const policyCell = row.querySelector('td:first-child');
            if (policyCell && policyCell.textContent === policyNo) {
                existingRow = row;
            }
        });

        // Save case data for reopening
        savedSpecialCases[policyNo] = {
            name: name,
            type: type,
            issue: issue,
            resolved: resolved
        };
        saveToStorage();

        if (existingRow) {
            updateSpecialCaseRow(existingRow, policyNo, name, type, issue);
        } else {
            var newRow = createSpecialCaseRow(policyNo, name, type, issue);
            tableBody.appendChild(newRow);
        }

        showToast('Special case saved successfully!');
    }

    document.getElementById('specialCaseForm')?.classList.add('hidden');
    resetSpecialForm();
});

function createSpecialCaseRow(policyNo, name, type, issue) {
    var row = document.createElement('tr');
    row.className = 'dark-table-row border-t transition-all duration-300';
    row.style.cursor = 'pointer';

    // Ensure dataset.policyNo is set
    row.dataset.policyNo = policyNo;
    updateSpecialCaseRow(row, policyNo, name, type, issue);
    return row;
}

function updateSpecialCaseRow(row, policyNo, name, type, issue) {
    row.innerHTML = `
        <td class="px-6 py-4 font-semibold text-gray-300">${policyNo}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${name}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${type}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${issue.length > 50 ? issue.substring(0, 50) + '...' : issue}</td>
        <td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>
    `;
}

function openCase(policyNo) {
    const caseData = savedCases[policyNo];

    // Always show the form
    document.getElementById('deathClaimForm')?.classList.remove('hidden');

    // Populate basics from saved data when available; otherwise, fall back to row values
    const policyEl = document.getElementById('policyNumber');
    const nameEl = document.getElementById('claimantName');
    if (policyEl) policyEl.value = policyNo;
    if (nameEl) nameEl.value = caseData?.name || (document.querySelector(`#activeDeathClaimsTable tr[data-policy-no="${policyNo}"] td:nth-child(2)`)?.textContent ?? '');

    // Restore saved fields if present
    if (caseData) {
        if (caseData.commencementDate) document.getElementById('commencementDate').value = caseData.commencementDate;
        if (caseData.deathDate) document.getElementById('deathDate').value = caseData.deathDate;
        if (caseData.query) document.getElementById('queryText').value = caseData.query;
        if (caseData.commencementDate && caseData.deathDate) calculateDuration();
    }

    // Select claim type from saved data or infer from the row's third column
    const claimType = caseData?.claimType || document.querySelector(`#activeDeathClaimsTable tr[data-policy-no="${policyNo}"] td:nth-child(3)`)?.textContent;
    if (claimType) {
        const claimTypeRadio = document.querySelector(`input[name="claimType"][value="${claimType}"]`);
        if (claimTypeRadio) {
            claimTypeRadio.checked = true;
            claimTypeRadio.dispatchEvent(new Event('change'));
        }
    }

    // Show workflow sections
    document.getElementById('workflowSections')?.classList.remove('hidden');

    // Restore workflow state if exists
    const workflowState = savedWorkflowStates[policyNo];
    if (workflowState) {
        Object.keys(workflowState).forEach(function(inputId) {
            var input = document.getElementById(inputId);
            if (!input) return;
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = workflowState[inputId];
                if (input.checked) input.dispatchEvent(new Event('change'));
            } else {
                input.value = workflowState[inputId];
                if (input.type === 'date' && input.value) input.dispatchEvent(new Event('change'));
            }
        });
    }
}

function removeSpecialRow(button) {
    var row = button.closest('tr');
    var tableBody = row.parentNode;
    const policyNo = row.dataset.policyNo;

    // Remove the data object from storage first
    if (policyNo && savedSpecialCases[policyNo]) {
        delete savedSpecialCases[policyNo];
    }
    row.remove();
    
    if (tableBody.children.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
    }
    saveToStorage();
}

function openSpecialCase(policyNo) {
    const caseData = savedSpecialCases[policyNo];
    if (!caseData) return;

    // Show the form
    document.getElementById('specialCaseForm')?.classList.remove('hidden');
    
    // Populate fields
    document.getElementById('specialPolicyNumber').value = policyNo;
    document.getElementById('specialName').value = caseData.name;
    document.getElementById('specialType').value = caseData.type;
    document.getElementById('specialIssue').value = caseData.issue;
    // Restore the 'resolved' checkbox state from saved data
    document.getElementById('specialResolved').checked = caseData.resolved || false;
}

// Open a death claim from the Completed table
function openCaseFromCompleted(policyNo) {
    const caseData = completedDeathCases.find(c => c.policyNo === policyNo);
    if (!caseData) return;
    // Show form
    document.getElementById('deathClaimForm')?.classList.remove('hidden');
    // Populate basics
    const policyEl = document.getElementById('policyNumber');
    const nameEl = document.getElementById('claimantName');
    if (policyEl) policyEl.value = caseData.policyNo;
    if (nameEl) nameEl.value = caseData.name;
    const claimTypeRadio = document.querySelector(`input[name="claimType"][value="${caseData.claimType}"]`);
    if (claimTypeRadio) {
        claimTypeRadio.checked = true;
        claimTypeRadio.dispatchEvent(new Event('change'));
    }
    document.getElementById('workflowSections')?.classList.remove('hidden');
}

// Open a special case from the Completed table
function openCompletedSpecialCase(policyNo) {
    const caseData = completedSpecialCases.find(c => c.policyNo === policyNo);
    if (!caseData) return;
    const form = document.getElementById('specialCaseForm');
    form?.classList.remove('hidden');
    const p = document.getElementById('specialPolicyNumber');
    const n = document.getElementById('specialName');
    const t = document.getElementById('specialType');
    const i = document.getElementById('specialIssue');
    if (p) p.value = caseData.policyNo;
    if (n) n.value = caseData.name;
    if (t) t.value = caseData.type;
    if (i) i.value = caseData.issue || '';
    const resolved = document.getElementById('specialResolved');
    if (resolved) resolved.checked = true;
}

function resetSpecialForm() {
    document.getElementById('specialPolicyNumber').value = '';
    document.getElementById('specialName').value = '';
    document.getElementById('specialType').value = '';
    document.getElementById('specialIssue').value = '';
    document.getElementById('specialResolved').checked = false;
}

// Reset the Death Claim form and related UI state
function resetForm() {
    // Clear basic inputs
    ['policyNumber', 'claimantName', 'commencementDate', 'deathDate', 'queryText'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else {
                el.value = '';
            }
        } else {
            // Fallback
            el.value = '';
        }
    });

    // Clear claim type selection
    document.querySelectorAll('input[name="claimType"]').forEach(r => (r.checked = false));
    window.selectedClaimType = undefined;

    // Hide and reset duration/suggestion/time-bar UI
    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.classList.add('hidden');
    const durationText = document.getElementById('durationText');
    if (durationText) durationText.textContent = '';
    const suggestionBox = document.getElementById('suggestionBox');
    if (suggestionBox) {
        suggestionBox.classList.add('hidden');
        // keep base classes if any, avoid removing styling classes set elsewhere
    }
    const suggestionText = document.getElementById('suggestionText');
    if (suggestionText) suggestionText.textContent = '';
    const timeBarWarning = document.getElementById('timeBarWarning');
    if (timeBarWarning) {
        timeBarWarning.textContent = '';
        timeBarWarning.classList.add('hidden');
    }
    const manualSelection = document.getElementById('manualSelection');
    if (manualSelection) manualSelection.classList.add('hidden');

    // Reset workflow sections state and inputs
    const workflow = document.getElementById('workflowSections');
    if (workflow) workflow.classList.add('hidden');
    // Clear all inputs inside workflow
    document.querySelectorAll('#workflowSections input, #workflowSections select, #workflowSections textarea').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    // Hide dynamic subsections and counters
    document.getElementById('investigationDetails')?.classList.add('hidden');
    document.getElementById('daysSinceAllotted')?.classList.add('hidden');
    const daysCount = document.getElementById('daysCount');
    if (daysCount) daysCount.textContent = '';
    document.getElementById('daysSinceSent')?.classList.add('hidden');
    const doSentDaysCount = document.getElementById('doSentDaysCount');
    if (doSentDaysCount) doSentDaysCount.textContent = '';

    // Reset LET forms section and nominee toggles
    document.getElementById('letFormsSection')?.classList.add('hidden');
    const nomineeAvailable = document.getElementById('nomineeAvailable');
    const nomineeNotAvailable = document.getElementById('nomineeNotAvailable');
    if (nomineeAvailable) nomineeAvailable.checked = false;
    if (nomineeNotAvailable) nomineeNotAvailable.checked = false;
    const deathClaimFormDocs = document.getElementById('deathClaimFormDocs');
    if (deathClaimFormDocs) deathClaimFormDocs.checked = false;
    const letForms = document.getElementById('letForms');
    if (letForms) letForms.checked = false;

    // Disable all workflow sections and reset headers/arrows
    if (typeof resetWorkflowSections === 'function') {
        resetWorkflowSections();
    }
}

// Workflow logic

var nomineeAvailable = document.getElementById('nomineeAvailable');
var nomineeNotAvailable = document.getElementById('nomineeNotAvailable');
var investigationRadios = document.querySelectorAll('input[name="investigationType"]');
var investigationDetails = document.getElementById('investigationDetails');
var investigationDate = document.getElementById('investigationDate');
var daysSinceAllotted = document.getElementById('daysSinceAllotted');
var daysCount = document.getElementById('daysCount');
var doSentDate = document.getElementById('doSentDate');
var daysSinceSent = document.getElementById('daysSinceSent');
var doSentDaysCount = document.getElementById('doSentDaysCount');
var doDecisionSection = document.getElementById('doDecisionSection');
var paymentDone = document.getElementById('paymentDone');

// Nominee checkbox logic (mutually exclusive) with completion tracking
nomineeAvailable?.addEventListener('change', function () {

    if (this.checked) {
        nomineeNotAvailable.checked = false;
        document.getElementById('letFormsSection').classList.add('hidden');
    }
    checkSectionCompletion('checkNominee');
});


nomineeNotAvailable?.addEventListener('change', function () {

    if (this.checked) {
        nomineeAvailable.checked = false;
        document.getElementById('letFormsSection').classList.remove('hidden');
    } else {
        document.getElementById('letFormsSection').classList.add('hidden');
    }
    checkSectionCompletion('checkNominee');
});

// Documents completion tracking

document.getElementById('deathClaimFormDocs')?.addEventListener('change', function () {
    checkSectionCompletion('documentsRequired');
});

document.getElementById('letForms')?.addEventListener('change', function () {

    checkSectionCompletion('documentsRequired');
});

// Investigation radio logic with completion tracking
investigationRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.checked) {
            investigationDetails.classList.remove('hidden');
        }
        checkSectionCompletion('investigation');
    });
});

// Investigation received completion tracking
document.getElementById('investigationReceived')?.addEventListener('change', function () {

    checkSectionCompletion('investigation');
});

// D.O. Decision completion tracking

document.getElementById('doDecisionReceived')?.addEventListener('change', function () {

    checkSectionCompletion('doDecision');
});

// Investigation date calculation

investigationDate?.addEventListener('change', function () {

    if (this.value) {
        const allottedDate = new Date(this.value);
        const today = new Date();
        const diffTime = Math.abs(today - allottedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        daysCount.textContent = diffDays;
        daysSinceAllotted.classList.remove('hidden');
    }
});

// D.O. sent date calculation
doSentDate?.addEventListener('change', function () {

    if (this.value) {
        const sentDate = new Date(this.value);
        const today = new Date();
        const diffTime = Math.abs(today - sentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        doSentDaysCount.textContent = diffDays;
        daysSinceSent.classList.remove('hidden');
    }
});

// Progressive workflow logic based on claim type
document.querySelectorAll('input[name="claimType"]').forEach(radio => {
    radio.addEventListener('change', function () {
        // Show workflow sections when claim type is selected // Keep let here because the error happens before this
        document.getElementById('workflowSections').classList.remove('hidden');
        
        // Reset all sections to collapsed and disabled
        resetWorkflowSections();
        
        // Enable first section (Check Nominee)
        enableSection('checkNominee');
        
        // Store selected claim type for workflow control
        window.selectedClaimType = this.value;
        
        // Show/hide sections based on claim type
        const investigationSection = document.getElementById('investigation').parentElement;
        if (this.value === 'Early') {
            doDecisionSection.classList.remove('hidden');
       investigationSection.classList.remove('hidden');
        } else if (this.value === 'Non-Early (4–5 Yrs)') {
            doDecisionSection.classList.add('hidden');
            investigationSection.classList.remove('hidden');
        } else { // Non-Early (>5 years)
            doDecisionSection.classList.add('hidden');
            investigationSection.classList.add('hidden');
        }
    });
});

function resetWorkflowSections() {
    // Collapse all workflow sections
    document.querySelectorAll('.workflow-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Reset all arrows
    document.querySelectorAll('.workflow-header span:last-child').forEach(arrow => {
        arrow.style.transform = 'rotate(0deg)';
    });
    
    // Disable all sections except the first one
    var sections = ['checkNominee', 'documentsRequired', 'investigation', 'doDecision', 'proceedPayment'];
    sections.forEach(sectionId => {
        disableSection(sectionId);
    });
}

function enableSection(sectionId) {
    const section = document.getElementById(sectionId);
    var header = document.querySelector(`[data-target="${sectionId}"]`);

    if (section && header) {
        header.classList.remove('opacity-50', 'cursor-not-allowed');
        header.classList.add('hover:bg-gray-50');
        header.style.pointerEvents = 'auto';
    }
}

function disableSection(sectionId) {
    const section = document.getElementById(sectionId);
    var header = document.querySelector(`[data-target="${sectionId}"]`);

    if (section && header) {
        header.classList.add('opacity-50', 'cursor-not-allowed');
        header.classList.remove('hover:bg-gray-50');
        header.style.pointerEvents = 'none';
        section.classList.remove('active');
    }
}

function checkSectionCompletion(sectionId) {
    let isComplete = false;
    let nextSectionId = null;
    
    switch(sectionId) {
        case 'checkNominee':
            isComplete = nomineeAvailable.checked || nomineeNotAvailable.checked;
            if (isComplete) {
                nextSectionId = 'documentsRequired';
                enableSection('documentsRequired');
            }
            break;
            
        case 'documentsRequired':
            var deathClaimFormChecked = document.getElementById('deathClaimFormDocs').checked;
            var letFormsChecked = document.getElementById('letForms').checked;
            var letFormsRequired = !document.getElementById('letFormsSection').classList.contains('hidden');

            isComplete = deathClaimFormChecked && (!letFormsRequired || letFormsChecked);
            if (isComplete) {
                if (window.selectedClaimType === 'Non-Early') {
                    // For Non-Early (>5 years), skip investigation and go to payment
                    nextSectionId = 'proceedPayment';
                    enableSection('proceedPayment');
                } else {
                    nextSectionId = 'investigation';
                    enableSection('investigation');
                }
            }
            break;
            
        case 'investigation':
            var investigationTypeSelected = document.querySelector('input[name="investigationType"]:checked');
            var investigationReceived = document.getElementById('investigationReceived').checked;

            isComplete = investigationTypeSelected && investigationReceived;
            if (isComplete) {
                if (window.selectedClaimType === 'Early') {
                    nextSectionId = 'doDecision';
                    enableSection('doDecision');
                } else {
                    nextSectionId = 'proceedPayment';
                    enableSection('proceedPayment');
                }
            }
            break;
            
        case 'doDecision':
            var doDecisionReceived = document.getElementById('doDecisionReceived').checked;
            isComplete = doDecisionReceived;
            if (isComplete) {
                nextSectionId = 'proceedPayment';
                enableSection('proceedPayment');
            }
            break;
    }
    
    // Auto-expand next section when current section is completed
    if (isComplete && nextSectionId) {
        setTimeout(function() {
            autoExpandSection(nextSectionId);
        }, 300); // Small delay for smooth transition
    }
    
    return isComplete;
}

function autoExpandSection(sectionId) {
    const section = document.getElementById(sectionId);
    var header = document.querySelector(`[data-target="${sectionId}"]`);
    var arrow = header.querySelector('span:last-child');

    if (section && header && !section.classList.contains('active')) {
        section.classList.add('active');
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Payment done - move to completed claims

paymentDone?.addEventListener('change', function () {
    
   if (this.checked) {
        const policyNo = document.getElementById('policyNumber').value;
        const name = document.getElementById('claimantName').value;
        var selectedType = document.querySelector('input[name="claimType"]:checked');
        
        if (policyNo && name && selectedType) {
            // Add to completed claims
            const completedTableBody = document.getElementById('completedDeathClaimsTable');
          if (completedTableBody.querySelector('td[colspan="5"]')) {
              completedTableBody.innerHTML = '';
            }
    
            const completedRow = document.createElement('tr');
            completedRow.className = 'lic-table-row border-t transition-all duration-300';
            completedRow.dataset.policyNo = policyNo;
            completedRow.innerHTML = `
                <td class="px-6 py-4 font-semibold text-gray-300">${policyNo}</td>
                <td class="px-6 py-4 font-semibold text-gray-300">${name}</td>
                <td class="px-6 py-4 font-semibold text-gray-300">${selectedType ? selectedType.value : 'N/A'}</td>
                <td class="px-6 py-4 font-semibold text-gray-300">${new Date().toLocaleDateString()}</td>
                <td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>
            `;
            completedTableBody.appendChild(completedRow);

             // Save the completed case data
             completedDeathCases.push({
                 policyNo: policyNo,
                 name: name,
                 claimType: selectedType.value,
                 completionDate: new Date().toLocaleDateString()
            });
    
             // Remove from savedCases (active cases)
             if (savedCases[policyNo]) {
                delete savedCases[policyNo];
            }

            // Remove from active claims
            const activeTableBody = document.getElementById('activeDeathClaimsTable');
            const rows = activeTableBody.querySelectorAll('tr');
            rows.forEach(function(row) {
                const policyCell = row.querySelector('td:first-child');
                if (row.dataset.policyNo === policyNo) {
                    row.remove();
                }
            });

            if (activeTableBody.children.length === 0) {
                activeTableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
            }


             saveToStorage();
            showToast('Claim completed and moved to completed claims!');
            document.getElementById('deathClaimForm')?.classList.add('hidden');
            resetForm();

        }
    }
});

// Save progress functionality

document.getElementById('saveProgress')?.addEventListener('click', async function () {
    const policyNo = document.getElementById('policyNumber').value;
    const name = document.getElementById('claimantName').value;
    var selectedType = document.querySelector('input[name="claimType"]:checked');
    if (!policyNo || !name || !selectedType) {
        showToast('Please fill basic claim information first.');
        return;
    }
    // Save all form data
    var formData = {
        policyNo: policyNo,
        commencementDate: document.getElementById('commencementDate').value,
        deathDate: document.getElementById('deathDate').value,
        query: document.getElementById('queryText').value,
        name: name,
        claimType: selectedType.value
    };
    savedCases[policyNo] = formData;
    // Save workflow state
    var workflowState = {};
    var allInputs = document.querySelectorAll('#workflowSections input, #workflowSections select, #workflowSections textarea');
    allInputs.forEach(function(input) {
        if (input.type === 'checkbox' || input.type === 'radio') {
            workflowState[input.id] = input.checked;
        } else {
            workflowState[input.id] = input.value;
        }
    });
    savedWorkflowStates[policyNo] = workflowState;
    // Persist only via sentinel records for consistency
    await saveToStorage();
    // Update or add to active claims table
    const tableBody = document.getElementById('activeDeathClaimsTable');
    if (tableBody.querySelector('td[colspan="5"]')) {
        tableBody.innerHTML = '';
    }
    // Check if claim already exists
    let existingRow = null;
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(function(row) {
        const policyCell = row.querySelector('td:first-child');
        if (policyCell && policyCell.textContent === policyNo) {
            existingRow = row;
        }
    });
    const stage = getClaimStage(policyNo);
    if (existingRow) {
        updateDeathClaimRow(existingRow, policyNo, name, selectedType.value, stage);
    } else {
        const newRow = createDeathClaimRow(policyNo, name, selectedType.value, stage);
        tableBody.appendChild(newRow);
    }
    showToast('Progress saved successfully!');
    document.getElementById('deathClaimForm')?.classList.add('hidden');
    resetForm();
});

function createDeathClaimRow(policyNo, name, claimType, stage) {
    var row = document.createElement('tr');
    row.className = 'dark-table-row border-t transition-all duration-300';
    row.style.cursor = 'pointer';
    row.dataset.policyNo = policyNo;
    updateDeathClaimRow(row, policyNo, name, claimType, stage);
    return row;
}

function updateDeathClaimRow(row, policyNo, name, claimType, stage) {
    row.innerHTML = `
        <td class="px-6 py-4 font-semibold text-gray-300">${policyNo}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${name}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${claimType}</td>
        <td class="px-6 py-4 font-semibold text-gray-300">${stage}</td>
        <td class="px-6 py-4">
            <button class="btn-danger btn-remove px-3 py-1 rounded-lg text-xs">Remove</button>
        </td>
    `;
}

function getClaimStage() {
    if (document.getElementById('paymentDone').checked) return 'Payment Done';
    if (document.getElementById('doDecisionReceived') && document.getElementById('doDecisionReceived').checked) return 'D.O. Decision Received';
    if (document.getElementById('investigationReceived').checked) return 'Investigation Complete';
    if (document.getElementById('investigationDate').value) return 'Under Investigation';
    if (document.getElementById('deathClaimFormDocs').checked) return 'Documents Received';
    if (document.getElementById('nomineeAvailable').checked || document.getElementById('nomineeNotAvailable').checked) return 'Nominee Verified';
    return 'Initial Review';
}

// Note: Removed duplicate async openCase() that loaded ad-hoc per-claim records.

// --- Plan Data (inline from your JSONs) ---
const PLAN_111 = {
  "18": {"15":19.55,"16":17.45,"17":15.75,"18":14.4,"19":13.35,"20":12.45,"21":11.7,"22":11.1,"23":10.55,"24":10.1,"25":9.75,"26":"9.4","27":"9.1","28":"8.9","29":"8.65","30":"8.5"},
  "19": {"15":19.6,"16":17.45,"17":15.8,"18":14.45,"19":13.4,"20":12.5,"21":11.75,"22":11.15,"23":10.65,"24":10.2,"25":9.8,"26":"9.5","27":"9.2","28":"9","29":"8.8","30":"8.6"},
  "20": {"15":19.7,"16":17.5,"17":15.85,"18":14.55,"19":13.45,"20":12.55,"21":11.85,"22":11.25,"23":10.7,"24":10.3,"25":9.9,"26":"9.6","27":"9.35","28":"9.1","29":"8.9","30":"8.75"},
  "21": {"15":19.7,"16":17.6,"17":15.95,"18":14.6,"19":13.55,"20":12.65,"21":11.95,"22":11.35,"23":10.85,"24":10.4,"25":10.05,"26":"9.75","27":"9.45","28":"9.25","29":"9.05","30":"8.9"},
  "22": {"15":19.8,"16":17.7,"17":16.05,"18":14.7,"19":13.65,"20":12.75,"21":12.05,"22":11.5,"23":11.0,"24":10.55,"25":10.2,"26":"9.9","27":"9.65","28":"9.4","29":"9.25","30":"9.05"},
  "23": {"15":19.9,"16":17.8,"17":16.15,"18":14.85,"19":13.8,"20":12.9,"21":12.2,"22":11.65,"23":11.15,"24":10.75,"25":10.4,"26":"10.1","27":"9.85","28":"9.6","29":"9.45","30":"9.3"},
  "24": {"15":20.05,"16":17.95,"17":16.35,"18":15.0,"19":13.95,"20":13.1,"21":12.4,"22":11.85,"23":11.35,"24":10.95,"25":10.6,"26":"10.3","27":"10.05","28":"9.8","29":"9.65","30":"9.55"},
  "25": {"15":20.25,"16":18.15,"17":16.5,"18":15.25,"19":14.2,"20":13.35,"21":12.65,"22":12.05,"23":11.6,"24":11.2,"25":10.85,"26":"10.55","27":"10.3","28":"10.1","29":"9.95","30":"9.8"},
  "26": {"15":20.45,"16":18.4,"17":16.75,"18":15.45,"19":14.45,"20":13.6,"21":12.9,"22":12.3,"23":11.85,"24":11.45,"25":11.1,"26":"10.85","27":"10.6","28":"10.4","29":"10.25","30":"10.1"},
  "27": {"15":20.7,"16":18.65,"17":17.05,"18":15.75,"19":14.7,"20":13.85,"21":13.2,"22":12.6,"23":12.15,"24":11.75,"25":11.45,"26":"11.15","27":"10.95","28":"10.75","29":"10.6","30":"10.45"},
  "28": {"15":21.0,"16":18.95,"17":17.35,"18":16.05,"19":15.05,"20":14.2,"21":13.5,"22":12.95,"23":12.5,"24":12.1,"25":11.8,"26":"11.5","27":"11.3","28":"11.1","29":"10.95","30":"10.8"},
  "29": {"15":21.35,"16":19.3,"17":17.7,"18":16.4,"19":15.4,"20":14.55,"21":13.9,"22":13.35,"23":12.9,"24":12.5,"25":12.2,"26":"11.9","27":"11.7","28":"11.5","29":"11.35","30":"11.25"},
  "30": {"15":21.75,"16":19.7,"17":18.1,"18":16.85,"19":15.8,"20":15.0,"21":14.35,"22":13.75,"23":13.3,"24":12.95,"25":12.65,"26":"12.35","27":"12.15","28":"11.95","29":"11.8","30":"11.7"},
  "31": {"15":22.2,"16":20.15,"17":18.55,"18":17.3,"19":16.3,"20":15.45,"21":14.8,"22":14.25,"23":13.8,"24":13.45,"25":13.1,"26":"12.85","27":"12.65","28":"12.45","29":"12.35","30":"12.25"},
  "32": {"15":22.75,"16":20.7,"17":19.1,"18":17.8,"19":16.8,"20":16.0,"21":15.35,"22":14.8,"23":14.35,"24":13.95,"25":13.65,"26":"13.4","27":"13.2","28":"13","29":"–","30":"–"},
  "33": {"15":23.3,"16":21.25,"17":19.65,"18":18.4,"19":17.4,"20":16.55,"21":15.9,"22":15.35,"23":14.9,"24":14.55,"25":14.25,"26":"14","27":"13.8","28":"–","29":"–","30":"–"},
  "34": {"15":23.95,"16":21.9,"17":20.3,"18":19.05,"19":18.05,"20":17.2,"21":16.55,"22":16.0,"23":15.55,"24":15.2,"25":14.9,"26":"14.65","27":"–","28":"–","29":"–","30":"–"},
  "35": {"15":24.65,"16":22.6,"17":21.0,"18":19.75,"19":18.75,"20":17.9,"21":17.25,"22":16.7,"23":16.25,"24":15.9,"25":15.6,"26":"–","27":"–","28":"–","29":"–","30":"–"}
};

const PLAN_150 = {
  "18": {"10":21.95,"11":19.55,"12":17.65,"13":16.15,"14":14.8,"15":14.05,"16":13.15,"17":12.15,"18":11.8,"19":11.25,"20":10.95,"21":10.5,"22":10.15,"23":9.85,"24":9.55,"25":9.4,"26":9.2,"27":9.0,"28":8.85,"29":8.7,"30":8.65},
  "19": {"10":22.05,"11":19.65,"12":17.75,"13":16.2,"14":15.0,"15":14.15,"16":13.3,"17":12.55,"18":11.9,"19":11.4,"20":11.05,"21":10.65,"22":10.3,"23":9.95,"24":9.7,"25":9.55,"26":9.35,"27":9.15,"28":9.0,"29":8.9,"30":8.8},
  "20": {"10":22.15,"11":19.7,"12":17.8,"13":16.3,"14":15.15,"15":14.25,"16":13.4,"17":12.65,"18":12.05,"19":11.6,"20":11.2,"21":10.8,"22":10.45,"23":10.1,"24":9.85,"25":9.7,"26":9.5,"27":9.3,"28":9.15,"29":9.0,"30":8.9},
  "21": {"10":22.35,"11":19.85,"12":17.95,"13":16.45,"14":15.3,"15":14.4,"16":13.5,"17":12.8,"18":12.2,"19":11.65,"20":11.3,"21":10.95,"22":10.6,"23":10.3,"24":10.0,"25":9.9,"26":9.7,"27":9.5,"28":9.35,"29":9.2,"30":9.2},
  "22": {"10":22.5,"11":19.95,"12":18.05,"13":16.55,"14":15.35,"15":14.55,"16":13.7,"17":12.95,"18":12.35,"19":11.8,"20":11.55,"21":11.15,"22":10.75,"23":10.45,"24":10.2,"25":10.1,"26":9.9,"27":9.7,"28":9.55,"29":9.4,"30":9.4},
  "23": {"10":22.6,"11":20.1,"12":18.2,"13":16.7,"14":15.45,"15":14.7,"16":13.85,"17":13.15,"18":12.5,"19":12.0,"20":11.75,"21":11.35,"22":10.9,"23":10.6,"24":10.4,"25":10.3,"26":10.1,"27":9.9,"28":9.75,"29":9.65,"30":9.65},
  "24": {"10":22.75,"11":20.25,"12":18.35,"13":16.85,"14":15.65,"15":14.8,"16":14.05,"17":13.3,"18":12.7,"19":12.25,"20":11.95,"21":11.55,"22":11.2,"23":10.9,"24":10.65,"25":10.5,"26":10.35,"27":10.2,"28":10.05,"29":9.95,"30":9.95},
  "25": {"10":22.9,"11":20.45,"12":18.6,"13":17.1,"14":15.85,"15":15.15,"16":14.3,"17":13.55,"18":12.95,"19":12.45,"20":12.2,"21":11.8,"22":11.45,"23":11.15,"24":10.9,"25":10.8,"26":10.65,"27":10.45,"28":10.3,"29":10.15,"30":10.2},
  "26": {"10":23.15,"11":20.7,"12":18.85,"13":17.3,"14":16.1,"15":15.45,"16":14.55,"17":13.85,"18":13.2,"19":12.7,"20":12.5,"21":12.1,"22":11.75,"23":11.45,"24":11.15,"25":11.15,"26":10.95,"27":10.8,"28":10.6,"29":10.5,"30":10.55},
  "27": {"10":23.45,"11":21.05,"12":19.15,"13":17.6,"14":16.4,"15":15.75,"16":14.85,"17":14.15,"18":13.5,"19":13.0,"20":12.8,"21":12.4,"22":12.05,"23":11.75,"24":11.5,"25":11.5,"26":11.3,"27":11.1,"28":10.95,"29":10.8,"30":10.9},
  "28": {"10":23.85,"11":21.4,"12":19.5,"13":17.95,"14":16.7,"15":16.1,"16":15.25,"17":14.5,"18":13.85,"19":13.35,"20":13.2,"21":12.8,"22":12.45,"23":12.15,"24":11.85,"25":11.8,"26":11.7,"27":11.5,"28":11.3,"29":11.2,"30":11.3},
  "29": {"10":24.3,"11":21.85,"12":19.9,"13":18.3,"14":17.1,"15":16.5,"16":15.65,"17":14.9,"18":14.25,"19":13.75,"20":13.6,"21":13.2,"22":12.85,"23":12.55,"24":12.3,"25":12.3,"26":12.1,"27":11.95,"28":11.75,"29":11.65,"30":11.75}
};

const PLAN_179 = {
  "14": {"12":63.1,"16":55.05,"20":40.25},
  "15": {"12":63.3,"16":55.2,"20":40.4},
  "16": {"12":63.5,"16":55.35,"20":40.55},
  "17": {"12":63.7,"16":55.5,"20":40.7},
  "18": {"12":63.9,"16":55.7,"20":40.85},
  "19": {"12":64.05,"16":55.85,"20":41.05},
  "20": {"12":64.25,"16":56.0,"20":41.2},
  "21": {"12":64.4,"16":56.15,"20":41.35},
  "22": {"12":64.6,"16":56.35,"20":41.6},
  "23": {"12":64.75,"16":56.55,"20":41.8},
  "24": {"12":64.95,"16":56.75,"20":42.05},
  "25": {"12":65.2,"16":57.0,"20":42.3},
  "26": {"12":65.45,"16":57.25,"20":42.6},
  "27": {"12":65.7,"16":57.55,"20":42.95},
  "28": {"12":66.05,"16":57.9,"20":43.3},
  "29": {"12":66.45,"16":58.3,"20":43.75},
  "30": {"12":66.9,"16":58.8,"20":44.2},
  "31": {"12":67.5,"16":59.35,"20":44.75},
  "32": {"12":68.25,"16":60.0,"20":45.35},
  "33": {"12":69.05,"16":60.75,"20":46.0},
  "34": {"12":70.0,"16":61.55,"20":46.75},
  "35": {"12":71.05,"16":62.4,"20":47.55},
  "36": {"12":72.2,"16":63.35,"20":48.45},
  "37": {"12":73.5,"16":64.4,"20":49.4},
  "38": {"12":74.95,"16":65.55,"20":50.45},
  "39": {"12":76.45,"16":66.8,"20":51.55},
  "40": {"12":78.1,"16":68.1,"20":52.75},
  "41": {"12":79.85,"16":69.5,"20":54.05},
  "42": {"12":81.7,"16":71.05,"20":55.4},
  "43": {"12":83.75,"16":72.7,"20":56.9},
  "44": {"12":86.0,"16":74.5,"20":58.45},
  "45": {"12":88.45,"16":76.45,"20":60.15},
  "46": {"12":91.05,"16":78.5,"20":null},
  "47": {"12":93.9,"16":80.75,"20":null},
  "48": {"12":96.95,"16":83.1,"20":null},
  "49": {"12":100.0,"16":85.55,"20":null},
  "50": {"12":103.3,"16":88.1,"20":null},
  "51": {"12":106.7,"16":90.8,"20":null},
  "52": {"12":110.3,"16":null,"20":null},
  "53": {"12":114.0,"16":null,"20":null},
  "54": {"12":117.8,"16":null,"20":null},
  "55": {"12":121.8,"16":null,"20":null},
  "56": {"12":125.85,"16":null,"20":null},
  "57": {"12":129.95,"16":null,"20":null}
};

// Plan 174 - Bima Gold (Annual premium per 1000 SA)
const PLAN_174 = {
    "14": {"12":65.45,"16":56.80,"20":41.65},
    "15": {"12":65.70,"16":56.90,"20":41.75},
    "16": {"12":65.90,"16":57.05,"20":41.85},
    "17": {"12":66.05,"16":57.15,"20":41.95},
    "18": {"12":66.20,"16":57.25,"20":42.05},
    "19": {"12":66.40,"16":57.35,"20":42.15},
    "20": {"12":66.50,"16":57.45,"20":42.25},
    "21": {"12":66.60,"16":57.55,"20":42.35},
    "22": {"12":66.60,"16":57.55,"20":42.45},
    "23": {"12":66.80,"16":57.75,"20":42.60},
    "24": {"12":66.90,"16":57.90,"20":42.70},
    "25": {"12":67.00,"16":58.00,"20":42.85},
    "26": {"12":67.15,"16":58.15,"20":43.00},
    "27": {"12":67.30,"16":58.35,"20":43.20},
    "28": {"12":67.45,"16":58.55,"20":43.45},
    "29": {"12":67.60,"16":58.75,"20":43.70},
    "30": {"12":68.05,"16":59.25,"20":44.00},
    "31": {"12":68.45,"16":59.45,"20":44.35},
    "32": {"12":68.90,"16":59.85,"20":44.80},
    "33": {"12":69.50,"16":60.35,"20":45.30},
    "34": {"12":70.10,"16":60.90,"20":45.85},
    "35": {"12":70.85,"16":61.55,"20":46.45},
    "36": {"12":71.70,"16":62.25,"20":47.10},
    "37": {"12":72.65,"16":63.05,"20":47.85},
    "38": {"12":73.70,"16":63.95,"20":48.65},
    "39": {"12":74.80,"16":64.90,"20":49.50},
    "40": {"12":76.05,"16":65.90,"20":50.40},
    "41": {"12":77.35,"16":67.00,"20":51.35},
    "42": {"12":78.85,"16":68.20,"20":52.45},
    "43": {"12":80.50,"16":69.45,"20":53.55},
    "44": {"12":82.30,"16":70.90,"20":54.80},
    "45": {"12":84.25,"16":72.40,"20":56.15},
    "46": {"12":86.40,"16":74.05,"20":57.60},
    "47": {"12":88.65,"16":75.80,"20":59.15},
    "48": {"12":91.00,"16":77.65,"20":60.75},
    "49": {"12":93.50,"16":79.60,"20":62.45},
    "50": {"12":96.10,"16":81.60,"20":64.25},
    "51": {"12":98.85,"16":83.75,"20":66.10},
    "52": {"12":101.65,"16":85.95,"20":68.10},
    "53": {"12":104.60,"16":88.25,"20":70.10},
    "54": {"12":107.60,"16":90.65,"20":72.25},
    "55": {"12":110.65,"16":93.10,"20":74.45},
    "56": {"12":113.75,"16":95.65,"20":null},
    "57": {"12":117.05,"16":98.35,"20":null},
    "58": {"12":120.55,"16":101.20,"20":null},
    "59": {"12":124.40,"16":104.30,"20":null},
    "60": {"12":128.50,"16":null,"20":null},
    "61": {"12":132.75,"16":null,"20":null},
    "62": {"12":137.15,"16":null,"20":null},
    "63": {"12":141.45,"16":null,"20":null}
};

        // --- Premium Calculator Logic ---
        const MODE_MULTIPLIERS = { YLY: 1, HLY: 0.51, QLY: 0.26, MLY: 0.085 };
        async function getTabularPremium(plan, age, term) {
            try {
                const plans = await idbGetAll(STORE.plans);
                const rec = plans.find(p => p.plan === String(plan));
                const table = rec?.data;
                if (!table) return null;
                const raw = table[String(age)]?.[String(term)];
                const val = typeof raw === 'string' ? parseFloat(raw) : raw;
                return Number.isFinite(val) ? val : null;
            } catch (e) {
                console.error('getTabularPremium error', e);
                return null;
            }
        }

        // Handlers to remove completed rows (delegated in setupTableEventListeners)
        function removeCompletedRow(el) {
            const row = el.closest('tr');
            const policyNo = row?.dataset?.policyNo || row?.querySelector('td')?.textContent;
            if (!row || !policyNo) return;
            row.remove();
            const idx = completedDeathCases.findIndex(c => c.policyNo === policyNo);
            if (idx !== -1) completedDeathCases.splice(idx, 1);
            saveToStorage();
            updateCounters();
            const body = document.getElementById('completedDeathClaimsTable');
            if (body && body.children.length === 0) {
                body.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed cases</td></tr>';
            }
        }

        function removeCompletedSpecialRow(el) {
            const row = el.closest('tr');
            const policyNo = row?.dataset?.policyNo || row?.querySelector('td')?.textContent;
            if (!row || !policyNo) return;
            row.remove();
            const idx = completedSpecialCases.findIndex(c => c.policyNo === policyNo);
            if (idx !== -1) completedSpecialCases.splice(idx, 1);
            saveToStorage();
            updateCounters();
            const body = document.getElementById('completedSpecialCasesTable');
            if (body && body.children.length === 0) {
                body.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed cases</td></tr>';
            }
        }

// ===================== Claims Follow-up =====================
let followUps = {}; // keyed by policyNo
let followUpColumns = []; // dynamic column keys in display order (from pasted data)
// Persisted UI preference to show/hide editable detail columns (Agent, phones, remarks)
let followUpShowDetails = (localStorage.getItem('followUpShowDetails') ?? '1') !== '0';

function setupFollowUpsUI() {
    const updateBtn = document.getElementById('followUpUpdateBtn');
    const parseBtn = document.getElementById('followUpParseBtn');
    const cancelPaste = document.getElementById('followUpCancelPaste');
    const saveAllBtn = document.getElementById('followUpSaveAllBtn');
    const pasteBox = document.getElementById('followUpPasteBox');
    const pasteInput = document.getElementById('followUpPasteInput');
    const openFullscreen = document.getElementById('followUpOpenFullscreen');
    const modal = document.getElementById('followUpModal');
    const modalClose = document.getElementById('followUpModalClose');
    const toggleDetailsBtn = document.getElementById('followUpToggleDetails');
    const modalToggleDetailsBtn = document.getElementById('followUpModalToggleDetails');

    // Load persisted follow-ups on init
    loadFollowUps();

    updateBtn?.addEventListener('click', () => {
        pasteBox?.classList.remove('hidden');
    });
    cancelPaste?.addEventListener('click', () => {
        pasteBox?.classList.add('hidden');
        pasteInput.value = '';
    });
    parseBtn?.addEventListener('click', async () => {
        const raw = pasteInput.value.trim();
        if (!raw) { showToast('Nothing to parse'); return; }
        const { rows: parsed, columns } = parseOutstanding(raw);
        if (parsed.length === 0) { showToast('No rows detected'); return; }
        followUpColumns = columns; // remember column layout
        // Merge by policyNo, preserve existing fields (remarks, agent details, status)
        const incomingKeys = new Set();
        parsed.forEach(row => {
            if (!row.policyNo) return;
            incomingKeys.add(row.policyNo);
            const existing = followUps[row.policyNo] || {};
            followUps[row.policyNo] = {
                policyNo: row.policyNo,
                // bring across all parsed columns into the record for display
                ...Object.fromEntries(columns.map(k => [k, row[k] ?? existing[k] ?? ''])),
                // preserved fields
                status: existing.status || 'grey',
                agent: existing.agent || '',
                agentMobile: existing.agentMobile || '',
                customerNo: existing.customerNo || '',
                customerOP: existing.customerOP || '',
                remarks: existing.remarks || ''
            };
        });
        // Remove entries not present in new list
        Object.keys(followUps).forEach(p => { if (!incomingKeys.has(p)) delete followUps[p]; });
        await saveFollowUps();
        renderFollowUps();
        pasteBox?.classList.add('hidden');
        pasteInput.value = '';
        showToast('Follow-up list merged.');
    });
    saveAllBtn?.addEventListener('click', async () => {
        await saveFollowUps();
        showToast('Follow-up entries saved.');
    });

    openFullscreen?.addEventListener('click', () => {
        if (!modal) return;
        modal.classList.remove('hidden');
        renderFollowUps(true); // render into modal
    });
    modalClose?.addEventListener('click', () => {
        modal?.classList.add('hidden');
    });
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // Toggle Details (panel)
    toggleDetailsBtn?.addEventListener('click', () => {
        followUpShowDetails = !followUpShowDetails;
        localStorage.setItem('followUpShowDetails', followUpShowDetails ? '1' : '0');
        // Re-render both views
        renderFollowUps();
        if (!modal?.classList.contains('hidden')) renderFollowUps(true);
    });
    // Toggle Details (modal)
    modalToggleDetailsBtn?.addEventListener('click', () => {
        followUpShowDetails = !followUpShowDetails;
        localStorage.setItem('followUpShowDetails', followUpShowDetails ? '1' : '0');
        renderFollowUps(true);
        // Also update panel if visible
        renderFollowUps();
    });
}

function parseOutstanding(raw) {
    // Accept HTML table or CSV/TSV text; return { rows, columns }
    if (/</.test(raw)) {
        // Attempt HTML parsing
        const div = document.createElement('div');
        div.innerHTML = raw;
        const trs = Array.from(div.querySelectorAll('tr'));
        const matrix = trs.map(tr => Array.from(tr.querySelectorAll('td,th')).map(td => td.textContent.trim()));
        return matrixToFollowUps(matrix);
    }
    // Text: split lines, prefer tab-delimited if present; else CSV
    const lines = raw.split(/\r?\n/).filter(l => l.replace(/\s+/g,'').length);
    // Determine delimiter globally for better consistency
    const containsTab = lines.some(l => l.includes('\t'));
    const useTab = containsTab;
    const matrix = lines.map(line => {
        if (useTab) {
            return line.split('\t').map(s => s.trim());
        }
        if (line.includes(',')) {
            return splitCsvLine(line);
        }
        // fallback: split on multiple spaces
        return line.split(/\s{2,}/).map(s => s.trim());
    });
    return matrixToFollowUps(matrix);
}

function matrixToFollowUps(matrix) {
    // Decide whether first row is a header by matching common header tokens
    let header = matrix[0] || [];
    const tokens = ['policy', 'plan', 'term', 'due', 'address', 'amount', 'status', 'name'];
    const headerHits = header.reduce((acc, c) => acc + (tokens.some(t => String(c).toLowerCase().includes(t)) ? 1 : 0), 0);
    let rows = matrix;
    if (headerHits >= 2) {
        rows = matrix.slice(1);
    } else {
        // synthesize headers based on column count and common pattern (PolicyNo, Plan, TermYears, DueDate, Address, Amount, Status)
        const sample = matrix[0] || [];
        header = guessHeaders(sample.length, sample);
    }
    // Normalize header names to camelCase keys
    const keys = header.map(h => normalizeHeader(h));
    // Ensure essential keys exist
    if (!keys.includes('policyNo') && keys.includes('policyNumber')) {
        // ok
    }
    const columns = [];
    const pushCol = k => { if (!columns.includes(k)) columns.push(k); };
    // Build rows
    const out = [];
    rows.forEach(cols => {
        const rec = {};
        for (let i=0;i<cols.length;i++) {
            const kRaw = keys[i] || `col${i+1}`;
            const k = kRaw;
            const val = cols[i]?.trim?.() ?? '';
            rec[k] = val;
            pushCol(k);
        }
        // Extract policy number from known fields
        const pRaw = rec.policyNo || rec.policyNumber || rec.policy || rec['policy no'] || rec['policynumber'] || '';
        const policyNo = (String(pRaw).match(/[A-Za-z0-9-]+/) || [String(pRaw)])[0];
        if (!policyNo) return; // skip
        rec.policyNo = policyNo;
        pushCol('policyNo');
        out.push(rec);
    });
    // Prefer a nice default ordering: policyNo first then common columns
    const preferred = ['policyNo', 'plan', 'termYears', 'term', 'dueDate', 'address', 'claimAmount', 'outstandingStatus', 'name'];
    const ordered = ['policyNo'];
    preferred.forEach(k => { if (columns.includes(k) && !ordered.includes(k)) ordered.push(k); });
    columns.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });
    return { rows: out, columns: ordered };
}

function splitCsvLine(line) {
    // basic CSV splitter with quotes
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i=0;i<line.length;i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(cur.trim()); cur='';
        } else {
            cur += ch;
        }
    }
    result.push(cur.trim());
    return result;
}

function normalizeHeader(h) {
    const s = String(h || '').toLowerCase().trim();
    if (!s) return '';
    // map common names
    if (s.startsWith('policy')) return 'policyNo';
    if (s === 'plan') return 'plan';
    if (s.includes('term')) return 'termYears';
    if (s.includes('due')) return 'dueDate';
    if (s.includes('address')) return 'address';
    if (s.includes('amount')) return 'claimAmount';
    if (s.includes('status')) return 'outstandingStatus';
    if (s.includes('name')) return 'name';
    return s.replace(/[^a-z0-9]+([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function guessHeaders(len, sample) {
    // If first value looks like a policy number, use common mapping
    const first = String(sample?.[0] || '');
    const looksLikePolicy = /[A-Za-z]{2,}\d{3,}/.test(first) || /^\d{6,}$/.test(first);
    if (looksLikePolicy && len >= 6) {
        const base = ['Policy Number','Plan','Term (Years)','Due Date','Address','Claim Amount','Outstanding Status'];
        return base.slice(0, len);
    }
    // Default: col1..colN
    return Array.from({ length: len }, (_, i) => `col${i+1}`);
}

async function loadFollowUps() {
    const all = await idbGetAll(STORE.followups);
    followUps = {};
    all.forEach(rec => { if (rec?.policyNo) followUps[rec.policyNo] = rec; });
    // attempt to reconstruct columns from saved data if none are set
    if ((!followUpColumns || followUpColumns.length === 0) && all.length) {
        const localFields = new Set(['policyNo','status','agent','agentMobile','customerNo','customerOP','remarks']);
        const sample = all[0];
        const keys = Object.keys(sample).filter(k => !localFields.has(k));
        followUpColumns = ['policyNo', ...keys];
    }
    renderFollowUps();
}

async function saveFollowUps() {
    // Clear store then write all for simplicity
    // More efficient merge could be done, but this is fine for moderate lists
    const existing = await idbGetAll(STORE.followups);
    const tx = db.transaction(STORE.followups, 'readwrite');
    const store = tx.objectStore(STORE.followups);
    // Delete ones not present
    existing.forEach(r => { if (!followUps[r.policyNo]) store.delete(r.policyNo); });
    // Put all current
    Object.values(followUps).forEach(r => store.put(r));
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = e => reject(e.target.error);
    });
}

function renderFollowUps(toModal = false) {
    const body = document.getElementById(toModal ? 'followUpModalBody' : 'followUpTableBody');
    const head = document.getElementById(toModal ? 'followUpModalHead' : 'followUpTableHead');
    const countersWrap = document.getElementById(toModal ? 'followUpCountersModal' : 'followUpCounters');
    if (!body || !head) return;
    body.innerHTML = '';
    // Build dynamic headers (Status first, then dynamic parsed headers, then local fields)
    const staticLeft = '<th class="px-4 py-3 text-left font-bold text-gray-200">Status</th>';
    const dyn = (followUpColumns || []).filter(k => k !== 'policyNo').map(k => `<th class="px-6 py-3 text-left font-bold text-gray-200">${humanizeKey(k)}</th>`).join('');
    const staticRight = followUpShowDetails
        ? ['Agent','Agent Mob','Customer No','Customer OP','Remarks']
            .map(h => `<th class="px-6 py-3 text-left font-bold text-gray-200">${h}</th>`).join('')
        : '';
    head.innerHTML = staticLeft + `<th class="px-6 py-3 text-left font-bold text-gray-200">Policy No</th>` + dyn + staticRight;

    const rows = Object.values(followUps);
    if (rows.length === 0) {
        body.innerHTML = '<tr><td class="px-6 py-12 text-center text-gray-400 font-medium text-lg">— No follow-up items</td></tr>';
        updateFollowUpCounters(countersWrap, []);
        return;
    }
    // Sort by policyNo for consistency
    rows.sort((a,b) => String(a.policyNo).localeCompare(String(b.policyNo), undefined, { numeric: true }));
    rows.forEach(rec => body.appendChild(createFollowUpRow(rec, toModal)));
    updateFollowUpCounters(countersWrap, rows);
}

function createFollowUpRow(item, toModal = false) {
    const tr = document.createElement('tr');
    tr.className = 'border-t transition-all duration-300';
    tr.dataset.policyNo = item.policyNo;
    applyRowStatusColor(tr, item.status);

    const statusCell = document.createElement('td');
    statusCell.className = 'px-4 py-3';
    statusCell.innerHTML = `
        <select class="dark-input px-2 py-2 rounded-lg">
            <option value="grey" ${!item.status || item.status==='grey' ? 'selected' : ''}>Grey (Unattended)</option>
            <option value="red" ${item.status==='red' ? 'selected' : ''}>Red</option>
            <option value="yellow" ${item.status==='yellow' ? 'selected' : ''}>Yellow</option>
            <option value="blue" ${item.status==='blue' ? 'selected' : ''}>Blue</option>
            <option value="green" ${item.status==='green' ? 'selected' : ''}>Green</option>
        </select>`;

    const tds = [];
    const policyCell = document.createElement('td');
    policyCell.className = 'px-6 py-3 text-gray-300 font-semibold';
    policyCell.textContent = item.policyNo;
    tds.push(policyCell);

    // Dynamic columns
    (followUpColumns || []).filter(k => k !== 'policyNo').forEach(k => {
        const td = document.createElement('td');
        // Address may be long; allow wrapping and multi-line
        td.className = 'px-6 py-3 text-gray-300 align-top';
        td.textContent = item[k] ?? '';
        tds.push(td);
    });

    // Local editable fields (conditionally rendered)
    let agent, agentMobile, customerNo, customerOP, remarks;
    if (followUpShowDetails) {
        const mkInput = (val='') => `<input type="text" class="dark-input px-3 py-2 rounded-lg w-full" value="${escapeAttr(val)}">`;
        agent = htmlTd(mkInput(item.agent||''));
        agentMobile = htmlTd(mkInput(item.agentMobile||''));
        customerNo = htmlTd(mkInput(item.customerNo||''));
        customerOP = htmlTd(mkInput(item.customerOP||''));
        remarks = htmlTd(mkInput(item.remarks||''));
    }

    // Compose row
    tr.appendChild(statusCell);
    tds.forEach(td => tr.appendChild(td));
    if (followUpShowDetails) {
        tr.appendChild(agent);
        tr.appendChild(agentMobile);
        tr.appendChild(customerNo);
        tr.appendChild(customerOP);
        tr.appendChild(remarks);
    }

    // Bind change listener on dropdown
    const statusSelect = statusCell.querySelector('select');
    statusSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        (followUps[item.policyNo] ||= {}).status = value;
        applyRowStatusColor(tr, value);
        // Update counters without rebuilding the whole table
        const panelCounters = document.getElementById('followUpCounters');
        if (panelCounters) updateFollowUpCounters(panelCounters, Object.values(followUps));
        const modalEl = document.getElementById('followUpModal');
        if (modalEl && !modalEl.classList.contains('hidden')) {
            const modalCounters = document.getElementById('followUpCountersModal');
            if (modalCounters) updateFollowUpCounters(modalCounters, Object.values(followUps));
        }
    });

    tr.addEventListener('input', () => {
        const rec = followUps[item.policyNo] ||= { policyNo: item.policyNo };
        // Only update when details are shown (inputs exist)
        if (!followUpShowDetails) return;
        const allTds = tr.querySelectorAll('td');
        const start = 1 + (followUpColumns?.length || 1); // after status + policy + dynamic cols
        const [agentTD, agentMobTD, custNoTD, custOPTD, remarksTD] = Array.from(allTds).slice(start, start + 5);
        if (agentTD) rec.agent = agentTD.querySelector('input')?.value || '';
        if (agentMobTD) rec.agentMobile = agentMobTD.querySelector('input')?.value || '';
        if (custNoTD) rec.customerNo = custNoTD.querySelector('input')?.value || '';
        if (custOPTD) rec.customerOP = custOPTD.querySelector('input')?.value || '';
        if (remarksTD) rec.remarks = remarksTD.querySelector('input')?.value || '';
    });

    return tr;
}

function htmlTd(inner) { const td = document.createElement('td'); td.className = 'px-6 py-3'; td.innerHTML = inner; return td; }

function applyRowStatusColor(tr, status) {
    // Reset styles first
    tr.style.backgroundColor = '';
    tr.style.filter = '';
    tr.style.color = '';
    // Prefer text color to indicate status; keep background default
    const colors = {
        red:   '#ff6b6b',
        yellow:'#ffd166',
        blue:  '#60a5fa',
        green: '#34d399'
    };
    const c = colors[status];
    tr.style.color = c || '';
}

function updateFollowUpCounters(container, rows) {
    if (!container) return;
    const counts = { grey:0, red:0, yellow:0, blue:0, green:0 };
    rows.forEach(r => counts[(r.status||'grey')]++);
    Array.from(container.querySelectorAll('[data-status]')).forEach(span => {
        const s = span.getAttribute('data-status');
        const label = s.charAt(0).toUpperCase() + s.slice(1);
        span.textContent = `${counts[s]} ${label}`;
    });
}

function humanizeKey(k) {
    if (!k) return '';
    if (k === 'policyNo') return 'Policy No';
    return String(k).replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }


