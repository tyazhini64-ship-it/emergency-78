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

    // --- AUTHORITY VERIFICATION SUITE ---

    /**
     * Manually approves a volunteer. 
     * Adds an audit timestamp and the name of the role that approved them.
     */
    verifyV(idx) { 
        const target = this.vols[idx];
        if(!target) return;

        const confirmAuth = confirm(`MANUAL OVERRIDE: Do you authorize "${target.name}" to be a Verified Emergency Responder?`);
        if (confirmAuth) {
            target.isVerified = true;
            target.authTimestamp = new Date().toLocaleString();
            target.verifiedBy = "DISTRICT_OFFICER_HQ";
            
            this.save();
            this.renderAdminDatabase();
            this.updateStats();
            alert(`SUCCESS: ${target.name} has been moved to the Verified Registry.`);
        }
    },

    /**
     * Rejects a volunteer application or revokes existing verification.
     */
    rejectV(idx) {
        const target = this.vols[idx];
        const reason = target.isVerified ? "REVOKE ACCESS" : "REJECT APPLICATION";
        
        if(confirm(`WARNING: Are you sure you want to ${reason} for ${target.name}?`)) {
            this.vols.splice(idx, 1);
            this.save();
            this.renderAdminDatabase();
            this.updateStats();
        }
    },

    // --- CORE SYSTEM METHODS ---

    checkData() {
        console.table(this.vols);
        console.table(this.incs);
        alert(`System Audit: ${this.vols.length} Registered Personnel, ${this.incs.length} Total Incident Logs.`);
    },

    sendAdminMessage() {
        const msgInput = document.getElementById('adminMsgInput');
        if (!msgInput || !msgInput.value) return alert("Error: Message payload cannot be empty.");
        
        const newMsg = { 
            id: Date.now(), 
            sender: "DISTRICT HQ", 
            text: msgInput.value, 
            timestamp: new Date().toLocaleTimeString(), 
            date: new Date().toLocaleDateString() 
        };
        
        this.msgs.push(newMsg);
        this.save();
        msgInput.value = '';
        this.renderAdminDatabase();
    },

    renderMessages() {
        const msgContainer = document.getElementById('volunteerMsgDisplay');
        if (!msgContainer || this.role === 'Admin') return;
        
        msgContainer.innerHTML = this.msgs.slice(-3).reverse().map(m => `
            <div style="background:#fff3cd; border-left:5px solid #ffc107; padding:12px; margin:8px 0; border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 11px; color: #856404; margin-bottom: 4px;">${m.date} | ${m.timestamp}</div>
                <strong>⚠️ ${m.sender}:</strong> ${m.text}
            </div>
        `).join('');
    },

    exportToCSV(type) {
        let data = type === 'vols' ? this.vols : this.incs;
        if (data.length === 0) return alert("Database is empty. Nothing to export.");
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','), 
            ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
        ].join('\n');
        
        const link = document.createElement("a");
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.target = '_blank';
        link.download = `AUTHORITY_EXPORT_${type.toUpperCase()}_${Date.now()}.csv`;
        link.click();
    },

    // --- ENHANCED ADMIN INTERFACE ---

    renderAdminDatabase() {
        const dbContainer = document.getElementById('adminDatabaseView');
        if (!dbContainer) return; 
        
        if (this.role !== 'Admin') {
            dbContainer.classList.add('hidden');
            return;
        }
        dbContainer.classList.remove('hidden');

        dbContainer.innerHTML = `
            <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:2px solid #1e40af;">
                <h2 style="margin-top:0; color:#1e40af; display:flex; align-items:center; gap:10px;">
                    🛡️ AUTHORITY COMMAND CONSOLE
                </h2>
                
                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #cbd5e1; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h3 style="margin-top:0;">📢 Mass Broadcast System</h3>
                    <p style="font-size:12px; color:#64748b;">Send priority updates to all active volunteers on duty.</p>
                    <textarea id="adminMsgInput" placeholder="Enter tactical update..." style="width:100%; height:60px; padding:10px; border-radius:5px; border:1px solid #ddd; margin-bottom:10px;"></textarea>
                    <button onclick="Engine.sendAdminMessage()" style="width:100%; background:#1e40af; color:white; padding:10px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Broadcast Message</button>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #cbd5e1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0;">📋 Personnel Registry & Verification</h3>
                        <button onclick="Engine.exportToCSV('vols')" style="background:#059669; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">Download CSV</button>
                    </div>
                    
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; min-width:500px;">
                            <thead>
                                <tr style="background:#e2e8f0; text-align:left; font-size:12px;">
                                    <th style="padding:12px; border:1px solid #cbd5e1;">Personnel Name</th>
                                    <th style="padding:12px; border:1px solid #cbd5e1;">Expertise</th>
                                    <th style="padding:12px; border:1px solid #cbd5e1;">Status</th>
                                    <th style="padding:12px; border:1px solid #cbd5e1;">Authority Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.vols.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No personnel records found.</td></tr>' : 
                                this.vols.map((v, i) => `
                                    <tr style="border-bottom:1px solid #f1f5f9; font-size:13px; background:${v.isVerified ? '#fff' : '#fff7ed'};">
                                        <td style="padding:12px; border:1px solid #e2e8f0;">
                                            <strong>${v.name}</strong><br>
                                            <span style="font-size:10px; color:#94a3b8;">ID: ${v.id}</span>
                                        </td>
                                        <td style="padding:12px; border:1px solid #e2e8f0;">${v.skill}</td>
                                        <td style="padding:12px; border:1px solid #e2e8f0;">
                                            ${v.isVerified ? 
                                                '<span style="color:#16a34a; font-weight:600;">✅ VERIFIED</span>' : 
                                                '<span style="color:#ea580c; font-weight:600;">⏳ PENDING</span>'}
                                        </td>
                                        <td style="padding:12px; border:1px solid #e2e8f0; display:flex; gap:5px;">
                                            ${!v.isVerified ? 
                                                `<button onclick="Engine.verifyV(${i})" style="background:#2563eb; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Approve</button>` : 
                                                `<span style="font-size:10px; color:#64748b;">Auth: ${v.authTimestamp}</span>`
                                            }
                                            <button onclick="Engine.rejectV(${i})" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0;">🚨 Emergency Authorization Queue</h3>
                        <button onclick="Engine.exportToCSV('incs')" style="background:#059669; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer;">Export Incidents</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse;">
                        <tr style="background:#fee2e2; text-align:left; font-size:12px;">
                            <th style="padding:12px; border:1px solid #fca5a5;">Type</th>
                            <th style="padding:12px; border:1px solid #fca5a5;">Location</th>
                            <th style="padding:12px; border:1px solid #fca5a5;">Status</th>
                            <th style="padding:12px; border:1px solid #fca5a5;">Action</th>
                        </tr>
                        ${this.incs.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:20px;">No incidents reported in the queue.</td></tr>' : 
                        this.incs.map((inc, i) => `
                            <tr style="border-bottom:1px solid #f1f5f9; font-size:13px;">
                                <td style="padding:12px; border:1px solid #f1f5f9;"><strong>${inc.type}</strong></td>
                                <td style="padding:12px; border:1px solid #f1f5f9;">${inc.location}</td>
                                <td style="padding:12px; border:1px solid #f1f5f9;">
                                    <span style="padding:3px 6px; border-radius:4px; font-size:11px; background:${inc.status === 'PENDING' ? '#ffedd5' : '#dcfce7'}; color:${inc.status === 'PENDING' ? '#9a3412' : '#166534'};">
                                        ${inc.status}
                                    </span>
                                </td>
                                <td style="padding:12px; border:1px solid #f1f5f9;">
                                    ${inc.status === 'PENDING' ? 
                                        `<button onclick="Engine.authorizeInc(${i})" style="background:#059669; color:white; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer;">AUTHORIZE LIVE</button>` : 
                                        inc.status === 'IN_PROGRESS' ? 
                                        `<button onclick="Engine.resolve(${i})" style="background:#1e40af; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Mark Resolved</button>` : 
                                        '✅ Archived'}
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
        if (sel === 'Admin' && adminKeyInput.value !== this.ADMIN_KEY) {
            return alert("CRITICAL: Unauthorized Admin Access Attempted.");
        }
        
        this.role = sel;
        document.getElementById('loginOverlay').classList.add('hidden');
        
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
            info.innerHTML = `📍 GPS Active: Latitude ${this.userLocation.lat.toFixed(6)}`;
            info.style.marginTop = "10px";
            info.style.fontSize = "12px";
            info.style.color = "#1e40af";
        }
    },

    showSection(id) {
        document.querySelectorAll('.content-container').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id + 'Section');
        if(target) target.classList.remove('hidden');
        
        if (id === 'home') { 
            this.renderHeatmap(); 
            this.renderMessages(); 
        }
        if (id === 'dashboard') { 
            this.renderDashboard(); 
            this.renderAdminDatabase(); 
        }
        this.updateStats();
    },

    registerVolunteer() {
        const name = document.getElementById('volName').value;
        const skill = document.getElementById('volSkill').value;
        const location = document.getElementById('volLocation').value;

        if(!name || !skill) return alert("Error: Official Full Name and Expertise are required for verification.");
        
        const v = { 
            id: 'V-' + Date.now().toString().slice(-4), 
            name: name, 
            skill: skill, 
            location: location, 
            isVerified: false, 
            isOnDuty: false, 
            isBusy: false,
            authTimestamp: null,
            verifiedBy: null
        };
        
        this.vols.push(v); 
        this.save(); 
        alert("APPLICATION SUBMITTED: District HQ must manually verify your credentials before access is granted."); 
        this.showSection('home');
    },

    toggleDuty() {
        const user = this.vols[this.vols.length - 1]; 
        if (!user) return alert("System Error: No registered personnel found for this session.");
        
        // --- AUTHORITY GATE ---
        if (!user.isVerified) {
            return alert("❌ ACCESS DENIED: Your account is currently in the Authority Verification Queue.");
        }
        
        user.isOnDuty = !user.isOnDuty;
        this.save(); 
        this.updateStats(); 
        this.renderHeatmap();
        alert(user.isOnDuty ? "STATUS UPDATED: You are now ON DUTY and visible to dispatch." : "STATUS UPDATED: You are now OFF DUTY.");
    },

    createIncident() {
        const type = document.getElementById('taskType').value;
        const loc = document.getElementById('taskLocation').value;
        const addr = document.getElementById('taskAddress').value;

        const newInc = {
            id: 'CPT-' + Math.floor(Math.random()*9000),
            type: type,
            location: loc,
            address: addr,
            status: (this.role === 'Admin' ? 'IN_PROGRESS' : 'PENDING'),
            responderIds: [],
            geoLocation: this.userLocation,
            createdAt: new Date().toLocaleString()
        };
        
        this.incs.push(newInc); 
        this.save(); 
        
        if(this.role === 'Admin') {
            alert("BROADCAST SUCCESS: Incident is now live for all responders.");
        } else {
            alert("REPORT FILED: Authorities have been notified and must authorize this emergency.");
        }
        this.showSection('dashboard');
    },

    authorizeInc(idx) {
        const inc = this.incs[idx];
        inc.status = 'IN_PROGRESS';
        
        // Auto-match Verified & Available Units
        const availableUnits = this.vols.filter(v => v.isVerified && v.isOnDuty && !v.isBusy);
        availableUnits.slice(0, 3).forEach(unit => { 
            unit.isBusy = true; 
            inc.responderIds.push(unit.id); 
        });
        
        this.save();
        this.renderAdminDatabase();
        this.renderDashboard();
        alert(`AUTHORIZATION COMPLETE: ${inc.responderIds.length} units dispatched.`);
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
        
        const activeIncs = this.incs.filter(i => i.status === 'IN_PROGRESS');
        
        p.innerHTML = activeIncs.map(inc => `
            <div style="background:#fff1f2; border-left:5px solid #ef4444; padding:15px; margin-bottom:12px; border-radius:8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between;">
                    <strong style="color:#991b1b; font-size:16px;">${inc.type}</strong>
                    <span style="font-size:11px; background:#fecaca; padding:2px 8px; border-radius:10px; color:#991b1b; font-weight:bold;">LIVE</span>
                </div>
                <div style="margin-top:5px; color:#4b5563;">📍 ${inc.location}</div>
                <small style="color:#6b7280; display:block; margin-top:5px; border-top:1px solid #fee2e2; padding-top:5px;">
                    ${inc.address}
                </small>
            </div>
        `).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No active authorized emergencies at this time.</div>';
    },

    renderHeatmap() {
        const area = document.getElementById('heatmapArea');
        if(!area) return;
        const activeCount = this.vols.filter(v => v.isOnDuty && v.isVerified).length;
        area.innerHTML = `
            <div style="padding:15px; background:#dcfce7; color:#166534; border-radius:8px; border:1px solid #86efac; text-align:center;">
                <strong>Tactical Strength:</strong> ${activeCount} Verified & Active Units
            </div>
        `;
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
