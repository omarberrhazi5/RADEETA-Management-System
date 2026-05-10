<?php

declare(strict_types=1);

require __DIR__.'/../backend/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

date_default_timezone_set('Africa/Lagos');

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function paragraph(string $text): string
{
    return '<p>'.nl2br(esc($text)).'</p>';
}

function note(string $text): string
{
    return '<div class="note">'.nl2br(esc($text)).'</div>';
}

function bullets(array $items): string
{
    $html = '<ul>';
    foreach ($items as $item) {
        $html .= '<li>'.nl2br(esc($item)).'</li>';
    }
    $html .= '</ul>';

    return $html;
}

function codeBlock(string $code): string
{
    return '<pre><code>'.esc(trim($code)).'</code></pre>';
}

function tableHtml(array $headers, array $rows): string
{
    $html = '<table><thead><tr>';
    foreach ($headers as $header) {
        $html .= '<th>'.esc((string) $header).'</th>';
    }
    $html .= '</tr></thead><tbody>';

    foreach ($rows as $row) {
        $html .= '<tr>';
        foreach ($row as $cell) {
            $html .= '<td>'.nl2br(esc((string) $cell)).'</td>';
        }
        $html .= '</tr>';
    }

    $html .= '</tbody></table>';

    return $html;
}

function section(string $title, string $body, bool $pageBreak = false): string
{
    $class = $pageBreak ? 'section page-break' : 'section';

    return '<section class="'.$class.'"><h2>'.esc($title).'</h2>'.$body.'</section>';
}

$generatedAt = date('d/m/Y H:i');

$summaryRows = [
    ['Nom du projet', 'Depot : RADEETA-Management-System'],
    ['Nom visible dans l\'interface', 'SRM-FM'],
    ['Objectif principal', 'Centraliser la gestion des reclamations clients, des secteurs, des compteurs, des interventions techniques et des rapports.'],
    ['Probleme resolu', 'Eviter une gestion dispersee des incidents terrain et faciliter le suivi par role dans une seule application web.'],
];

$rolesRows = [
    ['directeur', 'Acces global, administration, utilisateurs, parametres, journaux.'],
    ['responsable', 'Pilotage principal du systeme, CRUD metier, dashboard, rapports.'],
    ['manager', 'Suivi operationnel, pannes, interventions, rapports, compteurs.'],
    ['technician', 'Travail terrain sur les pannes assignees, reparations, interventions, taches.'],
    ['viewer', 'Lecture seule sur plusieurs modules metier.'],
    ['developer', 'Role technique present dans le code, bloque en production.'],
];

$techRows = [
    ['Frontend', 'React 19, Vite 8, Tailwind CSS, React Router 7'],
    ['Backend', 'Laravel 11, PHP 8.2'],
    ['Base de donnees', 'MySQL observe dans backend/.env + Eloquent ORM'],
    ['Authentification', 'Laravel Sanctum + token Bearer + middleware de role'],
    ['Bibliotheques importantes', 'Axios, Recharts, Leaflet/react-leaflet, i18next, lucide-react, framer-motion, DomPDF, Laravel Excel'],
    ['Tests / qualite', 'PHPUnit cote backend, ESLint cote frontend'],
];

$dbRows = [
    ['users', 'Comptes de connexion et roles', '1 utilisateur peut etre technicien assigne, createur de releve ou auteur de journal.'],
    ['secteurs', 'Zones geographiques avec emplacement, agence et coordonnees', '1 secteur contient plusieurs compteurs.'],
    ['clients', 'Abonnes avec police, CIN, telephone, adresse, type d\'abonnement', '1 client peut avoir plusieurs compteurs.'],
    ['compteurs', 'Compteurs lies a un client et un secteur', '1 compteur peut avoir plusieurs pannes et releves.'],
    ['pannes', 'Reclamations / anomalies sur les compteurs', '1 panne appartient a 1 compteur et peut etre assignee a 1 technicien.'],
    ['reparations', 'Actions de reparation liees a une panne', '1 reparation appartient a 1 panne et 1 technicien.'],
    ['interventions', 'Rapports techniques plus detailles', 'Lies a la panne, au client, au compteur et au technicien.'],
    ['releves', 'Lectures d\'index de compteur', 'Calcul automatique de la consommation.'],
    ['settings', 'Parametres applicatifs', 'Reserve au directeur.'],
    ['activity_logs', 'Historique d\'actions', 'Trace les connexions et modifications importantes.'],
    ['notifications', 'Notifications Laravel en base', 'Utilisees dans la cloche du frontend.'],
    ['personal_access_tokens', 'Tokens Sanctum', 'Gere l\'authentification API.'],
];

