const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Resvg } = require("./.docx-builder/node_modules/@resvg/resvg-js");
const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    HeadingLevel,
    ImageRun,
    PageBreak,
    PageNumber,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
    convertMillimetersToTwip,
} = require("./.docx-builder/node_modules/docx");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const BACKEND_DIR = path.join(ROOT, "backend");
const OUTPUT_PATH = path.join(__dirname, "Rapport_Stage_RADEETA_Management_System.docx");

const COLORS = {
    navy: "0F172A",
    blue: "1D4ED8",
    blueSoft: "DBEAFE",
    cyan: "0F766E",
    cyanSoft: "CCFBF1",
    amber: "B45309",
    amberSoft: "FEF3C7",
    emerald: "047857",
    emeraldSoft: "D1FAE5",
    red: "B91C1C",
    redSoft: "FEE2E2",
    text: "1F2937",
    muted: "64748B",
    line: "CBD5E1",
    light: "F8FAFC",
    white: "FFFFFF",
    codeBg: "111827",
    codeText: "E5E7EB",
};

const A4_WIDTH = convertMillimetersToTwip(210);
const A4_HEIGHT = convertMillimetersToTwip(297);
const PAGE_MARGINS = {
    top: convertMillimetersToTwip(20),
    right: convertMillimetersToTwip(18),
    bottom: convertMillimetersToTwip(18),
    left: convertMillimetersToTwip(22),
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

function listBasenames(dirPath, matcher) {
    return fs
        .readdirSync(dirPath)
        .filter((name) => matcher.test(name))
        .map((name) => name.replace(/\.[^.]+$/, ""))
        .sort((left, right) => left.localeCompare(right));
}

function safeApiRouteCount() {
    try {
        const output = execSync("php artisan route:list --path=api", {
            cwd: BACKEND_DIR,
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        });

        return output
            .split(/\r?\n/)
            .filter((line) => /^\s*(GET\|HEAD|POST|PUT|PATCH|DELETE)/.test(line))
            .length;
    } catch {
        return 0;
    }
}

function safeBuildVerification() {
    try {
        const output = execSync("php artisan test", {
            cwd: BACKEND_DIR,
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        });

        const match = output.match(/Tests:\s+(\d+)\s+passed/i);
        return match ? Number(match[1]) : null;
    } catch {
        return null;
    }
}

function svgToPngFigure(svgPath, targetWidth) {
    const svg = fs.readFileSync(svgPath);
    const probe = new Resvg(svg);
    const ratio = probe.height / probe.width;
    const imageWidth = targetWidth;
    const imageHeight = Math.round(imageWidth * ratio);
    const render = new Resvg(svg, {
        fitTo: {
            mode: "width",
            value: imageWidth * 3,
        },
    });

    return {
        buffer: render.render().asPng(),
        width: imageWidth,
        height: imageHeight,
    };
}

function border(color = COLORS.line, size = 1) {
    return {
        style: BorderStyle.SINGLE,
        color,
        size,
    };
}

function baseParagraph(children, extra = {}) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: {
            line: 320,
            after: 110,
        },
        children,
        ...extra,
    });
}

function textRun(text, extra = {}) {
    return new TextRun({
        text,
        font: "Aptos",
        size: pt(11),
        color: COLORS.text,
        ...extra,
    });
}

function bodyParagraph(text, extra = {}) {
    return baseParagraph([textRun(text)], extra);
}

function centeredParagraph(text, extra = {}) {
    return baseParagraph([textRun(text)], {
        alignment: AlignmentType.CENTER,
        ...extra,
    });
}

function heading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: {
            before: 180,
            after: 80,
        },
        border: {
            bottom: {
                ...border(COLORS.blue, 4),
                space: 6,
            },
        },
        children: [
            new TextRun({
                text,
                bold: true,
                color: COLORS.navy,
                font: "Aptos Display",
                size: pt(17),
            }),
        ],
    });
}

function heading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: {
            before: 150,
            after: 50,
        },
        children: [
            new TextRun({
                text,
                bold: true,
                color: COLORS.blue,
                font: "Aptos Display",
                size: pt(13),
            }),
        ],
    });
}

function heading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: {
            before: 90,
            after: 40,
        },
        children: [
            new TextRun({
                text,
                bold: true,
                color: COLORS.cyan,
                font: "Aptos Display",
                size: pt(11.5),
            }),
        ],
    });
}

function bulletParagraph(text, level = 0) {
    return new Paragraph({
        bullet: { level },
        spacing: {
            line: 320,
            after: 70,
        },
        alignment: AlignmentType.JUSTIFIED,
        children: [textRun(text)],
    });
}

function pageBreak() {
    return new Paragraph({
        children: [new PageBreak()],
    });
}

function simpleCell(content, options = {}) {
    const paragraphs = Array.isArray(content)
        ? content
        : [
              new Paragraph({
                  alignment: options.align || AlignmentType.LEFT,
                  spacing: { after: 0, line: 280 },
                  children: [
                      new TextRun({
                          text: content,
                          bold: options.bold || false,
                          color: options.color || COLORS.text,
                          font: options.font || "Aptos",
                          size: pt(options.size || 10.5),
                          italics: options.italics || false,
                      }),
                  ],
              }),
          ];

    return new TableCell({
        width: options.width
            ? { size: options.width, type: WidthType.PERCENTAGE }
            : undefined,
        shading: options.fill ? { fill: options.fill } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: {
            top: 110,
            bottom: 110,
            left: 120,
            right: 120,
        },
        borders: {
            top: border(),
            bottom: border(),
            left: border(),
            right: border(),
        },
        children: paragraphs,
    });
}

function styledTable(headers, rows, widths) {
    const tableRows = [
        new TableRow({
            children: headers.map((header, index) =>
                simpleCell(header, {
                    width: widths[index],
                    bold: true,
                    color: COLORS.white,
                    fill: COLORS.navy,
                    align: AlignmentType.CENTER,
                    size: 10.5,
                }),
            ),
        }),
        ...rows.map((row, rowIndex) =>
            new TableRow({
                children: row.map((cell, index) =>
                    simpleCell(cell, {
                        width: widths[index],
                        fill: rowIndex % 2 === 0 ? COLORS.white : COLORS.light,
                    }),
                ),
            }),
        ),
    ];

    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: tableRows,
    });
}

function calloutBox(title, paragraphs, fill = COLORS.blueSoft, accent = COLORS.blue) {
    const content = [
        new Paragraph({
            spacing: { after: 50 },
            children: [
                new TextRun({
                    text: title,
                    bold: true,
                    color: accent,
                    font: "Aptos Display",
                    size: pt(11.5),
                }),
            ],
        }),
        ...paragraphs.map((text) =>
            new Paragraph({
                spacing: { after: 30, line: 300 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                    new TextRun({
                        text,
                        color: COLORS.text,
                        font: "Aptos",
                        size: pt(10.3),
                    }),
                ],
            }),
        ),
    ];

    return new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { fill },
                        margins: {
                            top: 130,
                            bottom: 130,
                            left: 170,
                            right: 170,
                        },
                        borders: {
                            top: border(accent, 3),
                            bottom: border(accent, 3),
                            left: border(accent, 3),
                            right: border(accent, 3),
                        },
                        children: content,
                    }),
                ],
            }),
        ],
    });
}

