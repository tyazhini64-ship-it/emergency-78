function toggleKey(val) { 
    document.getElementById('adminKeyContainer').classList.toggle('hidden', val !== 'Admin'); 
}

window.Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],

    login() {
        const sel = document.getElementById('userRole').value;
        if (sel === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) 
            return alert("Unauthorized");
        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('personalStatusCard').classList.toggle('hidden', this.role === 'Admin');
        document.getElementById('intelPanel').classList.toggle('hidden', this.role !== 'Admin');
        this.showSection('home');
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');
        if (id === 'home') this.renderHeatmap();
        if (id === 'volunteer') this.renderVols();
        if (id === 'task') this.renderReviews();
        if (id === 'dashboard') this.renderDashboard();
        this.updateStats();
    },

    // --- API & INTEL ---
    async fetchUSGS() {
        const status = document.getElementById('apiStatus');
        status.innerText = "Connecting to USGS Seismic Feed...";
        try {
            const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
            const data = await res.json();
            const quake = data.features[0]; 
            if(quake && quake.properties.mag > 2.0) {
                this.autoDispatch("SEISMIC ACTIVITY", `Magnitude ${quake.properties.mag} - Detected at ${quake.properties.place}`, "RES");
            } else { 
                status.innerText = "USGS: No tremors detected in the last hour."; 
            }
        } catch(e) { 
            status.innerText = "USGS Server Offline."; 
        }
    },

    async fetchPurpleAir() {
        const status = document.getElementById('apiStatus');
        const mockAQI = Math.floor(Math.random() * 200);
        if(mockAQI > 110) {
            this.autoDispatch("AIR QUALITY ALERT", `Unhealthy AQI (${mockAQI}) in Chengalpattu District.`, "MED");
        } else { 
            status.innerText = `District AQI is Stable (${mockAQI})`; 
        }
    },

    autoDispatch(type, desc, skill) {
        const alertBox = document.getElementById('apiAlert');
        alertBox.innerHTML = `🚨 DISTRICT ALERT: ${type}. Auto-assigning nearest ${skill} responders.`;
        alertBox.classList.remove('hidden');
        
        const autoInc = {
            id: 'CPT-INTEL-' + Math.floor(Math.random()*99),
            type: type, location: "District Wide", address: desc, skillReq: skill,
            max: 5, crit: 'HIGH', status: 'IN_PROGRESS', responderIds: [],
            startTime: new Date().toLocaleString()
        };

        const matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && v.skill === skill);
        matches.slice(0, 5).forEach(m => { m.isBusy = true; autoInc.responderIds.push(m.id); });
        
        this.incs.push(autoInc); this.save(); this.renderDashboard();
        setTimeout(() => alertBox.classList.add('hidden'), 8000);
    },

    // --- CORE LOGIC ---
    registerVolunteer() {
        const v = {
            id: 'V-' + Math.random().toString(36).substr(2,5).toUpperCase(),
            name: document.getElementById('volName').value,
            govID: document.getElementById('volGovID').value,
            blood: document.getElementById('volBlood').value,
            skill: document.getElementById('volSkill').value,
            location: document.getElementById('volLocation').value,
            isVerified: false, isOnDuty: false, isBusy: false 
        };
        if(!v.name) return alert("Full Name Required");
        this.vols.push(v); this.save(); 
        alert("Registration Successful. Awaiting Admin Audit."); 
        this.showSection('home');
    },

    toggleDuty() {
        if (this.vols.length === 0) return alert("Please Register First.");
        const user = this.vols[this.vols.length - 1]; 
        user.isOnDuty = !user.isOnDuty;
        this.save(); this.updateStats(); this.renderHeatmap();
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        const active = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy);
        if (active.length === 0) { 
            area.innerHTML = "<small>No personnel currently active in Chengalpattu.</small>"; 
            return; 
        }
        const heat = {}; 
        active.forEach(v => { heat[v.location] = (heat[v.location] || 0) + 1; });
        area.innerHTML = Object.keys(heat).map(loc => 
            `<div class="heat-tag"><strong>${loc}</strong>: ${heat[loc]} Units</div>`
        ).join('');
    },

    createIncident() {
        const newInc = {
            id: 'CPT-' + Math.random().toString(36).substr(2,4).toUpperCase(),
            type: document.getElementById('taskType').value,
            location: document.getElementById('taskLocation').value,
            address: document.getElementById('taskAddress').value,
            skillReq: document.getElementById('taskSkillReq').value,
            max: parseInt(document.getElementById('taskMax').value),
            crit: document.getElementById('taskCrit').value,
            status: (this.role === 'Admin' ? 'IN_PROGRESS' : 'UNAUTHORIZED'),
            responderIds: [], startTime: new Date().toLocaleString()
        };
        if(this.role === 'Admin') this.autoMatch(newInc);
        this.incs.push(newInc); this.save(); this.showSection('dashboard');
    },

    autoMatch(inc) {
        let matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && 
            v.location === inc.location && (v.skill === inc.skillReq || v.skill === "GEN"));
        matches.slice(0, inc.max).forEach(m => { m.isBusy = true; inc.responderIds.push(m.id); });
    },

    resolve(idx) {
        const inc = this.incs[idx];
        inc.status = 'RESOLVED'; inc.endTime = new Date().toLocaleString();
        inc.responderIds.forEach(id => { 
            const v = this.vols.find(vol => vol.id === id); 
            if(v) v.isBusy = false; 
        });
        this.save(); this.renderDashboard();
    },

    renderDashboard() {
        const p = document.getElementById('list-progress'); 
        const r = document.getElementById('list-resolved');
        const filter = document.getElementById('aarSearch').value.toLowerCase();
        p.innerHTML = ''; r.innerHTML = '';
        this.incs.forEach((inc, idx) => {
            const staff = inc.responderIds.map(id => 
                this.vols.find(v => v.id === id)?.name
            ).join(', ');
            if(inc.status === 'IN_PROGRESS') {
                p.innerHTML += `<div class="emergency-card critical-${inc.crit?.toLowerCase()}">
                    <strong>${inc.id}: ${inc.type}</strong><br>${inc.address}<br>
                    <small>Personnel: ${staff || 'Pending Match'}</small><br>
                    ${this.role === 'Admin' ? `<button onclick="Engine.resolve(${idx})">MARK RESOLVED</button>` : ''}
                </div>`;
            } else if(inc.status === 'RESOLVED' && inc.location.toLowerCase().includes(filter)) {
                r.innerHTML += `<div class="aar-card">
                    <strong>AAR ARCHIVE: ${inc.id}</strong><br>
                    ${inc.type} - ${inc.location}<br>
                    <small>${inc.startTime} - ${inc.endTime}</small>
                </div>`;
            }
        });
    },

    renderVols() {
        const l = document.getElementById('vList');
        document.getElementById('verificationAdminCard').classList.toggle('hidden', this.role !== 'Admin');
        l.innerHTML = this.vols.map((v, i) => `<div class="emergency-card">
            <strong>${v.name}</strong> [${v.skill}]<br>${v.location}<br>
            ${!v.isVerified && this.role === 'Admin' ? 
                `<button onclick="Engine.verifyV(${i})">APPROVE</button>` : 
                v.isVerified ? '✓ VERIFIED' : 'Pending Verification'}
        </div>`).join('');
    },

    verifyV(idx) { 
        this.vols[idx].isVerified = true; 
        this.save(); this.renderVols(); this.updateStats(); 
    },
    
    updateStats() {
        document.getElementById('statVols').innerText = this.vols.filter(v => v.isVerified).length;
        document.getElementById('statIncidents').innerText = this.incs.filter(i => i.status === 'IN_PROGRESS').length;
        const statusText = document.getElementById('currentStatusText');
        if (statusText && this.vols.length > 0) {
            const user = this.vols[this.vols.length - 1];
            statusText.innerText = user.isBusy ? "DEPLOYED" : 
                (user.isOnDuty ? "ACTIVE ON-DUTY" : "STANDBY OFF-DUTY");
            statusText.className = user.isBusy ? "status-busy" : 
                (user.isOnDuty ? "status-on" : "status-off");
        }
    },

    save() {
        localStorage.setItem('cpt_vols', JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs', JSON.stringify(this.incs));
    }
};

// Initialize
Engine.showSection('home');
