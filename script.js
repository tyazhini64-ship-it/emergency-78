/** * DISTRICT HQ COMMAND & CONTROL ENGINE - V3.0
 * EXTENDED FEATURES: GovID Verification, Skill-based Deployment, and Tactical Authorization
 */
window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025", 
    vols: JSON.parse(localStorage.getItem('vols_v2')) || [],
    incs: JSON.parse(localStorage.getItem('incs_v2')) || [],
    msgs: JSON.parse(localStorage.getItem('cpt_msgs')) || [], 
    userLocation: null,

    // --- 1. AUTHORITY VERIFICATION ACTIONS ---

    /**
     * Approves responder credentials based on GovID.
     * Inherited from Verification List style.
     */
    authorizeResponder(idx) { 
        if(confirm(`SYSTEM NOTIFICATION: Authorize credentials for ${this.vols[idx].name}?`)) {
            this.vols[idx].isVerified = true;
            this.vols[idx].authDate = new Date().toLocaleString();
            this.vols[idx].officerRank = "Field Specialist";
            this.save();
            this.renderAdminDatabase();
            this.updateStats();
            alert("PERSONNEL STATUS: Verified and authorized for deployment.");
        }
    },

    /**
     * Authorizes a public report and initiates tactical matching.
     * Inherited from Review Queue style.
     */
    authorizeReport(idx) {
        const inc = this.incs[idx];
        
        // Advanced Match Logic: Filter by Verification, Duty Status, Location, and Required Skills
        const matches = this.vols.filter(v => 
            v.isVerified && 
            v.isOnDuty && 
            !v.isBusy &&
            v.location === inc.location &&
            v.skills.some(s => inc.requiredSkills.includes(s))
        ).slice(0, inc.maxNeeded);

        // Update Incident status based on deployment success
        inc.status = matches.length > 0 ? 'IN_PROGRESS' : 'PENDING';
        inc.responderIds = matches.map(m => m.id);
        inc.deploymentTime = new Date().toLocaleTimeString();
        
        // Mark personnel as actively engaged
        matches.forEach(m => { m.isBusy = true; });

        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
        alert(`TACTICAL OPS: Authorized. ${matches.length} qualified responders dispatched.`);
    },

    // --- 2. REGISTRATION & DATA INPUT (ENHANCED) ---

    registerVolunteer() {
        const nameInput = document.getElementById('volName');
        const govIDInput = document.getElementById('volGovID');
        const skillChecks = Array.from(document.querySelectorAll('input[name="vskill"]:checked')).map(i => i.value);

        if(!nameInput.value) return alert("CRITICAL: Legal Name is mandatory for Authority Verification.");
        
        const volunteerProfile = { 
            id: 'V-' + Math.floor(1000 + Math.random() * 9000), 
            name: nameInput.value, 
            govID: govIDInput ? govIDInput.value : "PENDING_DOCS",
            skills: skillChecks, 
            location: document.getElementById('volLocation').value, 
            tier: document.getElementById('volMainSkill')?.value || "Standard",
            isVerified: false, 
            isOnDuty: false, 
            isBusy: false,
            regDate: new Date().toLocaleDateString()
        };
        
        this.vols.push(volunteerProfile); 
        this.save(); 
        alert("REGISTRY LOGGED: Your credentials have been submitted to District HQ for manual verification."); 
        this.showSection('home');
    },

    createIncident() {
        const reqSkills = Array.from(document.querySelectorAll('input[name="tskill"]:checked')).map(i => i.value);
        const taskLoc = document.getElementById('taskLocation').value;
        const criticality = document.getElementById('taskCriticality')?.value || "Standard";

        const incidentLog = {
            id: 'OPS-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            type: document.getElementById('taskType').value,
            criticality: criticality,
            location: taskLoc,
            address: document.getElementById('taskAddress').value,
            requiredSkills: reqSkills,
            maxNeeded: parseInt(document.getElementById('taskMaxVolunteers')?.value) || 2,
            hazmat: document.getElementById('taskHazmat')?.value || "None",
            victims: document.getElementById('taskVictims')?.value || "0",
            // Public reports remain UNAUTHORIZED until Admin review
            status: (this.role === 'Admin' ? 'PENDING' : 'UNAUTHORIZED'),
            responderIds: [],
            timestamp: new Date().toLocaleString()
        };
        
        this.incs.push(incidentLog); 
        this.save(); 
        
        if(this.role === 'Admin') {
            alert("COMMAND ALERT: Incident successfully logged in the Ops Database.");
            this.renderAdminDatabase();
        } else {
            alert("REPORT FILED: Authorities have been notified to validate this emergency.");
        }
        this.showSection('dashboard');
    },

    // --- 3. THE EXPANDED ADMIN DASHBOARD (COMBINED STYLES) ---

    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer || this.role !== 'Admin') return; 

        dbContainer.classList.remove('hidden');
        dbContainer.innerHTML = `
            <div style="background:#f1f5f9; padding:25px; border-radius:15px; border:3px solid #1e40af; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                <h2 style="margin-top:0; color:#1e40af; font-family:sans-serif;">🛡️ DISTRICT HQ: COMMAND & CONTROL</h2>
                
                <div style="display:grid; grid-template-columns: 1fr; gap:25px;">
                    
                    <div id="adminReviewSection" style="background:#fff; padding:20px; border-radius:10px; border:2px solid #ef4444;">
                        <h3 style="color:#ef4444; margin-top:0;">📡 Unauthorized Incident Reports</h3>
                        <p style="font-size:12px; color:#666;">Validate public reports to initiate deployment.</p>
                        <div id="reviewQueueList">
                            ${this.incs.filter(i => i.status === 'UNAUTHORIZED').length === 0 ? 
                            '<p style="color:#94a3b8; font-style:italic;">No unauthorized reports pending.</p>' : 
                            this.incs.map((inc, i) => inc.status === 'UNAUTHORIZED' ? `
                                <div style="background:#fff5f5; border:1px solid #feb2b2; padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                                    <div>
                                        <strong style="font-size:16px;">${inc.type} @ ${inc.address}</strong><br>
                                        <small>Risk: ${inc.hazmat} | Reported: ${inc.timestamp}</small>
                                    </div>
                                    <button onclick="Engine.authorizeReport(${i})" style="background:#ef4444; color:white; border:none; padding:10px 15px; border-radius:6px; font-weight:bold; cursor:pointer; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">VALIDATE & ACTIVATE OPS</button>
                                </div>
                            ` : '').join('')}
                        </div>
                    </div>

                    <div id="verificationAdminCard" style="background:white; padding:20px; border-radius:10px; border:2px solid #3b82f6;">
                        <h3 style="color:#1e40af; margin-top:0;">📋 Responder Credential Registry</h3>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#eff6ff; text-align:left; font-size:13px;">
                                        <th style="padding:12px;">Personnel & GovID</th>
                                        <th style="padding:12px;">Expertise/Skills</th>
                                        <th style="padding:12px;">Verification Status</th>
                                        <th style="padding:12px;">Command Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.vols.map((v, i) => `
                                        <tr style="border-bottom:1px solid #e2e8f0; font-size:13px; background:${v.isVerified ? '#fff' : '#fffbeb'};">
                                            <td style="padding:12px;">
                                                <strong>${v.name}</strong><br>
                                                <code style="background:#f1f5f9; padding:2px 4px; border-radius:3px; color:#475569;">${v.govID}</code>
                                            </td>
                                            <td style="padding:12px;">
                                                <span style="font-size:11px; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:10px;">${v.tier}</span><br>
                                                <small style="color:#64748b;">${v.skills.join(', ')}</small>
                                            </td>
                                            <td style="padding:12px;">
                                                ${v.isVerified ? 
                                                    '<span style="color:#16a34a; font-weight:bold;">✔ AUTHORIZED</span>' : 
                                                    '<span style="color:#b45309; font-weight:bold;">⏳ PENDING HQ</span>'}
                                            </td>
                                            <td style="padding:12px;">
                                                ${!v.isVerified ? 
                                                    `<button onclick="Engine.authorizeResponder(${i})" style="background:#2563eb; color:white; border:none; padding:8px 12px; border-radius:5px; font-weight:bold; cursor:pointer;">APPROVE CREDENTIALS</button>` : 
                                                    `<span style="color:#94a3b8; font-size:11px;">Verified on ${v.authDate}</span>`
                                                }
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // --- 4. CORE ENGINE SUPPORT ---

    login() {
        const roleSel = document.getElementById('userRole');
        const adminKeyInput = document.getElementById('adminKey');
        if (roleSel.value === 'Admin' && adminKeyInput.value !== this.ADMIN_KEY) {
            return alert("SECURITY PROTOCOL: Invalid Administrative Credentials.");
        }
        this.role = roleSel.value;
        document.getElementById('loginOverlay').style.display = 'none';
        
        // Dynamic visibility based on role
        const personalCard = document.getElementById('personalStatusCard');
        if(personalCard) personalCard.classList.toggle('hidden', this.role === 'Admin');
        
        const intelPanel = document.getElementById('intelPanel');
        if(intelPanel) intelPanel.classList.toggle('hidden', this.role !== 'Admin');

        this.showSection('home');
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');
        
        // Render specific views
        if (id === 'dashboard') {
            this.renderDashboard();
            if (this.role === 'Admin') this.renderAdminDatabase();
        }
        if (id === 'home') {
            this.renderHeatmap();
        }
        this.updateStats();
    },

    toggleDuty() {
        const user = this.vols[this.vols.length - 1]; 
        if (!user) return alert("SYSTEM ERROR: No active registration found.");
        
        // Verification Gate
        if (!user.isVerified) {
            return alert("ACCESS DENIED: Credentials not yet verified by District HQ. You cannot go On-Duty.");
        }
        
        user.isOnDuty = !user.isOnDuty;
        this.save(); 
        this.updateStats(); 
        this.renderHeatmap();
        alert(user.isOnDuty ? "STATUS: ON-DUTY (Visible to Dispatch)" : "STATUS: OFF-DUTY");
    },

    renderDashboard() {
        const containers = { 
            PENDING: document.getElementById('list-pending'), 
            IN_PROGRESS: document.getElementById('list-progress'), 
            RESOLVED: document.getElementById('list-resolved') 
        };
        
        // Clear all containers
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });
        
        // Filter out Unauthorized reports from the public dashboard
        this.incs.filter(i => i.status !== 'UNAUTHORIZED').forEach(inc => {
            const card = document.createElement('div');
            card.className = `emergency-card criticality-${inc.criticality.toLowerCase()}`;
            card.style = "background:white; padding:15px; border-left:6px solid #1e40af; margin-bottom:15px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);";
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>ID: ${inc.id} | ${inc.type}</strong>
                    <span style="font-size:11px; background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:10px; font-weight:bold;">${inc.criticality}</span>
                </div>
                <div style="margin-top:8px;">📍 ${inc.address}</div>
                <div style="margin-top:8px; font-size:12px; color:#475569;">
                    <strong>Deployments:</strong> ${inc.responderIds.length} / ${inc.maxNeeded}<br>
                    <strong>Responders:</strong> ${inc.responderIds.length > 0 ? inc.responderIds.join(', ') : 'Searching for localized assets...'}
                </div>
            `;
            if(containers[inc.status]) containers[inc.status].appendChild(card);
        });
    },

    updateStats() {
        const vStat = document.getElementById('statVols');
        const iStat = document.getElementById('statIncidents');
        if(vStat) vStat.innerText = this.vols.filter(v => v.isVerified).length;
        if(iStat) iStat.innerText = this.incs.filter(i => i.status === 'IN_PROGRESS' || i.status === 'PENDING').length;
    },

    save() {
        localStorage.setItem('vols_v2', JSON.stringify(this.vols));
        localStorage.setItem('incs_v2', JSON.stringify(this.incs));
        localStorage.setItem('cpt_msgs', JSON.stringify(this.msgs));
    }
};

// Start Initial Logic
document.addEventListener('DOMContentLoaded', () => { Engine.updateStats(); });
