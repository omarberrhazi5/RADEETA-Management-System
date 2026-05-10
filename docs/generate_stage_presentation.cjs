const path = require('path');
const pptxgen = require('./.pptx-builder/node_modules/pptxgenjs');

const OUTPUT = path.resolve(__dirname, 'Rapport_Stage_RADEETA_Management_System.pptx');

const COLORS = {
  navy: '0F172A',
  blue: '2563EB',
  blueSoft: 'DBEAFE',
  cyan: '0891B2',
  cyanSoft: 'CFFAFE',
  amber: 'D97706',
  amberSoft: 'FEF3C7',
  emerald: '059669',
  emeraldSoft: 'D1FAE5',
  red: 'DC2626',
  redSoft: 'FEE2E2',
  bg: 'F8FAFC',
  card: 'FFFFFF',
  line: 'CBD5E1',
  text: '0F172A',
  muted: '64748B',
  codeBg: '111827',
  codeText: 'E2E8F0',
};

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'OpenAI';
pptx.subject = 'Rapport de stage professionnel genere a partir du code source du projet RADEETA Management System';
pptx.title = 'Rapport de stage - RADEETA Management System';
pptx.lang = 'fr-FR';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
};

const ASSETS = {
  useCase: path.resolve(__dirname, 'uml-assets', 'use-case-diagram.svg'),
  mcd: path.resolve(__dirname, 'uml-assets', 'mcd.svg'),
};

const META = {
  analysisDate: '10 mai 2026',
  apiRoutes: 53,
  backendTests: 15,
  roles: 6,
  mainTables: 11,
};

const deck = [];

function note(text) {
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

function addFooter(slide, index, total, dark = false) {
  const color = dark ? 'E2E8F0' : COLORS.muted;
  slide.addText(`Analyse du code source - ${META.analysisDate}`, {
    x: 0.6,
    y: 7.05,
    w: 4.8,
    h: 0.2,
    fontSize: 8.5,
    color,
    margin: 0,
  });
  slide.addText(`${index}/${total}`, {
    x: 12.1,
    y: 7.02,
    w: 0.6,
    h: 0.2,
    align: 'right',
    fontSize: 9,
    bold: true,
    color,
    margin: 0,
  });
}

function addTitle(slide, { section, title, subtitle, index, total, dark = false }) {
  slide.background = { color: dark ? COLORS.navy : COLORS.bg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.12,
    line: { color: dark ? COLORS.amber : COLORS.blue, transparency: 100 },
    fill: { color: dark ? COLORS.amber : COLORS.blue },
  });

  const titleColor = dark ? 'FFFFFF' : COLORS.text;
  const subtitleColor = dark ? 'D7E3F4' : COLORS.muted;
  const pillFill = dark ? '1E293B' : COLORS.blueSoft;
  const pillColor = dark ? 'FFFFFF' : COLORS.blue;

  if (section) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.65,
      y: 0.34,
      w: 2.05,
      h: 0.34,
      rectRadius: 0.08,
      line: { color: pillFill, transparency: 100 },
      fill: { color: pillFill },
    });
    slide.addText(section.toUpperCase(), {
      x: 10.82,
      y: 0.41,
      w: 1.7,
      h: 0.18,
      fontSize: 8.5,
      bold: true,
      color: pillColor,
      align: 'center',
      margin: 0,
    });
  }

  slide.addText(title, {
    x: 0.6,
    y: 0.36,
    w: 8.2,
    h: 0.45,
    fontSize: 24,
    bold: true,
    color: titleColor,
    margin: 0,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.62,
      y: 0.84,
      w: 8.6,
      h: 0.36,
      fontSize: 11.5,
      color: subtitleColor,
      margin: 0,
    });
  }

  addFooter(slide, index, total, dark);
}

function addCard(slide, { x, y, w, h, title, lines = [], accent = COLORS.blue, fill = COLORS.card, titleColor = COLORS.text, bodyColor = COLORS.muted }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: fill },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.18,
    y: y + 0.18,
    w: 0.08,
    h: h - 0.36,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.35,
    y: y + 0.18,
    w: w - 0.5,
    h: 0.24,
    fontSize: 13,
    bold: true,
    color: titleColor,
    margin: 0,
  });
  if (lines.length > 0) {
    slide.addText(lines.map((line) => `• ${line}`).join('\n'), {
      x: x + 0.35,
      y: y + 0.52,
      w: w - 0.45,
      h: h - 0.68,
      fontSize: 10.5,
      color: bodyColor,
      breakLine: false,
      margin: 0,
      valign: 'top',
    });
  }
}

function addStatCard(slide, { x, y, w, h, value, label, accent, dark = false }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    line: { color: dark ? '334155' : COLORS.line, pt: 1 },
    fill: { color: dark ? '111827' : 'FFFFFF', transparency: dark ? 8 : 0 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.18,
    y: y + 0.18,
    w: 0.1,
    h: h - 0.36,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(String(value), {
    x: x + 0.38,
    y: y + 0.16,
    w: w - 0.5,
    h: 0.34,
    fontSize: 20,
    bold: true,
    color: dark ? 'FFFFFF' : COLORS.text,
    margin: 0,
  });
  slide.addText(label, {
    x: x + 0.38,
    y: y + 0.56,
    w: w - 0.5,
    h: 0.42,
    fontSize: 9.5,
    color: dark ? 'D7E3F4' : COLORS.muted,
    margin: 0,
  });
}

function addTable(slide, rows, options) {
  slide.addTable(rows, {
    border: { color: COLORS.line, pt: 1 },
    color: COLORS.text,
    fill: COLORS.card,
    fontFace: 'Aptos',
    fontSize: 10.5,
    margin: 0.06,
    valign: 'mid',
    ...options,
  });
}

function addCodeBox(slide, { x, y, w, h, title, source, code }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: '1F2937', pt: 1 },
    fill: { color: COLORS.codeBg },
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.36,
    h: 0.22,
    fontSize: 11.5,
    bold: true,
    color: 'FFFFFF',
    margin: 0,
  });
  slide.addText(source, {
    x: x + 0.18,
    y: y + 0.36,
    w: w - 0.36,
    h: 0.18,
    fontSize: 8,
    italic: true,
    color: '93C5FD',
    margin: 0,
  });
  slide.addText(code.trim(), {
    x: x + 0.18,
    y: y + 0.62,
    w: w - 0.34,
    h: h - 0.76,
    fontFace: 'Consolas',
    fontSize: 8.2,
    color: COLORS.codeText,
    margin: 0,
    breakLine: false,
  });
}

