# Rupe Magna Viewer

A web-based interactive RTI viewer for rock art figures at the Rupe Magna petroglyph site (Grosio, Lombardy, Italy). Built on [RelightLab](https://github.com/cnr-isti-vclab/relight) and [OpenLIME](https://github.com/cnr-isti-vclab/openlime).

**Live:** [e-huseyin.github.io/rupemagnaviewer](https://e-huseyin.github.io/rupemagnaviewer)

---

## Overview

This viewer presents eleven RTI datasets acquired during a fieldwork campaign carried out from 4 to 8 September 2025 at the [Parco delle Incisioni Rupestri di Grosio-Grosotto](https://www.parcoincisionigrosio.it), with official authorisation from Stefano Rossi, Archaeologist Officer at the Ministry of Culture, and with the operational support of Federico Zoni, Director of the Park.

Each dataset was produced using a custom-built portable RTI dome (Ø 460 mm, 48 LEDs, 6 elevation rings) and a Fujifilm X-S20 camera. RTI models were generated using [RTI-FLOW](https://github.com/e-huseyin/RTI-FLOW) and RelightLab. Semantic documentation was produced using [semRTI](https://github.com/e-huseyin/semRTI).

---

## Figures

| ID | Sector | Figure |
|----|--------|--------|
| F01 | AA | The Praying Figure with Spiral |
| F02 | B | The Praying Woman Figure |
| F03 | F | The Spiral Figure |
| F04 | L | The Warrior Figure with Shield |
| F05 | L | The Second Warrior Figure |
| F06 | L | The Wild Boar Figure |
| F07 | Q | The Goat Figure with a Beard |
| F08 | Q | The Second Goat Figure |
| F09 | Q | The Map-like Figure |
| F10 | S | The Knight Figure |
| F11 | S | The Figure with a Square |

---

## Structure

```
rupemagnaviewer/
├── index.html
├── assets/
│   ├── openlime.min.js
│   ├── skin.css
│   └── skin.svg
└── datasets/
    └── F##/
        ├── F##.png
        └── RTI-##/
            └── ptm/
                ├── index.html
                ├── info.json
                └── plane_*.dzi / plane_*.tzi
```

---

## Usage

Serve from any static HTTP server. No build step required.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Opening `index.html` directly via `file://` will not work due to browser CORS restrictions on iframe loading.

---

## Viewer Features

- Interactive RTI re-lighting
- Diffuse, Specular, and Normals rendering modes (opens in Diffuse by default)
- Interactive lens (magnifier) with normal map overlay
- Ruler tool for on-screen measurement
- Snapshot export
- Per-figure archaeological description and acquisition parameters
- Mobile-responsive layout

---

## Related Projects

| Project | Description |
|---------|-------------|
| [RTI-FLOW](https://github.com/e-huseyin/RTI-FLOW) | Automated RTI processing pipeline: RAW → PTM/HSH via darktable-cli and relight-cli |
| [semRTI](https://github.com/e-huseyin/semRTI) | Semantic RTI Knowledge Graph: FAIR-compliant RDF/Turtle documentation aligned to the CHS-ODP and ArCo ontologies |

---

## Data

All datasets are published as FAIR-compliant open resources in accordance with the London Charter and the European Collaborative Cloud for Cultural Heritage (ECCCH) framework.

**Licence:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

---

**Author:** Hüseyin Erdoğan · [ORCID 0000-0002-2965-0918](https://orcid.org/0000-0002-2965-0918)  
**Affiliation:** Alma Mater Studiorum – Università di Bologna  
**Version:** 1.0 · 2026-05
