/* ═══════════════════════════════════════════════════════════════════
   viewer.js — Rupe Magna RTI Viewer shared logic
   Call initViewer(config) from each dataset's index.html.
   Requires OpenLIME (loaded dynamically via config.openlimeUrl).
═══════════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TILE & NORMAL-MAP DETECTION
   Probes for available tile files to determine the OpenLIME layout
   and checks whether a pre-computed normal map exists.
══════════════════════════════════════════════════════════════════ */

async function _autodetect() {
    let r = await fetch('plane_0.tzi');
    if (r.status === 200) return 'tarzoom';
    r = await fetch('plane_0.dzi');
    if (r.status === 200) return 'deepzoom';
    r = await fetch('planes.tzi');
    if (r.status === 200) return 'itarzoom';
    r = await fetch('plane_0.jpg');
    if (r.status === 200) return 'image';
    alert('RTI could not be detected here');
    return '';
}

async function _autodetectNormals(layout) {
    const checks = {
        tarzoom:  'normals.tzi',
        deepzoom: 'normals.dzi',
        image:    'normals.jpg'
    };
    if (checks[layout]) {
        const r = await fetch(checks[layout]);
        if (r.status === 200) return true;
    }
    return false;
}


/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — VIEWER INITIALISATION
   Creates all OpenLIME layers and the UI toolbar. Called once
   OpenLIME has finished loading.
══════════════════════════════════════════════════════════════════ */

async function _initLayers(config) {
    const layout  = await _autodetect();
    const normals = await _autodetectNormals(layout);

    /* ── Viewer instance */
    const lime = new OpenLIME.Viewer('#demo', { background: 'black' });

    /* ── Base RTI layer
       Renders the PTM/HSH reflectance model from info.json.
       Defaults to 'diffuse' mode once the layer is ready.          */
    const baseLayer = new OpenLIME.Layer({
        layout:  layout,
        type:    'rti',
        url:     config.rtiUrl,
        normals: normals,
        label:   config.rtiLabel
    });
    lime.canvas.addLayer('RTI', baseLayer);
    window._rtiBaseLayer = baseLayer;
    baseLayer.addEvent('ready', () => {
        baseLayer.setMode('diffuse');
        if (config.rotate) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const iw = (baseLayer.layout && baseLayer.layout.width  > 0
                        ? baseLayer.layout.width  : vw);
            const ih = (baseLayer.layout && baseLayer.layout.height > 0
                        ? baseLayer.layout.height : vh);
            const z  = (lime.camera.target && lime.camera.target.z) || 1;
            let adj  = 1;
            if (Math.abs(config.rotate % 180) === 90) {
                const scaleOrig = Math.min(vw / iw, vh / ih);
                const scaleNew  = Math.min(vw / ih, vh / iw);
                adj = scaleOrig > 0 ? scaleNew / scaleOrig : 1;
            }
            lime.camera.setPosition(0, 0, 0, z * adj, config.rotate);
        }
    });

    /* ── Vector overlay layer
       Optional PNG overlay (e.g. a vectorised tracing of the
       engraving). Hidden by default; toggled via the Vector
       button or the 'V' keyboard shortcut.                         */
    const vectorLayer = new OpenLIME.Layer({
        type:    'image',
        url:     config.vectorUrl,
        overlay: true,
        visible: false,
        label:   config.vectorLabel
    });
    lime.canvas.addLayer('vector', vectorLayer);
    window._vectorLayer = vectorLayer;

    /* ══════════════════════════════════════════════════════════════
       SECTION 3 — TOOLBAR & UI ACTIONS
       Configures which OpenLIME toolbar buttons are displayed
       and assigns keyboard shortcuts to each action.
    ══════════════════════════════════════════════════════════════ */
    OpenLIME.Skin.setUrl(config.skinUrl);
    const ui = new OpenLIME.UIBasic(lime, {
        skin:                config.skinUrl,
        showLightDirections: true
    });

    ui.actions.zoomin.display   = true;
    ui.actions.zoomout.display  = true;
    ui.actions.ruler.display    = true;
    ui.actions.ruler.key        = 'c';
    ui.actions.rotate.display   = true;
    ui.actions.snapshot.display = true;
    ui.actions.snapshot.key     = 's';
    ui.actions.light.active     = config.lightActive !== undefined ? config.lightActive : false;
    /* Layers button kept; side panel replaced by mode-bar toggle */
    ui.actions.layers.display   = true;
    ui.actions.layers.key       = 'z';
    ui.actions.layers.task      = () => { toggleModeBar(); };

    lime.camera.maxFixedZoom  = 1;
    window.lime = lime;

    /* Vector toggle — keyboard shortcut kept in sync with the
       mode-bar button via toggleVectorLayer()                       */
    ui.actions.vectortoggle = {
        title:   'Vector On/Off',
        key:     'v',
        display: false,
        task:    () => { toggleVectorLayer(); }
    };

    /* Help button opens the custom slide-up panel instead of OpenLIME's default dialog */
    ui.actions.help.display = true;
    ui.actions.help.task    = () => { toggleHelpPanel(); };

    _setupLightHighlight();
}