function codeBlock(title, code) {
    return [
        heading3(title),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: COLORS.codeBg },
                            margins: {
                                top: 120,
                                bottom: 120,
                                left: 160,
                                right: 160,
                            },
                            borders: {
                                top: border(COLORS.codeBg, 1),
                                bottom: border(COLORS.codeBg, 1),
                                left: border(COLORS.codeBg, 1),
                                right: border(COLORS.codeBg, 1),
                            },
                            children: code.split("\n").map((line) =>
                                new Paragraph({
                                    spacing: { after: 10, line: 250 },
                                    children: [
                                        new TextRun({
                                            text: line,
                                            font: "Consolas",
                                            size: pt(9),
                                            color: COLORS.codeText,
                                        }),
                                    ],
                                }),
                            ),
                        }),
                    ],
                }),
            ],
        }),
    ];
}

function placeholderFigure(title, description) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: COLORS.light },
                        margins: {
                            top: 140,
                            bottom: 140,
                            left: 160,
                            right: 160,
                        },
                        borders: {
                            top: {
                                style: BorderStyle.DASHED,
                                color: COLORS.line,
                                size: 2,
                            },
                            bottom: {
                                style: BorderStyle.DASHED,
                                color: COLORS.line,
                                size: 2,
                            },
                            left: {
                                style: BorderStyle.DASHED,
                                color: COLORS.line,
                                size: 2,
                            },
                            right: {
                                style: BorderStyle.DASHED,
                                color: COLORS.line,
                                size: 2,
                            },
                        },
                        children: [
                            centeredParagraph(title, {
                                spacing: { after: 80 },
                                children: [
                                    new TextRun({
                                        text: title,
                                        bold: true,
                                        color: COLORS.blue,
                                        font: "Aptos Display",
                                        size: pt(11.5),
                                    }),
                                ],
                            }),
                            centeredParagraph("Capture d'écran a inserer manuellement", {
                                spacing: { after: 80 },
                                children: [
                                    new TextRun({
                                        text: "Capture d'écran a inserer manuellement",
                                        italics: true,
                                        color: COLORS.muted,
                                        font: "Aptos",
                                        size: pt(10.5),
                                    }),
                                ],
                            }),
                            centeredParagraph(description, {
                                children: [
                                    new TextRun({
                                        text: description,
                                        color: COLORS.text,
                                        font: "Aptos",
                                        size: pt(10),
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

function imageFigure(title, description, imageBuffer, width, height) {
    return [
        heading3(title),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 70 },
            children: [
                new ImageRun({
                    data: imageBuffer,
                    type: "png",
                    transformation: { width, height },
                }),
            ],
        }),
        centeredParagraph(description, {
            spacing: { after: 110, line: 280 },
            children: [
                new TextRun({
                    text: description,
                    italics: true,
                    color: COLORS.muted,
                    font: "Aptos",
                    size: pt(9.8),
                }),
            ],
        }),
    ];
}

function buildProjectMetadata() {
    const frontendPackage = readJson(path.join(FRONTEND_DIR, "package.json"));
    const backendComposer = readJson(path.join(BACKEND_DIR, "composer.json"));
    const backendEnv = readEnv(path.join(BACKEND_DIR, ".env"));
    const frLocale = readJson(path.join(FRONTEND_DIR, "src", "locales", "fr.json"));

    return {
        projectTitle: "RADEETA Management System",
        appName: frLocale?.common?.appName || "SRM-FM",
        brandSubtitle: frLocale?.sidebar?.brandSubtitle || "Gestion des reclamations",
        dashboardSubtitle: frLocale?.dashboard?.subtitle || "",
        dbConnection: backendEnv.DB_CONNECTION || "mysql",
        dbName: backendEnv.DB_DATABASE || "radeeta_db",
        apiBaseUrl: readEnv(path.join(FRONTEND_DIR, ".env")).VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
        frontendDeps: frontendPackage.dependencies,
        frontendDevDeps: frontendPackage.devDependencies,
        backendReq: backendComposer.require,
        frontendPages: listBasenames(path.join(FRONTEND_DIR, "src", "pages"), /\.(jsx|js)$/),
        frontendDashboards: listBasenames(path.join(FRONTEND_DIR, "src", "dashboards"), /\.(jsx|js)$/),
        frontendComponents: listBasenames(path.join(FRONTEND_DIR, "src", "components"), /\.(jsx|js)$/),
        backendControllers: listBasenames(path.join(BACKEND_DIR, "app", "Http", "Controllers"), /\.php$/).filter((name) => name !== "Controller"),
        backendModels: listBasenames(path.join(BACKEND_DIR, "app", "Models"), /\.php$/),
        backendEnums: listBasenames(path.join(BACKEND_DIR, "app", "Enums"), /\.php$/),
        routeCount: safeApiRouteCount(),
        passedTests: safeBuildVerification(),
    };
}

function projectTree() {
    return [
        "RADEETA-Management-System/",
        "├─ frontend/",
        "│  ├─ src/",
        "│  │  ├─ api/",
        "│  │  ├─ components/",
        "│  │  ├─ context/",
        "│  │  ├─ dashboards/",
        "│  │  ├─ hooks/",
        "│  │  ├─ i18n/",
        "│  │  ├─ layouts/",
        "│  │  ├─ locales/",
        "│  │  ├─ pages/",
        "│  │  ├─ routes/",
        "│  │  └─ utils/",
        "│  ├─ package.json",
        "│  └─ vite.config.js",
        "├─ backend/",
        "│  ├─ app/",
        "│  │  ├─ Enums/",
        "│  │  ├─ Http/",
        "│  │  │  ├─ Controllers/",
        "│  │  │  ├─ Middleware/",
        "│  │  │  ├─ Requests/",
        "│  │  │  └─ Resources/",
        "│  │  ├─ Models/",
        "│  │  ├─ Notifications/",
        "│  │  ├─ Policies/",
        "│  │  ├─ Services/",
        "│  │  └─ Support/",
        "│  ├─ database/",
        "│  │  ├─ factories/",
        "│  │  ├─ migrations/",
        "│  │  └─ seeders/",
        "│  ├─ routes/api.php",
        "│  ├─ config/",
        "│  └─ tests/",
        "└─ docs/",
        "   ├─ uml-assets/",
        "   ├─ scripts de generation",
        "   └─ rapports techniques",
    ].join("\n");
}

function commandsBlock() {
    return [
        "Backend",
        "-------",
        "composer install",
        "php artisan key:generate",
        "php artisan migrate --seed",
        "php artisan serve",
        "php artisan test",
        "",
        "Frontend",
        "--------",
        "npm install",
        "npm run dev",
        "npm run build",
    ].join("\n");
}

const meta = buildProjectMetadata();
const useCaseFigure = svgToPngFigure(path.join(__dirname, "uml-assets", "use-case-diagram.svg"), 520);
const mcdFigure = svgToPngFigure(path.join(__dirname, "uml-assets", "mcd.svg"), 520);

const body = [];

function push(...items) {
    items.flat().forEach((item) => {
        if (item) body.push(item);
    });
}

push(heading1("Remerciements"));
push(
    calloutBox(
        "Section a personnaliser manuellement",
        [
            "Les noms de l'encadrant, de l'etablissement et des personnes a remercier n'apparaissent pas dans le code source. Cette partie doit donc etre adaptee avant impression.",
        ],
    ),
);
push(
    bodyParagraph(
        "Je tiens a exprimer ma profonde gratitude a toutes les personnes qui ont contribue, de pres ou de loin, a la reussite de ce stage et a la realisation du present rapport. Mes remerciements s'adressent en particulier a l'equipe pedagogique de l'OFPPT, a l'encadrant professionnel, ainsi qu'aux responsables qui ont permis l'acces au contexte metier de l'application analysee.",
    ),
);
push(
    bodyParagraph(
        "Je remercie egalement les utilisateurs et collaborateurs qui ont partage leurs remarques fonctionnelles, car leurs besoins ont constitue un appui essentiel pour comprendre la logique du projet et la maniere dont le code y repond. Cette section peut etre completee avec les noms et fonctions des personnes a citer officiellement.",
    ),
);

push(pageBreak(), heading1("Dedicace (optionnelle)"));
push(
    calloutBox(
        "Section optionnelle a completer",
        [
            "Vous pouvez personnaliser cette page avec une dedicace familiale, personnelle ou institutionnelle selon les usages de votre centre de formation.",
        ],
        COLORS.cyanSoft,
        COLORS.cyan,
    ),
);
push(
    centeredParagraph(
        "Je dedie ce travail a toutes les personnes qui m'ont soutenu durant mon parcours de formation et de stage, et plus particulierement a ma famille, a mes formateurs et a toute personne qui m'a encourage a developper mes competences techniques et professionnelles.",
        {
            spacing: { line: 360, after: 180 },
        },
    ),
);

push(pageBreak(), heading1("Resume du projet"));
push(
    bodyParagraph(
        `Le projet ${meta.projectTitle} est une application web full stack organisee en deux sous-projets distincts : un frontend React/Vite et un backend Laravel expose sous forme d'API REST. D'apres le code source analyse, l'application cible un contexte de gestion operationnelle de type SRM-FM Taza, oriente vers le suivi des reclamations, des compteurs, des secteurs, des interventions techniques et du reporting.`,
    ),
);
push(
    bodyParagraph(
        `Le frontend propose des interfaces differenciees selon les roles utilisateurs : directeur, responsable, manager, technicien et lecteur. Le backend assure quant a lui l'authentification par token avec Laravel Sanctum, le controle d'acces par role, la validation metier, la serialisation des ressources JSON, les notifications, ainsi que les exports PDF et Excel. La base de donnees relationnelle centralise les entites principales du domaine : utilisateurs, clients, compteurs, secteurs, pannes, reparations, releves, interventions, parametres, journaux d'activite et notifications.`,
    ),
);
push(
    bodyParagraph(
        "Le present rapport a ete redige a partir de l'analyse directe du code reel du projet ouvert dans VS Code. Il ne repose pas sur des suppositions fonctionnelles. Lorsqu'une information administrative ou humaine n'est pas disponible dans le depot, une zone a completer manuellement a ete prevue afin de conserver un rendu conforme a un rapport de stage professionnel OFPPT.",
    ),
);
push(
    baseParagraph(
        [
            new TextRun({
                text: "Mots-cles : ",
                bold: true,
                color: COLORS.navy,
                font: "Aptos Display",
                size: pt(11),
            }),
            textRun("React, Laravel, API REST, Sanctum, RBAC, MySQL, notifications, interventions, cartographie, rapport de stage."),
        ],
    ),
);

push(pageBreak(), heading1("Table des matieres"));
push(
    bodyParagraph(
        "Le sommaire ci-dessous est genere a partir des titres hierarchiques du document et peut etre mis a jour automatiquement dans Microsoft Word si necessaire.",
    ),
);
push(
    new TableOfContents("Sommaire", {
        headingStyleRange: "1-3",
        hyperlink: true,
    }),
);

push(pageBreak(), heading1("Introduction generale"));
push(heading2("Contexte du stage"));
push(
    bodyParagraph(
        "Dans un contexte de digitalisation des services et de rationalisation des operations metier, les organismes techniques ont besoin d'outils capables de centraliser des informations jusque-la dispersees entre plusieurs supports ou traitements manuels. Le projet analyse s'inscrit dans cette logique en proposant une plateforme web unique destinee au suivi des operations terrain et a l'administration des donnees de reference.",
    ),
);
push(heading2("Presentation du besoin"));
push(
    bodyParagraph(
        "Le code montre qu'il etait necessaire de disposer d'un systeme permettant de lier les clients, les compteurs, les secteurs geographiques, les pannes, les reparations et les interventions techniques. L'application doit egalement fournir une vue differenciee selon les profils utilisateurs, afin que chaque acteur accede uniquement aux informations utiles a son activite.",
    ),
);
push(heading2("Problematique"));
push(
    bodyParagraph(
        "La problematique principale peut etre formulee ainsi : comment concevoir une application web securisee et lisible qui permette de suivre l'ensemble du cycle de traitement d'une reclamation ou d'une anomalie, depuis son enregistrement jusqu'au reporting, tout en garantissant la coherence des donnees et le respect des droits d'acces ?",
    ),
);
push(heading2("Objectifs du projet"));
push(
    bulletParagraph("Centraliser les donnees metier dans une base relationnelle unique."),
    bulletParagraph("Proposer une interface web claire et reutilisable pour les operations quotidiennes."),
    bulletParagraph("Securiser les acces par authentification, middleware et controle par roles."),
    bulletParagraph("Faciliter la supervision grace aux tableaux de bord, a la cartographie et aux notifications."),
    bulletParagraph("Permettre l'edition de rapports et d'exports exploitables par les responsables."),
);
push(
    calloutBox(
        "Cadre de redaction du rapport",
        [
            "Le contenu des chapitres techniques suivants provient directement des fichiers du projet : routes API, modeles Eloquent, composants React, migrations, seeders, pages, dashboards et tests.",
        ],
        COLORS.amberSoft,
        COLORS.amber,
    ),
);

push(pageBreak(), heading1("Presentation de l'entreprise ou de l'etablissement"));
push(heading2("Informations administratives a completer"));
push(
    styledTable(
        ["Champ", "Valeur"],
        [
            ["Nom de l'entreprise d'accueil", "[A completer manuellement]"],
            ["Departement / service", "[A completer manuellement]"],
            ["Nom de l'encadrant professionnel", "[A completer manuellement]"],
            ["Ville", "[A completer manuellement]"],
            ["Annee universitaire", "2025 / 2026"],
        ],
        [35, 65],
    ),
);
push(heading2("Description du contexte metier observe"));
push(
    bodyParagraph(
        `Le depot ne fournit pas une fiche administrative officielle de l'entreprise d'accueil, mais plusieurs indices convergents apparaissent dans le code : l'application se presente sous le nom ${meta.appName}, la mention "${meta.brandSubtitle}" revient dans le frontend, l'agence par defaut est "SRM-FM Taza" et la base locale configuree est "${meta.dbName}". Ces indices laissent apparaitre un environnement metier oriente vers la gestion technique locale de services tels que l'eau et l'electricite.`,
    ),
);
push(heading2("Activites principales couvertes par le systeme"));
push(
    bulletParagraph("Gestion des utilisateurs et des droits d'acces."),
    bulletParagraph("Gestion des clients, des compteurs et des secteurs geographiques."),
    bulletParagraph("Declaration, affectation et suivi des pannes."),
    bulletParagraph("Gestion des reparations et des interventions techniques."),
    bulletParagraph("Saisie des releves et calcul de la consommation dans le backend."),
    bulletParagraph("Consultation de tableaux de bord, notifications et exports de rapports."),
);
push(heading2("Contexte du projet"));
push(
    bodyParagraph(
        "Le projet repond a un besoin de structuration et de supervision des operations. Au lieu de traiter les informations de maniere dispersee, l'application rassemble les donnees de reference, les actions de terrain et la traçabilite au sein d'une architecture web separee, composee d'une interface React et d'une API Laravel. Cette approche facilite la maintenance, la securite et l'evolution du systeme.",
    ),
);

push(pageBreak(), heading1("Etude des besoins"));
push(heading2("Besoins fonctionnels"));
push(
    bulletParagraph("Authentifier les utilisateurs et rediriger chacun vers son espace de travail."),
    bulletParagraph("Consulter, creer, modifier ou supprimer certaines ressources selon le role."),
    bulletParagraph("Affecter une panne a un technicien et suivre son etat."),
    bulletParagraph("Enregistrer les reparations et cloturer automatiquement les pannes traitees."),
    bulletParagraph("Creer des interventions techniques structurees avec priorite, statut et materiels."),
    bulletParagraph("Consulter les notifications et marquer celles-ci comme lues."),
    bulletParagraph("Generer un rapport PDF mensuel des pannes et un export Excel clients + compteurs."),
);
push(heading2("Besoins non fonctionnels"));
push(
    bulletParagraph("Assurer la securite des acces par token, middleware et controle metier cote backend."),
    bulletParagraph("Garantir la coherence des donnees grace aux validations, transactions et hooks de modeles."),
    bulletParagraph("Maintenir une bonne lisibilite de l'interface par des composants reutilisables et une navigation claire."),
    bulletParagraph("Permettre la maintenance du projet grace a une separation nette frontend / backend."),
    bulletParagraph("Offrir une base exploitable pour le reporting et l'evolution future du systeme."),
);
push(heading2("Acteurs du systeme"));
push(
    styledTable(
        ["Acteur", "Role principal dans le systeme"],
        [
            ["Directeur", "Acces global, gestion des utilisateurs, consultation des logs, parametres et purge des tokens API."],
            ["Responsable", "Pilotage complet des modules metier et gestion avancee des donnees operationnelles."],
            ["Manager", "Supervision des operations, gestion des pannes, reparations, interventions et rapports."],
            ["Technicien", "Traitement des taches affectees, mise a jour des pannes, reparations et interventions terrain."],
            ["Lecteur", "Consultation en lecture seule des donnees metier et des notifications."],
            ["Developpeur", "Role technique present dans le code mais bloque en production."],
        ],
        [20, 80],
    ),
);
push(heading2("Cas d'utilisation principaux"));
push(
    bulletParagraph("Se connecter, verifier la session et se deconnecter."),
    bulletParagraph("Consulter un dashboard adapte au role de l'utilisateur."),
    bulletParagraph("Gerer le referentiel clients, compteurs et secteurs."),
    bulletParagraph("Declarer, consulter, affecter et suivre une panne."),
    bulletParagraph("Creer une reparation et une intervention technique."),
    bulletParagraph("Consulter ou administrer les utilisateurs, les parametres et le journal d'activite."),
    bulletParagraph("Generer des exports PDF et Excel pour le suivi operationnel."),
);

push(pageBreak(), heading1("Analyse et conception"));
push(heading2("Vue d'ensemble de la conception"));
push(
    bodyParagraph(
        "Le projet suit une logique de separation des responsabilites. Le frontend React prend en charge la presentation, la navigation et l'interaction utilisateur. Le backend Laravel centralise la logique metier, l'authentification, la validation, le controle d'acces et les exports. La base MySQL assure la persistance des entites metier et systeme.",
    ),
);
push(...imageFigure("Diagramme de cas d'utilisation", "Diagramme de cas d'utilisation reconstruit a partir des roles, des routes API et des modules React reels du projet.", useCaseFigure.buffer, useCaseFigure.width, useCaseFigure.height));
push(
    bodyParagraph(
        "Le diagramme de cas d'utilisation met en evidence les differents profils metier ainsi que les actions qui leur sont associees. Il montre notamment que le technicien n'agit que sur les elements affectes, alors que le directeur dispose d'un acces global sur les modules sensibles comme l'administration, les parametres et les journaux d'activite.",
    ),
);
push(...imageFigure("MCD / modele relationnel", "Modele conceptuel de donnees deduit des migrations, des modeles Eloquent et des relations chargees par l'API.", mcdFigure.buffer, mcdFigure.width, mcdFigure.height));
push(
    bodyParagraph(
        "Le modele de donnees s'articule autour de tables de reference (users, secteurs, clients, compteurs) et de tables operationnelles (pannes, reparations, interventions, releves). A cela s'ajoutent des tables de support telles que settings, activity_logs, notifications et personal_access_tokens.",
    ),
);
push(heading2("Description synthétique des principales tables"));
push(
    styledTable(
        ["Table", "Description", "Relations principales"],
        [
            ["users", "Comptes applicatifs avec identifiant, agence et role.", "Liee aux pannes affectees, reparations, interventions, releves, logs et notifications."],
            ["secteurs", "Zones geographiques avec emplacement, tournee et coordonnees.", "Liee aux clients et compteurs ; les pannes y sont rattachees indirectement via les compteurs."],
            ["clients", "Abonnes et informations administratives.", "Un client peut posseder plusieurs compteurs."],
            ["compteurs", "Compteurs physiques eau / electricite.", "Chaque compteur appartient a un client et a un secteur ; il porte les pannes et releves."],
            ["pannes", "Anomalies declarees sur le terrain.", "Chaque panne est reliee a un compteur et peut etre affectee a un technicien."],
            ["reparations", "Operations de reparation liees aux pannes.", "Une reparation est reliee a une panne et a un technicien / plombier."],
            ["interventions", "Rapports d'intervention structurees.", "Reliees a une panne, un client, un compteur et un technicien."],
            ["releves", "Lectures de compteurs et consommation calculee.", "Chaque releve est relie a un compteur et a un createur."],
            ["settings", "Parametres applicatifs serialises en JSON.", "Utilises pour la configuration generale."],
            ["activity_logs", "Journal des actions sensibles.", "Permet la traçabilite des operations."],
            ["notifications", "Notifications Laravel stockees en base.", "Diffusion d'informations aux utilisateurs autorises."],
        ],
        [14, 33, 53],
    ),
);
push(heading2("Relations entre les entites"));
push(
    bulletParagraph("Un secteur peut contenir plusieurs clients et plusieurs compteurs."),
    bulletParagraph("Un client peut posseder plusieurs compteurs."),
    bulletParagraph("Un compteur peut porter plusieurs pannes et plusieurs releves."),
    bulletParagraph("Une panne peut etre affectee a un technicien et reliee a plusieurs interventions."),
    bulletParagraph("Une reparation est reliee a une panne et permet de la marquer comme resolue."),
    bulletParagraph("Une intervention relie la panne, le client, le compteur et le technicien au sein d'un rapport technique."),
);
push(heading2("Architecture generale"));
push(
    styledTable(
        ["Couche", "Elements reels du projet", "Role technique"],
        [
            ["Presentation", "React 19, Vite 8, Tailwind, React Router 7, i18next", "Construire l'interface SPA, les pages par role et les composants reutilisables."],
            ["Communication", "Axios et endpoints centralises", "Envoyer les requetes HTTP et injecter le token Bearer."],
            ["Metier / API", "Laravel 11, controllers, resources, services, policies, requests", "Porter la logique metier, la validation et les reponses JSON."],
            ["Persistance", `${meta.dbConnection.toUpperCase()} / ${meta.dbName}`, "Stocker les donnees metier et systeme via Eloquent et les migrations."],
        ],
        [18, 36, 46],
    ),
);

push(pageBreak(), heading1("Technologies utilisees"));
push(
    bodyParagraph(
        "Les technologies suivantes ont ete identifiees directement dans les fichiers package.json, composer.json, .env et dans la structure du projet. Elles sont presentees par couche afin de faciliter la lecture technique du rapport.",
    ),
);
push(
    styledTable(
        ["Couche", "Technologies / versions observees", "Utilisation dans le projet"],
        [
            ["Frontend", `React ${meta.frontendDeps.react}, React DOM ${meta.frontendDeps["react-dom"]}, Vite ${meta.frontendDevDeps.vite}, Tailwind ${meta.frontendDevDeps.tailwindcss}`, "Base de l'interface SPA, rendu des pages et pipeline de build."],
            ["Navigation / API", `React Router DOM ${meta.frontendDeps["react-router-dom"]}, Axios ${meta.frontendDeps.axios}`, "Navigation par role et consommation des endpoints REST."],
            ["Visualisation", `Recharts ${meta.frontendDeps.recharts}, Leaflet ${meta.frontendDeps.leaflet}, react-leaflet ${meta.frontendDeps["react-leaflet"]}`, "Graphiques de dashboard et cartographie operationnelle."],
            ["IHM / UX", `Lucide React ${meta.frontendDeps["lucide-react"]}, Framer Motion ${meta.frontendDeps["framer-motion"]}`, "Icônes et animation de certains elements d'interface."],
            ["Internationalisation", `i18next ${meta.frontendDeps.i18next}, react-i18next ${meta.frontendDeps["react-i18next"]}`, "Gestion des libelles FR/EN."],
            ["Backend", `PHP ${meta.backendReq.php}, Laravel ${meta.backendReq["laravel/framework"]}`, "API REST, logique metier, ressources JSON, configuration et ecosysteme applicatif."],
            ["Securite", `Laravel Sanctum ${meta.backendReq["laravel/sanctum"]}`, "Generation et verification des tokens d'authentification."],
            ["Exports", `DomPDF ${meta.backendReq["barryvdh/laravel-dompdf"]}, Laravel Excel ${meta.backendReq["maatwebsite/excel"]}`, "Generation du PDF des pannes et de l'export Excel clients + compteurs."],
            ["Qualite", `PHPUnit ${meta.backendComposer ? "" : ""}`, "Tests backend fonctionnels et unitaires."],
        ].filter(Boolean),
        [18, 37, 45],
    ),
);
push(heading2("Outils de developpement"));
push(
    bulletParagraph("Visual Studio Code comme environnement de travail principal."),
    bulletParagraph("Git pour le suivi des versions du projet."),
    bulletParagraph("ESLint cote frontend et PHPUnit cote backend pour la qualite."),
    bulletParagraph("Migrations, factories et seeders pour la structure et la preparation des donnees."),
);
push(heading2("Configuration observee"));
push(
    bodyParagraph(
        `L'environnement local du projet pointe le frontend vers l'API ${meta.apiBaseUrl}. Le backend utilise la base ${meta.dbConnection.toUpperCase()} nommee ${meta.dbName}. Cette separation montre un decouplage clair entre la couche de presentation et la couche metier.`,
    ),
);

push(pageBreak(), heading1("Realisation du projet"));
push(heading2("Organisation generale du frontend"));
push(
    bodyParagraph(
        `Le frontend est structure autour d'un routeur principal (App.jsx), d'un contexte d'authentification (AuthContext.jsx), d'un layout global (Layout, Sidebar, Topbar) et d'un ensemble de pages metier. Les pages detectees dans le projet sont : ${meta.frontendPages.join(", ")}. Les dashboards specifiques par role sont : ${meta.frontendDashboards.join(", ")}.`,
    ),
);
push(
    bodyParagraph(
        "Les composants reutilisables jouent un role central. DataTable fournit la recherche, le tri, la pagination et les actions conditionnees par role. EntityFormModal encapsule les formulaires CRUD. PanneMap affiche les donnees cartographiques. NotificationBell, Badge, Modal, ConfirmDialog et les composants UI generalisent l'ergonomie de l'application.",
    ),
);
push(heading2("Organisation generale du backend"));
push(
    bodyParagraph(
        `Le backend s'organise autour de controllers Laravel, de modeles Eloquent et de ressources JSON. Les principaux controllers detectes sont : ${meta.backendControllers.join(", ")}. Les modeles detectes sont : ${meta.backendModels.join(", ")}. Cette organisation rend lisible la separation entre exposition API, metier, persistance et serialisation.`,
    ),
);
push(
    bodyParagraph(
        `Les routes API recensees lors de la verification sont au nombre de ${meta.routeCount || "plusieurs dizaines"}. Elles couvrent l'authentification, les tableaux de bord, les notifications, les modules CRUD metier, l'administration, les parametres, les journaux d'activite et les exports.`,
    ),
);

push(heading2("Fonctionnalites realisees"));
push(heading3("Authentification et redirection par role"));
push(
    bodyParagraph(
        "La page de connexion permet a l'utilisateur de s'authentifier avec un identifiant ou une adresse email ainsi qu'un mot de passe. Une fois connecte, le frontend appelle l'API /me pour valider la session, stocke le token dans le navigateur et redirige l'utilisateur vers un dashboard defini selon son role.",
    ),
);
push(heading3("Dashboards et visualisation"));
push(
    bodyParagraph(
        "Les dashboards reutilisent un socle commun (DashboardShared.jsx) pour afficher des cartes de statistiques, des graphiques Recharts et une carte Leaflet. Le backend fournit des indicateurs tels que le nombre total de clients, de compteurs, de secteurs, de pannes ouvertes et d'interventions, ainsi qu'une repartition eau / electricite et un classement des techniciens.",
    ),
);
push(heading3("Gestion du referentiel"));
push(
    bodyParagraph(
        "Les pages Clients, Compteurs et Secteurs implementent un CRUD coherent a l'aide des memes composants. Les formulaires tiennent compte des contraintes de validation observees cote backend : police unique pour les clients, cadran unique pour les compteurs, rattachement a un secteur, type de service eau ou electricite et statut d'abonnement.",
    ),
);
push(heading3("Gestion des pannes et des reparations"));
push(
    bodyParagraph(
        "Le module Pannes permet la consultation, le filtrage et, selon le role, la creation ou la mise a jour d'une anomalie. Un responsable ou un manager peut affecter une panne a un technicien. Le module Reparations enregistre ensuite l'action corrective. Le backend cloture automatiquement la panne correspondante dans une transaction SQL afin de garantir la coherence du traitement.",
    ),
);
push(heading3("Gestion des interventions techniques"));
push(
    bodyParagraph(
        "La page Interventions formalise le travail terrain sous forme de rapports structures : numero d'intervention, panne liee, technicien, client, compteur, type de service, type de travail, materiels utilises, priorite, statut, date de debut et date de fin. L'API hydrate automatiquement certaines informations a partir de la panne afin de reduire les saisies redondantes.",
    ),
);
push(heading3("Administration, parametres et journal d'activite"));
push(
    bodyParagraph(
        "Le module Administration est reserve au directeur. Il regroupe la gestion des comptes utilisateurs, une vue synthese des permissions par role, la modification des parametres applicatifs et la consultation du journal d'activite. Ce dernier enregistre plusieurs actions sensibles comme la connexion, la creation d'utilisateur, la mise a jour des interventions ou la modification des parametres.",
    ),
);
push(heading3("Notifications et rapports"));
push(
    bodyParagraph(
        "Le projet integre un systeme de notifications Laravel stockees en base. Cote frontend, la cloche de notifications recharge periodiquement les elements non lus. Le module Reports permet le telechargement d'un PDF mensuel des pannes et d'un export Excel des clients et compteurs. Cette fonctionnalite est appuyee cote backend par DomPDF et Laravel Excel.",
    ),
);
push(heading3("Module releves present dans le code"));
push(
    bodyParagraph(
        "Le backend expose un module complet de releves via /api/releves et le frontend contient une page Releves.jsx ainsi qu'un graphique de consommation. Toutefois, a la date de l'analyse, ce module n'est pas branche dans le routage principal App.jsx. Il est donc pertinent de le presenter comme une fonctionnalite techniquement presente dans le code, mais encore peu visible dans l'experience utilisateur finale.",
    ),
);

push(heading2("Description des interfaces"));
push(
    placeholderFigure(
        "Figure 1 - Interface de connexion",
        "Page Login.jsx : formulaire de connexion, message d'erreur, affichage / masquage du mot de passe et redirection par role.",
    ),
    placeholderFigure(
        "Figure 2 - Dashboard et cartographie",
        "Dashboards role-based : cartes de statistiques, graphiques Recharts et carte Leaflet des secteurs / pannes.",
    ),
    placeholderFigure(
        "Figure 3 - Gestion des anomalies et interventions",
        "Pages Pannes.jsx et Interventions.jsx : filtres, tableau, formulaires modaux et liaison metier entre les modules.",
    ),
    placeholderFigure(
        "Figure 4 - Administration et journal d'activite",
        "Page Administration.jsx : utilisateurs, roles, parametres et logs du systeme.",
    ),
);
push(
    calloutBox(
        "Remarque sur les captures d'ecran",
        [
            "Le projet a bien ete analyse au niveau du code, mais aucune capture exploitable n'etait presente dans le depot. Les emplacements ci-dessus sont donc prets a recevoir des captures reelles de l'application lancee localement avant la soutenance.",
        ],
        COLORS.redSoft,
        COLORS.red,
    ),
);

push(heading2("Flux des donnees"));
push(
    bulletParagraph("L'utilisateur se connecte depuis le frontend ; l'API retourne un token Sanctum et le profil du compte."),
    bulletParagraph("Le token est ajoute automatiquement par Axios dans les requetes ulterieures via l'en-tete Authorization: Bearer."),
    bulletParagraph("Le frontend interroge les endpoints REST pour charger les listes, dashboards, notifications et formulaires."),
    bulletParagraph("Les controllers Laravel valident les donnees, appliquent les regles metier et retournent des resources JSON."),
    bulletParagraph("Les modeles Eloquent manipulent la base MySQL et maintiennent les relations entre entites."),
    bulletParagraph("Les reponses sont affichees dans les composants React ou transformees en fichiers telechargeables (PDF / Excel)."),
);

push(pageBreak(), heading1("Securite et authentification"));
push(heading2("Gestion des utilisateurs"));
push(
    bodyParagraph(
        "Le backend gere les comptes via la table users et le controleur UserController. Le createur d'un compte doit obligatoirement renseigner un identifiant, un mot de passe, une agence et un role. Les roles assignables sont limites a directeur, responsable, manager, technicien et lecteur. Le role developpeur existe dans le code mais ne peut pas etre attribue en production.",
    ),
);
push(heading2("Gestion des roles"));
push(
    bodyParagraph(
        "Cote frontend, le fichier rbac.js centralise les constantes de roles et les droits de creation, modification, suppression et acces aux dashboards. Cote backend, le middleware EnsureUserHasRole applique le controle definitif. Le directeur contourne tous les controles role:* alors que les autres profils doivent explicitement appartenir a la liste autorisee.",
    ),
);
push(heading2("Middleware, policies et scopes metier"));
push(
    bodyParagraph(
        "L'application ne se limite pas a un simple filtrage visuel. ProtectedRoute protege les chemins React. Le middleware auth:sanctum protege toutes les routes privees de l'API. La policy InterventionPolicy controle les acces au module interventions. Enfin, la classe OperatorAccess limite techniquement les requetes d'un technicien a ses propres pannes, reparations, releves, compteurs et clients lies.",
    ),
);
push(heading2("Validation et coherence metier"));
push(
    bulletParagraph("AuthController valide les identifiants et interdit le role developpeur en production."),
    bulletParagraph("ReparationRequest impose une seule reparation active par panne et verifie la date de reparation."),
    bulletParagraph("ReleveController verifie que le nouvel index est superieur ou egal a l'ancien."),
    bulletParagraph("Releve.php calcule automatiquement la consommation avant sauvegarde."),
    bulletParagraph("InterventionController normalise les statuts et hydrate client / compteur / service a partir de la panne."),
    bulletParagraph("PanneController normalise certains anciens libelles frontend pour rester compatible avec des payloads legacy."),
);
push(heading2("Protection API et comportement frontend"));
push(
    bodyParagraph(
        "Le client Axios ajoute le token Bearer a chaque requete et purge automatiquement la session locale en cas de reponse 401. En cas de 403, un evenement frontend peut rediriger l'utilisateur vers une page d'acces refuse. Cette double protection garantit qu'une action interdite n'est pas seulement cachee dans l'interface : elle est egalement refusee par l'API.",
    ),
);
push(heading2("Verification par les tests"));
if (meta.passedTests) {
    push(
        bodyParagraph(
            `Lors de la verification realisee pendant la generation de ce rapport, le backend Laravel a execute avec succes ${meta.passedTests} tests automatises. Les scenarios couverts portent notamment sur la protection des routes, les droits du technicien, l'acces lecture seule du profil lecteur, la creation d'interventions et les contraintes de gestion des clients.`,
        ),
    );
} else {
    push(
        bodyParagraph(
            "Le depot contient des tests fonctionnels et unitaires, notamment RbacApiTest.php et ClientApiTest.php, qui valident les scenarios de securite et plusieurs comportements metier. Cette section peut etre completee manuellement avec le resultat de l'execution des tests sur votre poste.",
        ),
    );
}

push(pageBreak(), heading1("Difficultes rencontrees"));
push(
    calloutBox(
        "Important",
        [
            "Le code permet d'identifier plusieurs difficultes techniques probables au travers des migrations, des normalisations et des adaptations de compatibilite.",
            "Pour une soutenance plus personnelle, il est recommande d'ajouter a ce chapitre votre propre retour d'experience de stage : problemes d'installation, communication, comprehension du besoin, delais, tests ou deploiement.",
        ],
        COLORS.amberSoft,
        COLORS.amber,
    ),
);
push(
    styledTable(
        ["Difficulte technique observable", "Indices dans le code", "Solution apportee"],
        [
            ["Harmonisation d'un existant heterogene", "Presence d'anciens roles (super_admin, admin, operator, plombier), renommages de colonnes et normalisations legacy.", "Migrations de compatibilite, normalisation des roles, redirections legacy et adaptation des payloads."],
            ["Controle d'acces fin pour les techniciens", "Besoin de limiter l'acces a des pannes, releves et compteurs precis.", "Classe OperatorAccess, policy d'intervention, verifications supplementaires dans les controllers."],
            ["Coherence entre pannes, reparations et interventions", "Risque de divergence d'etat si plusieurs operations sont enchainees sans transaction.", "Transactions SQL, validations personnalisees et mise a jour automatique du statut des pannes."],
            ["Evolution des modules fonctionnels", "Le frontend conserve des traces de modules legacy supprimes (factures, paiements, tarifs) et le module releves n'est pas route.", "Intercepteurs Axios pour modules legacy, reorganisation progressive des ecrans et pistes d'amelioration futures."],
        ],
        [24, 34, 42],
    ),
);
push(heading2("Exemples de solutions visibles dans le projet"));
push(
    bulletParagraph("Migrations de normalisation pour converger vers une nomenclature unique."),
    bulletParagraph("Transactions DB pour garantir l'atomicite de certaines operations metier."),
    bulletParagraph("Composants frontend reutilisables afin de limiter la duplication."),
    bulletParagraph("Tests backend pour verifier les permissions et plusieurs scenarios critiques."),
);

push(pageBreak(), heading1("Conclusion generale"));
push(heading2("Bilan"));
push(
    bodyParagraph(
        `${meta.projectTitle} constitue une base technique serieuse pour une application metier de gestion des reclamations et des interventions. L'architecture separant frontend React et backend Laravel est coherentement exploitee. La securite est renforcee a plusieurs niveaux, la base de donnees couvre les principales entites du domaine et les modules de supervision, de cartographie et d'export renforcent la valeur pratique de l'outil.`,
    ),
);
push(heading2("Competences acquises"));
push(
    bulletParagraph("Conception et lecture d'une architecture full stack separee."),
    bulletParagraph("Utilisation de React, Vite, Tailwind et composants reutilisables pour une SPA."),
    bulletParagraph("Mise en place d'une API REST Laravel avec validation, resources JSON et middleware."),
    bulletParagraph("Manipulation d'une base relationnelle via migrations, modeles Eloquent et seeders."),
    bulletParagraph("Application d'un controle d'acces par roles et d'une logique metier securisee."),
    bulletParagraph("Generation d'exports, exploitation de tests et analyse d'un codebase reel."),
);
push(heading2("Perspectives d'amelioration"));
push(
    bulletParagraph("Raccorder la page Releves au routeur principal si le module doit devenir visible dans la version courante."),
    bulletParagraph("Aligner plus strictement les droits d'acces frontend / backend pour la page Reports cote lecteur."),
    bulletParagraph("Optimiser le bundle frontend si l'application continue de grandir."),
    bulletParagraph("Remplacer le polling des notifications par un mecanisme temps reel si le besoin metier l'exige."),
    bulletParagraph("Poursuivre la documentation et la couverture de tests pour faciliter le deploiement et la maintenance."),
);

push(pageBreak(), heading1("Annexes"));
push(heading2("Annexe A - Extraits de code importants"));
push(
    ...codeBlock(
        "Authentification et generation du token (AuthController.php)",
        `\$validated = \$request->validate([
    'identifiant' => ['required', 'string'],
    'password' => ['required', 'string'],
]);

\$user = User::query()
    ->where('identifiant', \$validated['identifiant'])
    ->orWhere('email', \$validated['identifiant'])
    ->first();

\$token = \$user->createToken('api-token')->plainTextToken;`,
    ),
);
push(
    ...codeBlock(
        "Calcul automatique de la consommation (Releve.php)",
        `protected static function booted(): void
{
    static::saving(function (Releve \$releve): void {
        \$releve->consommation = max(
            0,
            (float) \$releve->nouvel_index - (float) \$releve->ancien_index
        );
    });
}`,
    ),
);
push(
    ...codeBlock(
        "Cloture transactionnelle de la panne (ReparationController.php)",
        `\$reparation = DB::transaction(function () use (\$validated): Reparation {
    \$reparation = Reparation::create(\$validated);
    \$reparation->panne()->update([
        'status' => PanneStatus::Resolved->value,
    ]);

    return \$reparation;
});`,
    ),
);
push(
    ...codeBlock(
        "Protection des routes frontend (ProtectedRoute.jsx)",
        `if (!isAuthenticated || !isKnownRole(role)) {
  return <Navigate to="/login" replace state={{ from: location }} />;
}

if (roles && !hasRole(role, roles)) {
  return <Navigate to="/access-denied" replace />;
}

return <Outlet />;`,
    ),
);

push(pageBreak(), heading2("Annexe B - Commandes utiles"));
push(...codeBlock("Commandes principales de travail", commandsBlock()));

push(pageBreak(), heading2("Annexe C - Structure du projet"));
push(...codeBlock("Arborescence synthétique", projectTree()));

push(pageBreak(), heading2("Annexe D - Inventaire des fichiers cles"));
push(
    styledTable(
        ["Categorie", "Fichiers / elements detectes"],
        [
            ["Pages frontend", meta.frontendPages.join(", ")],
            ["Dashboards frontend", meta.frontendDashboards.join(", ")],
            ["Composants frontend", meta.frontendComponents.join(", ")],
            ["Controllers backend", meta.backendControllers.join(", ")],
            ["Modeles backend", meta.backendModels.join(", ")],
            ["Enums backend", meta.backendEnums.join(", ")],
        ],
        [22, 78],
    ),
);

const coverChildren = [
    centeredParagraph("OFPPT - Rapport de stage professionnel", {
        spacing: { after: 140 },
        children: [
            new TextRun({
                text: "OFPPT - Rapport de stage professionnel",
                bold: true,
                color: COLORS.blue,
                font: "Aptos Display",
                size: pt(16),
            }),
        ],
    }),
    centeredParagraph(meta.projectTitle, {
        spacing: { before: 260, after: 120 },
        children: [
            new TextRun({
                text: meta.projectTitle,
                bold: true,
                color: COLORS.navy,
                font: "Aptos Display",
                size: pt(24),
            }),
        ],
    }),
    centeredParagraph("Analyse academique basee sur le code reel du projet ouvert dans VS Code", {
        spacing: { after: 240 },
        children: [
            new TextRun({
                text: "Analyse academique basee sur le code reel du projet ouvert dans VS Code",
                color: COLORS.muted,
                font: "Aptos",
                size: pt(12),
                italics: true,
            }),
        ],
    }),
    styledTable(
        ["Information", "Valeur"],
        [
            ["Titre du projet", meta.projectTitle],
            ["Application metier visible dans le frontend", `${meta.appName} - ${meta.brandSubtitle}`],
            ["Nom du stagiaire", "[A completer manuellement]"],
            ["Encadrant", "[A completer manuellement]"],
            ["Etablissement / entreprise", "[A completer manuellement]"],
            ["Annee universitaire", "2025 / 2026"],
        ],
        [38, 62],
    ),
    new Paragraph({ spacing: { after: 140 } }),
    calloutBox(
        "Portee du document",
        [
            "Ce rapport a ete genere a partir de l'analyse du frontend, du backend, de la base de donnees, des routes, des modeles, des controllers, des composants, des tests et des diagrammes disponibles dans le projet.",
            "Les informations humaines ou administratives absentes du depot ont ete volontairement laissees a completer manuellement.",
        ],
        COLORS.blueSoft,
        COLORS.blue,
    ),
    new Paragraph({ spacing: { after: 180 } }),
    styledTable(
        ["Indicateur", "Valeur"],
        [
            ["Routes API detectees", String(meta.routeCount || "N/A")],
            ["Modeles backend detectes", String(meta.backendModels.length)],
            ["Controllers backend detectes", String(meta.backendControllers.length)],
            ["Pages frontend detectees", String(meta.frontendPages.length)],
            ["Base de donnees observee", `${meta.dbConnection.toUpperCase()} / ${meta.dbName}`],
        ],
        [45, 55],
    ),
];

const header = new Header({
    children: [
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0 },
            border: {
                bottom: {
                    ...border(COLORS.line, 2),
                    space: 4,
                },
            },
            children: [
                new TextRun({
                    text: `Rapport de stage - ${meta.projectTitle}`,
                    color: COLORS.muted,
                    font: "Aptos",
                    size: pt(9.5),
                }),
            ],
        }),
    ],
});

