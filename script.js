function toggleKey(val) { document.getElementById('adminKeyContainer').classList.toggle('hidden', val !== 'Admin'); }

window.Engine = {
    role: "User",
    ADMIN_KEY: "1234",
    vols: JSON.parse(localStorage.getItem('cpt_vols')) || [],
    incs: JSON.parse(localStorage.getItem('cpt_incs')) || [],

    login() {
        const sel = document.getElementById('userRole').value;
        if (sel === 'Admin' && document.getElementById('adminKey').value !== this.ADMIN_KEY) return alert("Unauthorized");
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
            } else { status.innerText = "USGS: No tremors detected in the last hour."; }
        } catch(e) { status.innerText = "USGS Server Offline."; }
    },

    async fetchPurpleAir() {
        const status = document.getElementById('apiStatus');
        const mockAQI = Math.floor(Math.random() * 200);
        if(mockAQI > 110) {
            this.autoDispatch("AIR QUALITY ALERT", `Unhealthy AQI (${mockAQI}) in Chengalpattu District.`, "MED");
        } else { status.innerText = `District AQI is Stable (${mockAQI})`; }
    },

    autoDispatch(type, desc, skill) {
        const alertBox = document.getElementById('apiAlert');
        alertBox.innerHTML = `🚨 DISTRICT ALERT: ${type}. Auto-assigning nearest ${skill} responders.`;
        alertBox.classList.remove('hidden');
        
        const autoInc = {
            id: 'CPT-INT
