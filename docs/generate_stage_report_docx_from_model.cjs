const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Resvg } = require("./.docx-builder/node_modules/@resvg/resvg-js");
const {
    AlignmentType,
    BorderStyle,
    Document,
    Header,
    HeadingLevel,
    ImageRun,
    Packer,
    PageBreak,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
    convertMillimetersToTwip,
} = require("./.docx-builder/node_modules/docx");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const BACKEND_DIR = path.join(ROOT, "backend");
const OUTPUT = path.join(__dirname, "Rapport_Stage_RADEETA_Management_System.docx");

const COLORS = {
    red: "FF0000",
    blue: "2F5597",
    green: "00B050",
    text: "111111",
    muted: "666666",
    black: "000000",
    white: "FFFFFF",
    lightBlue: "D9E2F3",
    lightGray: "F5F5F5",
};

const PAGE = {
    width: convertMillimetersToTwip(210),
    height: convertMillimetersToTwip(297),
    margin: {
        top: convertMillimetersToTwip(18),
        right: convertMillimetersToTwip(18),
        bottom: convertMillimetersToTwip(18),
        left: convertMillimetersToTwip(18),
    },
};

function pt(value) {
    return value * 2;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readEnv(filePath) {
    const env = {};
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
        const [key, ...rest] = line.split("=");
        env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
    }
    return env;
}

function safeExec(command, cwd) {
    try {
        return execSync(command, {
            cwd,
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        }).trim();
    } catch {
        return "";
    }
}

function safeCount(command, cwd, regex) {
    const output = safeExec(command, cwd);
    const match = output.match(regex);
    return match ? Number(match[1]) : null;
}

function fileCount(dirPath, extension) {
    return fs.readdirSync(dirPath).filter((name) => name.endsWith(extension)).length;
}

function fileList(dirPath, extension) {
    return fs
        .readdirSync(dirPath)
        .filter((name) => name.endsWith(extension))
        .map((name) => name.replace(/\.[^.]+$/, ""))
        .sort((left, right) => left.localeCompare(right));
}

function border(color, size = 4) {
    return {
        color,
        style: BorderStyle.SINGLE,
        size,
    };
}

function pageBreak() {
    return new Paragraph({
        children: [new PageBreak()],
    });
}

function normal(text, extra = {}) {
    return new TextRun({
        text,
        font: "Aptos",
        size: pt(12),
        color: COLORS.text,
        ...extra,
    });
}

function code(text) {
    return new TextRun({
        text,
        font: "Consolas",
        size: pt(9.5),
        color: COLORS.text,
    });
}

function p(text, extra = {}) {
    return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: {
            line: 360,
            after: 120,
        },
        children: [normal(text)],
        ...extra,
    });
}

function richParagraph(children, extra = {}) {
    return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: {
            line: 360,
            after: 120,
        },
        children,
        ...extra,
    });
}

function bullet(text) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: {
            line: 320,
            after: 80,
        },
        indent: {
            left: 420,
            hanging: 200,
        },
        children: [normal(text)],
    });
}

function codeParagraph(text) {
    return new Paragraph({
        spacing: {
            line: 260,
            after: 30,
        },
        children: [code(text)],
    });
}

function chapterTitle(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
            before: 60,
            after: 160,
        },
        border: {
            top: { ...border(COLORS.blue, 6), space: 8 },
            bottom: { ...border(COLORS.blue, 6), space: 8 },
        },
        children: [
            new TextRun({
                text,
                font: "Aptos",
                size: pt(18),
                color: COLORS.red,
                bold: true,
                italics: true,
            }),
        ],
    });
}

function sectionTitle(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: {
            before: 140,
            after: 80,
        },
        children: [
            new TextRun({
                text,
                font: "Aptos",
                size: pt(13),
                color: COLORS.green,
                bold: true,
                underline: {},
            }),
        ],
    });
}

function simpleTable(rows, widths, options = {}) {
    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        borders: options.borders === false ? {
            top: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
            bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
            left: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
            right: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
        } : undefined,
        rows: rows.map((row) => new TableRow({
            children: row.map((cell, index) => new TableCell({
                width: {
                    size: widths[index],
                    type: WidthType.PERCENTAGE,
                },
                borders: options.cellBorders === false ? {
                    top: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
                    bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
                    left: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
                    right: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
                } : undefined,
                children: Array.isArray(cell) ? cell : [p(String(cell), { spacing: { line: 320, after: 40 } })],
            })),
        })),
    });
}

