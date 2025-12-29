function toggleKey(val) { 
    document.getElementById('adminKeyContainer').classList.toggle('hidden', val !== 'Admin'); 
}

window.Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],
    msgs: JSON.parse(localStorage.getItem('cpt_msgs')) || [], 
    userLocation: null,

    sendAdminMessage() {
        const msgInput = document.getElementById('adminMsgInput');
        const msgText = msgInput.value;
        if (!msgText) return alert("Message cannot be empty.");
        const newMsg = { id: Date.now(), sender: "DISTRICT HQ", text: msgText, timestamp: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
        this.msgs.push(newMsg);
        this.save();
        msgInput.value = '';
        alert("Broadcast Sent to Field Units.");
        this.renderAdminDatabase();
    },

    renderMessages() {
        const msgContainer = document.getElementById('volunteerMsgDisplay');
        if (!msgContainer || this.role === 'Admin') return;
        msgContainer.innerHTML = this.msgs.slice(-3).reverse().map(m => `
            <div class="msg-alert" style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 12px; margin: 10px 0; border-radius: 5px;">
                <strong>⚠️ ${m.sender}:</strong> <span>${m.text}</span><br>
                <small>${m.timestamp} | ${m.date}</small>
            </div>
        `).join('');
    },

    exportToCSV(type) {
        let data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("No data records found.");
        const headers = Object.keys(data[0]);
        const csvContent = [headers.join(','), ...data.map(item => headers.map(header => `"${item[header] || ''}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `CPT_Rescue_${type}_${new Date().toISOString().slice(0,10)}.csv`);
        link.click();
    },

    // --- UPDATED: FIXED VERIFICATION BUTTONS IN ADMIN VIEW ---
    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer || this.role !== 'Admin') return;

        dbContainer.innerHTML = `
            <div class="db-card" style="background:white; padding:20px; border-radius:10px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="color:#1e40af;">📢 Emergency Broadcast</h3>
                <textarea id="adminMsgInput" style="width:100%; height:60px; margin-bottom:10px;"></textarea>
                <button onclick="Engine.sendAdminMessage()" style="background:#1e40af; color:white; width:100%; padding:10px; border-radius:5px;">SEND BROADCAST</button>
            </div>

            <div class="db-card" style="background:white; padding:20px; border-radius:10px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3>📋 Personnel Verification Registry</h3>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <tr style="background:#f8fafc; text-align:left;">
                        <th>Name</th><th>Skill</th><th>Action</th>
                    </tr>
                    ${this.vols.map((v, i) => `
                        <tr>
                            <td>${v.name}</td><td>${v.skill}</td>
                            <td>${v.isVerified ? '✅ Verified' : `<button onclick="Engine.verifyV(${i})" style="background:#2563eb; color:white; border:none; padding:4px 8px; border-radius:3px;">Verify User</button>`}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div class="db-card" style="background:white; padding:20px; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3>🚨 Emergency Authorization Queue</h3>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <tr style="background:#f8fafc; text-align:left;">
                        <th>ID</th><th>Status</th><th>Action</th>
                    </tr>
                    ${this.incs.map((inc, i) => `
                        <tr>
                            <td>${inc.id}</td>
                            <td><b style="color:${inc.status==='PENDING'?'#dc2626':'#059669'}">${inc.status}</b></td>
                            <td>
                                ${inc.status === 'PENDING' ? `<button onclick="Engine.authorizeInc(${i})" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:3px;">Authorize</button>` : 
                                  inc.status === 'IN_PROGRESS' ? `<button onclick="Engine.resolve(${i})" style="background:#1e40af; color:white; border:none; padding:4px 8px; border-radius:3px;">Resolve</button>` : 'Complete'}
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    },

    login() {
        const sel = document.getElementById('userRole').value;
        if (sel === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) return alert("Unauthorized");
        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('personalStatusCard').classList.toggle('hidden', this.role === 'Admin');
        document.getElementById('intelPanel').classList.toggle('hidden', this.role !== 'Admin');
        const dbView = document.getElementById('adminDatabaseView');
        if(dbView) dbView.classList.toggle('hidden', this.role !== 'Admin');
        this.getUserLocation();
        this.showSection('home');
    },

    getUserLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((p) => {
            this.userLocation = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
            this.updateLocationDisplay();
        }, (e) => console.error(e), { enableHighAccuracy: true });
    },

    navigateToIncident(lat, lng, id) {
        if (!this.userLocation) return alert("GPS not found.");
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${this.userLocation.lat},${this.userLocation.lng}&destination=${lat},${lng}&travelmode=driving`, '_blank');
        const user = this.vols[this.vols.length - 1];
        if (user) { user.isNavigatingTo = id; this.save(); this.updateStats(); }
    },

    getTownshipCoords(township) {
        const coords = { "Chengalpattu Town": {lat: 12.6855, lng: 80.1154}, "Tambaram": {lat: 12.9154, lng: 80.1439}, "Pallavaram": {lat: 12.9684, lng: 80.1495} };
        return coords[township] || {lat: 12.6855, lng: 80.1154}; 
    },

    updateLocationDisplay() {
        if (this.userLocation && this.role !== 'Admin') {
            const statusCard = document.getElementById('personalStatusCard');
            const locationHTML = `<div class="location-info">📍 GPS Locked: ${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lng.toFixed(4)}</div>`;
            const existing = statusCard.querySelector('.location-info');
            if (existing) existing.remove();
            statusCard.insertAdjacentHTML('beforeend', locationHTML);
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

    autoDispatch(type, desc, skill) {
        const autoInc = { id: 'CPT-INTEL-' + Math.floor(Math.random()*99), type, location: "District Wide", address: desc, skillReq: skill, status: 'IN_PROGRESS', responderIds: [], startTime: new Date().toLocaleString() };
        this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && v.skill === skill).slice(0, 5).forEach(m => { m.isBusy = true; autoInc.responderIds.push(m.id); });
        this.incs.push(autoInc); this.save(); this.renderDashboard();
    },

    registerVolunteer() {
        const v = { id: 'V-' + Math.random().toString(36).substr(2,5).toUpperCase(), name: document.getElementById('volName').value, skill: document.getElementById('volSkill').value, location: document.getElementById('volLocation').value, isVerified: false, isOnDuty: false, isBusy: false };
        if(!v.name) return alert("Name Required");
        this.vols.push(v); this.save(); 
        alert("Registered. Awaiting Admin Verification."); 
        this.showSection('home');
    },

    toggleDuty() {
        const user = this.vols[this.vols.length - 1]; 
        if (!user) return alert("Register first.");
        if (!user.isVerified) return alert("🚨 Admin verification required to go ON DUTY.");
        user.isOnDuty = !user.isOnDuty;
        this.save(); this.updateStats(); this.renderHeatmap();
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        const active = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy);
        if (active.length === 0) { area.innerHTML = "No active units."; return; }
        const heat = {}; active.forEach(v => { heat[v.location] = (heat[v.location] || 0) + 1; });
        area.innerHTML = Object.keys(heat).map(loc => `<div class="heat-tag"><strong>${loc}</strong>: ${heat[loc]} Units</div>`).join('');
    },

    createIncident() {
        const newInc = {
            id: 'CPT-' + Math.random().toString(36).substr(2,4).toUpperCase(),
            type: document.getElementById('taskType').value,
            location: document.getElementById('taskLocation').value,
            address: document.getElementById('taskAddress').value,
            skillReq: document.getElementById('taskSkillReq').value,
            status: (this.role === 'Admin' ? 'IN_PROGRESS' : 'PENDING'),
            responderIds: [], startTime: new Date().toLocaleString(),
            geoLocation: this.userLocation
        };
        if(this.role === 'Admin') this.autoMatch(newInc);
        this.incs.push(newInc); this.save(); 
        if(this.role !== 'Admin') alert("🚨 Report Pending Admin Approval.");
        this.showSection('dashboard');
    },

    authorizeInc(idx) {
        const inc = this.incs[idx];
        inc.status = 'IN_PROGRESS';
        this.autoMatch(inc);
        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
    },

    autoMatch(inc) {
        let matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && (v.skill === inc.skillReq || v.skill === "GEN"));
        matches.slice(0, 5).forEach(m => { m.isBusy = true; inc.responderIds.push(m.id); });
    },

    resolve(idx) {
        const inc = this.incs[idx];
        inc.status = 'RESOLVED';
        inc.responderIds.forEach(id => { const v = this.vols.find(vol => vol.id === id); if(v) { v.isBusy = false; v.isNavigatingTo = null; } });
        this.save(); this.renderDashboard(); this.renderAdminDatabase();
    },

    renderDashboard() {
        const p = document.getElementById('list-progress'); if(!p) return;
        p.innerHTML = '';
        this.incs.forEach((inc, idx) => {
            if(inc.status === 'IN_PROGRESS') {
                let coords = inc.geoLocation || this.getTownshipCoords(inc.location);
                let nav = (this.userLocation && this.role !== 'Admin') ? `<button onclick="Engine.navigateToIncident(${coords.lat}, ${coords.lng}, '${inc.id}')">🚗 NAV</button>` : '';
                p.innerHTML += `<div class="emergency-card"><strong>${inc.id}: ${inc.type}</strong><br>${inc.address}${nav}</div>`;
            }
        });
    },

    verifyV(idx) { this.vols[idx].isVerified = true; this.save(); this.renderAdminDatabase(); this.updateStats(); },
    
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
