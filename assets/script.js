    // Create floating particles with physics and connections

    function createParticles() {
        var particlesContainer = document.getElementById('particles');
        var particleCount = 100;
        var particles = [];
        var canvasRect = particlesContainer.getBoundingClientRect(); // Canvas dimensions

        for (var i = 0; i < particleCount; i++) {
            var particle = document.createElement('div');
            particle.className = 'particle';

            particle.vx = (Math.random() - 0.5) * 0.5; // X velocity
            particle.vy = (Math.random() - 0.5) * 0.5; // Y velocity

            // Color variant
            particle.isBlueVariant = Math.random() < 0.1; // 10% chance of being blue
            var color = particle.isBlueVariant ? 'rgba(0, 85, 164, 0.7)' : 'rgba(255, 210, 0, 0.85)';
           particle.style.background = color;
           particle.style.boxShadow = `0 0 8px rgba(255, 210, 0, 0.25)`;
            particle.x = Math.random() * canvasRect.width;
            particle.y = Math.random() * canvasRect.height;

             // Random size variation
            var size = 1 + Math.random() * 2;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';


                particlesContainer.appendChild(particle);
                particles.push(particle);
        }
        return { particles };
    }

    function createConnections(particles) {
            var svg = document.getElementById('particleLines');
            var clusterCount = particles.length; // Connect each particle to its neighbors
            window.connections = [];

            for (let i = 0; i < clusterCount; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('stroke', 'rgba(121, 167, 232, 0.15)');
                    line.setAttribute('stroke-width', '0.7');
                    svg.appendChild(line);
                    connections.push({ a: particles[i], b: particles[j], line });

                }
            }

    }

    function updateLines() {
        var particlesContainer = document.getElementById('particles');
        var canvasRect = particlesContainer.getBoundingClientRect();

        if(typeof connections !== 'undefined') {
          connections.forEach(conn => {
                var dx = conn.a.x - conn.b.x;
                var dy = conn.a.y - conn.b.y;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 75) { // Show line if within 75px distance
                    conn.line.setAttribute('x1', conn.a.x);
                  conn.line.setAttribute('y1', conn.a.y);
                    conn.line.setAttribute('x2', conn.b.x);
                    conn.line.setAttribute('y2', conn.b.y);
                    conn.line.style.display = ''; // Make line visible
                } else {
                  conn.line.style.display = 'none'; // Hide line if too far
                }
            });
        }

       requestAnimationFrame(updateParticlePhysics);
            requestAnimationFrame(updateLines);

    }

