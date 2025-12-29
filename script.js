/**
 * MISSION CRITICAL: DISTRICT HQ COMMAND & CONTROL ENGINE
 * Features: Manual GovID Verification, Incident Authorization, Tactical Skill-Matching, 
 * Broadcast Messaging, CSV Export, and Real-time Auditing.
 */
window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025", 
    vols: JSON.parse(localStorage.getItem('vols_v2')) || [],
    incs: JSON.parse(localStorage.getItem('incs_v2')) || [],
    msgs: JSON.parse(localStorage.getItem('cpt_msgs')) || [], 
    userLocation: null,

    // --- 1. AUTHORITY VERIFICATION & SECURITY ---

    /**
     * Approves responder credentials based on GovID.
     * Prevents unverified users from going on duty.
     */
    authorizeResponder(idx) { 
        if(confirm(`SYSTEM OVERRIDE: Verify credentials and authorize ${this.vols[idx].name} for duty?`)) {
            this.vols[idx].isVerified = true;
            this.vols[idx].authTimestamp = new Date().toLocaleString();
            this.vols[idx].verifiedBy = "DISTRICT_HQ_ADMIN";
            this.save();
            this.renderAdminDatabase();
            this.updateStats();
            alert("PERSONNEL VERIFIED: ID and credentials logged.");
        }
    },

    /**
     * Authorizes a public report.
     * Logic: Moves from 'UNAUTHORIZED' -> 'IN_PROGRESS' if matching assets found.
     */
    authorizeReport(idx) {
        const inc = this.incs[idx];
        const matches = this.vols.filter(v => 
            v.isVerified && 
            v.isOnDuty && 
            !v.isBusy &&
            v.location === inc.location &&
            v.skills.some(s => inc.requiredSkills.includes(s))
        ).slice(0, inc.maxNeeded);

        inc.status = matches.length > 0 ? 'IN_PROGRESS' : 'PENDING';
        inc.responderIds = matches.map(m => m.id);
        matches.forEach(m => { m.isBusy = true; });

        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
        alert(`TACTICAL DEPLOYMENT: Authorized. ${matches.length} assets assigned.`);
    },

    // --- 2. REGISTRATION & REPORTING (ALL FIELDS INCLUDED) ---

    registerVolunteer() {
        const name = document.getElementById('volName').value;
        const govID = document.getElementById('volGovID')?.value || "N/A";
        const skills = Array.from(document.querySelectorAll('input[name="vskill"]:checked')).map(i => i.value);

        if(!name) return alert("Full Name is required for District HQ verification.");
        
        const vProfile = { 
            id: 'V-' + Math.floor(1000 + Math.random() * 9000), 
            name: name, 
            govID: govID,
            skills: skills, 
            location: document.getElementById('volLocation').value, 
            tier: document.getElementById('volMainSkill')?.value || "Generalist",
            avail: document.getElementById('volAvail')?.value || "Immediate",
            isVerified: false, 
            isOnDuty: false, 
            isBusy: false,
            regDate: new Date().toLocaleDateString()
        };
        
        this.vols.push(vProfile); 
        this.save(); 
        alert("LOGGED: Credentials submitted. Access to duty features restricted until HQ Verification."); 
        this.showSection('home');
    },

    createIncident() {
        const reqSkills = Array.from(document.querySelectorAll('input[name="tskill"]:checked')).map(i => i.value);
        
        const newInc = {
            id: 'OPS-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            type: document.getElementById('taskType').value,
            criticality: document.getElementById('taskCriticality')?.value || "Medium",
            location: document.getElementById('taskLocation').value,
            address: document.getElementById('taskAddress').value,
            hazmat: document.getElementById('taskHazmat')?.value || "None",
            victims: document.getElementById('taskVictims')?.value || "0",
            maxNeeded: parseInt(document.getElementById('taskMaxVolunteers')?.value) || 2,
            requiredSkills: reqSkills,
            status: (this.role === 'Admin' ? 'PENDING' : 'UNAUTHORIZED'),
            responderIds: [],
            timestamp: new Date().toLocaleString()
        };
        
        this.incs.push(newInc); 
        this.save(); 
        alert(this.role === 'Admin' ? "Incident Active" : "Report Filed: Awaiting HQ Validation");
        this.showSection('dashboard');
    },

    // --- 3. COMMUNICATIONS & EXPORTS ---

    sendAdminMessage() {
        const input = document.getElementById('adminMsgInput');
        if (!input || !input.value) return alert("Message is empty.");
        
        const msg = { 
            id: Date.now(), 
            sender: "DISTRICT HQ", 
            text: input.value, 
            timestamp: new Date().toLocaleTimeString() 
        };
        this.msgs.push(msg);
        this.save();
        input.value = '';
        this.renderAdminDatabase();
    },

    renderMessages() {
        const container = document.getElementById('volunteerMsgDisplay');
        if (!container || this.role === 'Admin') return;
        container.innerHTML = this.msgs.slice(-3).reverse().map(m => `
            <div style="background:#fff3cd; border-left:5px solid #ffc107; padding:12px; margin:8px 0; border-radius:6px;">
                <strong>⚠️ HQ UPDATE [${m.timestamp}]:</strong> ${m.text}
            </div>
        `).join('');
    },

    exportToCSV(type) {
        let data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("No records found for export.");
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
        const link = document.createElement("a");
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download = `HQ_EXPORT_${type.toUpperCase()}.csv`;
        link.click();
    },

    // --- 4. ADMIN CONSOLE (COMBINED VIEW) ---

    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer || this.role !== 'Admin') return; 

        dbContainer.innerHTML = `
            <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:2px solid #1e40af;">
                <h2 style="color:#1e40af; margin-top:0;">🛡️ COMMAND CONSOLE: DISTRICT HQ</h2>
                
                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #cbd5e1;">
                    <h3>📢 Mass Tactical Broadcast</h3>
                    <textarea id="adminMsgInput" style="width:100%; height:50px; border:1px solid #ddd; border-radius:4px; padding:10px;"></textarea>
                    <button onclick="Engine.sendAdminMessage()" style="width:100%; background:#1e40af; color:white; padding:10px; border:none; border-radius:4px; cursor:pointer; margin-top:10px; font-weight:bold;">Send Command</button>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #ef4444;">
                    <div style="display:flex; justify-content:space-between;">
                        <h3 style="color:#ef4444; margin:0;">🚨 Unauthorized Emergency Reports</h3>
                        <button onclick="Engine.exportToCSV('incs')" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Export CSV</button>
                    </div>
                    ${this.incs.filter(i => i.status === 'UNAUTHORIZED').map((inc, i) => `
                        <div style="background:#fff5f5; padding:10px; margin-top:10px; border-radius:5px; border:1px solid #feb2b2; display:flex; justify-content:space-between; align-items:center;">
                            <span><strong>${inc.type}</strong> @ ${inc.address}</span>
                            <button onclick="Engine.authorizeReport(${i})" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">VALIDATE OPS</button>
                        </div>
                    `).join('') || '<p style="color:#666;">No reports pending validation.</p>'}
                </div>

                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #1e40af;">
                    <div style="display:flex; justify-content:space-between;">
                        <h3 style="color:#1e40af; margin:0;">📋 Responder Verification Registry</h3>
                        <button onclick="Engine.exportToCSV('vols')" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">Export CSV</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                        <tr style="background:#e2e8f0; text-align:left; font-size:12px;">
                            <th style="padding:8px;">Responder / GovID</th><th style="padding:8px;">Skills</th><th style="padding:8px;">Status</th><th style="padding:8px;">Action</th>
                        </tr>
                        ${this.vols.map((v, i) => `
                            <tr style="border-bottom:1px solid #eee; font-size:13px;">
                                <td style="padding:8px;"><strong>${v.name}</strong><br><small>${v.govID}</small></td>
                                <td style="padding:8px;">${v.skills.join(', ')}</td>
                                <td style="padding:8px; color:${v.isVerified ? 'green' : 'orange'}; font-weight:bold;">${v.isVerified ? 'VERIFIED' : 'PENDING'}</td>
                                <td style="padding:8px;">
                                    ${!v.isVerified ? `<button onclick="Engine.authorizeResponder(${i})" style="background:#2563eb; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">VERIFY</button>` : 'Authorized'}
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `;
    },

    // --- 5. CORE UI & STATE ---

    login() {
        const role = document.getElementById('userRole').value;
        const key = document.getElementById('adminKey').value;
        if (role === 'Admin' && key !== this.ADMIN_KEY) return alert("Security Breach: Invalid Credentials");
        this.role = role;
        document.getElementById('loginOverlay').style.display = 'none';
        
        // Toggle side-panels
        const personalCard = document.getElementById('personalStatusCard');
        if(personalCard) personalCard.classList.toggle('hidden', this.role === 'Admin');
        
        const intelPanel = document.getElementById('intelPanel');
        if(intelPanel) intelPanel.classList.toggle('hidden', this.role !== 'Admin');

        this.showSection('home');
    },

    toggleDuty() {
        const user = this.vols[this.vols.length - 1]; 
        if (!user) return alert("Please register first.");
        if (!user.isVerified) return alert("⛔ ACCESS DENIED: Credentials not verified by HQ.");
        
        user.isOnDuty = !user.isOnDuty;
        this.save(); 
        this.updateStats(); 
        this.renderHeatmap();
        alert(user.isOnDuty ? "STATUS: ON-DUTY" : "STATUS: OFF-DUTY");
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');
        
        if (id === 'home') { this.renderHeatmap(); this.renderMessages(); }
        if (id === 'dashboard') { this.renderDashboard(); if(this.role === 'Admin') this.renderAdminDatabase(); }
        this.updateStats();
    },

    renderDashboard() {
        const containers = { 
            PENDING: document.getElementById('list-pending'), 
            IN_PROGRESS: document.getElementById('list-progress'), 
            RESOLVED: document.getElementById('list-resolved') 
        };
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });
        
        this.incs.filter(i => i.status !== 'UNAUTHORIZED').forEach(inc => {
            const card = document.createElement('div');
            card.className = `emergency-card`;
            card.style = "background:white; padding:15px; border-left:6px solid #1e40af; margin-bottom:10px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);";
            card.innerHTML = `
                <strong>${inc.id}: ${inc.type}</strong> [Criticality: ${inc.criticality}]<br>
                📍 ${inc.address}<br>
                <small>Responders: ${inc.responderIds.length > 0 ? inc.responderIds.join(', ') : 'Dispatching assets...'}</small>
            `;
            if(containers[inc.status]) containers[inc.status].appendChild(card);
        });
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        if(!area) return;
        const count = this.vols.filter(v => v.isOnDuty && v.isVerified).length;
        area.innerHTML = `<div style="padding:15px; background:#dcfce7; border:1px solid #16a34a; border-radius:8px;"><strong>District Strength:</strong> ${count} Verified Responders Active.</div>`;
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

// Auto-init stats
document.addEventListener('DOMContentLoaded', () => Engine.updateStats());
