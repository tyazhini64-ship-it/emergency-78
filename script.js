/**
 * COMMAND & CONTROL ENGINE V6.0 - FULL SECURITY & FEATURE PARITY
 * INCLUDES: Password Protection, AQI, Seismic, Geolocation, & HQ Verification.
 */
window.Engine = {
    role: "User",
    ADMIN_KEY: "chengalpattu2025", 
    vols: JSON.parse(localStorage.getItem('vols_v2')) || [],
    incs: JSON.parse(localStorage.getItem('incs_v2')) || [],
    msgs: JSON.parse(localStorage.getItem('cpt_msgs')) || [], 
    userLocation: null,
    envData: { aqi: 0, seismic: 0.0, trend: 'Stable' },

    // --- 1. SECURITY & ACCESS CONTROL ---

    /**
     * Toggles the visibility of the password field based on role selection
     */
    toggleAdminField(val) { 
        const container = document.getElementById('adminKeyContainer');
        if (container) {
            container.style.display = (val === 'Admin') ? 'block' : 'none'; 
        }
    },

    /**
     * Validates credentials and grants access to specific Command Layers
     */
    login() {
        const selRole = document.getElementById('userRole').value;
        const passInput = document.getElementById('adminKey').value;

        // AUTHENTICATION GATE
        if (selRole === 'Admin' && passInput !== this.ADMIN_KEY) {
            return alert("🚨 SECURITY BREACH: Invalid Administrative Credentials.");
        }

        this.role = selRole;
        document.getElementById('loginOverlay').style.display = 'none';

        // Set UI visibility based on role
        const intelPanel = document.getElementById('intelPanel');
        if (intelPanel) intelPanel.classList.toggle('hidden', this.role !== 'Admin');
        
        const personalCard = document.getElementById('personalStatusCard');
        if (personalCard) personalCard.classList.toggle('hidden', this.role === 'Admin');

        this.initSensors(); // Start GPS and Environmental sensors
        this.showSection('home');
    },

    // --- 2. SENSORS & GEOLOCATION ---

    initSensors() {
        this.updateAQI();
        this.trackLocation();
        setInterval(() => this.monitorSeismic(), 8000); // 8-second refresh
    },

    trackLocation() {
        if (!navigator.geolocation) return alert("GPS Error: Hardware not found.");
        navigator.geolocation.watchPosition((p) => {
            this.userLocation = { 
                lat: p.coords.latitude, 
                lng: p.coords.longitude,
                alt: p.coords.altitude || 0,
                acc: p.coords.accuracy
            };
            this.renderLocationUI();
        }, (err) => console.error(err), { enableHighAccuracy: true });
    },

    updateAQI() {
        this.envData.aqi = Math.floor(Math.random() * (120 - 40) + 40);
        const aqiDisplay = document.getElementById('aqiStat');
        if(aqiDisplay) aqiDisplay.innerText = this.envData.aqi;
    },

    monitorSeismic() {
        this.envData.seismic = (Math.random() * 1.8).toFixed(1);
        const seismicDisplay = document.getElementById('seismicStat');
        if(seismicDisplay) {
            seismicDisplay.innerText = this.envData.seismic + " SR";
            seismicDisplay.style.color = this.envData.seismic > 1.5 ? 'red' : 'inherit';
        }
    },

    renderLocationUI() {
        const locBox = document.getElementById('geoDisplay');
        if(locBox && this.userLocation) {
            locBox.innerHTML = `🛰️ GPS: ${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lng.toFixed(4)} (±${this.userLocation.acc.toFixed(0)}m)`;
        }
    },

    // --- 3. HQ VERIFICATION & TACTICAL LOGIC ---

    authorizeResponder(idx) { 
        if(confirm(`Confirm GovID validation for ${this.vols[idx].name}?`)) {
            this.vols[idx].isVerified = true;
            this.save();
            this.renderAdminDatabase();
            this.updateStats();
        }
    },

    authorizeReport(idx) {
        const inc = this.incs[idx];
        // Match verified units with required skills
        const matches = this.vols.filter(v => 
            v.isVerified && v.isOnDuty && !v.isBusy &&
            v.skills.some(s => inc.requiredSkills.includes(s))
        ).slice(0, inc.maxNeeded);

        inc.status = matches.length > 0 ? 'IN_PROGRESS' : 'PENDING';
        inc.responderIds = matches.map(m => m.id);
        matches.forEach(m => { m.isBusy = true; });

        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
        alert("Ops Authorized: Deployment Successful.");
    },

    // --- 4. DATA MANAGEMENT ---

    exportToCSV(type) {
        const data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("Empty database.");
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download = `CPT_HQ_${type.toUpperCase()}.csv`;
        link.click();
    },

    sendAdminMessage() {
        const input = document.getElementById('adminMsgInput');
        if (!input.value) return;
        this.msgs.push({ sender: "DISTRICT HQ", text: input.value, ts: new Date().toLocaleTimeString() });
        this.save();
        input.value = '';
        this.renderAdminDatabase();
    },

    registerVolunteer() {
        const skills = Array.from(document.querySelectorAll('input[name="vskill"]:checked')).map(i => i.value);
        this.vols.push({
            id: 'V-' + Math.floor(1000 + Math.random() * 9000),
            name: document.getElementById('volName').value,
            govID: document.getElementById('volGovID').value,
            skills: skills,
            location: document.getElementById('volLocation').value,
            isVerified: false, isOnDuty: false, isBusy: false
        });
        this.save();
        alert("Credentials Logged. Access Restricted until HQ Approval.");
        this.showSection('home');
    },

    createIncident() {
        const reqs = Array.from(document.querySelectorAll('input[name="tskill"]:checked')).map(i => i.value);
        this.incs.push({
            id: 'OPS-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            type: document.getElementById('taskType').value,
            address: document.getElementById('taskAddress').value,
            requiredSkills: reqs,
            maxNeeded: parseInt(document.getElementById('taskMaxVolunteers').value) || 1,
            status: (this.role === 'Admin' ? 'PENDING' : 'UNAUTHORIZED'),
            responderIds: [],
            location: this.userLocation
        });
        this.save();
        this.showSection('dashboard');
    },

    // --- 5. RENDERERS & NAVIGATION ---

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');

        if (id === 'dashboard') {
            this.renderDashboard();
            if (this.role === 'Admin') this.renderAdminDatabase();
        }
        if (id === 'home') this.renderHeatmap();
        this.updateStats();
    },

    renderAdminDatabase() {
        const dbView = document.getElementById('adminDatabaseView');
        if (!dbView || this.role !== 'Admin') return;

        dbView.innerHTML = `
            <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:2px solid #1e40af;">
                <h3 style="color:#1e40af; margin-top:0;">🛡️ HQ COMMAND CENTER</h3>
                
                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:15px;">
                    <h4>📡 Broadcast System</h4>
                    <textarea id="adminMsgInput" style="width:100%; height:40px;"></textarea>
                    <button onclick="Engine.sendAdminMessage()" style="width:100%; margin-top:5px; background:#1e40af; color:white; border:none; padding:8px; border-radius:4px;">Send Message</button>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #ef4444; margin-bottom:15px;">
                    <h4 style="color:#ef4444;">🚨 Incident Review Queue</h4>
                    ${this.incs.filter(i => i.status === 'UNAUTHORIZED').map((inc, i) => `
                        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                            <span><strong>${inc.type}</strong> - ${inc.address}</span>
                            <button onclick="Engine.authorizeReport(${i})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px;">VALIDATE</button>
                        </div>
                    `).join('') || '<p>No pending reports.</p>'}
                </div>

                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #3b82f6;">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="color:#1e40af;">📋 Responder Verification</h4>
                        <button onclick="Engine.exportToCSV('vols')" style="font-size:11px;">CSV Export</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        ${this.vols.map((v, i) => `
                            <tr style="border-bottom:1px solid #eee;">
                                <td style="padding:8px;">${v.name} (${v.govID})</td>
                                <td style="padding:8px;">${v.isVerified ? '✅ VERIFIED' : `<button onclick="Engine.authorizeResponder(${i})">APPROVE</button>`}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `;
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
            card.className = "emergency-card";
            card.style = "background:white; padding:15px; margin-bottom:10px; border-radius:8px; border-left:5px solid #1e40af; box-shadow:0 2px 5px rgba(0,0,0,0.1);";
            card.innerHTML = `<strong>${inc.type}</strong><br>${inc.address}<br><small>Responders: ${inc.responderIds.join(', ') || 'Dispatching...'}</small>`;
            if(containers[inc.status]) containers[inc.status].appendChild(card);
        });
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        if(!area) return;
        const active = this.vols.filter(v => v.isOnDuty && v.isVerified).length;
        area.innerHTML = `<div style="padding:15px; background:#dcfce7; color:#166534; border-radius:8px;"><strong>Active Strength:</strong> ${active} Verified Responders</div>`;
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

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    Engine.updateStats();
    // Ensure the toggle logic is bound to the select element
    const roleSel = document.getElementById('userRole');
    if(roleSel) roleSel.addEventListener('change', (e) => Engine.toggleAdminField(e.target.value));
});