function updateParticlePhysics() {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > canvasRect.width) {
                particle.vx = -particle.vx;
            }
            if (particle.y < 0 || particle.y > canvasRect.height) {
                particle.vy = -particle.vy;
            }

           // Apply position to element
           particle.style.left = particle.x + 'px';
           particle.style.top = particle.y + 'px';
        });
       requestAnimationFrame(updateParticlePhysics);



    }


   // Initialize particles and connections when page loads


      document.addEventListener('DOMContentLoaded', function() {
           var particlesContainer = document.getElementById('particles');
            // Re-enabled the local, offline-friendly particle animation.
            var { particles } = createParticles();
            createConnections(particles);
           updateLines();

            
            var toolsPanel = document.querySelector('.dash-right');
            if (toolsPanel) {
                var tabs = toolsPanel.querySelectorAll('.tool-tab');
                var panels = {
                    todo: document.getElementById('todoPanel'),
                    requirements: document.getElementById('requirementsPanel'),
                    calculator: document.getElementById('calculatorPanel'),
                    links: document.getElementById('linksPanel'),
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

                // 2. To-Do List Logic
                var todoInput = document.getElementById('todoInput');
                var addTodoBtn = document.getElementById('addTodoBtn');
                var todoList = document.getElementById('todoList');

                var todos = JSON.parse(localStorage.getItem('lic_todos')) || [];

                var saveTodos = function() {
                    localStorage.setItem('lic_todos', JSON.stringify(todos));
                };

                var renderTodos = function() {
                    todoList.innerHTML = '';
                    if (todos.length === 0) {
                        todoList.innerHTML = '<li class="text-gray-500 text-center py-4">No tasks yet.</li>';
                        return;
                    }
                    todos.forEach((todo, index) => {
                        var li = document.createElement('li');
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

                addTodoBtn.addEventListener('click', function() {
                    var text = todoInput.value.trim();
                    if (text) {
                        todos.push({ text, completed: false });
                        todoInput.value = '';
                        saveTodos();
                        renderTodos();
                    }
                });

                todoList.addEventListener('click', function(e) {
                    var index = e.target.dataset.index;
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
                    requirementsTypeSelect.addEventListener('change', function(e) {
                        letRequirementsTable.style.display = e.target.value === 'LET' ? 'block' : 'none'; // Keep let here because the error happens before this
                    });
                }

                // 4. Premium Calculator Logic
                var calculateBtn = document.getElementById('calculatePremiumBtn');
                calculateBtn.addEventListener('click', function() {
                    var plan = document.querySelector('input[name="plan"]:checked').value;
                    var mode = document.querySelector('input[name="mode"]:checked').value;
                    var sa = parseFloat(document.getElementById('saInput').value) * 1000;
                    var tabularPremium = parseFloat(document.getElementById('tabularPremiumInput').value);
                    var term = parseInt(document.getElementById('termInput').value);

                    if (isNaN(sa) || isNaN(tabularPremium) || isNaN(term) || sa <= 0 || tabularPremium <= 0 || term <= 0) {
                        showToast('Please fill all calculator fields with valid numbers.');
                        return;
                    }

                    let breakdown = [];
                    let rate = tabularPremium;

                    // Step 1: Mode Rebate
                    var rebateConfig = {
                        'YLY': { default: { factor: 0.97, text: '3%' }, '179': { factor: 0.98, text: '2%' } },
                        'HLY': { default: { factor: 0.985, text: '1.5%' }, '179': { factor: 0.99, text: '1%' } },
                    };

                    var modeRebateFactor = 1.0;
                    var rebateInfo = rebateConfig[mode];


                    if (rebateInfo) {
                        var config = rebateInfo[plan] || rebateInfo.default;
                        modeRebateFactor = config.factor;
                        if (modeRebateFactor !== 1) {
                            var calculatedRebate = (tabularPremium * modeRebateFactor).toFixed(2);
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
                    var basePremium = rate * (sa / 1000);
                    breakdown.push(`Base Premium: ${rate.toFixed(4)} * ${sa/1000} = ${basePremium.toFixed(2)}`);

                  // Step 4: Modal Premium
                    let modalPremium = basePremium;
                    let paymentsPerYear = 1;
                    if (mode === 'HLY') { paymentsPerYear = 2; }
                    if (mode === 'QLY') { paymentsPerYear = 4; }
                    if (mode === 'MLY') { paymentsPerYear = 12; }
                    modalPremium = basePremium / paymentsPerYear;

                    // Step 5: Total Premium
                    var totalPremium = modalPremium * term * paymentsPerYear;

                    // Display results
                    document.getElementById('modalPremiumResult').textContent = `₹ ${modalPremium.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById('totalPremiumResult').textContent = `₹ ${totalPremium.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById('calculationBreakdown').innerHTML = breakdown.join('<br>');
                    document.getElementById('premiumResult').classList.remove('hidden');
                });

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
            }
        
        // Collapsible functionality
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', function () {
                const target = document.getElementById(this.dataset.target);
                var arrow = this.querySelector('span:last-child');
                
                target.classList.toggle('active');
                arrow.style.transform = target.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });

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

        function showToast(message) {
            var toast = document.getElementById('toast');
            toast.textContent = message; // Keep let here because the error happens before this
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


        commencementDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });

        deathDate?.addEventListener('input', function() {
            formatDateInput(this);
            calculateDuration();
        });





        function calculateDuration() {
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
        // Load completed cases from localStorage
        let completedDeathCases = JSON.parse(localStorage.getItem('licCompletedDeathCases') || '[]');
        let completedSpecialCases = JSON.parse(localStorage.getItem('licCompletedSpecialCases') || '[]');

        // Save data to localStorage
        function saveToStorage() {
            localStorage.setItem('licSavedCases', JSON.stringify(savedCases));
            localStorage.setItem('licSavedSpecialCases', JSON.stringify(savedSpecialCases));
            localStorage.setItem('licWorkflowStates', JSON.stringify(savedWorkflowStates));
            updateCounters();
            localStorage.setItem('licCompletedDeathCases', JSON.stringify(completedDeathCases));
            localStorage.setItem('licCompletedSpecialCases', JSON.stringify(completedSpecialCases));
        }

        // Update counters for all sections
        function updateCounters() {
            // Count active death claims
            var activeDeathRows = document.querySelectorAll('#activeDeathClaimsTable tr:not([colspan])');
            var activeDeathCount = activeDeathRows.length > 0 && !activeDeathRows[0].querySelector('td[colspan]') ? activeDeathRows.length : 0;
            document.getElementById('activeDeathClaimsCounter').textContent = activeDeathCount;

            // Count active special cases

            var activeSpecialRows = document.querySelectorAll('#activeSpecialCasesTable tr:not([colspan])');
            var activeSpecialCount = activeSpecialRows.length > 0 && !activeSpecialRows[0].querySelector('td[colspan]') ? activeSpecialRows.length : 0;
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
                    tableElement.addEventListener('click', function(e) {
                        const row = e.target.closest('tr');
                        if (!row || !row.dataset.policyNo) return;

                        var policyNo = row.dataset.policyNo;
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
            row.innerHTML = `<td class="px-6 py-4 font-semibold text-gray-300">${caseData.policyNo}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.name}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.claimType}</td><td class="px-6 py-4 font-semibold text-gray-300">${caseData.completionDate}</td><td class="px-6 py-4"><button class="btn-danger btn-remove px-4 py-2 rounded-lg text-sm font-bold" onclick="removeCompletedRow(this)">Remove</button></td>`;
            return row;
        }

        // Load data from localStorage
        function loadFromStorage() { // Keep let here because the error happens before this
           // Rebuild Active Death Claims table from savedCases object
           const activeDeathClaimsTable = document.getElementById('activeDeathClaimsTable');
            if (activeDeathClaimsTable) {
                activeDeathClaimsTable.innerHTML = ''; // Clear existing
                const cases = Object.keys(savedCases);
                if (cases.length > 0) {
                    cases.forEach(policyNo => {
                        const caseData = savedCases[policyNo];
                        const stage = getClaimStage(policyNo); // Pass policyNo to get specific stage
                        const newRow = createDeathClaimRow(policyNo, caseData.name, caseData.claimType, stage);
                        activeDeathClaimsTable.appendChild(newRow);
                    });
                } else {
                    activeDeathClaimsTable.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active death claims</td></tr>';
                }
            }

            // Rebuild Active Special Cases table from savedSpecialCases object
            const activeSpecialCasesTable = document.getElementById('activeSpecialCasesTable');
            if (activeSpecialCasesTable) {
                activeSpecialCasesTable.innerHTML = ''; // Clear existing
                const specialCases = Object.keys(savedSpecialCases);
                if (specialCases.length > 0) {
                    specialCases.forEach(policyNo => {
                        const caseData = savedSpecialCases[policyNo];
                        const newRow = createSpecialCaseRow(policyNo, caseData.name, caseData.type, caseData.issue);
                        activeSpecialCasesTable.appendChild(newRow);
                    });
                } else {
                    activeSpecialCasesTable.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No active special cases</td></tr>';
                }
            }
            // Populate Completed Death Cases Table
            populateCompletedCases('completedDeathClaimsTable', completedDeathCases, createCompletedDeathCaseRow);

             // Populate Completed Special Cases Table
            populateCompletedCases('completedSpecialCasesTable', completedSpecialCases, function(caseData) {
                return createSpecialCaseRow(caseData.policyNo, caseData.name, caseData.type, caseData.issue);
            });
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
                completedSpecialCases.push({
                    policyNo: policyNo,
                    name: name,
                    type: type,
                    issue: issue
                });

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

            specialCaseForm.classList.add('hidden');
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
            if (!caseData) return;
            
             // Show the form
            deathClaimForm.classList.remove('hidden');
            
            // Populate basic fields
            document.getElementById('policyNumber').value = policyNo;
            document.getElementById('claimantName').value = caseData.name;
            
            // Restore all saved data if exists
            if (savedCases[policyNo]) {
                var savedData = savedCases[policyNo];
                
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
            var claimTypeRadio = document.querySelector(`input[name="claimType"][value="${caseData.claimType}"]`);
            if (claimTypeRadio) {
                claimTypeRadio.checked = true;
                claimTypeRadio.dispatchEvent(new Event('change'));
            }
            
            // Show workflow sections
            document.getElementById('workflowSections').classList.remove('hidden');
            
            // Restore workflow state if exists
            if (savedWorkflowStates[policyNo]) {
                var workflowState = savedWorkflowStates[policyNo];

                // Restore all form inputs
                Object.keys(workflowState).forEach(function(inputId) {
                    var input = document.getElementById(inputId);
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
            specialCaseForm.classList.remove('hidden');
            
            // Populate fields
            document.getElementById('specialPolicyNumber').value = policyNo;
            document.getElementById('specialName').value = caseData.name;
            document.getElementById('specialType').value = caseData.type;
            document.getElementById('specialIssue').value = caseData.issue;
            // Restore the 'resolved' checkbox state from saved data
            document.getElementById('specialResolved').checked = caseData.resolved || false;
        }

        function resetSpecialForm() {
            document.getElementById('specialPolicyNumber').value = '';
            document.getElementById('specialName').value = '';
            document.getElementById('specialType').value = '';
            document.getElementById('specialIssue').value = '';
            document.getElementById('specialResolved').checked = false;
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
                    deathClaimForm.classList.add('hidden');
                    resetForm();

                }
            }
        });

        // Save progress functionality

        document.getElementById('saveProgress')?.addEventListener('click', function () {

            const policyNo = document.getElementById('policyNumber').value;
            const name = document.getElementById('claimantName').value;
            var selectedType = document.querySelector('input[name="claimType"]:checked');


            if (!policyNo || !name || !selectedType) {
                showToast('Please fill basic claim information first.');
               return;
            }



            // Save all form data
            var formData = {
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
            // Keep let here because the error happens before this
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
            var row = document.createElement('tr');
            row.className = 'dark-table-row border-t transition-all duration-300';
            row.style.cursor = 'pointer';
            row.dataset.policyNo = policyNo;
            row.dataset.policyNo = policyNo;
            updateDeathClaimRow(row, policyNo, name, claimType, stage);
            return row;
        }

        function updateDeathClaimRow(row, policyNo, name, claimType, stage) {
            row.innerHTML = `
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
            var row = button.closest('tr');
            var tableBody = row.parentNode;

            row.remove();
            
            if (tableBody.children.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No completed death claims</td></tr>';
            }
            saveToStorage();
        }

        function removeCompletedSpecialRow(button) {
            var row = button.closest('tr');
            var tableBody = row.parentNode;
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
            var searchInput = document.getElementById(inputId);
            var tableBody = document.getElementById(tableId);

            if (!searchInput || !tableBody) return;

            searchInput.addEventListener('input', function () {
                var searchTerm = this.value.toLowerCase();
                var dataRows = tableBody.querySelectorAll('tr[data-policy-no]');
                var placeholderRow = tableBody.querySelector('tr:not([data-policy-no])');
                let visibleRows = 0;

                dataRows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(searchTerm)) {
                        row.style.display = '';

                         // if placeholder row is visiable, hide it
                         if(placeholderRow) {
                            placeholderRow.style.display = 'none';
                         }


                        visibleRows++;
                    } else {
                        row.style.display = 'none';
                    }
                });

                if (placeholderRow) {
                    if (visibleRows > 0) {
                        placeholderRow.style.display = 'none';
                    }  else { // No visible rows
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