function titleBox(text) {
    return new Table({
        width: {
            size: 78,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: {
                            top: border(COLORS.black, 18),
                            bottom: border(COLORS.black, 18),
                            left: border(COLORS.black, 18),
                            right: border(COLORS.black, 18),
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 180, after: 180 },
                                children: [
                                    new TextRun({
                                        text,
                                        font: "Aptos",
                                        size: pt(22),
                                        color: "0563C1",
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

function placeholderBox(label) {
    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: COLORS.lightGray },
                        borders: {
                            top: border(COLORS.blue, 6),
                            bottom: border(COLORS.blue, 6),
                            left: border(COLORS.blue, 6),
                            right: border(COLORS.blue, 6),
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 180, after: 120 },
                                children: [
                                    new TextRun({
                                        text: `[Capture d'ecran - ${label}]`,
                                        italics: true,
                                        font: "Aptos",
                                        size: pt(11),
                                        color: COLORS.blue,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 180 },
                                children: [
                                    new TextRun({
                                        text: "Le depot ne contient pas d'image finale de cette interface. L'emplacement est preserve pour une capture manuelle si l'application est lancee localement.",
                                        font: "Aptos",
                                        size: pt(10.5),
                                        color: COLORS.muted,
                                        italics: true,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

function snippet(relativePath, start, end) {
    const filePath = path.join(ROOT, relativePath);
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    return lines
        .slice(start - 1, end)
        .map((line, index) => `${String(start + index).padStart(4, " ")}: ${line}`)
        .join("\n");
}

function codeBlock(title, filePath, content, explanation) {
    const paragraphs = [
        sectionTitle(title),
        richParagraph([
            new TextRun({
                text: "Fichier : ",
                bold: true,
                font: "Aptos",
                size: pt(12),
                color: COLORS.text,
            }),
            new TextRun({
                text: filePath,
                font: "Consolas",
                size: pt(10.5),
                color: COLORS.blue,
            }),
        ]),
    ];

    for (const line of content.split("\n")) {
        paragraphs.push(codeParagraph(line));
    }

    paragraphs.push(p(explanation));
    return paragraphs;
}

function figure(title, description, imageBuffer, width, height) {
    return [
        sectionTitle(title),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
                new ImageRun({
                    data: imageBuffer,
                    type: "png",
                    transformation: { width, height },
                }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
            children: [
                new TextRun({
                    text: description,
                    font: "Aptos",
                    size: pt(10.5),
                    color: COLORS.muted,
                    italics: true,
                }),
            ],
        }),
    ];
}

function svgToPng(svgPath, targetWidth) {
    const svg = fs.readFileSync(svgPath);
    const probe = new Resvg(svg);
    const ratio = probe.height / probe.width;
    const width = targetWidth;
    const height = Math.round(width * ratio);
    const render = new Resvg(svg, {
        fitTo: {
            mode: "width",
            value: width * 3,
        },
    });

    return {
        buffer: render.render().asPng(),
        width,
        height,
    };
}

function projectTree() {
    return [
        "RADEETA-Management-System/",
        "  backend/",
        "    app/",
        "      Enums/",
        "      Http/Controllers/",
        "      Http/Middleware/",
        "      Http/Requests/",
        "      Http/Resources/",
        "      Models/",
        "      Policies/",
        "      Services/",
        "      Support/",
        "    database/migrations/",
        "    database/seeders/",
        "    routes/api.php",
        "  frontend/",
        "    src/",
        "      api/",
        "      components/",
        "      context/",
        "      dashboards/",
        "      layouts/",
        "      locales/",
        "      pages/",
        "      routes/",
        "      utils/",
        "    package.json",
        "  docs/",
    ].join("\n");
}

function buildMeta() {
    const frontendPackage = readJson(path.join(FRONTEND_DIR, "package.json"));
    const backendPackage = readJson(path.join(BACKEND_DIR, "composer.json"));
    const frontendLocale = readJson(path.join(FRONTEND_DIR, "src", "locales", "fr.json"));
    const backendEnv = readEnv(path.join(BACKEND_DIR, ".env"));
    const routeOutput = safeExec("php artisan route:list --path=api", BACKEND_DIR);
    const routeCount = safeCount("php artisan route:list --path=api", BACKEND_DIR, /Showing \[(\d+)\] routes/);
    const remote = safeExec("git remote get-url origin", ROOT);

    return {
        projectTitle: "RADEETA Management System",
        appName: frontendLocale.common?.appName ?? "SRM-FM",
        appSubtitle: frontendLocale.dashboard?.subtitle ?? "Reclamations clients et interventions techniques SRM-FM",
        currentDate: "10/05/2026",
        academicYear: "2025 / 2026",
        dbConnection: backendEnv.DB_CONNECTION ?? "mysql",
        dbName: backendEnv.DB_DATABASE ?? "radeeta_db",
        routeCount: routeCount ?? 53,
        routeOutput,
        frontendPages: fileCount(path.join(FRONTEND_DIR, "src", "pages"), ".jsx"),
        frontendDashboards: fileCount(path.join(FRONTEND_DIR, "src", "dashboards"), ".jsx"),
        frontendComponents: fileCount(path.join(FRONTEND_DIR, "src", "components"), ".jsx"),
        backendControllers: fileCount(path.join(BACKEND_DIR, "app", "Http", "Controllers"), ".php"),
        backendModels: fileCount(path.join(BACKEND_DIR, "app", "Models"), ".php"),
        backendMigrations: fileCount(path.join(BACKEND_DIR, "database", "migrations"), ".php"),
        pageNames: fileList(path.join(FRONTEND_DIR, "src", "pages"), ".jsx"),
        dashboardNames: fileList(path.join(FRONTEND_DIR, "src", "dashboards"), ".jsx"),
        controllerNames: fileList(path.join(BACKEND_DIR, "app", "Http", "Controllers"), ".php"),
        modelNames: fileList(path.join(BACKEND_DIR, "app", "Models"), ".php"),
        frontendStack: [
            `React ${frontendPackage.dependencies.react.replace("^", "")}`,
            `React Router DOM ${frontendPackage.dependencies["react-router-dom"].replace("^", "")}`,
            `Axios ${frontendPackage.dependencies.axios.replace("^", "")}`,
            `Vite ${frontendPackage.devDependencies.vite.replace("^", "")}`,
            "Tailwind CSS",
            "i18next",
            "Recharts",
            "React-Leaflet",
        ],
        backendStack: [
            `PHP ${backendPackage.require.php.replace("^", "")}`,
            `Laravel ${backendPackage.require["laravel/framework"].replace("^", "")}`,
            `Sanctum ${backendPackage.require["laravel/sanctum"].replace("^", "")}`,
            `DomPDF ${backendPackage.require["barryvdh/laravel-dompdf"].replace("^", "")}`,
            `Laravel Excel ${backendPackage.require["maatwebsite/excel"].replace("^", "")}`,
        ],
        remote,
    };
}

async function main() {
    const meta = buildMeta();
    const useCaseFigure = svgToPng(path.join(__dirname, "uml-assets", "use-case-diagram.svg"), 520);
    const mcdFigure = svgToPng(path.join(__dirname, "uml-assets", "mcd.svg"), 520);
    const classFigure = svgToPng(path.join(__dirname, "uml-assets", "class-diagram.svg"), 520);

    const cover = [
        new Paragraph({
            spacing: { after: 160 },
            children: [
                new TextRun({
                    text: meta.projectTitle,
                    font: "Aptos",
                    size: pt(15),
                    color: COLORS.text,
                }),
            ],
        }),
        new Paragraph({ spacing: { after: 220 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
                new TextRun({
                    text: "RAPPORT DU PROJET :",
                    font: "Aptos",
                    size: pt(18),
                    color: COLORS.red,
                    bold: true,
                }),
            ],
        }),
        titleBox("Plateforme de gestion des reclamations clients, pannes, interventions et reparations - RADEETA / SRM-FM Taza"),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 520 },
            children: [
                new TextRun({
                    text: meta.currentDate,
                    font: "Aptos",
                    size: pt(16),
                    color: COLORS.red,
                    bold: true,
                }),
            ],
        }),
        simpleTable(
            [
                [
                    [
                        new Paragraph({
                            spacing: { after: 90 },
                            children: [
                                new TextRun({
                                    text: "Realise par :",
                                    font: "Aptos",
                                    size: pt(15),
                                    color: COLORS.red,
                                    bold: true,
                                }),
                            ],
                        }),
                        bullet("[A completer manuellement]"),
                    ],
                    [
                        new Paragraph({
                            spacing: { after: 90 },
                            children: [
                                new TextRun({
                                    text: "Encadre par :",
                                    font: "Aptos",
                                    size: pt(15),
                                    color: COLORS.red,
                                    bold: true,
                                }),
                            ],
                        }),
                        bullet("[A completer manuellement]"),
                    ],
                ],
            ],
            [50, 50],
            { borders: false, cellBorders: false },
        ),
        new Paragraph({ spacing: { after: 160 } }),
        p(`Etablissement / entreprise : [A completer manuellement]`, { alignment: AlignmentType.CENTER }),
        p(`Annee universitaire : ${meta.academicYear}`, { alignment: AlignmentType.CENTER }),
        p("Le contenu du present rapport est reconstruit a partir du code reel du projet ouvert dans VS Code. Les informations personnelles ou administratives absentes du depot ont ete laissees a completer manuellement.", {
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 320 },
        }),
    ];

    const body = [];
    const push = (...items) => body.push(...items);

    push(chapterTitle("Table des matieres"));
    push(
        new Paragraph({
            spacing: { after: 120 },
            children: [
                new TextRun({
                    text: "La structure du document suit le modele de rapport fourni, avec adaptation minimale au perimetre reel du projet RADEETA Management System.",
                    font: "Aptos",
                    size: pt(12),
                    color: COLORS.text,
                }),
            ],
        }),
    );
    push(
        new TableOfContents("Table des matieres", {
            headingStyleRange: "1-2",
            hyperlink: true,
        }),
    );

    push(pageBreak(), chapterTitle("Remerciements"));
    push(
        p("Je souhaite adresser mes remerciements les plus sinceres a mon encadrant pedagogique et a toute personne ayant contribue a l'avancement de ce travail. Leur accompagnement, leurs remarques constructives et leur disponibilite ont permis de conduire ce projet dans de bonnes conditions et de structurer l'analyse avec davantage de rigueur."),
        p("Je remercie egalement les responsables du projet et les utilisateurs metiers dont les besoins ont guide l'organisation fonctionnelle de l'application. Le present rapport s'appuie sur cette realite technique et met en valeur le travail de conception, de developpement et de structuration observe dans le depot source."),
    );

    push(pageBreak(), chapterTitle("1. Presentation generale du projet"));
    push(
        p("Le projet RADEETA Management System est une application web metier destinee a la gestion des reclamations clients, des secteurs, des compteurs, des pannes, des interventions techniques, des reparations et des releves. Le depot observe montre une application privee, orientee exploitation terrain, qui centralise les operations quotidiennes d'une agence SRM-FM a Taza."),
        p("L'objectif principal du projet est d'offrir une plateforme unique pour suivre le cycle de vie d'un incident, depuis la declaration d'une anomalie jusqu'a son traitement par les techniciens, tout en maintenant une vision globale sur les clients, les equipements et les secteurs couverts par l'agence."),
        p("L'analyse du code confirme une separation nette entre un backend Laravel charge de la logique metier et un frontend React charge du routage, de l'interface, de l'authentification cote client et des tableaux de bord par role. Cette organisation rend le projet lisible, maintenable et evolutif."),
    );
    push(sectionTitle("1.1 Objectifs fonctionnels du projet"));
    [
        "Permettre l'authentification des utilisateurs avec redirection vers un espace adapte a leur role.",
        "Centraliser la gestion des clients, des secteurs et des compteurs au sein d'une meme interface.",
        "Declarer, suivre et mettre a jour les pannes selon un cycle de traitement clairement defini.",
        "Planifier et enregistrer les reparations, les interventions et les releves lies au terrain.",
        "Offrir des fonctions d'administration, de parametrage, de notification et d'export pour les responsables et la direction.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("1.2 Synthese quantitative du projet"));
    [
        `L'API Laravel expose actuellement ${meta.routeCount} routes sous le prefixe /api.`,
        `Le frontend contient ${meta.frontendPages} pages React et ${meta.frontendDashboards} dashboards specialises par profil utilisateur.`,
        `Le backend comporte ${meta.backendModels} modeles Eloquent, ${meta.backendControllers} controllers et ${meta.backendMigrations} migrations.`,
        `Le perimetre fonctionnel reel couvre les modules clients, secteurs, compteurs, pannes, reparations, interventions, notifications, parametres, utilisateurs et rapports.`,
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("1.3 Perimetre technologique retenu"));
    [
        `Backend : ${meta.backendStack.join(", ")}.`,
        `Frontend : ${meta.frontendStack.join(", ")}.`,
        `Donnees : ${meta.dbConnection.toUpperCase()} avec base ${meta.dbName}, migrations Laravel et seeders de demonstration.`,
        "Cartographie et reporting : utilisation de Recharts pour les tableaux de bord et de React-Leaflet pour la localisation des secteurs.",
    ].forEach((item) => push(bullet(item)));

    push(pageBreak(), chapterTitle("2. Analyse fonctionnelle et modelisation UML"));
    push(
        p("Cette partie reprend la logique du modele fourni en mettant l'accent sur les cas d'utilisation, la sequence d'authentification et la structuration des composants. Les diagrammes integres ont ete reconstruits a partir des routes, des modeles, des relations et des composants reels du projet."),
    );
    push(
        ...figure(
            "2.1 Diagramme de cas d'utilisation",
            "Le diagramme met en evidence les acteurs reels detectes dans le code : directeur, responsable, manager, technician, viewer et developer non utilise en production.",
            useCaseFigure.buffer,
            useCaseFigure.width,
            useCaseFigure.height,
        ),
    );
    push(sectionTitle("2.2 Diagramme de sequence de l'authentification"));
    [
        "Utilisateur",
        "|",
        "| saisit identifiant + mot de passe",
        "v",
        "Page Login React",
        "|",
        "| appelle login({ identifiant, password })",
        "v",
        "AuthContext.jsx",
        "|",
        "| POST /api/login",
        "v",
        "AuthController@login",
        "|",
        "| validation + Hash::check(...)",
        "| creation du token Sanctum",
        "v",
        "Reponse JSON { token, role, user }",
        "|",
        "| stockage localStorage",
        "| verification /api/me au rechargement",
        "v",
        "ProtectedRoute / RoleRedirect",
    ].forEach((line) => push(codeParagraph(line)));
    push(p("La sequence d'authentification reste courte et robuste. Le backend conserve la responsabilite de la validation et de l'emission du token, tandis que le frontend orchestre le stockage local, le chargement de l'utilisateur courant et la redirection vers le bon espace de travail."));
    push(sectionTitle("2.3 Diagramme de composants et de deploiement logique"));
    [
        "+---------------------------+      HTTPS / JSON      +---------------------------+",
        "| Frontend React + Vite     | <--------------------> | Backend Laravel API       |",
        "| - App.jsx                 |                        | - routes/api.php          |",
        "| - AuthContext             |                        | - Controllers             |",
        "| - ProtectedRoute          |                        | - Middleware / Policy     |",
        "| - Dashboards par role     |                        | - Models / Resources      |",
        "+-------------+-------------+                        +-------------+-------------+",
        "              |                                                          |",
        "              v                                                          v",
        "+---------------------------+                        +---------------------------+",
        "| Navigateur utilisateur    |                        | Base MySQL + Notifications|",
        "| localStorage + UI         |                        | + exports PDF / Excel     |",
        "+---------------------------+                        +---------------------------+",
    ].forEach((line) => push(codeParagraph(line)));
    push(p("Le couplage entre composants reste maitrise. Le frontend ne connait que des endpoints HTTP et des structures JSON, tandis que Laravel centralise la logique metier, la persistance, l'application des roles et la production des rapports."));
    push(
        ...figure(
            "2.4 Diagramme de classes simplifie",
            "Le diagramme ci-dessous resume les principales entites du domaine et leurs relations reelles telles qu'elles apparaissent dans les modeles et migrations Laravel.",
            classFigure.buffer,
            classFigure.width,
            classFigure.height,
        ),
    );

    push(pageBreak(), chapterTitle("3. Architecture technique de la plateforme"));
    push(
        p("L'architecture du projet repose sur un schema SPA + API. Le frontend React assure le rendu, la navigation et l'experience utilisateur, alors que le backend Laravel expose des services HTTP decoupes par domaine fonctionnel. Cette organisation facilite la separation des responsabilites et permet de faire evoluer independamment l'interface et la logique metier."),
    );
    push(sectionTitle("3.1 Backend Laravel"));
    push(
        p("Le backend s'organise autour de controllers specialises, de modeles Eloquent, de ressources JSON, d'un middleware de role et de classes de support qui limitent le couplage. Les controllers principaux concernent les clients, les compteurs, les secteurs, les pannes, les reparations, les interventions, les notifications, les parametres et les utilisateurs."),
    );
    [
        "Le fichier routes/api.php structure l'ensemble des endpoints autour de Sanctum et de groupes de roles.",
        "Le middleware EnsureUserHasRole impose la politique RBAC, avec un traitement particulier pour le role developer desactive en production.",
        "La policy InterventionPolicy et la classe OperatorAccess affinent les droits sur les operations terrain.",
        "Les exports sont produits cote backend via DomPDF pour les pannes et Laravel Excel pour les clients / compteurs.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("3.2 Frontend React"));
    push(
        p("Le frontend utilise React Router pour segmenter l'application par profil. Le fichier App.jsx declare une couche ProtectedRoute et distribue les pages selon les roles directeur, responsable, manager, technician et viewer. Les dashboards sont separes par profil afin d'afficher des indicateurs differencies."),
    );
    [
        "AuthContext centralise le token, l'etat d'authentification et la redirection apres connexion.",
        "Les composants reutilisables comme DataTable, EntityFormModal, ConfirmDialog et NotificationBell homogeneiisent l'experience utilisateur.",
        "La traduction repose sur i18next, ce qui permet au projet de preparer une interface multilingue.",
        "Les pages metier principales sont Clients, Compteurs, Secteurs, Pannes, Reparations, Interventions, Reports et Administration.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("3.3 Securite, authentification et controle des acces"));
    push(
        p("L'authentification s'appuie sur Laravel Sanctum. Une fois connecte, l'utilisateur recoit un token personnel, stocke cote navigateur, puis reutilise dans les appels Axios. Le controle d'acces n'est pas delegue au seul frontend : le backend revalide les roles et limite certaines operations aux utilisateurs affectes ou habilites."),
    );
    [
        "Connexion possible par identifiant ou par email, avec verification du mot de passe par Hash::check.",
        "RoleRedirect et ProtectedRoute empechent l'acces aux routes non conformes au profil courant.",
        "Les techniciens sont limites aux pannes, reparations et interventions liees a leurs affectations.",
        "Le role developer reste present dans le code pour l'assistance technique mais il est bloque en production.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("3.4 Gestion des exports, notifications et flux de reporting"));
    push(
        p("Contrairement au modele ISTA qui mettait l'accent sur les medias publics, ce projet se distingue davantage par le reporting operationnel. Le code montre une logique de notification, de synthese statistique, de cartographie des secteurs et d'export documentaire utile a l'exploitation quotidienne."),
    );
    [
        "Le module Reports telecharge un PDF de synthese des pannes et un export Excel des clients / compteurs.",
        "DashboardController fournit des indicateurs agreges et des donnees de visualisation pour les graphiques.",
        "NotificationController exploite les notifications Laravel stockees en base de donnees.",
        "La page PanneMap et les coordonnees des secteurs permettent une lecture geographique de la couverture agence.",
    ].forEach((item) => push(bullet(item)));

    push(pageBreak(), chapterTitle("4. Conception et structuration des donnees"));
    push(
        p("La base de donnees du projet est relationnelle et s'appuie sur les migrations Laravel. Le domaine metier se structure autour d'un noyau d'identite, d'un noyau abonnes / equipements et d'un noyau incidents / terrain. Les sections qui suivent reprennent la logique du modele fourni, avec adaptation au contexte RADEETA."),
    );
    push(
        ...figure(
            "4.1 Modele conceptuel de donnees (MCD)",
            "Le MCD ci-dessous a ete reconstruit a partir des modeles, des clefs etrangeres et des relations explicites du projet.",
            mcdFigure.buffer,
            mcdFigure.width,
            mcdFigure.height,
        ),
    );
    push(
        ...figure(
            "4.2 Modele logique de donnees (MLD)",
            "Le depot ne fournit pas un MLD dessine distinct. Le schema logique suivant est reconstruit a partir des migrations et des modeles Eloquent disponibles.",
            classFigure.buffer,
            classFigure.width,
            classFigure.height,
        ),
    );
    push(sectionTitle("4.3 Noyau d'identite et d'administration"));
    [
        "users : identifiant, nom, prenom, email, agence, mot de passe et role. Cette table porte l'authentification et la repartition des droits.",
        "settings : parametres d'application comme le nom de l'agence, le nom de l'application, la langue par defaut et certaines preferences.",
        "activity_logs : journalisation des actions sensibles, notamment l'authentification et certaines operations d'administration.",
        "notifications : stockage Laravel des messages applicatifs consultables depuis le frontend.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("4.4 Noyau abonnes, secteurs et equipements"));
    [
        "secteurs : decoupage geographique de l'agence avec emplacement, agence, numero de tournee et coordonnees GPS.",
        "clients : identification des abonnes par police, nom, CIN, telephone, adresse, type d'abonnement, service et rattachement a un secteur.",
        "compteurs : equipements rattaches aux clients et aux secteurs, avec service_type, calibre, marque, cadran et index courant.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("4.5 Noyau incidents, reparations, interventions et releves"));
    [
        "pannes : declaration des anomalies constatees sur un compteur, avec date, statut et technicien eventuellement affecte.",
        "reparations : trace des reparations effectuees sur les pannes, avec technicien, date et description d'intervention.",
        "interventions : suivi plus detaille des operations terrain, avec numero d'intervention, dates, priorite, statut, observations et materiels utilises.",
        "releves : enregistrement des anciens et nouveaux index, avec calcul de consommation et mise a jour du compteur.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("4.6 Regles de gestion identifiees dans le code"));
    [
        "Le role directeur dispose d'un traitement transversal et peut passer outre les restrictions classiques du middleware de role.",
        "Une panne peut etre affectee a un technicien via le champ assigned_to pour restreindre les actions terrain.",
        "Un technicien ne peut creer ou mettre a jour qu'une reparation liee a une panne qui lui est affectee.",
        "La date de reparation doit etre superieure ou egale a la date de panne.",
        "Une seule reparation active est acceptee par panne dans les validations backend.",
        "Le releve met automatiquement a jour l'index du compteur et calcule la consommation.",
    ].forEach((item) => push(bullet(item)));
    push(sectionTitle("4.7 Arborescence de haut niveau du projet"));
    projectTree().split("\n").forEach((line) => push(codeParagraph(line)));

    push(pageBreak(), chapterTitle("5. Presentation des interfaces et parcours utilisateurs"));
    push(
        p("Cette section suit la logique du modele fourni, tout en tenant compte d'une difference importante : le projet RADEETA observe dans le depot est une application metier privee et non un site institutionnel hybride. La presentation des interfaces est donc reorganisee par role, ce qui constitue l'adaptation minimale necessaire pour rester fidele a la realite du code."),
    );
    push(sectionTitle("5.1 Espace directeur"));
    [
        "L'espace directeur est centre sur la page Administration, accessible via /administration et /admin/administration.",
        "Cette interface regroupe la gestion des utilisateurs, le parametrage applicatif et la consultation du journal d'activite.",
        "Le directeur constitue le profil de supervision et de gouvernance du systeme.",
    ].forEach((item) => push(bullet(item)));
    push(placeholderBox("Espace directeur - Administration"));

    push(sectionTitle("5.2 Espace responsable"));
    [
        "Le responsable dispose du dashboard le plus complet cote exploitation, via /admin/dashboard.",
        "Il gere les clients, compteurs, secteurs, pannes, reparations, interventions et rapports.",
        "Cet espace correspond au pilotage metier quotidien de l'agence et a la maintenance des referentiels.",
    ].forEach((item) => push(bullet(item)));
    push(placeholderBox("Espace responsable - Dashboard et modules metier"));

    push(sectionTitle("5.3 Espace manager"));
    [
        "Le manager accede a un dashboard specifique et a un ensemble de pages orientees suivi des incidents : pannes, reparations, interventions et rapports.",
        "Il peut creer et mettre a jour les operations de terrain sans acceder a l'administration complete des utilisateurs.",
        "Ce role se situe a l'interface entre coordination metier et execution technique.",
    ].forEach((item) => push(bullet(item)));
    push(placeholderBox("Espace manager - Suivi des operations"));

    push(sectionTitle("5.4 Espace technicien"));
    [
        "Le technicien dispose d'un dashboard operationnel, d'une page MyTasks et des pages pannes, reparations et interventions.",
        "Le code limite cet espace aux elements affectes ou autorises, ce qui reduit le risque de modification sur des dossiers non concernes.",
        "Le depot contient egalement une page Releves.jsx, mais celle-ci n'est pas encore branchee dans le routage principal observe dans App.jsx.",
    ].forEach((item) => push(bullet(item)));
    push(placeholderBox("Espace technicien - Tableau de bord et taches"));

    push(sectionTitle("5.5 Espace viewer"));
    [
        "Le viewer dispose d'un dashboard de consultation et de pages en lecture seule pour les clients, compteurs, secteurs, pannes, reparations et interventions.",
        "Le frontend expose aussi une route /viewer/reports, mais les exports backend restent reserves aux roles manager / responsable.",
        "Cette nuance montre qu'une harmonisation supplementaire entre le routage frontend et les permissions API reste souhaitable.",
    ].forEach((item) => push(bullet(item)));
    push(placeholderBox("Espace viewer - Consultation seule"));

    push(pageBreak(), chapterTitle("6. Elements techniques significatifs du developpement"));
    push(
        p("Les extraits suivants ont ete selectionnes pour montrer concretement la facon dont le projet implemente son routage, son authentification, sa structuration des roles et sa logique frontend. Ils sont issus directement des fichiers reels du depot."),
    );
    push(
        ...codeBlock(
            "6.1 Cartographie des endpoints API",
            "backend/routes/api.php",
            snippet("backend/routes/api.php", 20, 74),
            "Cet extrait montre la coexistence d'un point d'entree de connexion, d'un groupe Sanctum authentifie, d'une politique RBAC par role et des ressources metier principales. Il constitue l'une des pieces centrales de l'architecture backend.",
        ),
    );
    push(
        ...codeBlock(
            "6.2 Authentification avec Sanctum",
            "backend/app/Http/Controllers/AuthController.php",
            snippet("backend/app/Http/Controllers/AuthController.php", 17, 49),
            "Ce bloc est significatif car il montre la validation des identifiants, la verification du hash, la prise en compte du role developer en production et la creation du token Sanctum renvoye au frontend.",
        ),
    );
    push(
        ...codeBlock(
            "6.3 Migration du noyau RBAC et de l'affectation des pannes",
            "backend/database/migrations/2026_05_01_000001_enforce_six_role_rbac_and_panne_assignment.php",
            snippet("backend/database/migrations/2026_05_01_000001_enforce_six_role_rbac_and_panne_assignment.php", 10, 35),
            "Cette migration est importante car elle montre l'evolution du projet vers un modele a six roles normalises, tout en introduisant le champ assigned_to qui structure la logique d'affectation des pannes aux techniciens.",
        ),
    );
    push(
        ...codeBlock(
            "6.4 Validation metier des reparations",
            "backend/app/Http/Requests/ReparationRequest.php",
            snippet("backend/app/Http/Requests/ReparationRequest.php", 15, 98),
            "Le FormRequest des reparations illustre bien la logique metier du projet : affectation automatique du technicien, verification de l'appartenance de la panne, controle de coherence sur les dates et interdiction d'avoir plusieurs reparations actives sur une meme panne.",
        ),
    );
    push(
        ...codeBlock(
            "6.5 Routage frontend par layout et par role",
            "frontend/src/App.jsx",
            snippet("frontend/src/App.jsx", 23, 95),
            "Le routage React montre une separation claire des espaces directeur, responsable, manager, technician et viewer. Il confirme egalement que l'application actuelle est entierement privee et structuree autour d'un layout commun.",
        ),
    );
    push(
        ...codeBlock(
            "6.6 Contexte d'authentification React",
            "frontend/src/context/AuthContext.jsx",
            snippet("frontend/src/context/AuthContext.jsx", 24, 159),
            "L'AuthContext centralise le boot de session, la requete /me, le stockage du token et les fonctions de login / logout. Il constitue la passerelle de confiance entre l'interface React et l'API Laravel.",
        ),
    );

    push(pageBreak(), chapterTitle("Conclusion generale"));
    push(
        p("Le projet RADEETA Management System analyse dans ce rapport est une application full stack coherente, structuree autour d'une API Laravel et d'un frontend React moderne. Sa principale qualite est de centraliser la gestion des clients, des equipements et des operations terrain dans une meme plateforme, tout en distinguant clairement les responsabilites par role."),
        p("D'un point de vue documentaire, le projet offre une matiere suffisante pour une soutenance de stage ou de fin d'etudes : modelisation, architecture, structures de donnees, parcours utilisateurs et extraits de code significatifs. Le rapport reconstitue ici suit la structure du modele fourni, avec une adaptation minimale rendue necessaire par la nature purement metier et privee de l'application."),
        p("Des ameliorations restent envisageables, notamment le branchement complet du module Releves dans le routage principal, l'alignement de la route viewer/reports avec les permissions backend et une optimisation du bundle frontend de production."),
        p(`Lien du depot observe : ${meta.remote || "[Lien non disponible dans le depot local]"}`),
    );

    const header = new Header({
        children: [
            new Paragraph({
                spacing: { after: 80 },
                children: [
                    new TextRun({
                        text: meta.projectTitle,
                        font: "Aptos",
                        size: pt(14),
                        color: COLORS.text,
                    }),
                ],
            }),
        ],
    });

    const doc = new Document({
        title: `Rapport du projet - ${meta.projectTitle}`,
        subject: "Rapport professionnel genere a partir du code reel du projet",
        description: "Rapport reconstruit a partir du modele PDF fourni et du code reel du projet RADEETA Management System.",
        creator: "OpenAI Codex",
        keywords: "rapport de stage, RADEETA, OFPPT, Laravel, React, Sanctum, API",
        features: {
            updateFields: true,
        },
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: PAGE.width,
                            height: PAGE.height,
                        },
                        margin: PAGE.margin,
                    },
                },
                children: cover,
            },
            {
                properties: {
                    page: {
                        size: {
                            width: PAGE.width,
                            height: PAGE.height,
                        },
                        margin: PAGE.margin,
                    },
                },
                headers: {
                    default: header,
                },
                children: body,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(OUTPUT, buffer);
    console.log(`Word report generated: ${OUTPUT}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