const footer = new Footer({
    children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            border: {
                top: {
                    ...border(COLORS.line, 2),
                    space: 4,
                },
            },
            children: [
                new TextRun({
                    text: `${meta.projectTitle} - Page `,
                    color: COLORS.muted,
                    font: "Aptos",
                    size: pt(9),
                }),
                new TextRun({
                    color: COLORS.muted,
                    font: "Aptos",
                    size: pt(9),
                    children: [PageNumber.CURRENT],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    title: `Rapport de stage - ${meta.projectTitle}`,
    subject: "Rapport de stage professionnel genere a partir du code source du projet",
    description: "Rapport de stage professionnel OFPPT base sur l'analyse reelle du projet RADEETA Management System.",
    creator: "OpenAI Codex",
    keywords: "rapport de stage, OFPPT, React, Laravel, API REST, RBAC, MySQL",
    features: {
        updateFields: true,
    },
    sections: [
        {
            properties: {
                page: {
                    size: {
                        width: A4_WIDTH,
                        height: A4_HEIGHT,
                    },
                    margin: PAGE_MARGINS,
                },
            },
            children: coverChildren,
        },
        {
            properties: {
                page: {
                    size: {
                        width: A4_WIDTH,
                        height: A4_HEIGHT,
                    },
                    margin: PAGE_MARGINS,
                    pageNumbers: {
                        start: 1,
                    },
                },
            },
            headers: {
                default: header,
            },
            footers: {
                default: footer,
            },
            children: body,
        },
    ],
});

Packer.toBuffer(doc)
    .then((buffer) => {
        fs.writeFileSync(OUTPUT_PATH, buffer);
        console.log(`Word report generated: ${OUTPUT_PATH}`);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