/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — LIGHT BUTTON HIGHLIGHT
   Watches the openlime-light-active class on #demo via
   MutationObserver and colours the light icon amber while active.
   Help button highlight is handled inside toggleHelpPanel().
══════════════════════════════════════════════════════════════════ */

function _setupLightHighlight() {
    const demo = document.getElementById('demo');
    const btn  = demo && demo.querySelector('.openlime-button.openlime-light');
    if (!btn) { setTimeout(_setupLightHighlight, 200); return; }
    const paths = btn.querySelectorAll('path[style]');
    new MutationObserver(() => {
        const active = demo.classList.contains('openlime-light-active');
        paths.forEach(p => {
            if (active) {
                p.style.setProperty('fill',   '#ffcc00', 'important');
                p.style.setProperty('stroke', '#ffcc00', 'important');
            } else {
                p.style.removeProperty('fill');
                p.style.removeProperty('stroke');
            }
        });
    }).observe(demo, { attributes: true, attributeFilter: ['class'] });
}


/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — PUBLIC API

   initViewer(config)   — entry point called by each dataset's index.html
   toggleModeBar()      — slides the rendering-mode bar in or out
   toggleHelpPanel()    — slides the help panel in or out
   setRTIMode(mode)     — switches RTI shading mode and updates button state
   toggleVectorLayer()  — toggles the vector overlay
══════════════════════════════════════════════════════════════════ */

