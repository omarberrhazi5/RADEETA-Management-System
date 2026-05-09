<?php

declare(strict_types=1);

require __DIR__.'/../backend/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

function html_inline(string $text): string
{
    $escaped = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $escaped = preg_replace('/`([^`]+)`/', '<code>$1</code>', $escaped) ?? $escaped;
    $escaped = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $escaped) ?? $escaped;

    return nl2br($escaped);
}

function markdown_table(array $headers, array $rows): string
{
    $lines = [];
    $lines[] = '| '.implode(' | ', $headers).' |';
    $lines[] = '| '.implode(' | ', array_fill(0, count($headers), '---')).' |';

    foreach ($rows as $row) {
        $cells = array_map(static fn ($value): string => str_replace("\n", '<br>', (string) $value), $row);
        $lines[] = '| '.implode(' | ', $cells).' |';
    }

    return implode("\n", $lines)."\n";
}

function render_blocks_markdown(array $blocks): string
{
    $output = '';

    foreach ($blocks as $block) {
        switch ($block['type']) {
            case 'paragraph':
                $output .= $block['text']."\n\n";
                break;
            case 'subheading':
                $output .= "### {$block['text']}\n\n";
                break;
            case 'bullets':
                foreach ($block['items'] as $item) {
                    $output .= "- {$item}\n";
                }
                $output .= "\n";
                break;
            case 'numbered':
                foreach (array_values($block['items']) as $index => $item) {
                    $output .= ($index + 1).". {$item}\n";
                }
                $output .= "\n";
                break;
            case 'code':
                $language = $block['language'] ?? '';
                $output .= "```{$language}\n{$block['code']}\n```\n\n";
                if (! empty($block['caption'])) {
                    $output .= $block['caption']."\n\n";
                }
                break;
            case 'table':
                $output .= markdown_table($block['headers'], $block['rows'])."\n";
                break;
            case 'note':
                $output .= '> '.$block['text']."\n\n";
                break;
        }
    }

    return $output;
}