$featuresRows = [
    ['Authentification', 'Connexion par identifiant ou email, mot de passe, token Sanctum et deconnexion.'],
    ['Dashboards', 'Statistiques, graphiques Recharts, carte des pannes et indicateurs par role.'],
    ['CRUD metier', 'Clients, compteurs, secteurs, pannes, reparations, interventions.'],
    ['Gestion des utilisateurs', 'Creation, mise a jour, attribution des roles, module administration.'],
    ['Affectation des pannes', 'Un technicien ne voit que les pannes qui lui sont assignees.'],
    ['Reparations', 'Une reparation valide ferme automatiquement la panne associee.'],
    ['Interventions', 'Suivi des travaux, priorite, materiaux, dates et statut.'],
    ['Notifications', 'Cloche frontend avec marquage comme lu et rechargement regulier.'],
    ['Rapports', 'Export PDF des pannes et export Excel des clients/compteurs.'],
    ['Cartographie', 'Carte Leaflet des secteurs et incidents selon les coordonnees GPS.'],
    ['Releves', 'Module backend et page frontend presentes, consommation calculee automatiquement.'],
];

$frontendRoutesRows = [
    ['/login', 'Page de connexion'],
    ['/access-denied', 'Page de refus d\'acces'],
    ['/', 'Redirection automatique selon le role'],
    ['/administration', 'Administration du directeur'],
    ['/admin/*', 'Espace responsable : dashboard, clients, compteurs, secteurs, pannes, reparations, interventions, rapports'],
    ['/manager/*', 'Espace manager : dashboard, pannes, reparations, interventions, rapports'],
    ['/technician/*', 'Espace technicien : dashboard, taches, pannes, reparations, interventions'],
    ['/operator/*', 'Alias rediriges vers /technician/*'],
    ['/viewer/*', 'Espace lecture : dashboard, clients, compteurs, secteurs, pannes, reparations, interventions, rapports'],
];

$backendRoutesRows = [
    ['POST /api/login', 'Authentifier l\'utilisateur et creer le token'],
    ['GET /api/me, POST /api/logout', 'Lire le profil courant et fermer la session'],
    ['GET /api/dashboard/stats', 'Charger les indicateurs du dashboard'],
    ['GET/POST/PUT/DELETE /api/clients', 'CRUD des clients'],
    ['GET/POST/PUT/DELETE /api/compteurs', 'CRUD des compteurs'],
    ['GET/POST/PUT/DELETE /api/secteurs', 'CRUD des secteurs'],
    ['GET/POST/PUT/DELETE /api/pannes', 'Gestion des reclamations et affectation'],
    ['GET/POST/PUT/DELETE /api/reparations', 'Gestion des reparations'],
    ['GET/POST/PUT /api/interventions', 'Gestion des interventions'],
    ['GET/POST/PUT /api/releves', 'Gestion des releves'],
    ['GET/POST /api/notifications*', 'Lister et marquer les notifications comme lues'],
    ['GET/PUT /api/settings', 'Lire et modifier les parametres'],
    ['GET /api/logs', 'Consulter le journal d\'activite'],
    ['GET/POST/PUT /api/users*', 'Gestion des utilisateurs et liste des techniciens'],
    ['GET /api/reports/pannes/pdf', 'Exporter le rapport PDF des pannes'],
    ['GET /api/reports/clients/excel', 'Exporter le rapport Excel clients/compteurs'],
];

