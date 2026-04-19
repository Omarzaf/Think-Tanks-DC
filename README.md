# Think-Tanks-DC: Macro-Analysis Dashboard

This project provides a systems-level macro analysis of the epistemic community in Washington, D.C. It utilizes D3.js and React to visualize complex relationships concerning funding sources, personnel networks, and ideological trends across 75 think tanks.

## Data Schema
The analysis relies on structured datasets mapped in `src/data/types.ts`:
* `ThinkTank`: Core entity tracking ideological leaning, personnel, transparency scores, and funding categorizations (e.g., Pentagon, Foreign Gov, Dark Money).
* `Transaction`: Records discrete financial flows linking donors to think tanks.
* `RevolvingDoorEntry`: Tracks individual transitions between government agencies, lobbying firms, and think tanks to map network centrality.

## Analytical Framework
The dashboard employs multiple visual frameworks to analyze systemic influence:
* **Foreign Government Flows (Chord):** Maps dependencies and major funding channels from sovereign entities.
* **Funding Concentration (Heatmap):** Assesses the distribution of disclosed versus undisclosed ("Dark Money") capital across the sector.
* **Revolving Door Network (Network Graph):** Analyzes shared personnel to reveal clusters of institutional influence and cross-pollination.
* **Money Flows (Sankey):** Traces the volume and pathways of financial support from broad donor types to specific institutions.
* **Ideology & Funding (Treemap/Timeline):** Correlates ideological alignment with establishment trends and total capital deployment.

For Methodolody (link)
https://docs.google.com/document/d/1kYJblAn-Q3YRhWEeDEOo69iDG5H4nCEhopisjMhg7eI/edit?usp=sharing

## Getting Started*
To run the Macro-Analysis Dashboard locally, follow these steps:

Prerequisites
Node.js (v18.0 or higher recommended)

npm or yarn

Installation
Clone the repository:

Bash
git clone https://github.com/Omarzaf/Think-Tanks-DC.git
cd Think-Tanks-DC
Install dependencies:

Bash
npm install
Development
Start the local development server:

Bash
npm run dev
The application will be available at http://localhost:5173.

Build and Deployment
To create a production-ready bundle:

Bash
npm run build
The output will be generated in the dist/ directory, ready for hosting.


## License
This project is licensed under the MIT License