function render_blocks_html(array $blocks): string
{
    $output = '';

    foreach ($blocks as $block) {
        switch ($block['type']) {
            case 'paragraph':
                $output .= '<p>'.html_inline($block['text'])."</p>\n";
                break;
            case 'subheading':
                $output .= '<h3>'.htmlspecialchars($block['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')."</h3>\n";
                break;
            case 'bullets':
                $output .= "<ul>\n";
                foreach ($block['items'] as $item) {
                    $output .= '  <li>'.html_inline($item)."</li>\n";
                }
                $output .= "</ul>\n";
                break;
            case 'numbered':
                $output .= "<ol>\n";
                foreach ($block['items'] as $item) {
                    $output .= '  <li>'.html_inline($item)."</li>\n";
                }
                $output .= "</ol>\n";
                break;
            case 'code':
                $output .= "<pre><code>".htmlspecialchars($block['code'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')."</code></pre>\n";
                if (! empty($block['caption'])) {
                    $output .= '<p class="code-caption">'.html_inline($block['caption'])."</p>\n";
                }
                break;
            case 'table':
                $output .= "<table>\n<thead><tr>";
                foreach ($block['headers'] as $header) {
                    $output .= '<th>'.htmlspecialchars((string) $header, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'</th>';
                }
                $output .= "</tr></thead>\n<tbody>\n";

                foreach ($block['rows'] as $row) {
                    $output .= "<tr>";
                    foreach ($row as $cell) {
                        $output .= '<td>'.html_inline((string) $cell).'</td>';
                    }
                    $output .= "</tr>\n";
                }

                $output .= "</tbody>\n</table>\n";
                break;
            case 'note':
                $output .= '<div class="note">'.html_inline($block['text'])."</div>\n";
                break;
        }
    }

    return $output;
}

$generatedAt = (new DateTimeImmutable('now'))->format('d/m/Y H:i');

$techRows = [
    ['Frontend', 'React 19, Vite 8, Tailwind CSS, React Router 7, Axios, Recharts, Leaflet, Lucide React', 'Interface web SPA, navigation, cartes, tableaux, graphiques et consommation de l’API'],
    ['Backend', 'Laravel 11 sur PHP 8.2', 'API REST, validation, contrôle d’accès, logique métier, export de documents'],
    ['Base de données', 'MySQL via Eloquent ORM, migrations, factories et seeders', 'Stockage relationnel des données métier et du système'],
    ['Authentification', 'Laravel Sanctum + middleware personnalisé `role` + `ProtectedRoute` côté frontend', 'Connexion par token, sécurité des routes et contrôle des rôles'],
    ['Documents', 'barryvdh/laravel-dompdf, maatwebsite/excel', 'Génération de PDF et export Excel'],
    ['Qualité / outils', 'PHPUnit, ESLint, Vite, seeders de démonstration', 'Tests d’API, qualité du code et environnement de développement'],
];

$importantFilesRows = [
    ['`frontend/src/App.jsx`', 'Routeur principal : définit les écrans par rôle et le flux global de navigation.'],
    ['`frontend/src/context/AuthContext.jsx`', 'Gestion de session, stockage local du token et redirection après connexion.'],
    ['`frontend/src/api/axios.js`', 'Client HTTP centralisé avec injection automatique du token Bearer.'],
    ['`frontend/src/dashboards/DashboardShared.jsx`', 'Chargement mutualisé des données de dashboard et widgets communs.'],
    ['`backend/routes/api.php`', 'Déclaration de toutes les routes REST et des règles d’accès par rôle.'],
    ['`backend/app/Http/Controllers/*`', 'Contrôleurs des ressources métier, de l’authentification, des rapports et des notifications.'],
    ['`backend/app/Services/BillingService.php`', 'Calcul des montants, des tranches, des taxes et création des factures.'],
    ['`backend/app/Support/OperatorAccess.php`', 'Filtrage métier pour limiter les opérateurs à leurs données assignées.'],
    ['`backend/database/migrations/*`', 'Historique de création et d’évolution du schéma relationnel.'],
    ['`backend/database/seeders/DatabaseSeeder.php`', 'Jeu de données réaliste pour démonstration et tests fonctionnels.'],
    ['`backend/resources/views/invoices/*` et `backend/resources/views/reports/*`', 'Templates Blade utilisés pour les PDF de factures et de rapports mensuels.'],
];

$featureRows = [
    ['Authentification sécurisée', 'Connexion avec `identifiant` et `password`, génération d’un token Sanctum, déconnexion et expiration propre côté frontend.'],
    ['Gestion des utilisateurs', 'Création et mise à jour des comptes avec rôles `super_admin`, `admin`, `manager`, `operator`, `viewer`, `developer`.'],
    ['Gestion des clients', 'CRUD sur les abonnés avec police, identité, CIN, téléphone, adresse et statut d’abonnement.'],
    ['Gestion des compteurs', 'Association des compteurs aux clients et aux secteurs, avec calibre, marque et index de lecture.'],
    ['Gestion des secteurs', 'Découpage géographique par zone, tournée et coordonnées GPS pour l’affichage cartographique.'],
    ['Suivi des pannes', 'Déclaration d’une panne, affectation à un opérateur et suivi du statut ouvert/résolu.'],
    ['Gestion des réparations', 'Création d’une intervention liée à une panne ; une réparation clôt automatiquement la panne concernée.'],
    ['Relevés de compteurs', 'Saisie des anciens/nouveaux index et calcul automatique de la consommation.'],
    ['Facturation', 'Génération d’une facture à partir d’un relevé non encore facturé, avec détail des lignes, taxes, échéance et PDF.'],
    ['Paiements', 'Enregistrement des règlements, calcul du solde restant et mise à jour automatique du statut de facture.'],
    ['Notifications', 'Notifications base de données visibles dans la cloche du frontend et marquage comme lues.'],
    ['Reporting', 'Exports PDF et Excel pour les pannes, factures, paiements, clients et compteurs.'],
];

$frontendRows = [
    ['`Login.jsx`', 'Écran de connexion ; appelle `AuthContext.login` puis redirige vers le dashboard du rôle connecté.'],
    ['`Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx`', 'Cadre principal de l’application avec navigation latérale, titre de page, rôle courant et cloche de notifications.'],
    ['`ProtectedRoute.jsx` et `RoleRedirect.jsx`', 'Protection des routes et redirection automatique selon le rôle.'],
    ['`rbac.js`', 'Règles frontend pour afficher ou masquer les actions CRUD et choisir les chemins de dashboard.'],
    ['`AdminDashboard.jsx`, `ManagerDashboard.jsx`, `OperatorDashboard.jsx`, `ViewerDashboard.jsx`', 'Dashboards adaptés aux responsabilités de chaque type d’utilisateur.'],
    ['`Clients.jsx`, `Compteurs.jsx`, `Secteurs.jsx`', 'Pages de gestion des référentiels métier via `DataTable` et `EntityFormModal`.'],
    ['`Pannes.jsx`, `Reparations.jsx`, `Releves.jsx`, `MyTasks.jsx`', 'Écrans opérationnels pour le terrain, l’affectation, les interventions et le travail quotidien des opérateurs.'],
    ['`Factures.jsx`, `Paiements.jsx`, `TariffSettings.jsx`, `Reports.jsx`', 'Écrans de facturation, d’encaissement, de configuration tarifaire et de reporting.'],
    ['`DataTable.jsx`', 'Composant générique de tableaux avec recherche, tri, pagination et actions conditionnées par le rôle.'],
    ['`PanneMap.jsx`', 'Carte Leaflet des secteurs/pannes à partir des coordonnées GPS.'],
    ['`InvoiceDetailModal.jsx`', 'Vue détaillée d’une facture avec lignes d’eau, assainissement, taxes et actions PDF.'],
    ['`NotificationBell.jsx`', 'Chargement périodique des notifications (polling toutes les 30 secondes).'],
];

$backendRows = [
    ['`AuthController`', 'Connexion, émission du token Sanctum et déconnexion.'],
    ['`UserController`', 'Lecture, création et mise à jour des utilisateurs ; récupération ciblée des opérateurs.'],
    ['`ClientController`, `CompteurController`, `SecteurController`', 'CRUD sur les référentiels principaux.'],
    ['`PanneController`', 'Création, affectation, filtrage des opérateurs, changement de statut et notifications d’affectation.'],
    ['`ReparationController` + `ReparationRequest`', 'Validation métier, clôture automatique de panne, contrôle de date et unicité de la réparation active.'],
    ['`ReleveController`', 'Saisie des relevés, contrôle des index, calcul de consommation et protection des relevés déjà facturés.'],
    ['`FactureController`', 'Liste, création, aperçu PDF et téléchargement des factures.'],
    ['`PaiementController`', 'Ajout des paiements, contrôle du dépassement du solde et rafraîchissement du statut de facture.'],
    ['`DashboardController`', 'Indicateurs de pilotage, métriques par secteur et top opérateurs.'],
    ['`NotificationController`', 'Lecture et marquage des notifications, avec visibilité selon le rôle.'],
    ['`ReportController`', 'Exports mensuels PDF/Excel pour le management.'],
    ['`TariffSettingController`', 'Lecture et mise à jour de la configuration tarifaire JSON.'],
    ['`BillingService`', 'Calcule les tranches d’eau/assainissement, la TVA, les frais fixes et la structure détaillée d’une facture.'],
    ['`NotificationService`', 'Diffuse les événements métier importants aux bons profils.'],
    ['`OperatorAccess` + `EnsureUserHasRole`', 'Double sécurité métier : filtrage des données opérateur et contrôle d’accès aux endpoints.'],
];

$apiRows = [
    ['`POST /api/login`', 'Authentification', 'Valide les identifiants, retourne le token, le rôle et le profil utilisateur.'],
    ['`POST /api/logout`', 'Authentification', 'Supprime le token actif.'],
    ['`GET /api/dashboard/summary` et `GET /api/dashboard/stats`', 'Pilotage', 'Retourne les statistiques globales du système.'],
    ['`GET /api/notifications`', 'Notifications', 'Liste les notifications visibles par l’utilisateur connecté.'],
    ['`POST /api/notifications/read` et `PUT /api/notifications/mark-as-read`', 'Notifications', 'Marque une ou plusieurs notifications comme lues.'],
    ['`GET /api/clients`, `GET /api/clients/{id}`', 'Clients', 'Consultation des clients.'],
    ['`POST /api/clients`, `PUT /api/clients/{id}`, `DELETE /api/clients/{id}`', 'Clients', 'Création, modification et suppression logique des clients.'],
    ['`GET /api/compteurs`, `GET /api/compteurs/{id}`', 'Compteurs', 'Consultation des compteurs et de leurs relations.'],
    ['`POST /api/compteurs`, `PUT /api/compteurs/{id}`, `DELETE /api/compteurs/{id}`', 'Compteurs', 'Gestion des compteurs.'],
    ['`GET /api/secteurs`, `GET /api/secteurs/{id}`', 'Secteurs', 'Consultation des secteurs et des coordonnées GPS.'],
    ['`POST /api/secteurs`, `PUT /api/secteurs/{id}`, `DELETE /api/secteurs/{id}`', 'Secteurs', 'Gestion des secteurs et tournées.'],
    ['`GET /api/pannes`, `GET /api/pannes/{id}`', 'Pannes', 'Lecture des pannes ; les opérateurs ne voient que leurs pannes assignées.'],
    ['`POST /api/pannes`, `PUT /api/pannes/{id}`, `DELETE /api/pannes/{id}`', 'Pannes', 'Création, affectation, changement de statut et suppression.'],
    ['`GET /api/reparations`, `GET /api/reparations/{id}`', 'Réparations', 'Historique des interventions.'],
    ['`POST /api/reparations`, `PUT /api/reparations/{id}`, `DELETE /api/reparations/{id}`', 'Réparations', 'Gestion des interventions ; une réparation résout la panne liée.'],
    ['`GET /api/releves`, `GET /api/releves/{id}`', 'Relevés', 'Consultation des relevés et filtrage des relevés non facturés.'],
    ['`POST /api/releves`, `PUT /api/releves/{id}`', 'Relevés', 'Saisie et mise à jour des lectures de compteurs.'],
    ['`GET /api/factures`, `GET /api/factures/{id}`', 'Facturation', 'Liste et détail des factures.'],
    ['`POST /api/factures`', 'Facturation', 'Génère une facture à partir d’un relevé non facturé.'],
    ['`GET /api/factures/{facture}/preview`', 'Facturation', 'Affiche le PDF de facture dans le navigateur.'],
    ['`GET /api/factures/{facture}/pdf`', 'Facturation', 'Télécharge le PDF de facture.'],
    ['`POST /api/factures/{facture}/paiements`', 'Paiements', 'Ajoute un paiement sur une facture.'],
    ['`GET /api/paiements`', 'Paiements', 'Liste les règlements enregistrés.'],
    ['`GET /api/tariff-settings`, `PUT /api/tariff-settings`', 'Configuration', 'Lit et met à jour la grille tarifaire JSON.'],
    ['`GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`', 'Utilisateurs', 'Consultation et gestion des comptes.'],
    ['`GET /api/users/operators` et `GET /api/plombiers`', 'Utilisateurs', 'Retourne la liste des opérateurs / plombiers.'],
    ['`GET /api/reports/pannes/pdf`', 'Rapports', 'Export PDF mensuel des pannes.'],
    ['`GET /api/reports/invoices/pdf`', 'Rapports', 'Export PDF mensuel des factures.'],
    ['`GET /api/reports/clients/excel`', 'Rapports', 'Export Excel clients + compteurs.'],
    ['`GET /api/reports/payments/excel`', 'Rapports', 'Export Excel des paiements.'],
];

$databaseRows = [
    ['`users`', 'Comptes applicatifs avec rôle et identifiant de connexion.', '1 utilisateur peut être opérateur assigné à plusieurs pannes et réparations.'],
    ['`personal_access_tokens`', 'Tokens Sanctum pour l’API.', 'Liés aux utilisateurs via relation polymorphe.'],
    ['`secteurs`', 'Zones géographiques, emplacement, tournée, latitude, longitude.', '1 secteur possède plusieurs compteurs.'],
    ['`clients`', 'Abonnés et leurs informations administratives.', '1 client possède plusieurs compteurs et plusieurs factures.'],
    ['`compteurs`', 'Compteurs physiques rattachés à un client et à un secteur.', '1 compteur a plusieurs pannes, relevés et factures.'],
    ['`pannes`', 'Incidents détectés sur les compteurs.', '1 panne appartient à 1 compteur et peut être assignée à 1 opérateur.'],
    ['`reparations`', 'Interventions de réparation.', '1 réparation appartient à 1 panne et à 1 opérateur/plombier.'],
    ['`releves`', 'Lectures des index de compteurs.', '1 relevé appartient à 1 compteur et peut mener à 1 facture.'],
    ['`factures`', 'Factures détaillées (montants, lignes, snapshot de calcul, échéance, statut).', '1 facture appartient à 1 client, 1 compteur, 1 relevé et possède plusieurs paiements.'],
    ['`paiements`', 'Règlements des factures.', '1 paiement appartient à 1 facture et à un créateur utilisateur.'],
    ['`tariff_settings`', 'Configuration JSON des tranches, taxes et coefficients.', 'Utilisée par `BillingService` au moment de la génération d’une facture.'],
    ['`notifications`', 'Notifications Laravel en base de données (uuid, data JSON, read_at).', 'Visibilité globale pour admins, personnelle pour les autres rôles.'],
];

$roleRows = [
    ['`super_admin`', 'Accès complet au backend ; le middleware lui laisse passer toutes les routes.'],
    ['`admin`', 'Accès étendu : utilisateurs, clients, secteurs, compteurs, pannes, réparations, relevés, factures, paiements, tarifs et rapports.'],
    ['`manager`', 'Pilotage opérationnel et commercial : dashboards, pannes, réparations, relevés, factures, paiements, tarifs et rapports.'],
    ['`operator`', 'Accès limité au travail terrain assigné : pannes assignées, réparations autorisées, relevés dans le périmètre lié aux tâches.'],
    ['`viewer`', 'Lecture seule sur les données métier, les factures, les paiements et les rapports.'],
    ['`developer`', 'Rôle technique présent dans le code mais explicitement bloqué en production.'],
];

$authSnippet = <<<'PHP'
$validated = $request->validate([
    'identifiant' => ['required', 'string'],
    'password' => ['required', 'string'],
    'device_name' => ['nullable', 'string', 'max:255'],
]);

$user = User::where('identifiant', $validated['identifiant'])->first();

if (! $user || ! Hash::check($validated['password'], $user->password)) {
    throw ValidationException::withMessages([
        'identifiant' => ['The provided credentials are incorrect.'],
    ]);
}

$token = $user->createToken($validated['device_name'] ?? 'api-token')->plainTextToken;
PHP;

$readingSnippet = <<<'PHP'
protected static function booted(): void
{
    static::saving(function (Releve $releve): void {
        $releve->consommation = max(
            0,
            (float) $releve->nouvel_index - (float) $releve->ancien_index
        );
    });
}
PHP;

$operatorSnippet = <<<'PHP'
public static function scopeFactures(Builder $query, User $user): Builder
{
    return $query->where(function (Builder $query) use ($user): void {
        $query->whereHas('releve', fn (Builder $releve) => $releve->where('created_by', $user->id))
            ->orWhereHas('compteur.pannes', fn (Builder $panne) => $panne->where('assigned_to', $user->id));
    });
}
PHP;

$billingSnippet = <<<'PHP'
$waterLines = $this->tariffs->splitConsumption($consumption, data_get($config, 'water.tranches', []), 'water', $waterTva);
$sanitationLines = $this->tariffs->splitConsumption($consumption, data_get($config, 'sanitation.tranches', []), 'sanitation', $sanitationTva);

$lineItems = array_values(array_filter(
    [...$waterLines, ...$sanitationLines, ...$fixedLines, ...$taxLines],
    fn (array $line): bool => (float) $line['montant_ht'] > 0
));

return [
    'montant_ht' => $montantHt,
    'taxes' => $taxes,
    'tva' => $tva,
    'total_ttc' => $total,
    'line_items' => $lineItems,
    'detail_snapshot' => [
        'agence' => $config['agence'] ?? 'SRM Taza/Region',
        'consommation_m3' => $consumption,
    ],
];
PHP;

$sections = [
    [
        'title' => '1. Présentation du projet',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Ce document a été préparé à partir de l’analyse du code source du projet `RADEETA-Management-System`, sans modifier le code applicatif. Le produit exposé au travers du frontend porte le nom `SRM Taza/Region` et se présente comme une plateforme de gestion des opérations d’un service d’eau et d’assainissement."],
            ['type' => 'subheading', 'text' => 'Objectif du projet'],
            ['type' => 'bullets', 'items' => [
                "Centraliser dans une seule application la gestion des abonnés, des compteurs, des secteurs, des pannes, des réparations, des relevés, des factures et des paiements.",
                "Donner à chaque profil métier un espace de travail adapté : administration, supervision, terrain et consultation.",
                "Fournir un cycle complet allant de l’incident terrain jusqu’à la facturation et au reporting.",
            ]],
            ['type' => 'subheading', 'text' => 'Problème résolu'],
            ['type' => 'bullets', 'items' => [
                "Évite la dispersion des informations entre plusieurs fichiers, outils ou traitements manuels.",
                "Sécurise l’accès aux données grâce à un contrôle d’accès par rôle à la fois côté frontend et côté backend.",
                "Automatise des règles métier sensibles : calcul de consommation, génération de facture, suivi du solde restant et clôture des pannes après réparation.",
                "Améliore le pilotage grâce aux dashboards, aux cartes GIS et aux exports PDF / Excel.",
            ]],
        ],
    ],
    [
        'title' => '2. Technologies utilisées',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le projet est construit comme une application web full stack séparée en deux sous-projets : un frontend React/Vite et un backend Laravel. La base est relationnelle et la sécurité repose sur des tokens d’API."],
            ['type' => 'table', 'headers' => ['Couche', 'Technologies', 'Rôle dans le projet'], 'rows' => $techRows],
            ['type' => 'note', 'text' => "La configuration locale observée dans le code pointe le frontend vers `http://127.0.0.1:8000/api` et utilise `MySQL` comme base de données principale."],
        ],
    ],
    [
        'title' => '3. Architecture',
        'blocks' => [
            ['type' => 'subheading', 'text' => 'Structure générale du système'],
            ['type' => 'code', 'language' => 'text', 'code' => <<<'TEXT'
Utilisateur
    |
    v
Frontend React (SPA)
    |
    |  Axios + Bearer Token
    v
API Laravel (/api/*)
    |
    +--> Controllers
    |       |
    |       +--> Services métier (facturation, notifications, tarifs)
    |       |
    |       +--> Resources JSON
    |
    v
Modèles Eloquent
    |
    v
Base MySQL

Exports :
- PDF de factures et de rapports via DomPDF
- Excel de synthèse via Laravel Excel
TEXT],
            ['type' => 'subheading', 'text' => 'Communication entre les composants'],
            ['type' => 'numbered', 'items' => [
                "L’utilisateur se connecte depuis le frontend React via la page `Login.jsx`.",
                "Le frontend envoie les identifiants à `POST /api/login`.",
                "Laravel vérifie le compte, crée un token Sanctum et renvoie le rôle ainsi que le profil utilisateur.",
                "Le frontend stocke le token et le renvoie automatiquement dans l’en-tête `Authorization: Bearer ...` pour chaque appel ultérieur.",
                "Les contrôleurs Laravel exécutent la logique métier, appellent si besoin les services et renvoient des ressources JSON structurées.",
                "Les fichiers PDF et Excel sont générés côté backend puis téléchargés côté frontend sous forme de blob.",
            ]],
            ['type' => 'note', 'text' => "Les notifications ne passent pas par WebSocket dans cette version : la cloche du frontend effectue un polling régulier toutes les 30 secondes pour rafraîchir les données."],
        ],
    ],
    [
        'title' => '4. Structure des dossiers',
        'page_break' => true,
        'blocks' => [
            ['type' => 'code', 'language' => 'text', 'code' => <<<'TEXT'
RADEETA-Management-System/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- dashboards/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- routes/
|   |   `-- utils/
|   `-- package.json
|
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
    |   |-- Services/
    |   `-- Support/
    |-- database/
    |   |-- factories/
    |   |-- migrations/
    |   `-- seeders/
    |-- resources/views/
    |-- routes/api.php
    `-- tests/Feature/
TEXT],
            ['type' => 'table', 'headers' => ['Fichier / dossier', 'Explication'], 'rows' => $importantFilesRows],
            ['type' => 'note', 'text' => "Le dépôt montre aussi des traces d’évolution progressive du projet, par exemple `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/Notifications.jsx` ou `backend/resources/js/*`, qui ne sont pas au cœur du routage React actuel mais témoignent d’itérations précédentes."],
        ],
    ],
    [
        'title' => '5. Fonctionnalités principales',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le code source met en évidence un périmètre métier large couvrant le terrain, l’administration et la facturation."],
            ['type' => 'table', 'headers' => ['Fonctionnalité', 'Explication'], 'rows' => $featureRows],
        ],
    ],
    [
        'title' => '6. Partie Frontend',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le frontend est une application SPA construite avec React et Vite. Il n’implémente pas la sécurité à lui seul : il améliore l’expérience utilisateur en masquant certaines actions, mais l’autorité finale reste côté API Laravel."],
            ['type' => 'table', 'headers' => ['Page / composant', 'Rôle'], 'rows' => $frontendRows],
            ['type' => 'subheading', 'text' => 'Observations importantes sur le frontend'],
            ['type' => 'bullets', 'items' => [
                "Les données sont chargées principalement via le hook générique `useResource`, qui gère `loading`, `error`, `items` et `refresh`.",
                "Les actions CRUD passent par un petit nombre de composants réutilisables : `DataTable`, `EntityFormModal`, `ConfirmDialog`, `Badge`, `Button`.",
                "La carte `PanneMap` s’appuie sur `react-leaflet` et utilise les coordonnées GPS des secteurs pour afficher les incidents.",
                "Les téléchargements de PDF et d’Excel se font via `downloadFile`, qui manipule les blobs reçus depuis l’API.",
                "Le routeur principal utilisé en production est `frontend/src/App.jsx`, qui oriente vers des dashboards par rôle (`admin`, `manager`, `operator`, `viewer`).",
            ]],
        ],
    ],
    [
        'title' => '7. Partie Backend',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le backend Laravel organise clairement les responsabilités : contrôleurs pour exposer l’API, services pour les règles métier transverses, modèles Eloquent pour la persistance, ressources pour la forme JSON et middleware pour la sécurité."],
            ['type' => 'table', 'headers' => ['Composant backend', 'Responsabilité'], 'rows' => $backendRows],
            ['type' => 'subheading', 'text' => 'Logique métier notable'],
            ['type' => 'bullets', 'items' => [
                "Une réparation valide ferme automatiquement la panne correspondante ; si la réparation disparaît, la panne peut être réouverte.",
                "Un relevé déjà facturé ne peut plus être modifié.",
                "Le montant d’un paiement ne peut pas dépasser le solde restant de la facture.",
                "Les opérateurs ne voient pas tout le système : `OperatorAccess` filtre leurs données à partir des pannes et secteurs qui leur sont assignés.",
                "La configuration tarifaire est stockée en JSON et fusionnée avec des valeurs par défaut pour éviter les paramètres manquants.",
            ]],
        ],
    ],
    [
        'title' => '8. API (endpoints)',
        'page_break' => true,
        'blocks' => [
            ['type' => 'paragraph', 'text' => "L’API suit une logique REST enrichie de quelques routes métier (authentification, prévisualisation PDF, rapports et paramètres tarifaires). Les routes sont regroupées dans `backend/routes/api.php` et protégées par `auth:sanctum` puis par le middleware `role`."],
            ['type' => 'table', 'headers' => ['Endpoint principal', 'Catégorie', 'Utilité'], 'rows' => $apiRows],
            ['type' => 'note', 'text' => "Le code distingue bien les droits de lecture, de création, de mise à jour et de suppression selon les rôles. Par exemple, `viewer` reste en lecture seule, tandis qu’un `operator` ne peut pas accéder aux factures ni aux paiements."],
        ],
    ],
    [
        'title' => '9. Base de données',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "La base relationnelle est structurée pour couvrir le cycle de vie complet du métier : référentiel, incidents, interventions, relève, facturation, encaissement et notifications."],
            ['type' => 'table', 'headers' => ['Table / modèle', 'Rôle', 'Relations clés'], 'rows' => $databaseRows],
            ['type' => 'subheading', 'text' => 'Relations principales'],
            ['type' => 'code', 'language' => 'text', 'code' => <<<'TEXT'
User 1----n Panne (assigned_to)
User 1----n Reparation (id_plombier)
User 1----n Releve (created_by)

Client 1----n Compteur
Client 1----n Facture

Secteur 1----n Compteur
Secteur 1----n Panne (via Compteur)

Compteur 1----n Panne
Compteur 1----n Releve
Compteur 1----n Facture

Panne 1----n Reparation
Releve 1----1 Facture
Facture 1----n Paiement
TEXT],
            ['type' => 'subheading', 'text' => 'Contraintes utiles à retenir'],
            ['type' => 'bullets', 'items' => [
                "Suppression logique (`soft deletes`) sur les clients, compteurs, secteurs, pannes et réparations.",
                "Unicité de `police`, `cadran`, `reference` de facture et `identifiant` utilisateur.",
                "Contrôle sur les index de relevé : le nouvel index doit être supérieur ou égal à l’ancien.",
                "Une panne ne peut pas avoir plusieurs réparations actives concurrentes.",
                "Les statuts de facture (`impayee`, `partielle`, `payee`) sont recalculés après chaque paiement.",
            ]],
        ],
    ],
    [
        'title' => '10. Authentification et rôles',
        'blocks' => [
            ['type' => 'subheading', 'text' => 'Connexion'],
            ['type' => 'bullets', 'items' => [
                "L’utilisateur se connecte avec `identifiant` et `password`.",
                "Le backend crée un token Sanctum et le renvoie au frontend.",
                "Le token est stocké dans le navigateur puis ajouté automatiquement à chaque requête API.",
                "En cas de `401`, le frontend vide la session locale et force la reconnexion.",
            ]],
            ['type' => 'subheading', 'text' => 'Rôles observés dans le code'],
            ['type' => 'table', 'headers' => ['Rôle', 'Accès principal'], 'rows' => $roleRows],
            ['type' => 'subheading', 'text' => 'Remarques importantes'],
            ['type' => 'bullets', 'items' => [
                "Le `super_admin` est reconnu côté backend ; côté frontend, il est redirigé vers le dashboard admin.",
                "Le rôle `developer` existe pour des besoins techniques mais le code le bloque en production, aussi bien dans l’authentification que dans le middleware.",
                "Le contrôle d’accès est doublé : le frontend masque les écrans/actions non autorisés, et le backend refuse réellement l’accès aux routes interdites.",
            ]],
        ],
    ],
    [
        'title' => '11. Workflow de l’application',
        'blocks' => [
            ['type' => 'numbered', 'items' => [
                "Un utilisateur ouvre la page de connexion et saisit son `identifiant` ainsi que son mot de passe.",
                "Le backend valide le compte et renvoie un token Sanctum, le rôle et le profil.",
                "Le frontend redirige automatiquement l’utilisateur vers le dashboard correspondant à son rôle.",
                "Les administrateurs et managers préparent le référentiel : secteurs, utilisateurs, clients, compteurs et paramètres tarifaires.",
                "Une panne est déclarée puis éventuellement affectée à un opérateur.",
                "L’opérateur consulte ses tâches, traite la panne et peut enregistrer une réparation.",
                "Lors des tournées, un relevé est saisi ; la consommation est calculée automatiquement et l’index du compteur est mis à jour.",
                "Un administrateur ou manager génère ensuite une facture à partir d’un relevé non encore facturé.",
                "Les paiements sont enregistrés au fil des encaissements ; le statut de la facture passe de `impayee` à `partielle` ou `payee`.",
                "Les responsables et utilisateurs autorisés consultent enfin les dashboards, la carte des secteurs, les notifications et les rapports exportables.",
            ]],
        ],
    ],
    [
        'title' => '12. Exemples de code importants',
        'page_break' => true,
        'blocks' => [
            ['type' => 'subheading', 'text' => 'Exemple 1 : authentification et création du token'],
            ['type' => 'code', 'language' => 'php', 'code' => $authSnippet, 'caption' => "Cet extrait d’`AuthController` montre la séquence principale : validation des champs, recherche de l’utilisateur, vérification du mot de passe, puis création du token d’API."],
            ['type' => 'subheading', 'text' => 'Exemple 2 : calcul automatique de la consommation'],
            ['type' => 'code', 'language' => 'php', 'code' => $readingSnippet, 'caption' => "Le modèle `Releve` calcule automatiquement la consommation au moment de l’enregistrement. Cela évite de dépendre du frontend pour une règle métier aussi importante."],
            ['type' => 'subheading', 'text' => 'Exemple 3 : filtrage métier pour les opérateurs'],
            ['type' => 'code', 'language' => 'php', 'code' => $operatorSnippet, 'caption' => "Dans `OperatorAccess`, les opérateurs ne voient pas toutes les factures : ils sont limités aux éléments liés à leurs propres relevés ou à leurs pannes assignées."],
            ['type' => 'subheading', 'text' => 'Exemple 4 : structure de calcul d’une facture'],
            ['type' => 'code', 'language' => 'php', 'code' => $billingSnippet, 'caption' => "Le service `BillingService` assemble des lignes de facturation détaillées par section (`water`, `sanitation`, `taxes`) et produit un `detail_snapshot` enregistré dans la facture pour garder une trace fidèle du calcul."],
        ],
    ],
    [
        'title' => '13. Conclusion',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "D’après le code source, `RADEETA-Management-System` est une application de gestion métier complète, pensée pour relier les opérations terrain, la gestion des abonnés et la facturation dans un seul système. L’architecture séparée React / Laravel est cohérente, la sécurité par rôles est appliquée à plusieurs niveaux et la logique métier essentielle est bien centralisée dans le backend."],
            ['type' => 'paragraph', 'text' => "Le projet se distingue aussi par des fonctionnalités de présentation utiles dans un contexte professionnel : cartes GIS, dashboards par rôle, exports PDF/Excel, notifications, seeders de démonstration et premiers tests d’API. En résumé, il s’agit d’une base solide pour un outil de pilotage opérationnel et commercial d’un service de distribution d’eau."],
        ],
    ],
];

$markdown = "# Rapport d'analyse du projet RADEETA Management System\n\n";
$markdown .= "_Document généré à partir du code source le {$generatedAt}_\n\n";
$markdown .= "## Sommaire\n\n";

foreach ($sections as $index => $section) {
    $markdown .= ($index + 1).". {$section['title']}\n";
}

$markdown .= "\n";

foreach ($sections as $section) {
    $markdown .= "## {$section['title']}\n\n";
    $markdown .= render_blocks_markdown($section['blocks']);
}

$tocHtml = "<ul class=\"toc\">\n";
foreach ($sections as $section) {
    $anchor = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $section['title']), '-'));
    $tocHtml .= '  <li><a href="#'.$anchor.'">'.htmlspecialchars($section['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')."</a></li>\n";
}
$tocHtml .= "</ul>\n";

$htmlSections = '';
foreach ($sections as $section) {
    $anchor = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $section['title']), '-'));
    $pageBreakClass = ! empty($section['page_break']) ? ' page-break-before' : '';
    $htmlSections .= '<section class="section'.$pageBreakClass.'" id="'.$anchor.'">';
    $htmlSections .= '<h2>'.htmlspecialchars($section['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'</h2>';
    $htmlSections .= render_blocks_html($section['blocks']);
    $htmlSections .= "</section>\n";
}

$html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Rapport RADEETA Management System</title>
  <style>
    @page {
      margin: 58px 42px 72px 42px;
    }

    body {
      font-family: DejaVu Sans, sans-serif;
      color: #1f2937;
      font-size: 12px;
      line-height: 1.6;
    }

    .footer {
      position: fixed;
      bottom: -50px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    .footer .page:after {
      content: counter(page) " / " counter(pages);
    }

    .cover {
      background: #0f172a;
      color: #ffffff;
      border-radius: 18px;
      padding: 28px 30px;
      margin-bottom: 24px;
    }

    .cover .eyebrow {
      text-transform: uppercase;
      letter-spacing: 1.4px;
      font-size: 10px;
      color: #93c5fd;
      margin-bottom: 12px;
    }

    .cover h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      line-height: 1.2;
      color: #ffffff;
    }

    .cover p {
      margin: 0;
      font-size: 13px;
      color: #dbeafe;
    }

    .meta-table,
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
    }

    .meta-table td {
      border: 1px solid #dbe4f0;
      padding: 10px 12px;
      vertical-align: top;
      background: #f8fafc;
      width: 50%;
    }

    h2 {
      font-size: 20px;
      margin: 0 0 12px 0;
      color: #0f172a;
      border-bottom: 2px solid #dbeafe;
      padding-bottom: 6px;
    }

    h3 {
      font-size: 14px;
      margin: 18px 0 8px 0;
      color: #1d4ed8;
    }

    p {
      margin: 8px 0;
    }

    ul,
    ol {
      margin: 8px 0 14px 20px;
      padding: 0;
    }

    li {
      margin: 4px 0;
    }

    table {
      border: 1px solid #d1d5db;
    }

    th {
      background: #eff6ff;
      color: #1e3a8a;
      text-align: left;
      font-size: 11px;
      padding: 8px 10px;
      border: 1px solid #d1d5db;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      vertical-align: top;
    }

    code {
      background: #eef2ff;
      color: #1e3a8a;
      padding: 1px 5px;
      border-radius: 4px;
      font-family: DejaVu Sans Mono, monospace;
      font-size: 11px;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px;
      border-radius: 10px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 10.5px;
      line-height: 1.45;
      margin: 12px 0 8px 0;
    }

    .code-caption {
      margin-top: 0;
      font-size: 11px;
      color: #475569;
    }

    .note {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 10px 12px;
      margin: 12px 0 18px 0;
      color: #334155;
    }

    .toc {
      margin: 0 0 18px 18px;
    }

    .toc li {
      margin: 5px 0;
    }

    .toc a {
      color: #1d4ed8;
      text-decoration: none;
    }

    .section {
      margin-bottom: 24px;
    }

    .page-break-before {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="footer">
    Rapport d'analyse du code source - RADEETA Management System - Page <span class="page"></span>
  </div>

  <div class="cover">
    <div class="eyebrow">Rapport d'analyse du code source</div>
    <h1>RADEETA Management System</h1>
    <p>Application web de gestion des operations terrain, de la facturation et du pilotage de service pour SRM Taza/Region.</p>
  </div>

  <table class="meta-table">
    <tr>
      <td><strong>Date de génération</strong><br>{$generatedAt}</td>
      <td><strong>Sources analysées</strong><br><code>frontend/</code> et <code>backend/</code></td>
    </tr>
    <tr>
      <td><strong>Stack observée</strong><br>React + Vite / Laravel + Sanctum / MySQL</td>
      <td><strong>Type de document</strong><br>Rapport technique de présentation orienté métier</td>
    </tr>
  </table>

  <div class="note">
    Analyse réalisée uniquement à partir du code source disponible dans le dépôt. Le rapport décrit l’architecture, les flux, les composants et la logique métier réellement visibles dans les fichiers.
  </div>

  <h2>Sommaire</h2>
  {$tocHtml}

  {$htmlSections}
</body>
</html>
HTML;

$outputDir = __DIR__;
$markdownPath = $outputDir.'/RADEETA-Management-System-Report.md';
$htmlPath = $outputDir.'/RADEETA-Management-System-Report.html';
$pdfPath = $outputDir.'/RADEETA-Management-System-Report.pdf';

file_put_contents($markdownPath, $markdown);
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

echo "Markdown: {$markdownPath}\n";
echo "HTML: {$htmlPath}\n";
echo "PDF: {$pdfPath}\n";