$questionsRows = [
    ['Pourquoi avoir separe frontend et backend ?', 'Pour avoir une interface React fluide et une API Laravel claire, securisee et reutilisable.'],
    ['Comment le projet est-il securise ?', 'Par la connexion Sanctum, le token Bearer, les routes protegees et les roles verifies aussi bien dans React que dans Laravel.'],
    ['Comment limiter un technicien a ses propres donnees ?', 'Le backend filtre ses pannes, reparations, releves et interventions avec des regles metier dediees.'],
    ['Que se passe-t-il quand une reparation est enregistree ?', 'La panne associee passe automatiquement au statut resolu.'],
    ['Pourquoi avoir une carte ?', 'Pour localiser rapidement les secteurs et visualiser les incidents sur le terrain.'],
    ['Y a-t-il des evolutions encore en cours ?', 'Oui : certaines pages existent dans le code mais leur exposition finale dans le routage ou le menu reste a verifier.'],
];

$tree = <<<'TEXT'
RADEETA-Management-System/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- dashboards/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- routes/
|   |   `-- utils/
|   `-- package.json
`-- backend/
    |-- app/
    |   |-- Enums/
    |   |-- Http/
    |   |   |-- Controllers/
    |   |   |-- Middleware/
    |   |   |-- Requests/
    |   |   `-- Resources/
    |   |-- Models/
    |   |-- Notifications/
    |   |-- Policies/
    |   |-- Services/
    |   `-- Support/
    |-- database/
    |   |-- migrations/
    |   |-- factories/
    |   `-- seeders/
    |-- routes/api.php
    `-- tests/
TEXT;

$frontendExample = <<<'CODE'
if (!isAuthenticated || !isKnownRole(role)) {
  return <Navigate to="/login" replace state={{ from: location }} />;
}

if (roles && !hasRole(role, roles)) {
  return <Navigate to="/access-denied" replace />;
}

return <Outlet />;
CODE;

$backendExample = <<<'CODE'
$reparation = DB::transaction(function () use ($validated): Reparation {
    $reparation = Reparation::create($validated);
    $reparation->panne()->update([
        'status' => PanneStatus::Resolved->value,
    ]);

    return $reparation;
});
CODE;

$modelExample = <<<'CODE'
protected static function booted(): void
{
    static::saving(function (Releve $releve): void {
        $releve->consommation = max(
            0,
            (float) $releve->nouvel_index - (float) $releve->ancien_index
        );
    });
}
CODE;

$migrationExample = <<<'CODE'
Schema::create('interventions', function (Blueprint $table): void {
    $table->id();
    $table->string('intervention_number')->unique();
    $table->foreignId('panne_id')->nullable()->constrained('pannes')->nullOnDelete();
    $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
    $table->foreignId('meter_id')->nullable()->constrained('compteurs')->nullOnDelete();
    $table->foreignId('technician_id')->constrained('users')->restrictOnDelete();
    $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
    $table->enum('status', ['en_attente', 'en_cours', 'terminee', 'annulee'])->default('en_attente');
});
CODE;

$oralSummary = "Ce projet est une application web de gestion technique et administrative. Le frontend React sert a afficher les tableaux, les dashboards, la carte et les formulaires, tandis que le backend Laravel expose une API securisee par roles. Le coeur metier repose sur la relation secteurs -> clients -> compteurs -> pannes, puis sur les reparations, interventions et releves. Un point fort du projet est que les techniciens ne voient que leurs taches assignees, alors que les responsables et managers ont une vue de pilotage plus large. Enfin, le projet propose aussi des notifications et des exports PDF/Excel, ce qui le rend proche d'un vrai outil professionnel.";

$body = '';
$body .= note("Je n'ai pas invente de fonctionnalites. Quand un point semble incomplet ou pas totalement branche dans le code actuel, il est marque 'a verifier'.");

$body .= section(
    '1. Presentation generale',
    tableHtml(['Point', 'Resume'], $summaryRows)
    . paragraph("Le projet sert a suivre les operations d'une regie technique : zones geographiques, abonnes, compteurs, pannes, reparations, interventions, notifications et rapports.")
    . paragraph("Le nom du depot est 'RADEETA-Management-System', mais l'interface affiche surtout 'SRM-FM'. Cela montre probablement une evolution du projet ou un changement de contexte : a verifier si ton professeur attend un seul nom officiel.")
    . tableHtml(['Role', 'Utilite'], $rolesRows)
);

$body .= section(
    '2. Technologies utilisees',
    tableHtml(['Categorie', 'Technologies observees'], $techRows)
    . bullets([
        "Le frontend est une SPA React compilee par Vite.",
        "Le backend expose une API REST Laravel sous /api.",
        "La communication se fait avec Axios, en JSON, via un token Bearer.",
        "Les exports de documents passent par DomPDF et Laravel Excel.",
    ])
);

$body .= section(
    '3. Architecture du projet',
    codeBlock($tree)
    . tableHtml(['Element', 'Role'], [
        ['Frontend', 'Affiche les pages, les dashboards, les formulaires, la carte et les tableaux.'],
        ['Backend', 'Valide les donnees, applique les roles et gere la logique metier.'],
        ['Communication', 'Axios appelle l\'API Laravel. L\'URL vient de VITE_API_BASE_URL, sinon http://localhost:8000/api.'],
    ])
    . note("Le projet suit une separation claire : React pour l'interface et Laravel pour la logique, la securite et la base de donnees.")
);

$body .= section(
    '4. Base de donnees',
    paragraph("La base observee dans backend/.env est MySQL. Les donnees sont gerees avec Eloquent et les migrations Laravel.")
    . tableHtml(['Table', 'Role', 'Relations importantes'], $dbRows)
    . bullets([
        "1 secteur -> plusieurs compteurs.",
        "1 client -> plusieurs compteurs.",
        "1 compteur -> plusieurs pannes et plusieurs releves.",
        "1 panne -> plusieurs reparations et plusieurs interventions.",
        "1 technicien -> plusieurs pannes assignees, reparations et interventions.",
        "Plusieurs tables utilisent la suppression logique (soft deletes).",
    ])
);

$body .= section(
    '5. Fonctionnalites principales',
    tableHtml(['Fonctionnalite', 'Ce que fait le projet'], $featuresRows)
    . note("Pages ou modules presents dans le code mais a verifier dans l'experience finale : Releves.jsx et Notifications.jsx existent, mais ne sont pas branches comme pages principales dans App.jsx.")
);

$body .= section(
    '6. Routes importantes',
    '<h3>Routes frontend</h3>'
    . tableHtml(['Route', 'Role principal'], $frontendRoutesRows)
    . '<h3>Routes backend / API</h3>'
    . tableHtml(['Endpoint', 'Utilite'], $backendRoutesRows)
    . note("A verifier : la route frontend /viewer/reports existe, mais les exports backend de rapports sont limites a des roles plus eleves dans routes/api.php."),
    true
);

$body .= section(
    '7. Exemples de code importants',
    '<h3>Exemple frontend : protection des pages</h3>'
    . codeBlock($frontendExample)
    . paragraph("Explication simple : si l'utilisateur n'est pas connecte, il retourne vers /login. Si son role n'est pas autorise, il va vers /access-denied.")
    . '<h3>Exemple backend : une reparation ferme la panne</h3>'
    . codeBlock($backendExample)
    . paragraph("Explication simple : la creation de la reparation et la mise a jour du statut de la panne se font ensemble dans une transaction.")
    . '<h3>Exemple modele : calcul automatique de consommation</h3>'
    . codeBlock($modelExample)
    . paragraph("Explication simple : la consommation n'est pas saisie a la main. Elle est calculee automatiquement dans le modele Releve.")
    . '<h3>Exemple migration : table interventions</h3>'
    . codeBlock($migrationExample)
    . paragraph("Explication simple : cette table relie une intervention a une panne, un client, un compteur et un technicien, avec un niveau de priorite et un statut.")
);

$body .= section(
    '8. Comment expliquer le projet au professeur',
    '<h3>Resume oral de 2 minutes</h3>'
    . note($oralSummary)
    . '<h3>Points forts du projet</h3>'
    . bullets([
        'Architecture propre frontend / backend.',
        'Securite par roles assez bien pensee.',
        'Projet proche d\'un vrai besoin metier terrain.',
        'Presence de dashboards, carte, notifications et exports.',
        'Base de donnees coherente avec le cycle complet client -> compteur -> panne -> intervention.',
        '15 tests backend ont passe pendant la verification.',
    ])
    . '<h3>Questions possibles du professeur</h3>'
    . tableHtml(['Question', 'Reponse simple'], $questionsRows)
);

$body .= section(
    '9. Points a verifier',
    bullets([
        'Nom officiel a utiliser a l\'oral : RADEETA ou SRM-FM.',
        'Page Releves presente dans le code frontend et endpoint backend actif, mais pas routee dans App.jsx au moment de l\'analyse.',
        'Page Notifications presente dans le code, mais l\'interface utilise surtout la cloche NotificationBell dans le topbar.',
        'Le viewer a une route frontend vers les rapports, mais les exports API semblent restreints a d\'autres roles.',
        'Le menu Sidebar n\'affiche pas toutes les routes viewer pourtant presentes dans App.jsx.',
    ])
    . paragraph("Conseil pratique : si ton professeur demande les limites du projet, tu peux dire qu'il est fonctionnel et bien structure, mais que certaines parties semblent encore en cours d'alignement entre les pages, le menu et les autorisations.")
);

$html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Fiche de revision - RADEETA Management System</title>
  <style>
    @page {
      margin: 48px 38px 60px 38px;
    }

    body {
      font-family: DejaVu Sans, sans-serif;
      color: #1f2937;
      font-size: 11.5px;
      line-height: 1.55;
    }

    h1, h2, h3 {
      margin: 0;
    }

    .cover {
      background: #0f172a;
      color: #ffffff;
      border-radius: 18px;
      padding: 26px 28px;
      margin-bottom: 18px;
    }

    .cover .eyebrow {
      color: #93c5fd;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .cover h1 {
      font-size: 26px;
      margin-bottom: 10px;
    }

    .cover p {
      margin: 0;
      color: #dbeafe;
    }

    .meta {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 14px 0;
    }

    .meta td {
      border: 1px solid #dbe4f0;
      background: #f8fafc;
      padding: 9px 11px;
      vertical-align: top;
      width: 50%;
    }

    .section {
      margin-bottom: 22px;
    }

    .page-break {
      page-break-before: always;
    }

    h2 {
      font-size: 17px;
      color: #0f172a;
      border-bottom: 2px solid #dbeafe;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    h3 {
      font-size: 13px;
      color: #1d4ed8;
      margin: 12px 0 6px 0;
    }

    p {
      margin: 6px 0 10px 0;
    }

    ul {
      margin: 6px 0 10px 18px;
      padding: 0;
    }

    li {
      margin: 4px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
    }

    th {
      background: #eff6ff;
      color: #1e3a8a;
      border: 1px solid #d1d5db;
      text-align: left;
      font-size: 10.5px;
      padding: 7px 9px;
    }

    td {
      border: 1px solid #d1d5db;
      padding: 7px 9px;
      vertical-align: top;
    }

    pre {
      background: #0f172a;
      color: #e5e7eb;
      padding: 12px;
      border-radius: 10px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 10px;
      line-height: 1.4;
      margin: 8px 0 10px 0;
    }

    .note {
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 9px 11px;
      margin: 10px 0 12px 0;
    }

    .mini {
      color: #64748b;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="eyebrow">Fiche de revision rapide</div>
    <h1>RADEETA Management System</h1>
    <p>Resume court, professionnel et base uniquement sur le code ouvert dans VS Code.</p>
  </div>

  <table class="meta">
    <tr>
      <td><strong>Date de generation</strong><br>{$generatedAt}</td>
      <td><strong>Sources analysees</strong><br><code>frontend/</code> et <code>backend/</code></td>
    </tr>
    <tr>
      <td><strong>Confiance</strong><br>Analyse du code + verification des routes Laravel + 15 tests backend passes.</td>
      <td><strong>Format</strong><br>Fiche de revision pour presentation orale rapide.</td>
    </tr>
  </table>

  {$body}

  <p class="mini">Document genere depuis le code source disponible le {$generatedAt}.</p>
</body>
</html>
HTML;

$htmlPath = __DIR__.'/Fiche_Revision_RADEETA_Management_System.html';
$pdfPath = __DIR__.'/Fiche_Revision_RADEETA_Management_System.pdf';

file_put_contents($htmlPath, $html);

$options = new Options();
$options->set('isRemoteEnabled', false);
$options->set('isHtml5ParserEnabled', true);
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4');
$dompdf->render();

file_put_contents($pdfPath, $dompdf->output());

echo "HTML: {$htmlPath}\n";
echo "PDF: {$pdfPath}\n";
