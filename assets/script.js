    // Create floating particles

    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 200; // Increased for a "galaxy" effect
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random starting position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';

                // Random size variation
                const size = 1 + Math.random() * 2;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';

                particlesContainer.appendChild(particle);
                particles.push(particle);
            }


            return { container: particlesContainer, particles };
        }

        function createConnections(container, particles) {
            const svg = document.getElementById('particleLines');
        const connections = [];
            const clusterCount = 25; // Increased for a "constellation" effect

            for (let i = 0; i < clusterCount; i++) {
                const clusterSize = Math.random() < 0.5 ? 2 : 3;
                const indices = [];
                while (indices.length < clusterSize) {
                    const idx = Math.floor(Math.random()* particles.length);
                    if (!indices.includes(idx)) indices.push(idx);
                }
                for (let j = 0; j < clusterSize - 1; j++) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    svg.appendChild(line);
                    connections.push({ a: particles[indices[j]], b: particles[indices[j + 1]], line });
                }
            }

            function updateLines() {
        const rect = container.getBoundingClientRect();
            connections.forEach(conn => {
                const rectA = conn.a.getBoundingClientRect();
                    const rectB = conn.b.getBoundingClientRect();
                    const x1 = rectA.left + rectA.width / 2 - rect.left;
                    const y1 = rectA.top + rectA.height / 2 - rect.top;
                    const x2 = rectB.left + rectB.width / 2 - rect.left;
                    const y2 = rectB.top + rectB.height / 2 - rect.top;
                    conn.line.setAttribute('x1', x1);
                    conn.line.setAttribute('y1', y1);
                    conn.line.setAttribute('x2', x2);
                    conn.line.setAttribute('y2', y2);
                });
                requestAnimationFrame(updateLines);
            }

            requestAnimationFrame(updateLines);
        }

        // Initialize particles when page loads

        document.addEventListener('DOMContentLoaded', function() {
            // Re-enabled the local, offline-friendly particle animation.


            const style = document.createElement('style');
            style.textContent = `
            .particle {
                background-color: yellow;
            }
            `;
            document.head.appendChild(style);
            const { container, particles } = createParticles();
            createConnections(container, particles);
            
            const toolsPanel = document.querySelector('.dash-right');
            if (toolsPanel) {
                const tabs = toolsPanel.querySelectorAll('.tool-tab');
                const panels = {
                    todo: document.getElementById('todoPanel'),
                    requirements: document.getElementById('requirementsPanel'),
                    calculator: document.getElementById('calculatorPanel'),
                    links: document.getElementById('linksPanel')
                };
                const requirementsTypeSelect = document.getElementById('requirementsType');
                const letRequirementsTable = document.getElementById('letRequirementsTable');

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
                        const tabName = tab.dataset.tab;
                        if (panels[tabName]) {
                    panels[tabName].classList.remove('hidden');
                }
                    });
                });

                // 2. To-Do List Logic
                const todoInput = document.getElementById('todoInput');
                const addTodoBtn = document.getElementById('addTodoBtn');
                const todoList = document.getElementById('todoList');

                let todos = JSON.parse(localStorage.getItem('lic_todos')) || [];

                const saveTodos = () => {
                    localStorage.setItem('lic_todos', JSON.stringify(todos));
                };

                const renderTodos = () => {
                    todoList.innerHTML = '';
                    if (todos.length === 0) {
                        todoList.innerHTML = '<li class="text-gray-500 text-center py-4">No tasks yet.</li>';
                        return;
                    }
                    todos.forEach((todo, index) => {
                        const li = document.createElement('li');
                        li.className = `option-card flex items-center justify-between p-3 rounded-lg ${todo.completed ? 'opacity-50' : ''}`;
                        li.innerHTML = `
                            <div class="flex items-center">
                                <input type="checkbox" data-index="${index}" class="checkbox-modern mr-3" ${todo.completed ? 'checked' : ''}>
                                <span class="font-medium text-gray-300 ${todo.completed ? 'line-through' : ''}">${todo.text}</span>
                            </div>
                            <button data-index="${index}" class="btn-danger text-xs px-2 py-1 rounded-md">[X]</button>
                        `;
                        todoList.appendChild(li);
                    });
                };

                addTodoBtn.addEventListener('click', () => {
                    const text = todoInput.value.trim();
                    if (text) {
                        todos.push({ text, completed: false });
                        todoInput.value = '';
                        saveTodos();
                        renderTodos();
                    }
                });

                todoList.addEventListener('click', (e) => {
                    const index = e.target.dataset.index;
                    if (e.target.tagName === 'BUTTON') { // Delete
                        todos.splice(index, 1);
                        saveTodos();
                        renderTodos();
                    } else if (e.target.type === 'checkbox') { // Toggle complete
                        todos[index].completed = e.target.checked;
                        saveTodos();
                        renderTodos();
                    }
                });

                renderTodos();

                // 3. Requirements Dropdown Logic
                if (requirementsTypeSelect && letRequirementsTable) {
                    requirementsTypeSelect.addEventListener('change', (e) => {
                        letRequirementsTable.style.display = e.target.value === 'LET' ? 'block' : 'none';
                    });
                }

                // 4. Premium Calculator Logic
                const calculateBtn = document.getElementById('calculatePremiumBtn');
                calculateBtn.addEventListener('click', () => {
                    const plan = document.querySelector('input[name="plan"]:checked').value;
                    const mode = document.querySelector('input[name="mode"]:checked').value;
                    const sa = parseFloat(document.getElementById('saInput').value) * 1000;
                    const tabularPremium = parseFloat(document.getElementById('tabularPremiumInput').value);
                    const term = parseInt(document.getElementById('termInput').value);

                    if (isNaN(sa) || isNaN(tabularPremium) || isNaN(term) || sa <= 0 || tabularPremium <= 0 || term <= 0) {
                        showToast('Please fill all calculator fields with valid numbers.');
                        return;
                    }

                    let breakdown = [];
                    let rate = tabularPremium;

                    // Step 1: Mode Rebate
nm                    const rebateConfig = {
                        'YLY': { default: { factor: 0.97, text: '3%' }, '179': { factor: 0.98, text: '2%' } },
                        'HLY': { default: { factor: 0.985, text: '1.5%' }, '179': { factor: 0.99, text: '1%' } }
                    };

                    let modeRebateFactor = 1.0;
                    const rebateInfo = rebateConfig[mode];

                    if (rebateInfo) {
                        const config = rebateInfo[plan] || rebateInfo.default;
                        modeRebateFactor = config.factor;
                        if (modeRebateFactor !== 1) {
                            const calculatedRebate = (tabularPremium * modeRebateFactor).toFixed(2);
                            breakdown.push(`Mode Rebate (${mode} ${config.text}): ${tabularPremium.toFixed(2)} * ${config.factor} = ${calculatedRebate}`);
                        }
                    }
                    rate *= modeRebateFactor;

                    // Step 2: S.A. Rebate (Plan 179 only)
                    if (plan === '179') {
                        let saRebate = 0;
                        if (sa > 95000 && sa <= 195000) {
                            saRebate = 5;
                        } else if (sa > 195000) {
                            saRebate = 7.5;
                        }
                        if (saRebate > 0) {
                            breakdown.push(`S.A. Rebate (Plan 179): ${rate.toFixed(2)} - ${saRebate} = ${(rate - saRebate).toFixed(2)}`);
                            rate -= saRebate;
                        }
                    }

                    // Step 3: Base Premium
                    const basePremium = rate * (sa / 1000);
                    breakdown.push(`Base Premium: ${rate.toFixed(4)} * ${sa/1000} = ${basePremium.toFixed(2)}`);

                    // Step 4: Modal Premium
                    let modalPremium = basePremium;
                    let paymentsPerYear = 1;
                    if (mode === 'HLY') { paymentsPerYear = 2; }
                    if (mode === 'QLY') { paymentsPerYear = 4; }
                    if (mode === 'MLY') { paymentsPerYear = 12; }
                    modalPremium = basePremium / paymentsPerYear;

                    // Step 5: Total Premium
                    const totalPremium = modalPremium * term * paymentsPerYear;

                    // Display results
                    document.getElementById('modalPremiumResult').textContent = `₹ ${modalPremium.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById('totalPremiumResult').textContent = `₹ ${totalPremium.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById('calculationBreakdown').innerHTML = breakdown.join('<br>');
                    document.getElementById('premiumResult').classList.remove('hidden');
                });

                // Custom radio button styling logic
                document.querySelectorAll('.option-card input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', () => {
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
            }
        
        // Collapsible functionality
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', function() {
                const target = document.getElementById(this.dataset.target);
                const arrow = this.querySelector('span:last-child');
                
                target.classList.toggle('active');
                arrow.style.transform = target.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });

        // Workflow collapsible functionality with disabled state check
        document.querySelectorAll('.workflow-header').forEach(header => {
            header.addEventListener('click', function() {
                // Don't allow clicking if section is disabled
                if (this.style.pointerEvents === 'none') {
                    return;
                }
                
                const target = document.getElementById(this.dataset.target);
                const arrow = this.querySelector('span:last-child');
                
                target.classList.toggle('active');
                arrow.style.transform = target.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });

        // Form functionality
        const deathClaimBtn = document.getElementById('deathClaimBtn');
        const specialCaseBtn = document.getElementById('specialCaseBtn');
        const deathClaimForm = document.getElementById('deathClaimForm');
        const specialCaseForm = document.getElementById('specialCaseForm');
        const cancelForm = document.getElementById('cancelForm');
        const cancelSpecialForm = document.getElementById('cancelSpecialForm');
        deathClaimBtn?.addEventListener('click', () => {
            deathClaimForm?.classList.remove('hidden');
        });

        specialCaseBtn?.addEventListener('click', () => {
            specialCaseForm?.classList.remove('hidden');
        });

        cancelForm?.addEventListener('click', () => {
            deathClaimForm?.classList.add('hidden');
            resetForm();
        });

        cancelSpecialForm?.addEventListener('click', () => {
            specialCaseForm?.classList.add('hidden');
            resetSpecialForm();
        });

        // Date calculation
        const commencementDate = document.getElementById('commencementDate');
        const deathDate = document.getElementById('deathDate');
        const durationDisplay = document.getElementById('durationDisplay');
        const durationText = document.getElementById('durationText');

        const suggestionBox = document.getElementById('suggestionBox');
        const suggestionText = document.getElementById('suggestionText');
        const timeBarWarning = document.getElementById('timeBarWarning');
        const manualSelection = document.getElementById('manualSelection');

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
        }



        // Auto-format date inputs
        function formatDateInput(input) {
            let value = input.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length >= 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            input.value = value;
        }


        commencementDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });

        deathDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });





        function calculateDuration() {
            const commDate = commencementDate.value.replace(/\//g, '');
            const deathDateVal = deathDate.value.replace(/\//g, '');

            if (commDate.length === 8 && deathDateVal.length === 8) {
                const commYear = parseInt(commDate.substring(4, 8));
                const commMonth = parseInt(commDate.substring(2, 4));
                const commDay = parseInt(commDate.substring(0, 2));

                const deathYear = parseInt(deathDateVal.substring(4, 8));
                const deathMonth = parseInt(deathDateVal.substring(2, 4));
                const deathDay = parseInt(deathDateVal.substring(0, 2));

                const commDateObj = new Date(commYear, commMonth - 1, commDay);
                const deathDateObj = new Date(deathYear, deathMonth - 1, deathDay);

                const diffTime = Math.abs(deathDateObj - commDateObj);
                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

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
                const today = new Date();
                const intimationDiff = (today - deathDateObj) / (1000 * 60 * 60 * 24);
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
            const row = button.closest('tr');
            const tableBody = row.parentNode;
            row.remove();
            
            if (tableBody.children.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
            }
            saveToStorage();
        }

        // Store case data for reopening with localStorage persistence
        let savedCases = JSON.parse(localStorage.getItem('licSavedCases') || '{}');
        let savedSpecialCases = JSON.parse(localStorage.getItem('licSavedSpecialCases') || '{}');
        let savedWorkflowStates = JSON.parse(localStorage.getItem('licWorkflowStates') || '{}');

        // Save data to localStorage
        function saveToStorage() {
            localStorage.setItem('licSavedCases', JSON.stringify(savedCases));
            localStorage.setItem('licSavedSpecialCases', JSON.stringify(savedSpecialCases));
            localStorage.setItem('licWorkflowStates', JSON.stringify(savedWorkflowStates));
            localStorage.setItem('licActiveClaims', document.getElementById('activeDeathClaimsTable').innerHTML);
            localStorage.setItem('licActiveSpecialCases', document.getElementById('activeSpecialCasesTable').innerHTML);

            updateCounters();
        }

        // Update counters for all sections
        function updateCounters() {
            // Count active death claims
            const activeDeathRows = document.querySelectorAll('#activeDeathClaimsTable tr:not([colspan])');
            const activeDeathCount = activeDeathRows.length > 0 && !activeDeathRows[0].querySelector('td[colspan]') ? activeDeathRows.length : 0;
            document.getElementById('activeDeathClaimsCounter').textContent = activeDeathCount;

            // Count active special cases
            const activeSpecialRows = document.querySelectorAll('#activeSpecialCasesTable tr:not([colspan])');
            const activeSpecialCount = activeSpecialRows.length > 0 && !activeSpecialRows[0].querySelector('td[colspan]') ? activeSpecialRows.length : 0;
            document.getElementById('activeSpecialCasesCounter').textContent = activeSpecialCount;


        }

        // Centralized event handling for all tables using event delegation
        function setupTableEventListeners() {
            const tables = {
                'activeDeathClaimsTable': { openFn: openCase, removeFn: removeRow },
                'activeSpecialCasesTable': { openFn: openSpecialCase, removeFn: removeSpecialRow },
                'completedDeathClaimsTable': { removeFn: removeCompletedRow },
                'completedSpecialCasesTable': { removeFn: removeCompletedSpecialRow }
            };

            for (const tableId in tables) {
                const tableElement = document.getElementById(tableId);
                if (tableElement) {
                    tableElement.addEventListener('click', (e) => {
                        const row = e.target.closest('tr');
                        if (!row || !row.dataset.policyNo) return;

                        const policyNo = row.dataset.policyNo;
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
        // Load data from localStorage
        function loadFromStorage() {
            // Load active death claims
            const activeClaims = localStorage.getItem('licActiveClaims');
            if (activeClaims) {
                document.getElementById('activeDeathClaimsTable').innerHTML = activeClaims;
                // Re-attach event listeners to loaded rows
                document.querySelectorAll('#activeDeathClaimsTable tr').forEach(row => {
                    if (row.querySelector('td:first-child') && !row.querySelector('td[colspan]')) {
                        row.style.cursor = 'pointer';
                        row.onclick = function() { openCase(this); };
                    }
                });
            }

            // Load active special cases
            const activeSpecialCases = localStorage.getItem('licActiveSpecialCases');
            if (activeSpecialCases) {
                document.getElementById('activeSpecialCasesTable').innerHTML = activeSpecialCases;
                // Re-attach event listeners to loaded rows
                document.querySelectorAll('#activeSpecialCasesTable tr').forEach(row => {
                    if (row.querySelector('td:first-child') && !row.querySelector('td[colspan]')) {
                        row.style.cursor = 'pointer';
                        row.onclick = function() { openSpecialCase(this); };
                    }
                });
            }


        }




        // Special Case Save functionality
        document.getElementById('saveSpecialCase')?.addEventListener('click', function() {

            const policyNo = document.getElementById('specialPolicyNumber').value;
            const name = document.getElementById('specialName').value;
            const type = document.getElementById('specialType').value;
            const issue = document.getElementById('specialIssue').value;
            const resolved = document.getElementById('specialResolved').checked;

            if (!policyNo || !name || !type || !issue) {
                showToast('Please fill all fields.');
                return;
            }


            if (resolved) {
                // Add to completed special cases
                const completedTableBody = document.getElementById('completedSpecialCasesTable');
                if (completedTableBody.querySelector('td[colspan="5"]')) {
                    completedTableBody.innerHTML = '';
                }

                const completedRow = document.createElement('tr');
                completedRow.className = 'lic-table-row border-t transition-all duration-300';
                completedRow.innerHTML = `
                    <td class="px-6 py-4 font-semibold text-gray-300">${policyNo}</td>
                    <td class="px-6 py-4 font-semibold text-gray-300">${name}</td>
                    <td class="px-6 py-4 font-semibold text-gray-300">${type}</td>
                    <td class="px-6 py-4 font-semibold text-gray-300">${issue.length > 50 ? issue.substring(0, 50) + '...' : issue}</td>
                    <td class="px-6 py-4">
                        <button class="btn-danger px-4 py-2 rounded-lg text-sm font-bold" onclick="removeCompletedSpecialRow(this)">
                            Remove
                        </button>
                    </td>
                `;
                completedTableBody.appendChild(completedRow);

                // Remove from active cases
                const activeTableBody = document.getElementById('activeSpecialCasesTable');
                const rows = activeTableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const policyCell = row.querySelector('td:first-child');
                    if (policyCell && policyCell.textContent === policyNo) {
                        row.remove();
                    }
                });

                if (activeTableBody.children.length === 0) {
                    activeTableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
                }

                saveToStorage();
                showToast('Special case marked as resolved and moved to completed cases!');

            } else {
                // Save to active special cases
                const tableBody = document.getElementById('activeSpecialCasesTable');
                if (tableBody.querySelector('td[colspan="5"]')) {
                    tableBody.innerHTML = '';
                }

                // Check if case already exists
                let existingRow = null;
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
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
                    const newRow = createSpecialCaseRow(policyNo, name, type, issue);
                    tableBody.appendChild(newRow);
                }

                showToast('Special case saved successfully!');
            }

            specialCaseForm.classList.add('hidden');
            resetSpecialForm();
        });

        function createSpecialCaseRow(policyNo, name, type, issue) {
            const row = document.createElement('tr');
            row.className = 'dark-table-row border-t transition-all duration-300';
            row.style.cursor = 'pointer';
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
            if (!caseData) return;
            
            // Show the form
            deathClaimForm.classList.remove('hidden');
            
            // Populate basic fields
            document.getElementById('policyNumber').value = policyNo;
            document.getElementById('claimantName').value = caseData.name;
            
            // Restore all saved data if exists
            if (savedCases[policyNo]) {
                const savedData = savedCases[policyNo];
                
                // Restore basic form data
                if (savedData.commencementDate) document.getElementById('commencementDate').value = savedData.commencementDate;
                if (savedData.deathDate) document.getElementById('deathDate').value = savedData.deathDate;
                if (savedData.query) document.getElementById('queryText').value = savedData.query;
                
                // Trigger duration calculation if dates exist
                if (savedData.commencementDate && savedData.deathDate) {
                    calculateDuration();
                }
            }
            
            // Select the claim type
            const claimTypeRadio = document.querySelector(`input[name="claimType"][value="${caseData.claimType}"]`);
            if (claimTypeRadio) {
                claimTypeRadio.checked = true;
                claimTypeRadio.dispatchEvent(new Event('change'));
            }
            
            // Show workflow sections
            document.getElementById('workflowSections').classList.remove('hidden');
            
            // Restore workflow state if exists
            if (savedWorkflowStates[policyNo]) {
                const workflowState = savedWorkflowStates[policyNo];
                
                // Restore all form inputs
                Object.keys(workflowState).forEach(inputId => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        if (input.type === 'checkbox' || input.type === 'radio') {
                            input.checked = workflowState[inputId];
                            if (input.checked) {
                                input.dispatchEvent(new Event('change'));
                            }
                        } else {
                            input.value = workflowState[inputId];
                            if (input.type === 'date' && input.value) {
                                input.dispatchEvent(new Event('change'));
                            }
                        }
                    }
                });
            }
            
        }

        function removeSpecialRow(button) {
            const row = button.closest('tr');
            const tableBody = row.parentNode;
            row.remove();
            
            if (tableBody.children.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
            }
            saveToStorage();
        }

        function openSpecialCase(policyNo) {
            // Show the form
            specialCaseForm.classList.remove('hidden');
            
            // Populate fields
            document.getElementById('specialPolicyNumber').value = policyNo;
            document.getElementById('specialName').value = name;
            document.getElementById('specialType').value = type;
            
            // Restore full issue text and resolved status from saved data

            if (savedSpecialCases[policyNo]) {
                const specialCaseData = savedSpecialCases[policyNo];
                document.getElementById('specialIssue').value = savedSpecialCases[policyNo].issue;
                document.getElementById('specialResolved').checked = savedSpecialCases[policyNo].resolved;
                document.getElementById('specialName').value = specialCaseData.name;
                document.getElementById('specialType').value = specialCaseData.type;
                document.getElementById('specialIssue').value = issue;
                document.getElementById('specialResolved').checked = false;
            }
            
        }

        function resetSpecialForm() {
            document.getElementById('specialPolicyNumber').value = '';
            document.getElementById('specialName').value = '';
            document.getElementById('specialType').value = '';
            document.getElementById('specialIssue').value = '';
            document.getElementById('specialResolved').checked = false;
        }

        // Workflow logic

        const nomineeAvailable = document.getElementById('nomineeAvailable');
        const nomineeNotAvailable = document.getElementById('nomineeNotAvailable');
        const investigationRadios = document.querySelectorAll('input[name="investigationType"]');
        const investigationDetails = document.getElementById('investigationDetails');
        const investigationDate = document.getElementById('investigationDate');
        const daysSinceAllotted = document.getElementById('daysSinceAllotted');
        const daysCount = document.getElementById('daysCount');
        const doSentDate = document.getElementById('doSentDate');
        const daysSinceSent = document.getElementById('daysSinceSent');
        const doSentDaysCount = document.getElementById('doSentDaysCount');
        const doDecisionSection = document.getElementById('doDecisionSection');
        const paymentDone = document.getElementById('paymentDone');

        // Nominee checkbox logic (mutually exclusive) with completion tracking
        nomineeAvailable?.addEventListener('change', function() {

            if (this.checked) {
                nomineeNotAvailable.checked = false;
                document.getElementById('letFormsSection').classList.add('hidden');
            }
            checkSectionCompletion('checkNominee');
        });


        nomineeNotAvailable?.addEventListener('change', function() {

            if (this.checked) {
                nomineeAvailable.checked = false;
                document.getElementById('letFormsSection').classList.remove('hidden');
            } else {
                document.getElementById('letFormsSection').classList.add('hidden');
            }
            checkSectionCompletion('checkNominee');
        });

        // Documents completion tracking

        document.getElementById('deathClaimFormDocs')?.addEventListener('change', function() {
            checkSectionCompletion('documentsRequired');
        });

        document.getElementById('letForms')?.addEventListener('change', function() {

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
        document.getElementById('investigationReceived')?.addEventListener('change', function() {

            checkSectionCompletion('investigation');
        });

        // D.O. Decision completion tracking

        document.getElementById('doDecisionReceived')?.addEventListener('change', function() {

            checkSectionCompletion('doDecision');
        });

        // Investigation date calculation

        investigationDate?.addEventListener('change', function() {

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
        doSentDate?.addEventListener('change', function() {

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
            radio.addEventListener('change', function() {
                // Show workflow sections when claim type is selected
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
            const sections = ['checkNominee', 'documentsRequired', 'investigation', 'doDecision', 'proceedPayment'];
            sections.forEach(sectionId => {
                disableSection(sectionId);
            });
        }

        function enableSection(sectionId) {
            const section = document.getElementById(sectionId);
            const header = document.querySelector(`[data-target="${sectionId}"]`);
            
            if (section && header) {
                header.classList.remove('opacity-50', 'cursor-not-allowed');
                header.classList.add('hover:bg-gray-50');
                header.style.pointerEvents = 'auto';
            }
        }

        function disableSection(sectionId) {
            const section = document.getElementById(sectionId);
            const header = document.querySelector(`[data-target="${sectionId}"]`);
            
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
                    const deathClaimFormChecked = document.getElementById('deathClaimFormDocs').checked;
                    const letFormsChecked = document.getElementById('letForms').checked;
                    const letFormsRequired = !document.getElementById('letFormsSection').classList.contains('hidden');
                    
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
                    const investigationTypeSelected = document.querySelector('input[name="investigationType"]:checked');
                    const investigationReceived = document.getElementById('investigationReceived').checked;
                    
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
                    const doDecisionReceived = document.getElementById('doDecisionReceived').checked;
                    isComplete = doDecisionReceived;
                    if (isComplete) {
                        nextSectionId = 'proceedPayment';
                        enableSection('proceedPayment');
                    }
                    break;
            }
            
            // Auto-expand next section when current section is completed
            if (isComplete && nextSectionId) {
                setTimeout(() => {
                    autoExpandSection(nextSectionId);
                }, 300); // Small delay for smooth transition
            }
            
            return isComplete;
        }

        function autoExpandSection(sectionId) {
            const section = document.getElementById(sectionId);
            const header = document.querySelector(`[data-target="${sectionId}"]`);
            const arrow = header.querySelector('span:last-child');
            
            if (section && header && !section.classList.contains('active')) {
                section.classList.add('active');
                arrow.style.transform = 'rotate(180deg)';
            }
        }

        // Payment done - move to completed claims

        paymentDone?.addEventListener('change', function() {

            if (this.checked) {
                const policyNo = document.getElementById('policyNumber').value;
                const name = document.getElementById('claimantName').value;
                const selectedType = document.querySelector('input[name="claimType"]:checked');
                
                if (policyNo && name && selectedType) {
                    // Add to completed claims
                    const completedTableBody = document.getElementById('completedDeathClaimsTable');
                    if (completedTableBody.querySelector('td[colspan="5"]')) {
                        completedTableBody.innerHTML = '';
                    }

                    const completedRow = document.createElement('tr');
                    completedRow.className = 'lic-table-row border-t transition-all duration-300';
                    completedRow.innerHTML = `
                        <td class="px-6 py-4 font-semibold text-gray-300">${policyNo}</td>
                        <td class="px-6 py-4 font-semibold text-gray-300">${name}</td>
                        <td class="px-6 py-4 font-semibold text-gray-300">${selectedType ? selectedType.value : 'N/A'}</td>
                        <td class="px-6 py-4 font-semibold text-gray-300">${new Date().toLocaleDateString()}</td>
                        <td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>
                    `;
                    completedTableBody.appendChild(completedRow);

                    // Remove from active claims
                    const activeTableBody = document.getElementById('activeDeathClaimsTable');
                    const rows = activeTableBody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const policyCell = row.querySelector('td:first-child');
                        if (policyCell && policyCell.textContent === policyNo) {
                            row.remove();
                        }
                    });

                    if (activeTableBody.children.length === 0) {
                        activeTableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
                    }


                    saveToStorage();
                    showToast('Claim completed and moved to completed claims!');
                    deathClaimForm.classList.add('hidden');
                    resetForm();

                }
            }
        });

        // Save progress functionality

        document.getElementById('saveProgress')?.addEventListener('click', function() {

            const policyNo = document.getElementById('policyNumber').value;
            const name = document.getElementById('claimantName').value;
            const selectedType = document.querySelector('input[name="claimType"]:checked');


            if (!policyNo || !name || !selectedType) {
                showToast('Please fill basic claim information first.');
                return;
            }



            // Save all form data
            const formData = {
                commencementDate: document.getElementById('commencementDate').value,
                deathDate: document.getElementById('deathDate').value,
                query: document.getElementById('queryText').value,
                name: name,
                claimType: selectedType.value
            };
            savedCases[policyNo] = formData;

            // Save workflow state
            const workflowState = {};
            const allInputs = document.querySelectorAll('#workflowSections input, #workflowSections select, #workflowSections textarea');
            allInputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    workflowState[input.id] = input.checked;
                } else {
                    workflowState[input.id] = input.value;
                }
            });
            savedWorkflowStates[policyNo] = workflowState;

            // Update or add to active claims table
            const tableBody = document.getElementById('activeDeathClaimsTable');
            if (tableBody.querySelector('td[colspan="5"]')) {
                tableBody.innerHTML = '';
            }

            // Check if claim already exists
            let existingRow = null;
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const policyCell = row.querySelector('td:first-child');
                if (policyCell && policyCell.textContent === policyNo) {
                    existingRow = row;
                }
            });

            const stage = getClaimStage();

            if (existingRow) {
                updateDeathClaimRow(existingRow, policyNo, name, selectedType.value, stage);
            } else {
                const newRow = createDeathClaimRow(policyNo, name, selectedType.value, stage);
                tableBody.appendChild(newRow);
            }

            saveToStorage();

            showToast('Progress saved successfully!');
            deathClaimForm.classList.add('hidden');
            resetForm();
        });

        function createDeathClaimRow(policyNo, name, claimType, stage) {
            const row = document.createElement('tr');
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
                <td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold">Remove</button></td>
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

        function removeCompletedRow(button) {
            const row = button.closest('tr');
            const tableBody = row.parentNode;
            row.remove();
            
            if (tableBody.children.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed death claims</td></tr>';
            }
            saveToStorage();
        }

        function removeCompletedSpecialRow(button) {
            const row = button.closest('tr');
            const tableBody = row.parentNode;
            row.remove();
            
            if (tableBody.children.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed special cases</td></tr>';
            }
            saveToStorage();
        }

        function resetForm() {
            document.getElementById('policyNumber').value = '';
            document.getElementById('claimantName').value = '';
            document.getElementById('commencementDate').value = '';
            document.getElementById('deathDate').value = '';
            durationDisplay.classList.add('hidden');
            suggestionBox.classList.add('hidden');
            manualSelection.classList.add('hidden');
            document.getElementById('workflowSections').classList.add('hidden');
            document.querySelectorAll('input[name="claimType"]').forEach(radio => radio.checked = false);
            
            // Reset all workflow inputs
            document.querySelectorAll('#workflowSections input').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            document.getElementById('queryText').value = '';
            document.getElementById('letFormsSection').classList.add('hidden');
            investigationDetails.classList.add('hidden');
            daysSinceAllotted.classList.add('hidden');
            daysSinceSent.classList.add('hidden');
            doDecisionSection.classList.add('hidden');
        }

        // NEW: Search functionality for tables
        function addSearchFunctionality(inputId, tableId, noResultsText, defaultPlaceholderText) {
            const searchInput = document.getElementById(inputId);
            const tableBody = document.getElementById(tableId);
            
            if (!searchInput || !tableBody) return;

            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const dataRows = tableBody.querySelectorAll('tr[data-policy-no]');
                const placeholderRow = tableBody.querySelector('tr:not([data-policy-no])');
                let visibleRows = 0;

                dataRows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(searchTerm)) {
                        row.style.display = '';
                        visibleRows++;
                    } else {
                        row.style.display = 'none';
                    }
                });

                if (placeholderRow) {
                    if (visibleRows > 0) {
                        placeholderRow.style.display = 'none';
                    } else { // No visible rows
                        placeholderRow.style.display = '';
                        if (dataRows.length > 0) { // Table has data, but search yielded no results
                            placeholderRow.querySelector('td').textContent = noResultsText;
                        } else { // Table is empty to begin with
                            placeholderRow.querySelector('td').textContent = defaultPlaceholderText;
                        }
                    }
                }
            });
        }

        // Initial Load
        loadFromStorage();
        updateCounters();

        setupTableEventListeners();
        // Setup search after everything is loaded
        addSearchFunctionality('deathClaimSearch', 'activeDeathClaimsTable', '— No claims match your search', '— No active death claims');
        addSearchFunctionality('specialCaseSearch', 'activeSpecialCasesTable', '— No special cases match your search', '— No active special cases');
    });