function addPlaceholder(slide, { x, y, w, h, title, subtitle, accent = COLORS.blue }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: COLORS.line, pt: 1.2, dash: 'dash' },
    fill: { color: 'FFFFFF' },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.28,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.42,
    w: w - 0.36,
    h: 0.24,
    fontSize: 12.5,
    bold: true,
    color: COLORS.text,
    align: 'center',
    margin: 0,
  });
  slide.addText('Capture réelle à insérer', {
    x: x + 0.18,
    y: y + 0.96,
    w: w - 0.36,
    h: 0.22,
    fontSize: 10,
    italic: true,
    color: COLORS.muted,
    align: 'center',
    margin: 0,
  });
  slide.addText(subtitle, {
    x: x + 0.18,
    y: y + h - 0.7,
    w: w - 0.36,
    h: 0.42,
    fontSize: 9.5,
    color: COLORS.muted,
    align: 'center',
    margin: 0,
  });
}

function pushSlide(fn) {
  deck.push(fn);
}

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: '',
    title: 'Rapport de stage professionnel',
    subtitle: 'Presentation PowerPoint generee a partir du code source du projet',
    index,
    total,
    dark: true,
  });

  slide.addText('RADEETA Management System', {
    x: 0.6,
    y: 1.1,
    w: 6.3,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    margin: 0,
  });

  slide.addText('Plateforme web de gestion des reclamations clients, des compteurs, des interventions techniques et du reporting SRM-FM Taza.', {
    x: 0.62,
    y: 1.68,
    w: 5.6,
    h: 0.9,
    fontSize: 13,
    color: 'D7E3F4',
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.62,
    y: 2.75,
    w: 5.55,
    h: 2.4,
    rectRadius: 0.1,
    line: { color: '334155', pt: 1 },
    fill: { color: '111827', transparency: 10 },
  });

  slide.addText(
    [
      'Stagiaire : A completer',
      'Encadrant : A completer',
      'Etablissement / entreprise : A completer',
      'Organisme cible observe dans le code : SRM-FM Taza',
      'Annee de stage : 2025 - 2026',
    ].join('\n'),
    {
      x: 0.88,
      y: 3.02,
      w: 4.95,
      h: 1.75,
      fontSize: 12.5,
      color: 'FFFFFF',
      margin: 0,
    },
  );

  slide.addText('Les champs personnels peuvent etre completes manuellement dans PowerPoint avant la soutenance.', {
    x: 0.88,
    y: 4.64,
    w: 4.8,
    h: 0.28,
    fontSize: 9.5,
    italic: true,
    color: 'CBD5E1',
    margin: 0,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.15,
    y: 0.98,
    w: 5.48,
    h: 5.65,
    rectRadius: 0.12,
    line: { color: '334155', pt: 1 },
    fill: { color: '0B1220', transparency: 3 },
  });

  slide.addText('Indicateurs releves dans le code', {
    x: 7.48,
    y: 1.22,
    w: 3.6,
    h: 0.28,
    fontSize: 13,
    bold: true,
    color: 'FFFFFF',
    margin: 0,
  });

  addStatCard(slide, { x: 7.45, y: 1.72, w: 2.35, h: 1.1, value: META.roles, label: 'roles metier + 1 role technique', accent: COLORS.blue, dark: true });
  addStatCard(slide, { x: 9.96, y: 1.72, w: 2.35, h: 1.1, value: META.mainTables, label: 'tables principales analysees', accent: COLORS.amber, dark: true });
  addStatCard(slide, { x: 7.45, y: 2.98, w: 2.35, h: 1.1, value: META.apiRoutes, label: 'routes API Laravel', accent: COLORS.cyan, dark: true });
  addStatCard(slide, { x: 9.96, y: 2.98, w: 2.35, h: 1.1, value: META.backendTests, label: 'tests backend passes', accent: COLORS.emerald, dark: true });
  addStatCard(slide, { x: 7.45, y: 4.24, w: 2.35, h: 1.1, value: '2', label: 'formats d export: PDF / Excel', accent: COLORS.red, dark: true });
  addStatCard(slide, { x: 9.96, y: 4.24, w: 2.35, h: 1.1, value: '2', label: 'services: eau / electricite', accent: COLORS.blue, dark: true });

  slide.addText('Stack principale : React 19 + Vite 8 + Tailwind / Laravel 11 + Sanctum / MySQL / Leaflet / Recharts / DomPDF / Laravel Excel', {
    x: 7.48,
    y: 5.72,
    w: 4.9,
    h: 0.55,
    fontSize: 10.2,
    color: 'CBD5E1',
    margin: 0,
  });

  slide.addNotes(note(`
    Cette page de garde est construite a partir du projet reel.
    Les noms du stagiaire, de l encadrant et de l organisme d accueil n apparaissent pas dans le code.
    Ils doivent donc etre completes manuellement avant la soutenance.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Plan',
    title: 'Structure de la soutenance',
    subtitle: 'Une progression courte, claire et centree sur le code reel du projet.',
    index,
    total,
  });

  const items = [
    ['Contexte et objectifs', ['cadre du stage', 'problematique', 'finalite du projet'], COLORS.blue],
    ['Entreprise / besoin', ['organisme cible', 'activites metier', 'raison de la digitalisation'], COLORS.cyan],
    ['Cahier des charges', ['besoins fonctionnels', 'contraintes non fonctionnelles', 'acteurs'], COLORS.amber],
    ['Analyse et conception', ['cas d utilisation', 'MCD', 'tables et relations'], COLORS.emerald],
    ['Architecture et realisation', ['stack technique', 'securite', 'interfaces realisees'], COLORS.red],
    ['Bilan et perspectives', ['difficultes', 'competences', 'ameliorations futures'], COLORS.blue],
  ];

  let x = 0.7;
  let y = 1.55;
  items.forEach((item, idx) => {
    addCard(slide, { x, y, w: 3.95, h: 1.7, title: item[0], lines: item[1], accent: item[2] });
    if (idx % 2 === 1) {
      x = 0.7;
      y += 1.95;
    } else {
      x = 4.73;
    }
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.77,
    y: 1.55,
    w: 3.85,
    h: 5.65,
    rectRadius: 0.12,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: 'FFFFFF' },
  });
  slide.addText('Fil conducteur', {
    x: 9.02,
    y: 1.82,
    w: 2.8,
    h: 0.22,
    fontSize: 13,
    bold: true,
    color: COLORS.text,
    margin: 0,
  });
  slide.addText(
    [
      '1. Comprendre le besoin metier.',
      '2. Montrer comment le code y repond.',
      '3. Expliquer les choix techniques.',
      '4. Valoriser les ecrans et les cas d usage.',
      '5. Conclure sur les acquis et les suites possibles.',
    ].join('\n'),
    {
      x: 9.02,
      y: 2.18,
      w: 3.05,
      h: 2.25,
      fontSize: 11.5,
      color: COLORS.muted,
      margin: 0,
    },
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.02,
    y: 4.8,
    w: 2.95,
    h: 1.2,
    rectRadius: 0.1,
    line: { color: COLORS.blueSoft, pt: 1 },
    fill: { color: COLORS.blueSoft },
  });
  slide.addText('Objectif oral : rester synthétique sur les slides et garder les détails techniques dans les notes du presentateur.', {
    x: 9.22,
    y: 5.02,
    w: 2.55,
    h: 0.74,
    fontSize: 10.3,
    bold: true,
    color: COLORS.blue,
    margin: 0,
  });

  slide.addNotes(note(`
    Cette slide sert a annoncer une soutenance fluide et logique.
    Le jury voit d abord le besoin, ensuite la conception, puis la realisation et enfin le bilan.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Introduction',
    title: 'Introduction generale',
    subtitle: 'Le projet vise a centraliser le suivi des reclamations et des interventions techniques dans une application web securisee.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.75,
    y: 1.55,
    w: 2.9,
    h: 2.1,
    title: 'Contexte du stage',
    lines: [
      'Modernisation d un environnement metier oriente service public local.',
      'Besoin de disposer d un outil unique pour les operations techniques.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 3.88,
    y: 1.55,
    w: 2.9,
    h: 2.1,
    title: 'Presentation du projet',
    lines: [
      'Application web full stack : frontend React et API Laravel.',
      'Modules clients, compteurs, secteurs, pannes, reparations et interventions.',
    ],
    accent: COLORS.cyan,
  });
  addCard(slide, {
    x: 7.01,
    y: 1.55,
    w: 2.9,
    h: 2.1,
    title: 'Problematique',
    lines: [
      'Suivre les anomalies terrain, les affectations et les interventions sans dispersion.',
      'Garantir un acces differencie selon les roles utilisateurs.',
    ],
    accent: COLORS.amber,
  });
  addCard(slide, {
    x: 10.14,
    y: 1.55,
    w: 2.4,
    h: 2.1,
    title: 'Objectifs',
    lines: [
      'Centraliser.',
      'Securiser.',
      'Tracer.',
      'Reporter.',
    ],
    accent: COLORS.emerald,
  });

  addCard(slide, {
    x: 0.75,
    y: 4.05,
    w: 5.9,
    h: 2.3,
    title: 'Ce que le code confirme',
    lines: [
      'Tableaux de bord par role avec statistiques, graphiques et cartographie.',
      'API REST securisee par Sanctum, middleware role et scopes metier pour techniciens.',
      'Exports PDF / Excel, notifications en base et journal d activite.',
    ],
    accent: COLORS.blue,
  });

  addCard(slide, {
    x: 6.95,
    y: 4.05,
    w: 5.6,
    h: 2.3,
    title: 'Valeur ajoutee attendue',
    lines: [
      'Meilleure coordination entre direction, responsable, manager et techniciens.',
      'Vision consolidee des clients, compteurs, secteurs et anomalies.',
      'Base technique exploitable pour le pilotage et l amelioration continue.',
    ],
    accent: COLORS.red,
  });

  slide.addNotes(note(`
    Dans cette introduction, il faut rappeler que le rapport n est pas theorique.
    Chaque element presente ici a ete verifie dans les routes, les controllers, les modeles et le frontend.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Entreprise',
    title: 'Presentation de l entreprise / etablissement',
    subtitle: 'Le code ne donne pas le nom officiel du lieu de stage, mais il indique clairement le contexte metier cible.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.75,
    y: 1.6,
    w: 4.0,
    h: 2.0,
    title: 'Observation issue du code',
    lines: [
      'Agence cible recurrente : SRM-FM Taza.',
      'Branding frontend : SRM-FM, "Gestion des reclamations".',
      'Base locale configuree : radeeta_db.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 4.98,
    y: 1.6,
    w: 3.8,
    h: 2.0,
    title: 'Activites couvertes',
    lines: [
      'Gestion des clients et des compteurs.',
      'Gestion des secteurs et de la cartographie.',
      'Gestion des anomalies, reparations et interventions.',
    ],
    accent: COLORS.cyan,
  });
  addCard(slide, {
    x: 9.0,
    y: 1.6,
    w: 3.55,
    h: 2.0,
    title: 'Domaines de service',
    lines: [
      'Eau.',
      'Electricite.',
      'Suivi terrain et reporting.',
    ],
    accent: COLORS.amber,
  });

  addCard(slide, {
    x: 0.75,
    y: 4.0,
    w: 5.7,
    h: 2.25,
    title: 'Besoin ayant motive le projet',
    lines: [
      'Remplacer un suivi fragmenté par un systeme centralise.',
      'Associer les reclamations aux compteurs, aux secteurs et aux techniciens.',
      'Donner a chaque role un espace de travail adapte et securise.',
    ],
    accent: COLORS.emerald,
  });

  addCard(slide, {
    x: 6.75,
    y: 4.0,
    w: 5.8,
    h: 2.25,
    title: 'Point de vigilance pour le rapport oral',
    lines: [
      'Le nom exact de l entreprise d accueil doit etre complete manuellement.',
      'Le texte de cette slide doit etre personnalise selon votre lieu de stage reel.',
      'Le reste du contenu s appuie deja sur le code reel du projet.',
    ],
    accent: COLORS.red,
    fill: COLORS.redSoft,
    bodyColor: '7F1D1D',
  });

  slide.addNotes(note(`
    Cette slide doit etre adaptee avec les informations administratives reelles du stage.
    En revanche, le contexte fonctionnel observe dans le code est deja exploitable pour la soutenance.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Cahier des charges',
    title: 'Cahier des charges fonctionnel et non fonctionnel',
    subtitle: 'Le perimetre ci dessous est deduit des pages React, des routes API et des migrations.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.75,
    y: 1.55,
    w: 6.0,
    h: 2.25,
    title: 'Besoins fonctionnels',
    lines: [
      'Authentification et gestion de session par token.',
      'CRUD utilisateurs, clients, compteurs, secteurs, pannes, reparations et interventions.',
      'Saisie de releves, notifications, tableaux de bord et exports de rapports.',
    ],
    accent: COLORS.blue,
  });

  addCard(slide, {
    x: 6.95,
    y: 1.55,
    w: 5.6,
    h: 2.25,
    title: 'Besoins non fonctionnels',
    lines: [
      'Securite RBAC cote frontend et backend.',
      'Traçabilite via activity logs et tests API.',
      'Interface web reactive, paginee et exploitable sur plusieurs modules.',
    ],
    accent: COLORS.cyan,
  });

  addCard(slide, {
    x: 0.75,
    y: 4.15,
    w: 4.0,
    h: 2.1,
    title: 'Acteurs du systeme',
    lines: [
      'Directeur',
      'Responsable',
      'Manager',
      'Technicien',
      'Lecteur',
    ],
    accent: COLORS.amber,
  });

  addCard(slide, {
    x: 4.98,
    y: 4.15,
    w: 7.57,
    h: 2.1,
    title: 'Fonctionnalites principales',
    lines: [
      'Dashboards par role avec statistiques, graphiques et carte des secteurs.',
      'Affectation des pannes, suivi des reparations et creation des interventions.',
      'Exports PDF des pannes du mois et Excel clients + compteurs.',
    ],
    accent: COLORS.emerald,
  });

  slide.addNotes(note(`
    L idee ici est de montrer que le cahier des charges n est pas invente.
    Il est reconstruit a partir des ecrans, des controllers et des ressources exposees par l API.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Acteurs',
    title: 'Acteurs et droits d acces',
    subtitle: 'Les autorisations sont visibles dans frontend/src/utils/rbac.js, frontend/src/App.jsx et backend/routes/api.php.',
    index,
    total,
  });

  const rows = [
    [
      { text: 'Acteur', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.navy }, align: 'center' } },
      { text: 'Responsabilites confirmees dans le code', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.navy }, align: 'center' } },
    ],
    [
      { text: 'Directeur', options: { fill: { color: COLORS.blueSoft } } },
      { text: 'Administration, utilisateurs, parametres, logs, purge des tokens, acces global API.', options: { fill: { color: 'FFFFFF' } } },
    ],
    [
      { text: 'Responsable', options: { fill: { color: COLORS.cyanSoft } } },
      { text: 'Dashboard complet, gestion metier et suppression de plusieurs ressources, rapports.', options: { fill: { color: 'FFFFFF' } } },
    ],
    [
      { text: 'Manager', options: { fill: { color: COLORS.amberSoft } } },
      { text: 'Supervision operationnelle, compteurs, pannes, reparations, interventions, releves, rapports.', options: { fill: { color: 'FFFFFF' } } },
    ],
    [
      { text: 'Technicien', options: { fill: { color: COLORS.emeraldSoft } } },
      { text: 'Travail terrain scope : pannes affectees, reparations, interventions et releves lies aux taches.', options: { fill: { color: 'FFFFFF' } } },
    ],
    [
      { text: 'Lecteur', options: { fill: { color: 'F1F5F9' } } },
      { text: 'Lecture seule sur les donnees metier et les notifications. Les exports restent limites cote API.', options: { fill: { color: 'FFFFFF' } } },
    ],
  ];

  addTable(slide, rows, {
    x: 0.78,
    y: 1.6,
    w: 11.8,
    colW: [2.05, 9.75],
    rowH: 0.56,
    fontSize: 10.7,
  });

  addCard(slide, {
    x: 0.78,
    y: 5.45,
    w: 5.7,
    h: 1.15,
    title: 'Double securite',
    lines: [
      'Le frontend masque les actions non autorisees.',
      'Le backend refuse les routes interdites via middleware, policy et scopes metier.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.8,
    y: 5.45,
    w: 5.78,
    h: 1.15,
    title: 'Role technique',
    lines: [
      'Le role developer existe dans le code mais il est desactive en production.',
    ],
    accent: COLORS.red,
  });

  slide.addNotes(note(`
    Cette slide est importante pour la soutenance car elle montre la logique metier des profils.
    On peut insister sur le fait que le technicien ne travaille que sur les elements qui lui sont affectes.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Conception',
    title: 'Diagramme de cas d utilisation',
    subtitle: 'Diagramme UML genere a partir des roles, des routes et des modules observes dans le projet.',
    index,
    total,
  });

  slide.addImage({
    path: ASSETS.useCase,
    x: 0.55,
    y: 1.42,
    w: 8.55,
    h: 5.5,
  });

  addCard(slide, {
    x: 9.35,
    y: 1.55,
    w: 3.1,
    h: 1.55,
    title: 'Lecture du diagramme',
    lines: [
      'Chaque acteur dispose d un perimetre distinct.',
      'Le directeur reste le profil le plus large.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 9.35,
    y: 3.35,
    w: 3.1,
    h: 1.45,
    title: 'Point fort',
    lines: [
      'Le workflow va de la declaration de panne jusqu au reporting.',
    ],
    accent: COLORS.cyan,
  });
  addCard(slide, {
    x: 9.35,
    y: 5.0,
    w: 3.1,
    h: 1.45,
    title: 'Point a retenir',
    lines: [
      'Le scope technicien est volontairement limite par affectation.',
    ],
    accent: COLORS.amber,
  });

  slide.addNotes(note(`
    Le diagramme de cas d utilisation ne vient pas d une theorie externe.
    Il a ete reconstruit a partir des routes API et des chemins React effectivement disponibles.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Conception',
    title: 'MCD et relations entre entites',
    subtitle: 'Modele de donnees issu des migrations, des modeles Eloquent et des relations chargees dans les resources.',
    index,
    total,
  });

  slide.addImage({
    path: ASSETS.mcd,
    x: 0.45,
    y: 1.45,
    w: 8.55,
    h: 5.95,
  });

  addCard(slide, {
    x: 9.2,
    y: 1.55,
    w: 3.25,
    h: 1.55,
    title: 'Referentiel',
    lines: [
      'users, secteurs, clients et compteurs structurent le domaine.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 9.2,
    y: 3.35,
    w: 3.25,
    h: 1.55,
    title: 'Cycle terrain',
    lines: [
      'pannes -> reparations -> interventions -> releves.',
    ],
    accent: COLORS.red,
  });
  addCard(slide, {
    x: 9.2,
    y: 5.15,
    w: 3.25,
    h: 1.25,
    title: 'Support systeme',
    lines: [
      'settings, activity_logs, notifications et tokens API.',
    ],
    accent: COLORS.emerald,
  });

  slide.addNotes(note(`
    Ici, l objectif est de montrer la colonne vertebrale de la base.
    On peut presenter d abord les tables de reference, puis la chaine metier terrain et enfin les tables de support.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Donnees',
    title: 'Description des principales tables',
    subtitle: 'Les relations suivantes sont directement visibles dans les modeles Laravel et les migrations.',
    index,
    total,
  });

  const rows = [
    [
      { text: 'Table', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.navy }, align: 'center' } },
      { text: 'Role dans le systeme', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.navy }, align: 'center' } },
      { text: 'Relations essentielles', options: { bold: true, color: 'FFFFFF', fill: { color: COLORS.navy }, align: 'center' } },
    ],
    ['users', 'Comptes applicatifs et roles', '1 technicien peut etre lie a des pannes, reparations et interventions'],
    ['secteurs', 'Zones, agence, tournee, coordonnees', '1 secteur contient plusieurs compteurs et pannes via les compteurs'],
    ['clients', 'Abonnes et informations administratives', '1 client possede plusieurs compteurs'],
    ['compteurs', 'Compteurs physiques eau / electricite', 'Lie a 1 client, 1 secteur, plusieurs pannes et releves'],
    ['pannes', 'Anomalies declarees sur le terrain', 'Liees a 1 compteur et eventuellement 1 technicien'],
    ['reparations', 'Actions de reparation', 'Liees a 1 panne et 1 plombier / technicien'],
    ['interventions', 'Rapports techniques structures', 'Lies a panne, client, compteur et technicien'],
    ['releves', 'Lectures de compteur et consommation', 'Lies a 1 compteur et 1 createur'],
  ].map((row, rowIndex) => row.map((cell, cellIndex) => {
    if (typeof cell === 'string') {
      return {
        text: cell,
        options: {
          fill: { color: rowIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
          bold: cellIndex === 0,
        },
      };
    }
    return cell;
  }));

  addTable(slide, rows, {
    x: 0.7,
    y: 1.55,
    w: 11.9,
    colW: [1.7, 4.2, 6.0],
    rowH: 0.42,
    fontSize: 9.6,
  });

  addCard(slide, {
    x: 0.72,
    y: 5.68,
    w: 5.95,
    h: 1.0,
    title: 'Contraintes utiles',
    lines: [
      'Soft deletes sur plusieurs ressources, index de performance et contraintes d unicite.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.72,
    y: 5.68,
    w: 5.88,
    h: 1.0,
    title: 'Regles metier visibles',
    lines: [
      'Consommation calculee automatiquement, reparation unique active par panne, numerotation auto des interventions.',
    ],
    accent: COLORS.amber,
  });

  slide.addNotes(note(`
    Cette slide detaille les tables vraiment importantes pour la comprehension du projet.
    Les tables systeme comme personal_access_tokens, sessions ou password_reset_tokens peuvent etre citees a l oral si besoin.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Architecture',
    title: 'Architecture technique generale',
    subtitle: 'Le projet suit une architecture web separee : frontend SPA, API REST et base relationnelle.',
    index,
    total,
  });

  const layerX = 1.1;
  const layerW = 5.6;
  const boxH = 0.9;

  [
    { y: 1.55, title: 'Utilisateurs', desc: 'Directeur, responsable, manager, technicien, lecteur', fill: COLORS.blueSoft, accent: COLORS.blue },
    { y: 2.8, title: 'Frontend React 19 + Vite 8', desc: 'SPA, routing, dashboards, cartographie, formulaires, i18n', fill: 'FFFFFF', accent: COLORS.cyan },
    { y: 4.05, title: 'API Laravel 11 + Sanctum', desc: 'Controllers, resources JSON, middleware, policy, validation, services', fill: 'FFFFFF', accent: COLORS.amber },
    { y: 5.3, title: 'MySQL + Eloquent ORM', desc: 'Tables metier, migrations, seeders, soft deletes, indexes', fill: COLORS.emeraldSoft, accent: COLORS.emerald },
  ].forEach((box) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: layerX,
      y: box.y,
      w: layerW,
      h: boxH,
      rectRadius: 0.08,
      line: { color: COLORS.line, pt: 1 },
      fill: { color: box.fill },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: layerX + 0.2,
      y: box.y + 0.18,
      w: 0.1,
      h: boxH - 0.36,
      line: { color: box.accent, transparency: 100 },
      fill: { color: box.accent },
    });
    slide.addText(box.title, {
      x: layerX + 0.42,
      y: box.y + 0.16,
      w: 3.6,
      h: 0.22,
      fontSize: 13,
      bold: true,
      color: COLORS.text,
      margin: 0,
    });
    slide.addText(box.desc, {
      x: layerX + 0.42,
      y: box.y + 0.43,
      w: 4.9,
      h: 0.22,
      fontSize: 10.2,
      color: COLORS.muted,
      margin: 0,
    });
  });

  slide.addText('↓', { x: 3.7, y: 2.45, w: 0.2, h: 0.18, fontSize: 20, bold: true, color: COLORS.blue, align: 'center', margin: 0 });
  slide.addText('↓', { x: 3.7, y: 3.7, w: 0.2, h: 0.18, fontSize: 20, bold: true, color: COLORS.blue, align: 'center', margin: 0 });
  slide.addText('↓', { x: 3.7, y: 4.95, w: 0.2, h: 0.18, fontSize: 20, bold: true, color: COLORS.blue, align: 'center', margin: 0 });

  addCard(slide, {
    x: 7.45,
    y: 1.58,
    w: 5.0,
    h: 1.22,
    title: 'Frontend',
    lines: ['React Router 7, Axios, Tailwind, Recharts, Leaflet, Lucide, i18next.'],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 7.45,
    y: 3.02,
    w: 5.0,
    h: 1.22,
    title: 'Backend',
    lines: ['Controllers, Resources, ReparationRequest, InterventionPolicy, NotificationService, OperatorAccess.'],
    accent: COLORS.cyan,
  });
  addCard(slide, {
    x: 7.45,
    y: 4.46,
    w: 5.0,
    h: 1.22,
    title: 'Sorties et services',
    lines: ['Exports PDF / Excel, notifications en base, cartographie OpenStreetMap, dashboards.'],
    accent: COLORS.amber,
  });

  slide.addText('Base API frontend observee : http://127.0.0.1:8000/api - Base backend locale observee : MySQL / radeeta_db', {
    x: 0.78,
    y: 6.45,
    w: 11.7,
    h: 0.24,
    fontSize: 9.6,
    color: COLORS.muted,
    margin: 0,
  });

  slide.addNotes(note(`
    Cette architecture est tres lisible pour un jury.
    Le frontend est une SPA React, le backend expose une API REST Laravel, et la base conserve les donnees metier.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Securite',
    title: 'API, authentification et controle d acces',
    subtitle: 'La securite s appuie sur Laravel Sanctum, le middleware role, les policies et des scopes metier dedies aux techniciens.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.78,
    y: 1.58,
    w: 2.15,
    h: 1.2,
    title: '1. Login',
    lines: ['POST /api/login', 'identifiant ou email + password'],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 3.08,
    y: 1.58,
    w: 2.15,
    h: 1.2,
    title: '2. Token',
    lines: ['Creation d un token Sanctum', 'stockage local frontend'],
    accent: COLORS.cyan,
  });
  addCard(slide, {
    x: 5.38,
    y: 1.58,
    w: 2.15,
    h: 1.2,
    title: '3. Routes',
    lines: ['ProtectedRoute cote React', 'auth:sanctum cote API'],
    accent: COLORS.amber,
  });
  addCard(slide, {
    x: 7.68,
    y: 1.58,
    w: 2.15,
    h: 1.2,
    title: '4. Role',
    lines: ['middleware role:*', 'policy intervention'],
    accent: COLORS.emerald,
  });
  addCard(slide, {
    x: 9.98,
    y: 1.58,
    w: 2.15,
    h: 1.2,
    title: '5. Scope metier',
    lines: ['OperatorAccess limite les techniciens', 'a leurs taches et secteurs'],
    accent: COLORS.red,
  });

  slide.addText('→', { x: 2.84, y: 1.96, w: 0.18, h: 0.18, fontSize: 18, bold: true, color: COLORS.blue, align: 'center', margin: 0 });
  slide.addText('→', { x: 5.14, y: 1.96, w: 0.18, h: 0.18, fontSize: 18, bold: true, color: COLORS.blue, align: 'center', margin: 0 });
  slide.addText('→', { x: 7.44, y: 1.96, w: 0.18, h: 0.18, fontSize: 18, bold: true, color: COLORS.blue, align: 'center', margin: 0 });
  slide.addText('→', { x: 9.74, y: 1.96, w: 0.18, h: 0.18, fontSize: 18, bold: true, color: COLORS.blue, align: 'center', margin: 0 });

  addCard(slide, {
    x: 0.78,
    y: 3.35,
    w: 5.85,
    h: 2.55,
    title: 'Exemples de protections confirmees',
    lines: [
      'Le role developer est bloque en production.',
      'Le technicien ne peut modifier qu une partie des donnees de panne.',
      'Les notifications des profils non managers restent personnelles.',
      'La creation de client verifie l appartenance du secteur a l agence de l utilisateur.',
    ],
    accent: COLORS.blue,
  });

  addCard(slide, {
    x: 6.92,
    y: 3.35,
    w: 5.65,
    h: 2.55,
    title: 'Verification du projet analyse',
    lines: [
      `API recensee : ${META.apiRoutes} routes /api.`,
      `Tests backend executes : ${META.backendTests} passes.`,
      'Build frontend production execute avec succes.',
      'Notifications frontend rafraichies par polling toutes les 30 secondes.',
    ],
    accent: COLORS.amber,
  });

  slide.addNotes(note(`
    Cette slide met en valeur un vrai point fort du projet : la securite n est pas seulement visuelle.
    Elle est effectivement appliquee au niveau des routes, des policies et des regles metier.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Realisation',
    title: 'Interfaces principales realisees',
    subtitle: 'Des emplacements de captures sont prevus pour la version finale de soutenance.',
    index,
    total,
  });

  addPlaceholder(slide, {
    x: 0.75,
    y: 1.55,
    w: 2.85,
    h: 2.3,
    title: 'Connexion',
    subtitle: 'Login.jsx - identifiant/email, mot de passe, redirection selon le role',
    accent: COLORS.blue,
  });
  addPlaceholder(slide, {
    x: 3.9,
    y: 1.55,
    w: 2.85,
    h: 2.3,
    title: 'Dashboard',
    subtitle: 'Dashboards differencies : responsable, manager, technicien, lecteur',
    accent: COLORS.cyan,
  });
  addPlaceholder(slide, {
    x: 7.05,
    y: 1.55,
    w: 2.85,
    h: 2.3,
    title: 'Clients / Compteurs / Secteurs',
    subtitle: 'DataTable + EntityFormModal pour la gestion des references',
    accent: COLORS.amber,
  });
  addPlaceholder(slide, {
    x: 10.2,
    y: 1.55,
    w: 2.35,
    h: 2.3,
    title: 'Pannes',
    subtitle: 'Filtrage par statut, secteur et technicien, lien vers les reparations',
    accent: COLORS.red,
  });

  addCard(slide, {
    x: 0.75,
    y: 4.25,
    w: 5.65,
    h: 1.7,
    title: 'Logique UI commune',
    lines: [
      'Composants reutilisables : DataTable, EntityFormModal, Modal, Badge, ConfirmDialog.',
      'Hook useResource pour charger les donnees, gerer le loading et rafraichir les listes.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.75,
    y: 4.25,
    w: 5.8,
    h: 1.7,
    title: 'A dire a l oral',
    lines: [
      'Les captures peuvent etre ajoutees apres lancement local de l application.',
      'Le contenu fonctionnel de chaque ecran est deja confirme par le code analyse.',
    ],
    accent: COLORS.emerald,
  });

  slide.addNotes(note(`
    Si vous ajoutez des captures avant la soutenance, gardez cette organisation en quatre blocs.
    Cela permet de presenter le parcours utilisateur sans surcharger les slides de texte.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Realisation',
    title: 'Fonctionnalites metier et ecrans a valoriser',
    subtitle: 'Les modules ci dessous sont actifs dans le code et interessants a montrer pendant la demonstration.',
    index,
    total,
  });

  addPlaceholder(slide, {
    x: 0.78,
    y: 1.55,
    w: 2.85,
    h: 2.2,
    title: 'Interventions',
    subtitle: 'Creation, edition, priorite, statut, materiels utilises, liaison panne/client/compteur',
    accent: COLORS.blue,
  });
  addPlaceholder(slide, {
    x: 3.92,
    y: 1.55,
    w: 2.85,
    h: 2.2,
    title: 'Reparations',
    subtitle: 'Creation d une reparation avec cloture automatique de la panne',
    accent: COLORS.cyan,
  });
  addPlaceholder(slide, {
    x: 7.06,
    y: 1.55,
    w: 2.85,
    h: 2.2,
    title: 'Cartographie GIS',
    subtitle: 'PanneMap.jsx - Leaflet + coordonnees GPS des secteurs',
    accent: COLORS.amber,
  });
  addPlaceholder(slide, {
    x: 10.2,
    y: 1.55,
    w: 2.35,
    h: 2.2,
    title: 'Administration',
    subtitle: 'Utilisateurs, roles, settings et activity logs',
    accent: COLORS.red,
  });

  addCard(slide, {
    x: 0.78,
    y: 4.15,
    w: 5.8,
    h: 1.85,
    title: 'Exports et suivi',
    lines: [
      'Reports.jsx telecharge le PDF mensuel des pannes et l export Excel clients + compteurs.',
      'NotificationBell recharge les notifications toutes les 30 secondes.',
    ],
    accent: COLORS.emerald,
  });
  addCard(slide, {
    x: 6.85,
    y: 4.15,
    w: 5.72,
    h: 1.85,
    title: 'Remarque utile',
    lines: [
      'Une page Releves.jsx existe et le backend expose /api/releves, mais le module n est pas raccorde au routage principal a la date analysee.',
    ],
    accent: COLORS.blue,
  });

  slide.addNotes(note(`
    Cette slide permet de faire le lien entre le code et une future demonstration.
    Les modules les plus parlants pour un jury sont souvent les interventions, la carte, l administration et les exports.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Code',
    title: 'Extraits backend significatifs',
    subtitle: 'Deux exemples qui montrent la logique metier embarquee directement dans le backend Laravel.',
    index,
    total,
  });

  addCodeBox(slide, {
    x: 0.72,
    y: 1.55,
    w: 5.85,
    h: 3.55,
    title: 'Calcul automatique de la consommation',
    source: 'backend/app/Models/Releve.php',
    code: `
protected static function booted(): void
{
    static::saving(function (Releve $releve): void {
        $releve->consommation = max(
            0,
            (float) $releve->nouvel_index
            - (float) $releve->ancien_index
        );
    });
}`,
  });

  addCodeBox(slide, {
    x: 6.78,
    y: 1.55,
    w: 5.85,
    h: 3.55,
    title: 'Cloture transactionnelle d une panne',
    source: 'backend/app/Http/Controllers/ReparationController.php',
    code: `
$reparation = DB::transaction(function () use ($validated) {
    $reparation = Reparation::create($validated);
    $reparation->panne()->update([
        'status' => PanneStatus::Resolved->value,
    ]);

    return $reparation;
});`,
  });

  addCard(slide, {
    x: 0.72,
    y: 5.45,
    w: 5.85,
    h: 1.0,
    title: 'Pourquoi cet extrait est important',
    lines: ['Le calcul critique ne depend pas du frontend : il reste fiabilise dans le modele.'],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.78,
    y: 5.45,
    w: 5.85,
    h: 1.0,
    title: 'Pourquoi cet extrait est important',
    lines: ['La reparation et la mise a jour du statut sont executees ensemble, sans incoherence de donnees.'],
    accent: COLORS.amber,
  });

  slide.addNotes(note(`
    Ces extraits permettent de montrer que la logique metier ne se limite pas aux formulaires.
    Le backend garantit ici la coherence des donnees, meme si l interface evolue plus tard.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Code',
    title: 'Extraits frontend significatifs',
    subtitle: 'Le frontend ne sert pas seulement a afficher : il structure aussi la navigation securisee et l experience utilisateur.',
    index,
    total,
  });

  addCodeBox(slide, {
    x: 0.72,
    y: 1.55,
    w: 5.85,
    h: 3.35,
    title: 'Protection des routes',
    source: 'frontend/src/routes/ProtectedRoute.jsx',
    code: `
if (!isAuthenticated || !isKnownRole(role)) {
  return <Navigate to="/login" replace state={{ from: location }} />;
}

if (roles && !hasRole(role, roles)) {
  return <Navigate to="/access-denied" replace />;
}

return <Outlet />;`,
  });

  addCodeBox(slide, {
    x: 6.78,
    y: 1.55,
    w: 5.85,
    h: 3.35,
    title: 'Notifications rafraichies periodiquement',
    source: 'frontend/src/components/NotificationBell.jsx',
    code: `
useEffect(() => {
  load();
  const interval = window.setInterval(load, 30000);
  return () => window.clearInterval(interval);
}, [load]);`,
  });

  addCard(slide, {
    x: 0.72,
    y: 5.2,
    w: 5.85,
    h: 1.2,
    title: 'Lecture simple',
    lines: [
      'Le routeur React controle l acces visuel avant meme d entrer dans les pages.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.78,
    y: 5.2,
    w: 5.85,
    h: 1.2,
    title: 'Lecture simple',
    lines: [
      'Le tableau de notifications donne un ressenti quasi temps reel sans infrastructure WebSocket.',
    ],
    accent: COLORS.cyan,
  });

  slide.addNotes(note(`
    Ici, on peut montrer que le frontend participe aussi a la robustesse de l application.
    La navigation est protegee, et les notifications rendent l outil vivant pour les utilisateurs.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Bilan',
    title: 'Difficultes rencontrees et solutions observees',
    subtitle: 'Les difficultes ci dessous sont deduites de l evolution du schema, des normalisations et des adaptations presentes dans le code.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.78,
    y: 1.55,
    w: 5.8,
    h: 1.8,
    title: '1. Harmoniser un existant heterogene',
    lines: [
      'Le code gere des anciens noms de roles, de colonnes et de payloads.',
      'Solution : migrations de normalisation, alias frontend et conversion des champs legacy.',
    ],
    accent: COLORS.blue,
  });
  addCard(slide, {
    x: 6.82,
    y: 1.55,
    w: 5.76,
    h: 1.8,
    title: '2. Limiter proprement le scope technicien',
    lines: [
      'Le technicien ne doit voir que ses taches ou son secteur affecte.',
      'Solution : OperatorAccess, InterventionPolicy et verifications supplementaires dans les controllers.',
    ],
    accent: COLORS.red,
  });
  addCard(slide, {
    x: 0.78,
    y: 3.75,
    w: 5.8,
    h: 1.8,
    title: '3. Garantir la coherence metier',
    lines: [
      'Risque d incoherence entre panne, reparation, relevé et compteur.',
      'Solution : validations personnalisees, transactions DB, calculs automatiques cote backend.',
    ],
    accent: COLORS.amber,
  });
  addCard(slide, {
    x: 6.82,
    y: 3.75,
    w: 5.76,
    h: 1.8,
    title: '4. Garder de la traçabilite',
    lines: [
      'Besoin de suivre les actions sensibles et les etats du systeme.',
      'Solution : ActivityLog, tests API, dashboards et exports de rapports.',
    ],
    accent: COLORS.emerald,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.78,
    y: 5.95,
    w: 11.8,
    h: 0.7,
    rectRadius: 0.08,
    line: { color: COLORS.blueSoft, pt: 1 },
    fill: { color: COLORS.blueSoft },
  });
  slide.addText('Ces difficultes montrent un projet qui a deja connu plusieurs iterations reelles, avec des besoins de migration, de securisation et de stabilisation.', {
    x: 1.0,
    y: 6.16,
    w: 11.3,
    h: 0.2,
    fontSize: 10.8,
    bold: true,
    color: COLORS.blue,
    align: 'center',
    margin: 0,
  });

  slide.addNotes(note(`
    Cette slide est tres utile pour montrer une vision mature du projet.
    Le but n est pas de dire qu il y avait des erreurs, mais de montrer comment elles ont ete traitees proprement.
  `));
});

pushSlide((slide, index, total) => {
  addTitle(slide, {
    section: 'Conclusion',
    title: 'Conclusion generale',
    subtitle: 'Le projet constitue une base web metier solide pour le suivi des reclamations et des interventions SRM-FM Taza.',
    index,
    total,
  });

  addCard(slide, {
    x: 0.78,
    y: 1.55,
    w: 4.0,
    h: 2.35,
    title: 'Bilan du stage',
    lines: [
      'Mise en place d une application full stack coherente et securisee.',
      'Couverture des besoins de reference, de terrain, de supervision et de reporting.',
    ],
    accent: COLORS.blue,
  });

  addCard(slide, {
    x: 4.98,
    y: 1.55,
    w: 3.7,
    h: 2.35,
    title: 'Competences acquises',
    lines: [
      'React / Vite / Tailwind',
      'Laravel / API REST / Sanctum',
      'MySQL / migrations / tests',
      'RBAC / cartographie / exports',
    ],
    accent: COLORS.cyan,
  });

  addCard(slide, {
    x: 8.88,
    y: 1.55,
    w: 3.7,
    h: 2.35,
    title: 'Verification finale',
    lines: [
      `${META.backendTests} tests backend passes.`,
      'Build frontend production execute avec succes.',
      'Presentation generee directement depuis cette analyse.',
    ],
    accent: COLORS.emerald,
  });

  addCard(slide, {
    x: 0.78,
    y: 4.25,
    w: 11.8,
    h: 2.0,
    title: 'Perspectives d amelioration realistes',
    lines: [
      'Raccorder le module Releves au routage principal du frontend.',
      'Aligner la route frontend viewer/reports avec la politique reelle d export cote API.',
      'Reduire le bundle frontend par code splitting : le build signale un chunk principal > 500 kB.',
      'Remplacer a terme le polling de notifications par un mecanisme temps reel si le besoin metier grandit.',
    ],
    accent: COLORS.amber,
  });

  slide.addNotes(note(`
    La conclusion doit rester positive et concrete.
    On termine sur les acquis du stage, puis sur des pistes d amelioration deja visibles dans le code actuel.
  `));
});

for (let i = 0; i < deck.length; i += 1) {
  const slide = pptx.addSlide();
  deck[i](slide, i + 1, deck.length);
}

pptx.writeFile({ fileName: OUTPUT, compression: true })
  .then(() => {
    console.log(`Presentation generated: ${OUTPUT}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
