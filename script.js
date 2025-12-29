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

    // --- FEATURE: ADMIN MESSENGER SYSTEM ---
    sendAdminMessage() {
        const msgInput = document.getElementById('adminMsgInput');
        const msgText = msgInput.value;
        if (!msgText) return alert("Message cannot be empty.");
        
        const newMsg = {
            id: Date.now(),
            sender: "DISTRICT HQ",
            text: msgText,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
        
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
            <div class="msg-alert" style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 12px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <strong style="color: #856404;">⚠️ ${m.sender}:</strong> <span style="color: #664d03;">${m.text}</span><br>
                <small style="color: #bc9105;">${m.timestamp} | ${m.date}</small>
            </div>
        `).join('');
    },

    // --- FEATURE: CSV EXPORT SYSTEM ---
    exportToCSV(type) {
        let data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("No data records found for export.");

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','), 
            ...data.map(item => headers.map(header => `"${item[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `CPT_Rescue_${type}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // --- FEATURE: ADMIN MASTER DATABASE VIEW ---
    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer || this.role !== 'Admin') return;

        dbContainer.innerHTML = `
            <div class="db-card" style="background:white; padding:20px; border-radius:10px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top:0; color:#1e40af;">📢 Emergency Command Broadcast</h3>
                <textarea id="adminMsgInput" placeholder="Type urgent orders here..." style="width:100%; height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:5px; margin-bottom:10px; font-family:inherit;"></textarea>
                <button onclick="Engine.sendAdminMessage()" style="background:#1e40af; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; width:100%; font-weight:bold;">SEND BROADCAST</button>
            </div>

            <div class="db-card" style="background:white; padding:20px; border-radius:10px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; color:#1e40af;">📋 Personnel Registry</h3>
                    <button onclick="Engine.exportToCSV('vols')" style="background:#059669; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-size:12px;">📥 Export CSV</button>
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead>
                            <tr style="background:#f8fafc; text-align:left;">
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Name</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Skill</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Location</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.vols.map((v, i) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px;">${v.name}</td>
                                    <td style="padding:10px;">${v.skill}</td>
                                    <td style="padding:10px;">${v.location}</td>
                                    <td style="padding:10px;">
                                        ${v.isVerified ? '<span style="color:#059669;">Verified</span>' : 
                                        `<button onclick="Engine.verifyV(${i})" style="background:#2563eb; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer;">Approve</button>`}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="db-card" style="background:white; padding:20px; border-radius:10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; color:#1e40af;">🚨 Incident Logs</h3>
                    <button onclick="Engine.exportToCSV('incs')" style="background:#059669; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-size:12px;">📥 Export CSV</button>
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead>
                            <tr style="background:#f8fafc; text-align:left;">
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">ID</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Type</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Status</th>
                                <th style="padding:10px; border-bottom:2px solid #e2e8f0;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.incs.map((inc, i) => `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px;">${inc.id}</td>
                                    <td style="padding:10px;">${inc.type}</td>
                                    <td style="padding:10px;">${inc.status}</td>
                                    <td style="padding:10px;">
                                        ${inc.status === 'PENDING' ? `<button onclick="Engine.authorizeInc(${i})" style="background:#059669; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer;">Authorize</button>` : 
                                          inc.status === 'IN_PROGRESS' ? `<button onclick="Engine.resolve(${i})" style="background:#1e40af; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer;">Resolve</button>` : 'Resolved'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // --- CORE LOGIN & NAVIGATION (PRESERVED) ---
    login() {
        const sel = document.getElementById('userRole').value;
        if (sel === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) 
            return alert("Unauthorized");
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
        if (!navigator.geolocation) {
            console.log("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                this.updateLocationDisplay();
            },
            (error) => console.error("Geolocation error:", error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
        );
    },

    navigateToIncident(incidentLat, incidentLng, incidentId) {
        if (!this.userLocation) {
            return alert("GPS signal not found. Please refresh location.");
        }
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${this.userLocation.lat},${this.userLocation.lng}&destination=${incidentLat},${incidentLng}&travelmode=driving`;
        window.open(directionsUrl, '_blank');
        
        const user = this.vols[this.vols.length - 1];
        if (user) {
            user.isNavigatingTo = incidentId;
            this.save();
            this.updateStats();
        }
        alert(`🚗 Google Maps Navigation started to ${incidentId}`);
    },

    getTownshipCoords(township) {
        const coords = {
            "Chengalpattu Town": {lat: 12.6855, lng: 80.1154},
            "Tambaram": {lat: 12.9154, lng: 80.1439},
            "Pallavaram": {lat: 12.9684, lng: 80.1495},
            "Chromepet": {lat: 12.9511, lng: 80.1453},
            "Maraimalai Nagar": {lat: 12.7414, lng: 80.0228},
            "Guduvanchery": {lat: 12.8444, lng: 80.0467},
            "Mahabalipuram": {lat: 12.6205, lng: 80.1920},
            "Maduranthakam": {lat: 12.5142, lng: 79.9813},
            "Tiruporur": {lat: 12.5311, lng: 80.2747}
        };
        return coords[township] || {lat: 12.6855, lng: 80.1154}; 
    },

    updateLocationDisplay() {
        if (this.userLocation && this.role !== 'Admin') {
            const statusCard = document.getElementById('personalStatusCard');
            const locationHTML = `
                <div class="location-info" style="margin-top:10px; border-top:1px solid #eee; padding-top:10px; font-size:12px; color:#475569;">
                    📍 GPS: ${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lng.toFixed(4)}<br>
                    <small>Accuracy: ${this.userLocation.accuracy.toFixed(0)}m</small>
                    <button onclick="Engine.getUserLocation()" style="display:block; margin-top:5px; background:none; border:none; color:#2563eb; text-decoration:underline; cursor:pointer; font-size:11px;">🔄 Refresh Signal</button>
                </div>
            `;
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
        if (id === 'volunteer') this.renderVols();
        if (id === 'dashboard') { this.renderDashboard(); this.renderAdminDatabase(); }
        this.updateStats();
    },

    // --- DISTRICT INTELLIGENCE (PRESERVED) ---
    async fetchUSGS() {
        const status = document.getElementById('apiStatus');
        if(status) status.innerText = "Scanning USGS Seismology...";
        try {
            const res = await fetch('https://earthquake.usgov/earthquakes/feed/v1.0/summary/all_hour.geojson');
            const data = await res.json();
            const quake = data.features[0]; 
            if(quake && quake.properties.mag > 2.0) {
                this.autoDispatch("SEISMIC ACTIVITY", `Magnitude ${quake.properties.mag} - ${quake.properties.place}`, "RES");
            } else if(status) { 
                status.innerText = "USGS: No tremors detected in the last hour."; 
            }
        } catch(e) { if(status) status.innerText = "USGS Feed Offline."; }
    },

    async fetchPurpleAir() {
        const status = document.getElementById('apiStatus');
        const mockAQI = Math.floor(Math.random() * 200);
        if(mockAQI > 110) {
            this.autoDispatch("AIR QUALITY ALERT", `Unhealthy AQI (${mockAQI}) in Chengalpattu.`, "MED");
        } else if(status) { 
            status.innerText = `District AQI is Stable (${mockAQI})`; 
        }
    },

    autoDispatch(type, desc, skill) {
        const alertBox = document.getElementById('apiAlert');
        if(alertBox) {
            alertBox.innerHTML = `🚨 DISTRICT ALERT: ${type}. Auto-assigning nearest responders.`;
            alertBox.classList.remove('hidden');
        }
        
        const autoInc = {
            id: 'CPT-INTEL-' + Math.floor(Math.random()*99),
            type: type, location: "District Wide", address: desc, skillReq: skill,
            max: 5, crit: 'HIGH', status: 'IN_PROGRESS', responderIds: [],
            startTime: new Date().toLocaleString()
        };

        const matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && v.skill === skill);
        matches.slice(0, 5).forEach(m => { m.isBusy = true; autoInc.responderIds.push(m.id); });
        
        this.incs.push(autoInc); this.save(); this.renderDashboard();
        setTimeout(() => alertBox && alertBox.classList.add('hidden'), 8000);
    },

    // --- WORKFLOW LOGIC (UPDATED WITH VERIFICATION CHECKS) ---
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
        alert("Registration Successful. Please wait for admin verification."); 
        this.showSection('home');
    },

    toggleDuty() {
        if (this.vols.length === 0) return alert("Please Register First.");
        const user = this.vols[this.vols.length - 1]; 
        
        // PERSONAL VERIFICATION CHECK
        if (!user.isVerified) {
            return alert("🚨 YOUR ACCOUNT IS NOT VERIFIED. Please contact District Admin for credential approval.");
        }

        user.isOnDuty = !user.isOnDuty;
        this.save(); this.updateStats(); this.renderHeatmap();
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        const active = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy);
        if (active.length === 0) { 
            area.innerHTML = "<small style='color:#94a3b8;'>No active personnel in district.</small>"; 
            return; 
        }
        const heat = {}; 
        active.forEach(v => { heat[v.location] = (heat[v.location] || 0) + 1; });
        area.innerHTML = Object.keys(heat).map(loc => 
            `<div class="heat-tag" style="background:#dcfce7; color:#166534; padding:5px 10px; border-radius:20px; display:inline-block; margin:5px; font-size:12px; border:1px solid #bbf7d0;">
                <strong>${loc}</strong>: ${heat[loc]} Units
            </div>`
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
            // EMERGENCY VERIFICATION LOGIC: Users create 'PENDING', Admins create 'IN_PROGRESS'
            status: (this.role === 'Admin' ? 'IN_PROGRESS' : 'PENDING'),
            responderIds: [], startTime: new Date().toLocaleString(),
            geoLocation: this.userLocation
        };
        if(this.role === 'Admin') this.autoMatch(newInc);
        this.incs.push(newInc); this.save(); 
        if(this.role !== 'Admin') alert("🚨 Emergency report submitted. Waiting for Admin authorization.");
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
        let matches = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy && 
            v.location === inc.location && (v.skill === inc.skillReq || v.skill === "GEN"));
        matches.slice(0, inc.max).forEach(m => { m.isBusy = true; inc.responderIds.push(m.id); });
    },

    resolve(idx) {
        const inc = this.incs[idx];
        inc.status = 'RESOLVED'; inc.endTime = new Date().toLocaleString();
        inc.responderIds.forEach(id => { 
            const v = this.vols.find(vol => vol.id === id); 
            if(v) { v.isBusy = false; v.isNavigatingTo = null; }
        });
        this.save(); this.renderDashboard(); this.renderAdminDatabase();
    },

    renderDashboard() {
        const p = document.getElementById('list-progress'); 
        const r = document.getElementById('list-resolved');
        const searchInput = document.getElementById('aarSearch');
        const filter = searchInput ? searchInput.value.toLowerCase() : "";
        if(p) p.innerHTML = ''; if(r) r.innerHTML = '';

        this.incs.forEach((inc, idx) => {
            const staff = inc.responderIds.map(id => this.vols.find(v => v.id === id)?.name).join(', ');
            let incCoords = inc.geoLocation || this.getTownshipCoords(inc.location);

            // Dashboard only shows AUTHORIZED/IN_PROGRESS incidents to field users
            if(inc.status === 'IN_PROGRESS' && p) {
                let navBtn = (this.userLocation && this.role !== 'Admin') ? 
                    `<button onclick="Engine.navigateToIncident(${incCoords.lat}, ${incCoords.lng}, '${inc.id}')" style="background:#4285F4; color:white; border:none; padding:8px; border-radius:4px; margin-top:10px; cursor:pointer; width:100%; font-weight:bold;">🚗 START NAVIGATION</button>` : '';

                p.innerHTML += `<div class="emergency-card" style="border-left:5px solid #ef4444; background:#fff1f2; padding:15px; border-radius:8px; margin-bottom:10px; position:relative;">
                    <strong style="color:#b91c1c;">${inc.id}: ${inc.type}</strong><br>
                    <span style="font-size:13px;">${inc.address}</span><br>
                    <small style="color:#475569;">Staffed: ${staff || 'Searching Personnel...'}</small>
                    ${navBtn}
                </div>`;
            } else if(inc.status === 'RESOLVED' && r && inc.location.toLowerCase().includes(filter)) {
                r.innerHTML += `<div class="aar-card" style="border-left:5px solid #64748b; background:#f1f5f9; padding:12px; border-radius:8px; margin-bottom:10px; font-size:13px;">
                    <strong>ARCHIVE: ${inc.id}</strong><br>${inc.type} - ${inc.location}<br>
                    <small style="color:#64748b;">Closed: ${inc.endTime}</small>
                </div>`;
            }
        });
    },

    renderVols() {
        const l = document.getElementById('vList');
        if(!l) return;
        l.innerHTML = this.vols.map((v) => `
            <div class="emergency-card" style="background:white; border:1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:10px;">
                <strong style="color:#1e40af;">${v.name}</strong> [${v.skill}]<br>
                <span style="font-size:13px;">Region: ${v.location}</span><br>
                ${v.isNavigatingTo ? `<small style="color:#ea580c; font-weight:bold;">→ Deployed to ${v.isNavigatingTo}</small>` : 
                v.isVerified ? '<small style="color:#059669;">✓ Official Unit</small>' : '<small style="color:#64748b;">Pending Verification</small>'}
            </div>
        `).join('');
    },

    verifyV(idx) { 
        this.vols[idx].isVerified = true; 
        this.save(); this.renderAdminDatabase(); this.renderVols(); this.updateStats(); 
    },
    
    updateStats() {
        const vStat = document.getElementById('statVols');
        const iStat = document.getElementById('statIncidents');
        if(vStat) vStat.innerText = this.vols.filter(v => v.isVerified).length;
        if(iStat) iStat.innerText = this.incs.filter(i => i.status === 'IN_PROGRESS').length;
        
        const statusText = document.getElementById('currentStatusText');
        if (statusText && this.vols.length > 0) {
            const user = this.vols[this.vols.length - 1];
            let status = user.isOnDuty ? "ACTIVE" : "STANDBY";
            if (user.isBusy) status = "DEPLOYED";
            if (user.isNavigatingTo) status = "IN TRANSIT";
            statusText.innerText = status;
        }
    },

    save() {
        localStorage.setItem('cpt_vols', JSON.stringify(this.vols));
        localStorage.setItem('cpt_incs', JSON.stringify(this.incs));
        localStorage.setItem('cpt_msgs', JSON.stringify(this.msgs));
    }
};

Engine.showSection('home');