function initViewer(config) {
    document.getElementById('skinCssLink').href = config.stylesheetUrl;

    /* Inject help panel — starts invisible via CSS opacity:0 */
    document.getElementById('demo').insertAdjacentHTML('afterbegin', `
        <div id="help-panel">
            <h5>Light Control</h5>
            <ul>
                <li>Press <strong>L</strong> or click the light icon to activate interactive lighting.</li>
                <li>Move the mouse to reposition the virtual light source.</li>
            </ul>
            <h5>Rendering Modes</h5>
            <p>Press <strong>Z</strong> or click the layers icon to open the mode bar:</p>
            <ul>
                <li><strong>Light</strong> — Standard RTI with interactive lighting</li>
                <li><strong>Normals</strong> — Surface normal map</li>
                <li><strong>Diffuse</strong> — Diffuse reflectance (default)</li>
                <li><strong>Specular</strong> — Specular reflectance</li>
                <li><strong>Gray Diffuse</strong> — Greyscale diffuse</li>
                <li><strong>Vector</strong> — Toggle vector overlay (also <strong>V</strong>)</li>
            </ul>
            <h5>Ruler</h5>
            <ul>
                <li>Press <strong>C</strong> or click the ruler icon to activate.</li>
                <li>Click two points on the image to measure the distance between them.</li>
            </ul>
            <h5>Keyboard Shortcuts</h5>
            <ul>
                <li><strong>L</strong> — Light control</li>
                <li><strong>Z</strong> — Toggle mode bar</li>
                <li><strong>V</strong> — Toggle vector overlay</li>
                <li><strong>C</strong> — Toggle ruler</li>
                <li><strong>A</strong> — Rotate view</li>
                <li><strong>S</strong> — Save snapshot</li>
                <li><strong>+ / −</strong> — Zoom in / out</li>
                <li><strong>Home</strong> — Reset view</li>
            </ul>
        </div>
    `);

    /* Inject mode-bar — starts invisible via CSS opacity:0 */
    document.getElementById('demo').insertAdjacentHTML('afterbegin', `
        <div id="mode-bar">
            <button id="btn-light"        onclick="setRTIMode('light')">Light</button>
            <button id="btn-normals"      onclick="setRTIMode('normals')">Normals</button>
            <button id="btn-diffuse"      onclick="setRTIMode('diffuse')" class="active">Diffuse</button>
            <button id="btn-specular"     onclick="setRTIMode('specular')">Specular</button>
            <button id="btn-gray_diffuse" onclick="setRTIMode('gray_diffuse')">Gray Diffuse</button>
            <button id="btn-vector"       onclick="toggleVectorLayer()">Vector Off</button>
        </div>
    `);

    /* Intercept wheel events: control zoom speed directly via camera API */
    document.getElementById('demo').addEventListener('wheel', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (!window.lime) return;
        const cam = window.lime.camera;
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 30;   // line → pixels
        if (e.deltaMode === 2) delta *= 300;  // page → pixels
        const z = (cam.target.z || 1) * Math.pow(2, -delta * 0.0003);
        cam.setPosition(50, cam.target.x || 0, cam.target.y || 0,
                        Math.max(0.05, z), cam.target.a || 0);
    }, { capture: true, passive: false });

    const script = document.createElement('script');
    script.src   = config.openlimeUrl;
    document.head.appendChild(script);
    script.onload = () => _initLayers(config);
}

function toggleHelpPanel() {
    const panel  = document.getElementById('help-panel');
    const isOpen = panel.classList.toggle('open');
    const btn    = document.querySelector('.openlime-button.openlime-help');
    if (btn) {
        btn.querySelectorAll('path').forEach(p => {
            if (isOpen) {
                p.style.setProperty('fill',   '#ffcc00', 'important');
                p.style.setProperty('stroke', '#ffcc00', 'important');
            } else {
                p.style.removeProperty('fill');
                p.style.removeProperty('stroke');
            }
        });
    }
}

function toggleModeBar() {
    const isOpen = document.getElementById('mode-bar').classList.toggle('open');
    const btn = document.querySelector('.openlime-button.openlime-layers');
    if (btn) {
        btn.querySelectorAll('path').forEach(p => {
            if (isOpen) {
                p.style.setProperty('fill',   '#ffcc00', 'important');
                p.style.setProperty('stroke', '#ffcc00', 'important');
            } else {
                p.style.removeProperty('fill');
                p.style.removeProperty('stroke');
            }
        });
    }
}

function setRTIMode(mode) {
    if (window._rtiBaseLayer) {
        window._rtiBaseLayer.setMode(mode);
    }
    document.querySelectorAll('#mode-bar button:not(#btn-vector)')
            .forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + mode);
    if (btn) btn.classList.add('active');
}

function toggleVectorLayer() {
    if (window._vectorLayer) {
        const isVisible = window._vectorLayer.visible;
        window._vectorLayer.setVisible(!isVisible);
        const btn = document.getElementById('btn-vector');
        if (btn) {
            btn.classList.toggle('active', !isVisible);
            btn.textContent = isVisible ? 'Vector Off' : 'Vector On';
        }
    }
}
