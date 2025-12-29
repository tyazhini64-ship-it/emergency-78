function toggleKey(val) { 
    const container = document.getElementById('adminKeyContainer');
    if(container) container.classList.toggle('hidden', val !== 'Admin'); 
}

window.Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],
    msgs: JSON.parse(localStorage.getItem('cpt_msgs')) || [], 
    userLocation: null,

    // --- DEBUG TOOL: RUN THIS IN CONSOLE IF BUTTONS MISSING ---
    checkData() {
        console.table(this.vols);
        console.table(this.incs);
        alert(`Data Report: ${this.vols.length} Volunteers, ${this.incs.length} Incidents. Role: ${this.role}`);
    },

    sendAdminMessage() {
        const msgInput = document.getElementById('adminMsgInput');
        if (!msgInput || !msgInput.value) return alert("Message empty.");
        const newMsg = { id: Date.now(), sender: "DISTRICT HQ", text: msgInput.value, timestamp: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
        this.msgs.push(newMsg);
        this.save();
        msgInput.value = '';
        this.renderAdminDatabase();
    },

    renderMessages() {
        const msgContainer = document.getElementById('volunteerMsgDisplay');
        if (!msgContainer || this.role === 'Admin') return;
        msgContainer.innerHTML = this.msgs.slice(-3).reverse().map(m => `
            <div style="background:#fff3cd; border-left:5px solid #ffc107; padding:10px; margin:5px 0; border-radius:5px;">
                <strong>⚠️ ${m.sender}:</strong> ${m.text}
            </div>
        `).join('');
    },

    exportToCSV(type) {
        let data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("No data to export.");
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
        const link = document.createElement("a");
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.target = '_blank';
        link.download = `CPT_${type}.csv`;
        link.click();
    },

    // --- CRITICAL FIX: REWRITTEN ADMIN VIEW ---
    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer) return; 
        
        // If user is not Admin, hide and exit
        if (this.role !== 'Admin') {
            dbContainer.classList.add('hidden');
            return;
        }
        dbContainer.classList.remove('hidden');

        dbContainer.innerHTML = `
            <div style="background:#f1f5f9; padding:15px; border-radius:10px; border:2px solid #1e40af;">
                <h2 style="margin-top:0; color:#1e40af;">🛡️ MASTER ADMIN CONTROL</h2>
                
                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #cbd5e1;">
                    <h3>📢 Broadcast to All Units</h3>
                    <textarea id="adminMsgInput" style="width:100%; height:50px;"></textarea>
                    <button onclick="Engine.sendAdminMessage()" style="width:100%; background:#1e40af; color:white; padding:8px; border:none; border-radius:4px; cursor:pointer;">Send Command</button>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #cbd5e1;">
                    <div style="display:flex; justify-content:space-between;">
                        <h3>📋 Volunteer Registry (${this.vols.length})</h3>
                        <button onclick="Engine.exportToCSV('vols')" style="background:#059669; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px;">Export CSV</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                        <tr style="background:#e2e8f0; text-align:left; font-size:12px;">
                            <th style="padding:8px;">Name</th><th style="padding:8px;">Status</th><th style="padding:8px;">Action</th>
                        </tr>
                        ${this.vols.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding:10px;">No volunteers registered</td></tr>' : 
                        this.vols.map((v, i) => `
                            <tr style="border-bottom:1px solid #f1f5f9; font-size:13px;">
                                <td style="padding:8px;">${v.name}</td>
                                <td style="padding:8px;">${v.isVerified ? '✅ Verified' : '❌ Pending'}</td>
                                <td style="padding:8px;">
                                    ${!v.isVerified ? `<button onclick="Engine.verifyV(${i})" style="background:#2563eb; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">Verify Now</button>` : '---'}
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">
                    <div style="display:flex; justify-content:space-between;">
                        <h3>🚨 Emergency Auth Queue (${this.incs.filter(i=>i.status==='PENDING').length})</h3>
                        <button onclick="Engine.exportToCSV('incs')" style="background:#059669; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px;">Export CSV</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                        <tr style="background:#fee2e2; text-align:left; font-size:12px;">
                            <th style="padding:8px;">Type</th><th style="padding:8px;">Location</th><th style="padding:8px;">Action</th>
                        </tr>
                        ${this.incs.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding:10px;">No incidents reported</td></tr>' : 
                        this.incs.map((inc, i) => `
                            <tr style="border-bottom:1px solid #f1f5f9; font-size:13px;">
                                <td style="padding:8px;">${inc.type}</td>
                                <td style="padding:8px;">${inc.location}</td>
                                <td style="padding:8px;">
                                    ${inc.status === 'PENDING' ? `<button onclick="Engine.authorizeInc(${i})" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">Authorize</button>` : 
                                      inc.status === 'IN_PROGRESS' ? `<button onclick="Engine.resolve(${i})" style="background:#1e40af; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">Resolve</button>` : '✅ Closed'}
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `;
    },

    login() {
        const roleSel = document.getElementById('userRole');
        const adminKeyInput = document.getElementById('adminKey');
        if(!roleSel) return;

        const sel = roleSel.value;
        if (sel === 'Admin' && adminKeyInput.value !== this.ADMIN_KEY) return alert("Unauthorized Admin Access");
        
        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        
        // Toggle visibility based on role
        const personalCard = document.getElementById('personalStatusCard');
        if(personalCard) personalCard.classList.toggle('hidden', this.role === 'Admin');
        
        const intelPanel = document.getElementById('intelPanel');
        if(intelPanel) intelPanel.classList.toggle('hidden', this.role !== 'Admin');
        
        this.getUserLocation();
        this.showSection('home');
    },

    getUserLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((p) => {
            this.userLocation = { lat: p.coords.latitude, lng: p.coords.longitude };
            this.updateLocationDisplay();
        });
    },

    updateLocationDisplay() {
        const statusCard = document.getElementById('personalStatusCard');
        if (this.userLocation && statusCard && this.role !== 'Admin') {
            let info = statusCard.querySelector('.location-info');
            if (!info) {
                info = document.createElement('div');
                info.className = 'location-info';
                statusCard.appendChild(info);
            }
            info.innerHTML = `📍 Location Active: ${this.userLocation.lat.toFixed(4)}`;
        }
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');
        
        if (id === 'home') { this.renderHeatmap(); this.renderMessages(); }
        if (id === 'dashboard') { this.renderDashboard(); this.renderAdminDatabase(); }
        this.updateStats();
    },

    registerVolunteer() {
        const name = document.getElementById('volName').value;
        if(!name) return alert("Name required");
        
        const v = { 
            id: 'V-' + Date.now().toString().slice(-4), 
            name: name, 
            skill: document.getElementById('volSkill').value, 
            location: document.getElementById('volLocation').value, 
            isVerified: false, isOnDuty: false, isBusy: false 
        };
        this.vols.push(v); 
        this.save(); 
        alert("Registration sent. Admin must verify you before you can go On Duty."); 
        this.showSection('home');
    },

    toggleDuty() {
        const user = this.vols[this.vols.length - 1]; 
        if (!user) return alert("Please register first.");
        if (!user.isVerified) return alert("❌ ACCESS DENIED: Your account is not verified by Admin.");
        
        user.isOnDuty = !user.isOnDuty;
        this.save(); 
        this.updateStats(); 
        this.renderHeatmap();
    },

    createIncident() {
        const newInc = {
            id: 'CPT-' + Math.floor(Math.random()*9000),
            type: document.getElementById('taskType').value,
            location: document.getElementById('taskLocation').value,
            address: document.getElementById('taskAddress').value,
            status: (this.role === 'Admin' ? 'IN_PROGRESS' : 'PENDING'),
            responderIds: [],
            geoLocation: this.userLocation
        };
        this.incs.push(newInc); 
        this.save(); 
        alert(this.role === 'Admin' ? "Incident Live" : "Emergency Reported: Awaiting Authorization");
        this.showSection('dashboard');
    },

    authorizeInc(idx) {
        const inc = this.incs[idx];
        inc.status = 'IN_PROGRESS';
        // Auto-match Logic
        const matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy);
        matches.slice(0, 3).forEach(m => { m.isBusy = true; inc.responderIds.push(m.id); });
        
        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
    },

    resolve(idx) {
        const inc = this.incs[idx];
        inc.status = 'RESOLVED';
        inc.responderIds.forEach(id => {
            const v = this.vols.find(vol => vol.id === id);
            if(v) v.isBusy = false;
        });
        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
    },

    renderDashboard() {
        const p = document.getElementById('list-progress'); 
        if(!p) return;
        p.innerHTML = this.incs.filter(i => i.status === 'IN_PROGRESS').map(inc => `
            <div style="background:#fff1f2; border-left:5px solid #ef4444; padding:10px; margin-bottom:10px; border-radius:5px;">
                <strong>${inc.type}</strong> - ${inc.location}<br>
                <small>${inc.address}</small>
            </div>
        `).join('') || '<p>No active emergencies.</p>';
    },

    verifyV(idx) { 
        this.vols[idx].isVerified = true; 
        this.save(); 
        this.renderAdminDatabase(); 
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        if(!area) return;
        const activeCount = this.vols.filter(v => v.isOnDuty && v.isVerified).length;
        area.innerHTML = `<strong>Current Active Strength:</strong> ${activeCount} Verified Units`;
    },
    
    updateStats() {
        const vStat = document.getElementById('statVols');
        const iStat = document.getElementById('statIncidents');
        if(vStat) vStat.innerText = this.vols.filter(v => v.isVerified).length;
        if(iStat) iStat.innerText = this.incs.filter(i => i.status === 'IN_PROGRESS').length;
    },

    save() {
        localStorage.setItem('cpt_vols', JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs', JSON.stringify(this.incs));
        localStorage.setItem('cpt_msgs', JSON.stringify(this.msgs));
    }
};

Engine.showSection('home');
