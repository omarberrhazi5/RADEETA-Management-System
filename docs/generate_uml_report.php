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

            case 'code':
                $output .= '<pre><code>'.htmlspecialchars($block['code'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')."</code></pre>\n";
                if (! empty($block['caption'])) {
                    $output .= '<p class="code-caption">'.html_inline($block['caption'])."</p>\n";
                }
                break;

            case 'note':
                $output .= '<div class="note">'.html_inline($block['text'])."</div>\n";
                break;

            case 'figure':
                $output .= '<div class="figure">'.$block['svg']."</div>\n";
                if (! empty($block['caption'])) {
                    $output .= '<div class="figcaption">'.html_inline($block['caption'])."</div>\n";
                }
                break;
        }
    }

    return $output;
}

function write_text(string $path, string $content): void
{
    $dir = dirname($path);
    if (! is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    file_put_contents($path, $content);
}

$generatedAt = (new DateTimeImmutable('now'))->format('d/m/Y H:i');
$outputDir = __DIR__;
$assetDir = $outputDir.'/uml-assets';

if (! is_dir($assetDir)) {
    mkdir($assetDir, 0777, true);
}

$useCasePlantUml = <<<'PUML'
@startuml
left to right direction
skinparam packageStyle rectangle

actor "directeur" as Directeur
actor "responsable" as Responsable
actor "manager" as Manager
actor "technician" as Technician
actor "viewer" as Viewer
actor "developer" as Developer

rectangle "RADEETA-Management-System" {
  usecase "Se connecter /\nSe deconnecter" as UC_Auth
  usecase "Consulter tableau de bord" as UC_Dashboard
  usecase "Consulter donnees metier" as UC_ReadData
  usecase "Consulter notifications" as UC_Notifications
  usecase "Gerer `clients`" as UC_Clients
  usecase "Gerer `compteurs`" as UC_Compteurs
  usecase "Gerer `secteurs`" as UC_Secteurs
  usecase "Gerer `pannes`" as UC_Pannes
  usecase "Gerer `reparations`" as UC_Reparations
  usecase "Gerer `interventions`" as UC_Interventions
  usecase "Gerer `releves`" as UC_Releves
  usecase "Exporter rapports PDF / Excel" as UC_Reports
  usecase "Gerer `users` /\n`settings` /\n`logs` /\ntokens API" as UC_Admin
}

Directeur --> UC_Auth
Directeur --> UC_Dashboard
Directeur --> UC_ReadData
Directeur --> UC_Notifications
Directeur --> UC_Clients
Directeur --> UC_Compteurs
Directeur --> UC_Secteurs
Directeur --> UC_Pannes
Directeur --> UC_Reparations
Directeur --> UC_Interventions
Directeur --> UC_Releves
Directeur --> UC_Reports
Directeur --> UC_Admin

Responsable --> UC_Auth
Responsable --> UC_Dashboard
Responsable --> UC_ReadData
Responsable --> UC_Notifications
Responsable --> UC_Clients
Responsable --> UC_Compteurs
Responsable --> UC_Secteurs
Responsable --> UC_Pannes
Responsable --> UC_Reparations
Responsable --> UC_Interventions
Responsable --> UC_Releves
Responsable --> UC_Reports

Manager --> UC_Auth
Manager --> UC_Dashboard
Manager --> UC_ReadData
Manager --> UC_Notifications
Manager --> UC_Compteurs
Manager --> UC_Pannes
Manager --> UC_Reparations
Manager --> UC_Interventions
Manager --> UC_Releves
Manager --> UC_Reports

Technician --> UC_Auth
Technician --> UC_Dashboard
Technician --> UC_ReadData
Technician --> UC_Notifications
Technician --> UC_Pannes
Technician --> UC_Reparations
Technician --> UC_Interventions
Technician --> UC_Releves

Viewer --> UC_Auth
Viewer --> UC_Dashboard
Viewer --> UC_ReadData
Viewer --> UC_Notifications

Developer --> UC_Auth
Developer --> UC_Dashboard
Developer --> UC_ReadData
Developer --> UC_Notifications
Developer --> UC_Clients
Developer --> UC_Compteurs
Developer --> UC_Secteurs
Developer --> UC_Pannes
Developer --> UC_Reparations
Developer --> UC_Interventions
Developer --> UC_Releves
Developer --> UC_Reports

note right of UC_Admin
  Seulement `directeur`
  dans les routes API.
end note

note bottom of UC_Reports
  `viewer/reports` existe cote frontend
  mais l'API `reports/*` est a confirmer
  pour `viewer`.
end note
@enduml
PUML;

$mcdMermaid = <<<'MMD'
erDiagram
    users {
        bigint id PK
        string nom
        string prenom
        string identifiant
        string email
        string agence
        string role
    }

    secteurs {
        bigint id PK
        string nom_secteur
        string emplacement
        string agence
        string num_torne
        decimal latitude
        decimal longitude
    }

    clients {
        bigint id PK
        string police
        string nom
        string prenom
        string cin
        string telephone
        string adresse
        string type_abonnement
        string service_type
        bigint id_secteur FK
        boolean abonne
    }

    compteurs {
        bigint id PK
        string cadran
        string calibre
        string marque
        string service_type
        decimal index_releve
        bigint id_client FK
        bigint id_secteur FK
    }

    pannes {
        bigint id PK
        bigint id_compteur FK
        date date_panne
        string anomalie
        string status
        bigint assigned_to FK
    }

    reparations {
        bigint id PK
        bigint id_panne FK
        bigint id_plombier FK
        date date_reparation
        text description
    }

    releves {
        bigint id PK
        bigint compteur_id FK
        decimal ancien_index
        decimal nouvel_index
        decimal consommation
        date periode_debut
        date periode_fin
        bigint created_by FK
    }

    interventions {
        bigint id PK
        string intervention_number
        bigint panne_id FK
        bigint client_id FK
        bigint meter_id FK
        bigint technician_id FK
        string service_type
        string work_type
        json materials_used
        text observations
        string priority
        string status
        datetime started_at
        datetime completed_at
    }

    activity_logs {
        bigint id PK
        bigint user_id FK
        string action
        string module
        string ip_address
        json metadata
    }

    settings {
        bigint id PK
        string key
        json value
    }

    notifications {
        uuid id PK
        string type
        string notifiable_type
        bigint notifiable_id
        json data
        datetime read_at
    }

    secteurs o|--o{ clients : "id_secteur"
    secteurs ||--o{ compteurs : "id_secteur"
    clients ||--o{ compteurs : "id_client"
    compteurs ||--o{ pannes : "id_compteur"
    users o|--o{ pannes : "assigned_to"
    pannes ||--o{ reparations : "id_panne"
    users o|--o{ reparations : "id_plombier"
    compteurs ||--o{ releves : "compteur_id"
    users o|--o{ releves : "created_by"
    pannes o|--o{ interventions : "panne_id"
    users ||--o{ interventions : "technician_id"
    clients o|--o{ interventions : "client_id"
    compteurs o|--o{ interventions : "meter_id"
    users o|--o{ activity_logs : "user_id"
    users ||--o{ notifications : "notifiable_id (usage actuel)"
MMD;

$classPlantUml = <<<'PUML'
@startuml
left to right direction
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
hide empty members

abstract class Authenticatable
abstract class Model
abstract class Controller

package "Models" {
  class User {
    +id: bigint
    +nom: string
    +prenom: string?
    +identifiant: string
    +email: string?
    +agence: string
    +role: UserRole
    +reparations()
    +interventions()
    +assignedPannes()
  }

  class Secteur {
    +id: bigint
    +nom_secteur: string
    +emplacement: string
    +agence: string
    +num_torne: string
    +latitude: decimal?
    +longitude: decimal?
    +compteurs()
    +pannes()
  }

  class Client {
    +id: bigint
    +police: string
    +nom: string
    +prenom: string?
    +cin: string?
    +telephone: string?
    +adresse: string?
    +type_abonnement: string
    +service_type: string
    +id_secteur: bigint?
    +abonne: bool
    +compteurs()
    +secteur()
  }

  class Compteur {
    +id: bigint
    +cadran: string
    +calibre: string
    +marque: string?
    +service_type: string
    +index_releve: decimal
    +id_client: bigint
    +id_secteur: bigint
    +client()
    +secteur()
    +pannes()
    +releves()
  }

  class Panne {
    +id: bigint
    +id_compteur: bigint
    +date_panne: date
    +anomalie: PanneAnomalie
    +status: PanneStatus
    +assigned_to: bigint?
    +compteur()
    +reparations()
    +interventions()
    +assignedOperator()
  }

  class Reparation {
    +id: bigint
    +id_panne: bigint
    +id_plombier: bigint?
    +date_reparation: date
    +description: text?
    +panne()
    +plombier()
  }

  class Releve {
    +id: bigint
    +compteur_id: bigint
    +ancien_index: decimal
    +nouvel_index: decimal
    +consommation: decimal
    +periode_debut: date
    +periode_fin: date
    +created_by: bigint?
    +compteur()
    +creator()
  }

  class Intervention {
    +id: bigint
    +intervention_number: string
    +panne_id: bigint?
    +client_id: bigint?
    +meter_id: bigint?
    +technician_id: bigint
    +service_type: string
    +work_type: string
    +materials_used: array?
    +observations: text?
    +priority: string
    +status: string
    +started_at: datetime
    +completed_at: datetime?
    +panne()
    +technician()
    +client()
    +meter()
  }

  class Setting {
    +id: bigint
    +key: string
    +value: json
  }

  class ActivityLog {
    +id: bigint
    +user_id: bigint?
    +action: string
    +module: string
    +ip_address: string?
    +metadata: json?
    +user()
    +record(action, module, request, metadata)
  }

  class DatabaseNotification {
    +id: uuid
    +type: string
    +data: json
    +read_at: datetime?
    +created_at: datetime?
  }
}

package "Services / Policies / Requests" {
  class NotificationService {
    +panneAssigned(panne)
    +repairCompleted(reparation)
    +userCreated(user)
  }

  class OperatorAccess {
    +isOperator(user)
    +scopePannes(query, user)
    +scopeReparations(query, user)
    +scopeReleves(query, user)
    +scopeCompteurs(query, user)
    +scopeClients(query, user)
    +canAccessCompteur(compteur, user)
  }

  class InterventionPolicy {
    +viewAny(user)
    +view(user, intervention)
    +create(user)
    +update(user, intervention)
  }

  class ReparationRequest {
    +authorize()
    +rules()
    +withValidator()
  }
}

package "Controllers" {
  class AuthController {
    +login(request)
    +logout(request)
    +me(request)
    +clearTokens()
  }

  class DashboardController {
    +summary()
  }

  class NotificationController {
    +index(request)
    +markAsRead(request)
  }

  class ClientController {
    +index(request)
    +store(request)
    +show(request, client)
    +update(request, client)
    +destroy(client)
  }

  class PanneController {
    +index(request)
    +store(request, notifications)
    +show(request, panne)
    +update(request, panne, notifications)
    +destroy(panne)
  }

  class ReparationController {
    +index(request)
    +store(request, notifications)
    +show(request, reparation)
    +update(request, reparation, notifications)
    +destroy(reparation)
  }

  class ReleveController {
    +index(request)
    +store(request)
    +update(request, releve)
    +show(request, releve)
  }

  class InterventionController {
    +index(request, policy)
    +store(request, policy)
    +show(request, intervention, policy)
    +update(request, intervention, policy)
  }

  class UserController {
    +index(request)
    +technicians()
    +store(request, notifications)
    +update(request, user)
  }

  class SettingsController {
    +show()
    +update(request)
  }

  class ReportController {
    +pannesPdf(request)
    +clientsExcel()
  }
}

User --|> Authenticatable
Secteur --|> Model
Client --|> Model
Compteur --|> Model
Panne --|> Model
Reparation --|> Model
Releve --|> Model
Intervention --|> Model
Setting --|> Model
ActivityLog --|> Model

AuthController --|> Controller
DashboardController --|> Controller
NotificationController --|> Controller
ClientController --|> Controller
PanneController --|> Controller
ReparationController --|> Controller
ReleveController --|> Controller
InterventionController --|> Controller
UserController --|> Controller
SettingsController --|> Controller
ReportController --|> Controller

Client "0..*" --> "0..1" Secteur : secteur
Secteur "1" <-- "0..*" Compteur : compteurs
Client "1" <-- "0..*" Compteur : client
Compteur "1" <-- "0..*" Panne : compteur
Panne "0..*" --> "0..1" User : assignedOperator
Panne "1" <-- "0..*" Reparation : panne
Reparation "0..*" --> "0..1" User : plombier
Compteur "1" <-- "0..*" Releve : compteur
Releve "0..*" --> "0..1" User : creator
Panne "0..1" <-- "0..*" Intervention : panne
User "1" <-- "0..*" Intervention : technician
Client "0..1" <-- "0..*" Intervention : client
Compteur "0..1" <-- "0..*" Intervention : meter
User "0..1" <-- "0..*" ActivityLog : user
User "1" <-- "0..*" DatabaseNotification : notifications

NotificationService ..> Panne
NotificationService ..> Reparation
NotificationService ..> User
NotificationService ..> DatabaseNotification

OperatorAccess ..> User
OperatorAccess ..> Compteur
OperatorAccess ..> Panne
OperatorAccess ..> Reparation
OperatorAccess ..> Releve
OperatorAccess ..> Client

InterventionPolicy ..> User
InterventionPolicy ..> Intervention

ReparationRequest ..> Panne
ReparationRequest ..> Reparation
ReparationRequest ..> User

AuthController ..> User
AuthController ..> ActivityLog
DashboardController ..> Client
DashboardController ..> Compteur
DashboardController ..> Secteur
DashboardController ..> Panne
DashboardController ..> Intervention
NotificationController ..> DatabaseNotification
NotificationController ..> User
ClientController ..> Client
ClientController ..> Secteur
ClientController ..> OperatorAccess
PanneController ..> Panne
PanneController ..> NotificationService
ReparationController ..> Reparation
ReparationController ..> Panne
ReparationController ..> ReparationRequest
ReparationController ..> NotificationService
ReparationController ..> OperatorAccess
ReleveController ..> Releve
ReleveController ..> Compteur
ReleveController ..> OperatorAccess
InterventionController ..> Intervention
InterventionController ..> Panne
InterventionController ..> ActivityLog
InterventionController ..> InterventionPolicy
InterventionController ..> OperatorAccess
UserController ..> User
UserController ..> NotificationService
UserController ..> ActivityLog
SettingsController ..> Setting
SettingsController ..> ActivityLog
ReportController ..> Panne

note bottom of ReparationRequest
  Une seule reparation active par panne
  est imposee par validation applicative,
  pas par une contrainte SQL unique.
end note

note bottom of DatabaseNotification
  Table Laravel `notifications`.
  `App\Models\Notification` est legacy
  et reste a confirmer.
end note
@enduml
PUML;

$useCaseSvg = <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="860" viewBox="0 0 1400 860">
  <defs>
    <style>
      .title{font:700 28px Arial, sans-serif;fill:#0f172a}
      .sub{font:600 13px Arial, sans-serif;fill:#334155}
      .label{font:600 16px Arial, sans-serif;fill:#0f172a}
      .small{font:12px Arial, sans-serif;fill:#334155}
      .use{font:600 14px Arial, sans-serif;fill:#0f172a}
      .note{font:12px Arial, sans-serif;fill:#334155}
      .assoc{stroke:#94a3b8;stroke-width:2;stroke-opacity:.7}
      .uc{fill:#fff;stroke:#2563eb;stroke-width:2}
      .boundary{fill:#eff6ff;stroke:#bfdbfe;stroke-width:2}
      .note-box{fill:#f8fafc;stroke:#cbd5e1;stroke-width:1.5}
    </style>
  </defs>
  <rect width="1400" height="860" fill="#ffffff"/>
  <text x="700" y="38" text-anchor="middle" class="title">Diagramme de cas d'utilisation - code reel</text>
  <text x="700" y="62" text-anchor="middle" class="sub">Vue de synthese. Le detail exact par ressource est precise dans les tableaux et dans le code PlantUML.</text>

  <rect x="235" y="90" rx="24" ry="24" width="930" height="730" class="boundary"/>
  <text x="700" y="122" text-anchor="middle" class="label">Systeme : RADEETA-Management-System</text>

  <ellipse cx="420" cy="170" rx="120" ry="42" class="uc"/>
  <text x="420" y="164" text-anchor="middle" class="use">Se connecter</text>
  <text x="420" y="182" text-anchor="middle" class="use">Se deconnecter</text>

  <ellipse cx="700" cy="170" rx="125" ry="42" class="uc"/>
  <text x="700" y="176" text-anchor="middle" class="use">Consulter tableau de bord</text>

  <ellipse cx="980" cy="170" rx="120" ry="42" class="uc"/>
  <text x="980" y="176" text-anchor="middle" class="use">Consulter notifications</text>

  <ellipse cx="420" cy="320" rx="130" ry="46" class="uc"/>
  <text x="420" y="326" text-anchor="middle" class="use">Consulter donnees metier</text>

  <ellipse cx="700" cy="320" rx="110" ry="40" class="uc"/>
  <text x="700" y="326" text-anchor="middle" class="use">Gerer `clients`</text>

  <ellipse cx="980" cy="320" rx="120" ry="40" class="uc"/>
  <text x="980" y="326" text-anchor="middle" class="use">Gerer `compteurs`</text>

  <ellipse cx="420" cy="470" rx="115" ry="40" class="uc"/>
  <text x="420" y="476" text-anchor="middle" class="use">Gerer `secteurs`</text>

  <ellipse cx="700" cy="470" rx="105" ry="40" class="uc"/>
  <text x="700" y="476" text-anchor="middle" class="use">Gerer `pannes`</text>

  <ellipse cx="980" cy="470" rx="125" ry="40" class="uc"/>
  <text x="980" y="476" text-anchor="middle" class="use">Gerer `reparations`</text>

  <ellipse cx="420" cy="620" rx="130" ry="40" class="uc"/>
  <text x="420" y="626" text-anchor="middle" class="use">Gerer `interventions`</text>

  <ellipse cx="700" cy="620" rx="110" ry="40" class="uc"/>
  <text x="700" y="626" text-anchor="middle" class="use">Gerer `releves`</text>

  <ellipse cx="980" cy="620" rx="130" ry="40" class="uc"/>
  <text x="980" y="614" text-anchor="middle" class="use">Exporter rapports</text>
  <text x="980" y="632" text-anchor="middle" class="use">PDF / Excel</text>

  <ellipse cx="700" cy="750" rx="180" ry="52" class="uc"/>
  <text x="700" y="738" text-anchor="middle" class="use">Gerer `users` / `settings`</text>
  <text x="700" y="756" text-anchor="middle" class="use">`logs` / tokens API</text>

  <!-- Left actors -->
  <circle cx="95" cy="150" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="168" x2="95" y2="218" stroke="#0f172a" stroke-width="2"/>
  <line x1="70" y1="185" x2="120" y2="185" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="218" x2="75" y2="252" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="218" x2="115" y2="252" stroke="#0f172a" stroke-width="2"/>
  <text x="95" y="280" text-anchor="middle" class="label">directeur</text>

  <circle cx="95" cy="395" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="413" x2="95" y2="463" stroke="#0f172a" stroke-width="2"/>
  <line x1="70" y1="430" x2="120" y2="430" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="463" x2="75" y2="497" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="463" x2="115" y2="497" stroke="#0f172a" stroke-width="2"/>
  <text x="95" y="525" text-anchor="middle" class="label">responsable</text>

  <circle cx="95" cy="640" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="658" x2="95" y2="708" stroke="#0f172a" stroke-width="2"/>
  <line x1="70" y1="675" x2="120" y2="675" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="708" x2="75" y2="742" stroke="#0f172a" stroke-width="2"/>
  <line x1="95" y1="708" x2="115" y2="742" stroke="#0f172a" stroke-width="2"/>
  <text x="95" y="770" text-anchor="middle" class="label">developer</text>

  <!-- Right actors -->
  <circle cx="1305" cy="170" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="188" x2="1305" y2="238" stroke="#0f172a" stroke-width="2"/>
  <line x1="1280" y1="205" x2="1330" y2="205" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="238" x2="1285" y2="272" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="238" x2="1325" y2="272" stroke="#0f172a" stroke-width="2"/>
  <text x="1305" y="300" text-anchor="middle" class="label">manager</text>

  <circle cx="1305" cy="400" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="418" x2="1305" y2="468" stroke="#0f172a" stroke-width="2"/>
  <line x1="1280" y1="435" x2="1330" y2="435" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="468" x2="1285" y2="502" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="468" x2="1325" y2="502" stroke="#0f172a" stroke-width="2"/>
  <text x="1305" y="530" text-anchor="middle" class="label">technician</text>

  <circle cx="1305" cy="635" r="18" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="653" x2="1305" y2="703" stroke="#0f172a" stroke-width="2"/>
  <line x1="1280" y1="670" x2="1330" y2="670" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="703" x2="1285" y2="737" stroke="#0f172a" stroke-width="2"/>
  <line x1="1305" y1="703" x2="1325" y2="737" stroke="#0f172a" stroke-width="2"/>
  <text x="1305" y="765" text-anchor="middle" class="label">viewer</text>

  <!-- Associations -->
  <line x1="130" y1="175" x2="300" y2="170" class="assoc"/>
  <line x1="130" y1="175" x2="575" y2="170" class="assoc"/>
  <line x1="130" y1="175" x2="860" y2="170" class="assoc"/>
  <line x1="130" y1="190" x2="295" y2="320" class="assoc"/>
  <line x1="130" y1="215" x2="590" y2="320" class="assoc"/>
  <line x1="130" y1="230" x2="860" y2="320" class="assoc"/>
  <line x1="130" y1="245" x2="305" y2="470" class="assoc"/>
  <line x1="130" y1="255" x2="595" y2="470" class="assoc"/>
  <line x1="130" y1="260" x2="855" y2="470" class="assoc"/>
  <line x1="130" y1="265" x2="295" y2="620" class="assoc"/>
  <line x1="130" y1="268" x2="590" y2="620" class="assoc"/>
  <line x1="130" y1="270" x2="850" y2="620" class="assoc"/>
  <line x1="130" y1="272" x2="520" y2="750" class="assoc"/>

  <line x1="130" y1="420" x2="300" y2="170" class="assoc"/>
  <line x1="130" y1="425" x2="575" y2="170" class="assoc"/>
  <line x1="130" y1="430" x2="860" y2="170" class="assoc"/>
  <line x1="130" y1="435" x2="295" y2="320" class="assoc"/>
  <line x1="130" y1="445" x2="590" y2="320" class="assoc"/>
  <line x1="130" y1="455" x2="860" y2="320" class="assoc"/>
  <line x1="130" y1="465" x2="305" y2="470" class="assoc"/>
  <line x1="130" y1="475" x2="595" y2="470" class="assoc"/>
  <line x1="130" y1="485" x2="855" y2="470" class="assoc"/>
  <line x1="130" y1="495" x2="295" y2="620" class="assoc"/>
  <line x1="130" y1="505" x2="590" y2="620" class="assoc"/>
  <line x1="130" y1="515" x2="850" y2="620" class="assoc"/>

  <line x1="130" y1="665" x2="300" y2="170" class="assoc"/>
  <line x1="130" y1="670" x2="575" y2="170" class="assoc"/>
  <line x1="130" y1="675" x2="860" y2="170" class="assoc"/>
  <line x1="130" y1="680" x2="295" y2="320" class="assoc"/>
  <line x1="130" y1="685" x2="590" y2="320" class="assoc"/>
  <line x1="130" y1="690" x2="860" y2="320" class="assoc"/>
  <line x1="130" y1="695" x2="305" y2="470" class="assoc"/>
  <line x1="130" y1="700" x2="595" y2="470" class="assoc"/>
  <line x1="130" y1="705" x2="855" y2="470" class="assoc"/>
  <line x1="130" y1="710" x2="295" y2="620" class="assoc"/>
  <line x1="130" y1="715" x2="590" y2="620" class="assoc"/>
  <line x1="130" y1="720" x2="850" y2="620" class="assoc"/>

  <line x1="1280" y1="205" x2="540" y2="170" class="assoc"/>
  <line x1="1280" y1="205" x2="825" y2="170" class="assoc"/>
  <line x1="1280" y1="205" x2="1100" y2="170" class="assoc"/>
  <line x1="1280" y1="215" x2="1100" y2="320" class="assoc"/>
  <line x1="1280" y1="225" x2="805" y2="470" class="assoc"/>
  <line x1="1280" y1="235" x2="1105" y2="470" class="assoc"/>
  <line x1="1280" y1="245" x2="550" y2="620" class="assoc"/>
  <line x1="1280" y1="255" x2="805" y2="620" class="assoc"/>
  <line x1="1280" y1="265" x2="1100" y2="620" class="assoc"/>

  <line x1="1280" y1="435" x2="540" y2="170" class="assoc"/>
  <line x1="1280" y1="435" x2="825" y2="170" class="assoc"/>
  <line x1="1280" y1="435" x2="1100" y2="170" class="assoc"/>
  <line x1="1280" y1="440" x2="550" y2="320" class="assoc"/>
  <line x1="1280" y1="445" x2="805" y2="470" class="assoc"/>
  <line x1="1280" y1="450" x2="1105" y2="470" class="assoc"/>
  <line x1="1280" y1="455" x2="550" y2="620" class="assoc"/>
  <line x1="1280" y1="460" x2="805" y2="620" class="assoc"/>

  <line x1="1280" y1="670" x2="540" y2="170" class="assoc"/>
  <line x1="1280" y1="670" x2="825" y2="170" class="assoc"/>
  <line x1="1280" y1="670" x2="1100" y2="170" class="assoc"/>
  <line x1="1280" y1="675" x2="550" y2="320" class="assoc"/>

  <rect x="1025" y="705" width="250" height="90" rx="12" ry="12" class="note-box"/>
  <text x="1042" y="730" class="note">A confirmer :</text>
  <text x="1042" y="750" class="note">le frontend declare `viewer/reports`,</text>
  <text x="1042" y="768" class="note">mais `reports/*` est protege cote API</text>
  <text x="1042" y="786" class="note">par `managerRoles`.</text>
</svg>
SVG;

$mcdSvg = <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="980" viewBox="0 0 1400 980">
  <defs>
    <style>
      .title{font:700 28px Arial, sans-serif;fill:#0f172a}
      .sub{font:600 13px Arial, sans-serif;fill:#334155}
      .entity{fill:#fff;stroke:#2563eb;stroke-width:2}
      .entity-head{fill:#2563eb}
      .entity-title{font:700 16px Arial, sans-serif;fill:#fff}
      .attr{font:12px Arial, sans-serif;fill:#1f2937}
      .rel{stroke:#475569;stroke-width:2}
      .card{font:700 12px Arial, sans-serif;fill:#b91c1c}
      .note{font:12px Arial, sans-serif;fill:#334155}
      .note-box{fill:#f8fafc;stroke:#cbd5e1;stroke-width:1.5}
    </style>
  </defs>
  <rect width="1400" height="980" fill="#ffffff"/>
  <text x="700" y="36" text-anchor="middle" class="title">MCD - modele conceptuel de donnees</text>
  <text x="700" y="58" text-anchor="middle" class="sub">Entites deduites des models, migrations, controllers et relations Eloquent.</text>

  <!-- users -->
  <rect x="30" y="110" width="230" height="180" rx="14" ry="14" class="entity"/>
  <rect x="30" y="110" width="230" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="145" y="132" text-anchor="middle" class="entity-title">users</text>
  <text x="46" y="164" class="attr">PK id</text>
  <text x="46" y="182" class="attr">nom, prenom</text>
  <text x="46" y="200" class="attr">identifiant, email</text>
  <text x="46" y="218" class="attr">agence</text>
  <text x="46" y="236" class="attr">role</text>
  <text x="46" y="254" class="attr">password</text>

  <!-- secteurs -->
  <rect x="560" y="40" width="250" height="190" rx="14" ry="14" class="entity"/>
  <rect x="560" y="40" width="250" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="685" y="62" text-anchor="middle" class="entity-title">secteurs</text>
  <text x="576" y="94" class="attr">PK id</text>
  <text x="576" y="112" class="attr">nom_secteur</text>
  <text x="576" y="130" class="attr">emplacement</text>
  <text x="576" y="148" class="attr">agence</text>
  <text x="576" y="166" class="attr">num_torne</text>
  <text x="576" y="184" class="attr">latitude, longitude</text>

  <!-- clients -->
  <rect x="280" y="280" width="250" height="210" rx="14" ry="14" class="entity"/>
  <rect x="280" y="280" width="250" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="405" y="302" text-anchor="middle" class="entity-title">clients</text>
  <text x="296" y="334" class="attr">PK id</text>
  <text x="296" y="352" class="attr">police</text>
  <text x="296" y="370" class="attr">nom, prenom</text>
  <text x="296" y="388" class="attr">cin, telephone</text>
  <text x="296" y="406" class="attr">adresse</text>
  <text x="296" y="424" class="attr">type_abonnement</text>
  <text x="296" y="442" class="attr">service_type</text>
  <text x="296" y="460" class="attr">FK id_secteur</text>
  <text x="296" y="478" class="attr">abonne</text>

  <!-- compteurs -->
  <rect x="560" y="300" width="250" height="210" rx="14" ry="14" class="entity"/>
  <rect x="560" y="300" width="250" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="685" y="322" text-anchor="middle" class="entity-title">compteurs</text>
  <text x="576" y="354" class="attr">PK id</text>
  <text x="576" y="372" class="attr">cadran</text>
  <text x="576" y="390" class="attr">calibre, marque</text>
  <text x="576" y="408" class="attr">service_type</text>
  <text x="576" y="426" class="attr">index_releve</text>
  <text x="576" y="444" class="attr">FK id_client</text>
  <text x="576" y="462" class="attr">FK id_secteur</text>

  <!-- pannes -->
  <rect x="850" y="280" width="250" height="190" rx="14" ry="14" class="entity"/>
  <rect x="850" y="280" width="250" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="975" y="302" text-anchor="middle" class="entity-title">pannes</text>
  <text x="866" y="334" class="attr">PK id</text>
  <text x="866" y="352" class="attr">FK id_compteur</text>
  <text x="866" y="370" class="attr">date_panne</text>
  <text x="866" y="388" class="attr">anomalie</text>
  <text x="866" y="406" class="attr">status</text>
  <text x="866" y="424" class="attr">FK assigned_to</text>

  <!-- reparations -->
  <rect x="1120" y="270" width="240" height="180" rx="14" ry="14" class="entity"/>
  <rect x="1120" y="270" width="240" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="1240" y="292" text-anchor="middle" class="entity-title">reparations</text>
  <text x="1136" y="324" class="attr">PK id</text>
  <text x="1136" y="342" class="attr">FK id_panne</text>
  <text x="1136" y="360" class="attr">FK id_plombier</text>
  <text x="1136" y="378" class="attr">date_reparation</text>
  <text x="1136" y="396" class="attr">description</text>

  <!-- releves -->
  <rect x="270" y="580" width="260" height="200" rx="14" ry="14" class="entity"/>
  <rect x="270" y="580" width="260" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="400" y="602" text-anchor="middle" class="entity-title">releves</text>
  <text x="286" y="634" class="attr">PK id</text>
  <text x="286" y="652" class="attr">FK compteur_id</text>
  <text x="286" y="670" class="attr">ancien_index</text>
  <text x="286" y="688" class="attr">nouvel_index</text>
  <text x="286" y="706" class="attr">consommation</text>
  <text x="286" y="724" class="attr">periode_debut / periode_fin</text>
  <text x="286" y="742" class="attr">FK created_by</text>

  <!-- interventions -->
  <rect x="760" y="560" width="340" height="240" rx="14" ry="14" class="entity"/>
  <rect x="760" y="560" width="340" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="930" y="582" text-anchor="middle" class="entity-title">interventions</text>
  <text x="776" y="614" class="attr">PK id</text>
  <text x="776" y="632" class="attr">intervention_number</text>
  <text x="776" y="650" class="attr">FK panne_id, client_id, meter_id</text>
  <text x="776" y="668" class="attr">FK technician_id</text>
  <text x="776" y="686" class="attr">service_type, work_type</text>
  <text x="776" y="704" class="attr">materials_used, observations</text>
  <text x="776" y="722" class="attr">priority, status</text>
  <text x="776" y="740" class="attr">started_at, completed_at</text>

  <!-- activity_logs -->
  <rect x="30" y="390" width="230" height="150" rx="14" ry="14" class="entity"/>
  <rect x="30" y="390" width="230" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="145" y="412" text-anchor="middle" class="entity-title">activity_logs</text>
  <text x="46" y="444" class="attr">PK id</text>
  <text x="46" y="462" class="attr">FK user_id</text>
  <text x="46" y="480" class="attr">action, module</text>
  <text x="46" y="498" class="attr">ip_address</text>
  <text x="46" y="516" class="attr">metadata</text>

  <!-- notifications -->
  <rect x="30" y="620" width="230" height="170" rx="14" ry="14" class="entity"/>
  <rect x="30" y="620" width="230" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="145" y="642" text-anchor="middle" class="entity-title">notifications</text>
  <text x="46" y="674" class="attr">PK id (uuid)</text>
  <text x="46" y="692" class="attr">type</text>
  <text x="46" y="710" class="attr">notifiable_type</text>
  <text x="46" y="728" class="attr">notifiable_id</text>
  <text x="46" y="746" class="attr">data</text>
  <text x="46" y="764" class="attr">read_at</text>

  <!-- settings -->
  <rect x="560" y="820" width="250" height="120" rx="14" ry="14" class="entity"/>
  <rect x="560" y="820" width="250" height="34" rx="14" ry="14" class="entity-head"/>
  <text x="685" y="842" text-anchor="middle" class="entity-title">settings</text>
  <text x="576" y="874" class="attr">PK id</text>
  <text x="576" y="892" class="attr">key</text>
  <text x="576" y="910" class="attr">value</text>

  <!-- relations -->
  <line x1="760" y1="230" x2="760" y2="300" class="rel"/>
  <text x="770" y="255" class="card">0,N</text>
  <text x="770" y="290" class="card">1,1</text>

  <line x1="530" y1="385" x2="560" y2="385" class="rel"/>
  <text x="520" y="375" class="card">0,N</text>
  <text x="563" y="375" class="card">1,1</text>

  <line x1="810" y1="390" x2="850" y2="390" class="rel"/>
  <text x="812" y="378" class="card">0,N</text>
  <text x="850" y="378" class="card">1,1</text>

  <line x1="1100" y1="360" x2="1120" y2="360" class="rel"/>
  <text x="1088" y="348" class="card">0,N</text>
  <text x="1122" y="348" class="card">1,1</text>

  <line x1="405" y1="490" x2="400" y2="580" class="rel"/>
  <text x="414" y="530" class="card">0,N</text>
  <text x="414" y="568" class="card">0,1</text>

  <line x1="685" y1="510" x2="685" y2="580" class="rel"/>
  <text x="695" y="538" class="card">0,N</text>
  <text x="695" y="572" class="card">1,1</text>

  <line x1="975" y1="470" x2="930" y2="560" class="rel"/>
  <text x="978" y="510" class="card">0,N</text>
  <text x="940" y="550" class="card">0,1</text>

  <line x1="530" y1="445" x2="760" y2="630" class="rel"/>
  <text x="588" y="512" class="card">0,N</text>
  <text x="730" y="617" class="card">0,1</text>

  <line x1="810" y1="445" x2="760" y2="650" class="rel"/>
  <text x="802" y="520" class="card">0,N</text>
  <text x="734" y="652" class="card">0,1</text>

  <line x1="260" y1="205" x2="850" y2="424" class="rel"/>
  <text x="305" y="240" class="card">0,N</text>
  <text x="825" y="424" class="card">0,1</text>

  <line x1="260" y1="210" x2="1120" y2="360" class="rel"/>
  <text x="350" y="214" class="card">0,N</text>
  <text x="1090" y="336" class="card">0,1</text>

  <line x1="260" y1="220" x2="270" y2="742" class="rel"/>
  <text x="236" y="282" class="card">0,N</text>
  <text x="274" y="742" class="card">0,1</text>

  <line x1="260" y1="230" x2="760" y2="668" class="rel"/>
  <text x="330" y="305" class="card">0,N</text>
  <text x="735" y="668" class="card">1,1</text>

  <line x1="145" y1="290" x2="145" y2="390" class="rel"/>
  <text x="155" y="330" class="card">0,N</text>
  <text x="155" y="380" class="card">0,1</text>

  <line x1="145" y1="290" x2="145" y2="620" class="rel"/>
  <text x="155" y="520" class="card">0,N</text>
  <text x="155" y="610" class="card">1,1</text>

  <line x1="560" y1="140" x2="530" y2="370" class="rel"/>
  <text x="520" y="180" class="card">0,N</text>
  <text x="520" y="345" class="card">0,1</text>

  <rect x="1085" y="650" width="255" height="132" rx="12" ry="12" class="note-box"/>
  <text x="1102" y="676" class="note">A confirmer :</text>
  <text x="1102" y="696" class="note">- `pannes` -> `reparations` = 0,N</text>
  <text x="1102" y="714" class="note">  dans le schema / modele</text>
  <text x="1102" y="732" class="note">- mais `ReparationRequest` impose</text>
  <text x="1102" y="750" class="note">  une seule reparation active</text>
  <text x="1102" y="768" class="note">  par panne</text>
</svg>
SVG;

$classSvg = <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1020" viewBox="0 0 1400 1020">
  <defs>
    <style>
      .title{font:700 28px Arial, sans-serif;fill:#0f172a}
      .sub{font:600 13px Arial, sans-serif;fill:#334155}
      .panel-domain{fill:#eff6ff;stroke:#bfdbfe;stroke-width:2}
      .panel-rules{fill:#fff7ed;stroke:#fed7aa;stroke-width:2}
      .panel-ctrl{fill:#f8fafc;stroke:#cbd5e1;stroke-width:2}
      .panel-title{font:700 18px Arial, sans-serif;fill:#0f172a}
      .class-box{fill:#fff;stroke:#2563eb;stroke-width:2}
      .class-head{fill:#2563eb}
      .class-title{font:700 14px Arial, sans-serif;fill:#fff}
      .member{font:11px Arial, sans-serif;fill:#1f2937}
      .assoc{stroke:#334155;stroke-width:2}
      .dep{stroke:#f97316;stroke-width:2;stroke-dasharray:7 6}
      .inh{stroke:#0f172a;stroke-width:2}
      .legend{font:12px Arial, sans-serif;fill:#334155}
    </style>
  </defs>
  <rect width="1400" height="1020" fill="#ffffff"/>
  <text x="700" y="36" text-anchor="middle" class="title">Diagramme de classes UML - synthese du code</text>
  <text x="700" y="58" text-anchor="middle" class="sub">La visualisation ci-dessous se concentre sur les classes metier et les regles. Le code PlantUML complet est fourni ensuite.</text>

  <rect x="30" y="80" width="870" height="900" rx="24" ry="24" class="panel-domain"/>
  <text x="52" y="112" class="panel-title">Domaine et persistence</text>

  <rect x="920" y="80" width="220" height="430" rx="24" ry="24" class="panel-rules"/>
  <text x="942" y="112" class="panel-title">Services / regles</text>

  <rect x="1160" y="80" width="210" height="430" rx="24" ry="24" class="panel-ctrl"/>
  <text x="1182" y="112" class="panel-title">Controllers</text>

  <!-- Authenticatable -->
  <rect x="70" y="140" width="180" height="76" rx="12" ry="12" class="class-box"/>
  <rect x="70" y="140" width="180" height="28" rx="12" ry="12" class="class-head"/>
  <text x="160" y="159" text-anchor="middle" class="class-title">Authenticatable</text>
  <text x="84" y="190" class="member">+ login identity</text>

  <!-- User -->
  <rect x="70" y="250" width="220" height="170" rx="12" ry="12" class="class-box"/>
  <rect x="70" y="250" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="180" y="269" text-anchor="middle" class="class-title">User</text>
  <text x="84" y="300" class="member">+ nom, prenom</text>
  <text x="84" y="318" class="member">+ identifiant, email</text>
  <text x="84" y="336" class="member">+ agence, role</text>
  <text x="84" y="362" class="member">+ reparations()</text>
  <text x="84" y="380" class="member">+ interventions()</text>
  <text x="84" y="398" class="member">+ assignedPannes()</text>

  <!-- Secteur -->
  <rect x="330" y="140" width="220" height="155" rx="12" ry="12" class="class-box"/>
  <rect x="330" y="140" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="440" y="159" text-anchor="middle" class="class-title">Secteur</text>
  <text x="344" y="190" class="member">+ nom_secteur</text>
  <text x="344" y="208" class="member">+ emplacement</text>
  <text x="344" y="226" class="member">+ agence, num_torne</text>
  <text x="344" y="244" class="member">+ latitude, longitude</text>
  <text x="344" y="270" class="member">+ compteurs()</text>
  <text x="344" y="288" class="member">+ pannes()</text>

  <!-- Client -->
  <rect x="330" y="330" width="220" height="175" rx="12" ry="12" class="class-box"/>
  <rect x="330" y="330" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="440" y="349" text-anchor="middle" class="class-title">Client</text>
  <text x="344" y="380" class="member">+ police</text>
  <text x="344" y="398" class="member">+ nom, prenom</text>
  <text x="344" y="416" class="member">+ cin, telephone</text>
  <text x="344" y="434" class="member">+ type_abonnement</text>
  <text x="344" y="452" class="member">+ service_type, abonne</text>
  <text x="344" y="478" class="member">+ compteurs()</text>
  <text x="344" y="496" class="member">+ secteur()</text>

  <!-- Compteur -->
  <rect x="590" y="330" width="220" height="175" rx="12" ry="12" class="class-box"/>
  <rect x="590" y="330" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="700" y="349" text-anchor="middle" class="class-title">Compteur</text>
  <text x="604" y="380" class="member">+ cadran</text>
  <text x="604" y="398" class="member">+ calibre, marque</text>
  <text x="604" y="416" class="member">+ service_type</text>
  <text x="604" y="434" class="member">+ index_releve</text>
  <text x="604" y="460" class="member">+ client()</text>
  <text x="604" y="478" class="member">+ secteur()</text>
  <text x="604" y="496" class="member">+ pannes(), releves()</text>

  <!-- Panne -->
  <rect x="850" y="330" width="220" height="175" rx="12" ry="12" class="class-box"/>
  <rect x="850" y="330" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="960" y="349" text-anchor="middle" class="class-title">Panne</text>
  <text x="864" y="380" class="member">+ date_panne</text>
  <text x="864" y="398" class="member">+ anomalie</text>
  <text x="864" y="416" class="member">+ status</text>
  <text x="864" y="434" class="member">+ assigned_to</text>
  <text x="864" y="460" class="member">+ compteur()</text>
  <text x="864" y="478" class="member">+ reparations()</text>
  <text x="864" y="496" class="member">+ interventions()</text>

  <!-- Setting -->
  <rect x="70" y="540" width="220" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="70" y="540" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="180" y="559" text-anchor="middle" class="class-title">Setting</text>
  <text x="84" y="590" class="member">+ key</text>
  <text x="84" y="608" class="member">+ value</text>

  <!-- ActivityLog -->
  <rect x="70" y="690" width="220" height="145" rx="12" ry="12" class="class-box"/>
  <rect x="70" y="690" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="180" y="709" text-anchor="middle" class="class-title">ActivityLog</text>
  <text x="84" y="740" class="member">+ action, module</text>
  <text x="84" y="758" class="member">+ ip_address</text>
  <text x="84" y="776" class="member">+ metadata</text>
  <text x="84" y="802" class="member">+ user()</text>
  <text x="84" y="820" class="member">+ record(...)</text>

  <!-- Reparation -->
  <rect x="330" y="560" width="220" height="150" rx="12" ry="12" class="class-box"/>
  <rect x="330" y="560" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="440" y="579" text-anchor="middle" class="class-title">Reparation</text>
  <text x="344" y="610" class="member">+ id_panne</text>
  <text x="344" y="628" class="member">+ id_plombier</text>
  <text x="344" y="646" class="member">+ date_reparation</text>
  <text x="344" y="664" class="member">+ description</text>
  <text x="344" y="690" class="member">+ panne(), plombier()</text>

  <!-- Releve -->
  <rect x="590" y="560" width="220" height="168" rx="12" ry="12" class="class-box"/>
  <rect x="590" y="560" width="220" height="28" rx="12" ry="12" class="class-head"/>
  <text x="700" y="579" text-anchor="middle" class="class-title">Releve</text>
  <text x="604" y="610" class="member">+ compteur_id</text>
  <text x="604" y="628" class="member">+ ancien_index, nouvel_index</text>
  <text x="604" y="646" class="member">+ consommation</text>
  <text x="604" y="664" class="member">+ periode_debut / fin</text>
  <text x="604" y="690" class="member">+ compteur()</text>
  <text x="604" y="708" class="member">+ creator()</text>

  <!-- Intervention -->
  <rect x="850" y="560" width="240" height="210" rx="12" ry="12" class="class-box"/>
  <rect x="850" y="560" width="240" height="28" rx="12" ry="12" class="class-head"/>
  <text x="970" y="579" text-anchor="middle" class="class-title">Intervention</text>
  <text x="864" y="610" class="member">+ intervention_number</text>
  <text x="864" y="628" class="member">+ panne_id, client_id, meter_id</text>
  <text x="864" y="646" class="member">+ technician_id</text>
  <text x="864" y="664" class="member">+ service_type, work_type</text>
  <text x="864" y="682" class="member">+ priority, status</text>
  <text x="864" y="700" class="member">+ started_at, completed_at</text>
  <text x="864" y="726" class="member">+ panne(), technician()</text>
  <text x="864" y="744" class="member">+ client(), meter()</text>

  <!-- Rules -->
  <rect x="950" y="150" width="160" height="120" rx="12" ry="12" class="class-box"/>
  <rect x="950" y="150" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1030" y="169" text-anchor="middle" class="class-title">NotificationService</text>
  <text x="964" y="200" class="member">+ panneAssigned()</text>
  <text x="964" y="218" class="member">+ repairCompleted()</text>
  <text x="964" y="236" class="member">+ userCreated()</text>

  <rect x="950" y="300" width="160" height="150" rx="12" ry="12" class="class-box"/>
  <rect x="950" y="300" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1030" y="319" text-anchor="middle" class="class-title">OperatorAccess</text>
  <text x="964" y="350" class="member">+ isOperator()</text>
  <text x="964" y="368" class="member">+ scopePannes()</text>
  <text x="964" y="386" class="member">+ scopeReparations()</text>
  <text x="964" y="404" class="member">+ scopeReleves()</text>
  <text x="964" y="422" class="member">+ scopeCompteurs()</text>

  <rect x="950" y="480" width="160" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="950" y="480" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1030" y="499" text-anchor="middle" class="class-title">InterventionPolicy</text>
  <text x="964" y="530" class="member">+ viewAny()</text>
  <text x="964" y="548" class="member">+ view(), create()</text>
  <text x="964" y="566" class="member">+ update()</text>

  <rect x="950" y="630" width="160" height="140" rx="12" ry="12" class="class-box"/>
  <rect x="950" y="630" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1030" y="649" text-anchor="middle" class="class-title">ReparationRequest</text>
  <text x="964" y="680" class="member">+ authorize()</text>
  <text x="964" y="698" class="member">+ rules()</text>
  <text x="964" y="716" class="member">+ withValidator()</text>

  <!-- Controllers -->
  <rect x="1185" y="150" width="160" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="1185" y="150" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1265" y="169" text-anchor="middle" class="class-title">AuthController</text>
  <text x="1199" y="200" class="member">+ login()</text>
  <text x="1199" y="218" class="member">+ logout()</text>
  <text x="1199" y="236" class="member">+ me(), clearTokens()</text>

  <rect x="1185" y="290" width="160" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="1185" y="290" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1265" y="309" text-anchor="middle" class="class-title">PanneController</text>
  <text x="1199" y="340" class="member">+ index(), store()</text>
  <text x="1199" y="358" class="member">+ show(), update()</text>
  <text x="1199" y="376" class="member">+ destroy()</text>

  <rect x="1185" y="430" width="160" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="1185" y="430" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1265" y="449" text-anchor="middle" class="class-title">ReparationController</text>
  <text x="1199" y="480" class="member">+ index(), store()</text>
  <text x="1199" y="498" class="member">+ show(), update()</text>
  <text x="1199" y="516" class="member">+ destroy()</text>

  <rect x="1185" y="570" width="160" height="110" rx="12" ry="12" class="class-box"/>
  <rect x="1185" y="570" width="160" height="28" rx="12" ry="12" class="class-head"/>
  <text x="1265" y="589" text-anchor="middle" class="class-title">InterventionController</text>
  <text x="1199" y="620" class="member">+ index(), store()</text>
  <text x="1199" y="638" class="member">+ show(), update()</text>
  <text x="1199" y="656" class="member">+ validated()</text>

  <rect x="1178" y="720" width="174" height="156" rx="12" ry="12" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="1194" y="746" class="legend">Autres classes presentes</text>
  <text x="1194" y="766" class="legend">dans le code PlantUML :</text>
  <text x="1194" y="792" class="legend">ClientController</text>
  <text x="1194" y="810" class="legend">ReleveController</text>
  <text x="1194" y="828" class="legend">UserController</text>
  <text x="1194" y="846" class="legend">SettingsController</text>
  <text x="1194" y="864" class="legend">NotificationController</text>

  <!-- domain relations -->
  <line x1="160" y1="216" x2="180" y2="250" class="inh"/>
  <polygon points="160,216 150,232 170,232" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>

  <line x1="290" y1="335" x2="330" y2="420" class="assoc"/>
  <line x1="550" y1="420" x2="590" y2="420" class="assoc"/>
  <line x1="810" y1="420" x2="850" y2="420" class="assoc"/>
  <line x1="440" y1="295" x2="440" y2="330" class="assoc"/>
  <line x1="700" y1="505" x2="700" y2="560" class="assoc"/>
  <line x1="960" y1="505" x2="970" y2="560" class="assoc"/>
  <line x1="440" y1="505" x2="440" y2="560" class="assoc"/>
  <line x1="260" y1="340" x2="850" y2="420" class="assoc"/>
  <line x1="260" y1="360" x2="440" y2="635" class="assoc"/>
  <line x1="260" y1="380" x2="700" y2="650" class="assoc"/>
  <line x1="260" y1="400" x2="970" y2="650" class="assoc"/>
  <line x1="180" y1="420" x2="180" y2="690" class="assoc"/>

  <!-- dependencies -->
  <line x1="1110" y1="205" x2="850" y2="380" class="dep"/>
  <line x1="1110" y1="215" x2="440" y2="635" class="dep"/>
  <line x1="1110" y1="225" x2="250" y2="320" class="dep"/>

  <line x1="1110" y1="360" x2="250" y2="350" class="dep"/>
  <line x1="1110" y1="372" x2="700" y2="420" class="dep"/>
  <line x1="1110" y1="384" x2="960" y2="420" class="dep"/>
  <line x1="1110" y1="396" x2="440" y2="635" class="dep"/>
  <line x1="1110" y1="408" x2="700" y2="650" class="dep"/>

  <line x1="1110" y1="535" x2="970" y2="650" class="dep"/>
  <line x1="1110" y1="545" x2="250" y2="320" class="dep"/>

  <line x1="1110" y1="690" x2="960" y2="420" class="dep"/>
  <line x1="1110" y1="700" x2="440" y2="635" class="dep"/>
  <line x1="1110" y1="710" x2="250" y2="320" class="dep"/>

  <line x1="1185" y1="205" x2="290" y2="320" class="dep"/>
  <line x1="1185" y1="215" x2="290" y2="760" class="dep"/>

  <line x1="1185" y1="345" x2="1070" y2="205" class="dep"/>
  <line x1="1185" y1="355" x2="1070" y2="360" class="dep"/>
  <line x1="1185" y1="365" x2="960" y2="420" class="dep"/>

  <line x1="1185" y1="485" x2="1030" y2="690" class="dep"/>
  <line x1="1185" y1="495" x2="1070" y2="205" class="dep"/>
  <line x1="1185" y1="505" x2="440" y2="635" class="dep"/>

  <line x1="1185" y1="625" x2="1030" y2="535" class="dep"/>
  <line x1="1185" y1="635" x2="1070" y2="360" class="dep"/>
  <line x1="1185" y1="645" x2="970" y2="650" class="dep"/>

  <!-- legend -->
  <line x1="945" y1="920" x2="1005" y2="920" class="assoc"/>
  <text x="1015" y="925" class="legend">association</text>
  <line x1="1110" y1="920" x2="1170" y2="920" class="dep"/>
  <text x="1180" y="925" class="legend">dependance</text>
  <line x1="1260" y1="920" x2="1320" y2="920" class="inh"/>
  <polygon points="1260,920 1250,936 1270,936" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  <text x="1330" y="925" class="legend">heritage</text>
</svg>
SVG;

write_text($assetDir.'/use-case-diagram.puml', $useCasePlantUml);
write_text($assetDir.'/mcd.mmd', $mcdMermaid);
write_text($assetDir.'/class-diagram.puml', $classPlantUml);
write_text($assetDir.'/use-case-diagram.svg', $useCaseSvg);
write_text($assetDir.'/mcd.svg', $mcdSvg);
write_text($assetDir.'/class-diagram.svg', $classSvg);

$useCaseRows = [
    ['`directeur`', 'Acteur global cote API. Passe tous les controles `role:*`. Peut gerer les operations metier, `users`, `settings`, `logs` et vider les tokens API.'],
    ['`responsable`', 'Peut consulter le dashboard, les donnees metier, les notifications, gerer `clients`, `compteurs`, `secteurs`, `pannes`, `reparations`, `interventions`, `releves` et exporter les rapports.'],
    ['`manager`', 'Peut consulter le dashboard, les donnees metier, les notifications, gerer `compteurs`, `pannes`, `reparations`, `interventions`, `releves` et exporter les rapports.'],
    ['`technician`', 'Peut consulter son dashboard, les notifications, les donnees scopees par affectation, mettre a jour ses `pannes` assignees et gerer `reparations`, `interventions`, `releves`.'],
    ['`viewer`', 'Lecture seule : dashboard, notifications et consultation des ressources metier.'],
    ['`developer`', 'Role technique non production. Le code lui donne un comportement proche du `responsable`, sans les routes d\'administration `directeur`.'],
];

$mcdEntityRows = [
    ['`users`', '`id`, `nom`, `prenom`, `identifiant`, `email`, `agence`, `role`', 'Affecte des `pannes`, execute des `reparations`, cree des `releves`, porte des `interventions`, des `activity_logs` et des `notifications`.'],
    ['`secteurs`', '`id`, `nom_secteur`, `emplacement`, `agence`, `num_torne`, `latitude`, `longitude`', 'Reference geographique pour `clients` et `compteurs`.'],
    ['`clients`', '`id`, `police`, `nom`, `prenom`, `cin`, `telephone`, `adresse`, `type_abonnement`, `service_type`, `abonne`, `id_secteur`', 'Un client possede des `compteurs` et peut etre rattache indirectement aux `interventions`.'],
    ['`compteurs`', '`id`, `cadran`, `calibre`, `marque`, `service_type`, `index_releve`, `id_client`, `id_secteur`', 'Point central du domaine : lie `clients`, `secteurs`, `pannes`, `releves` et `interventions`.'],
    ['`pannes`', '`id`, `id_compteur`, `date_panne`, `anomalie`, `status`, `assigned_to`', 'Incident lie a un compteur et eventuellement assigne a un `User`.'],
    ['`reparations`', '`id`, `id_panne`, `id_plombier`, `date_reparation`, `description`', 'Trace une intervention de reparation sur une panne.'],
    ['`releves`', '`id`, `compteur_id`, `ancien_index`, `nouvel_index`, `consommation`, `periode_debut`, `periode_fin`, `created_by`', 'Lecture de compteur avec consommation calculee.'],
    ['`interventions`', '`id`, `intervention_number`, `panne_id`, `client_id`, `meter_id`, `technician_id`, `service_type`, `work_type`, `priority`, `status`, `started_at`, `completed_at`', 'Intervention terrain rattachee a une panne, un client, un compteur et un technicien.'],
    ['`activity_logs`', '`id`, `user_id`, `action`, `module`, `ip_address`, `metadata`', 'Journalise les actions sensibles ou administratives.'],
    ['`settings`', '`id`, `key`, `value`', 'Stocke les parametres globaux de l\'application.'],
    ['`notifications`', '`id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`', 'Table Laravel actuelle pour les notifications en base. `App\\Models\\Notification` est a confirmer.'],
];

$mcdRelationRows = [
    ['`secteurs` `0,N` - `clients` `0,1`', 'FK `clients.id_secteur`, nullable.'],
    ['`secteurs` `0,N` - `compteurs` `1,1`', 'FK `compteurs.id_secteur`, non nullable.'],
    ['`clients` `0,N` - `compteurs` `1,1`', 'FK `compteurs.id_client`, non nullable.'],
    ['`compteurs` `0,N` - `pannes` `1,1`', 'FK `pannes.id_compteur`, non nullable.'],
    ['`users` `0,N` - `pannes` `0,1`', 'FK `pannes.assigned_to`, nullable.'],
    ['`pannes` `0,N` - `reparations` `1,1`', 'Schema / modele: `hasMany`; metier actif: **a confirmer** vers `0,1` a cause de `ReparationRequest`.'],
    ['`users` `0,N` - `reparations` `0,1`', 'FK `reparations.id_plombier`, nullable.'],
    ['`compteurs` `0,N` - `releves` `1,1`', 'FK `releves.compteur_id`, non nullable.'],
    ['`users` `0,N` - `releves` `0,1`', 'FK `releves.created_by`, nullable.'],
    ['`pannes` `0,N` - `interventions` `0,1`', 'FK `interventions.panne_id`, nullable.'],
    ['`users` `0,N` - `interventions` `1,1`', 'FK `interventions.technician_id`, non nullable.'],
    ['`clients` `0,N` - `interventions` `0,1`', 'FK `interventions.client_id`, nullable.'],
    ['`compteurs` `0,N` - `interventions` `0,1`', 'FK `interventions.meter_id`, nullable.'],
    ['`users` `0,N` - `activity_logs` `0,1`', 'FK `activity_logs.user_id`, nullable.'],
    ['`users` `0,N` - `notifications` `1,1`', 'Usage actuel via `DatabaseNotification` et `notifiable_id`.'],
];

$classRows = [
    ['`User`', 'Modele d\'authentification et de role', 'Attributs clefs : `identifiant`, `agence`, `role`. Methodes : `reparations()`, `interventions()`, `assignedPannes()`.'],
    ['`Secteur`', 'Modele geographique', 'Methodes : `compteurs()`, `pannes()`.'],
    ['`Client`', 'Modele abonne', 'Methodes : `compteurs()`, `secteur()`.'],
    ['`Compteur`', 'Modele central de rattachement', 'Methodes : `client()`, `secteur()`, `pannes()`, `releves()`.'],
    ['`Panne`', 'Incident metier', 'Methodes : `compteur()`, `reparations()`, `interventions()`, `assignedOperator()`.'],
    ['`Reparation`', 'Action de reparation', 'Methodes : `panne()`, `plombier()`.'],
    ['`Releve`', 'Lecture de compteur', 'Methodes : `compteur()`, `creator()`. Regle metier : consommation calculee dans `booted()`.'],
    ['`Intervention`', 'Intervention terrain', 'Methodes : `panne()`, `technician()`, `client()`, `meter()`. Regle metier : numero auto dans `creating()`.'],
    ['`Setting`', 'Parametrage global', 'Attributs : `key`, `value`.'],
    ['`ActivityLog`', 'Journalisation', 'Methode statique : `record(...)`.'],
    ['`NotificationService`', 'Service de diffusion des notifications', 'Methodes : `panneAssigned()`, `repairCompleted()`, `userCreated()`.'],
    ['`OperatorAccess`', 'Filtrage metier pour `technician`', 'Methodes de scope : `scopePannes()`, `scopeReparations()`, `scopeReleves()`, `scopeCompteurs()`, `scopeClients()`.'],
    ['`InterventionPolicy`', 'Regles d\'autorisation sur les interventions', 'Methodes : `viewAny()`, `view()`, `create()`, `update()`.'],
    ['`ReparationRequest`', 'Validation metier sur les reparations', 'Methodes : `authorize()`, `rules()`, `withValidator()`.'],
    ['`AuthController`', 'Authentification API', 'Methodes : `login()`, `logout()`, `me()`, `clearTokens()`.'],
    ['`PanneController`', 'CRUD des pannes', 'Depend de `NotificationService` et applique une logique specifique a `technician`.'],
    ['`ReparationController`', 'CRUD des reparations', 'Depend de `ReparationRequest`, `NotificationService`, `OperatorAccess`, `Panne`.'],
    ['`InterventionController`', 'CRUD des interventions', 'Depend de `InterventionPolicy`, `OperatorAccess`, `ActivityLog`, `Panne`.'],
];

$sections = [
    [
        'title' => '1. Perimetre et methode',
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Cette documentation UML a ete construite uniquement a partir du code reel present dans le depot ouvert dans VS Code. Les sources principales examinees sont `backend/routes/api.php`, les `Models`, les `Controllers`, les `Policies`, les `Requests`, les `Services`, les migrations SQL et le routage React du frontend."],
            ['type' => 'bullets', 'items' => [
                "Les acteurs ont ete deduits des roles reels declares dans `App\\Enums\\UserRole`, `frontend/src/utils/rbac.js`, les routes API et les ecrans React.",
                "Le MCD a ete deduit de l'etat final du schema via les migrations, puis recoupe avec les relations Eloquent et les contraintes applicatives.",
                "Le diagramme de classes se concentre sur les classes qui portent la logique metier, les dependances structurantes et les points d'autorisation.",
                "Quand une information n'est pas entierement garantie par la base mais seulement par le code applicatif, elle est marquee **a confirmer**.",
            ]],
            ['type' => 'note', 'text' => "Les schemas integres au PDF sont des visuels vectoriels lisibles en soutenance. Le code PlantUML / Mermaid exact est fourni juste apres chaque schema pour reutilisation."],
        ],
    ],
    [
        'title' => '2. Diagramme de cas d\'utilisation UML',
        'page_break' => true,
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le systeme expose six acteurs reels : `directeur`, `responsable`, `manager`, `technician`, `viewer` et `developer`. Les cas d'usage ci-dessous ne reprennent que des fonctions effectivement visibles dans les routes, policies, controllers et ecrans raccordes."],
            ['type' => 'table', 'headers' => ['Acteur reel', 'Fonctionnalites confirmees par le code'], 'rows' => $useCaseRows],
            ['type' => 'figure', 'svg' => $useCaseSvg, 'caption' => "Figure 1 - Diagramme de cas d'utilisation de synthese. Les regroupements visuels sont affines par le tableau des fonctionnalites et le code PlantUML ci-dessous."],
            ['type' => 'subheading', 'text' => 'Code PlantUML pret a copier'],
            ['type' => 'code', 'code' => $useCasePlantUml, 'caption' => "Source : `docs/uml-assets/use-case-diagram.puml`."],
            ['type' => 'subheading', 'text' => 'Explication courte'],
            ['type' => 'paragraph', 'text' => "Le code montre un systeme centre sur la gestion operationnelle. `directeur` est un super-role cote API. `responsable` couvre presque tout le metier. `manager` supervise sans suppression globale. `technician` agit surtout sur les elements assignes. `viewer` reste en lecture seule. `developer` est un role technique reserve au non-production."],
            ['type' => 'note', 'text' => "A confirmer : le frontend declare une route `/viewer/reports`, mais l'API `reports/*` est protegee par `managerRoles` dans `backend/routes/api.php`. Le role `viewer` n'est donc pas documente comme ayant un acces confirme aux exports."],
        ],
    ],
    [
        'title' => '3. MCD - modele conceptuel de donnees',
        'page_break' => true,
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le MCD ci-dessous represente les entites les plus importantes du projet. Les tables techniques annexes de Laravel n'ont pas ete detaillees, sauf `notifications` car elles sont effectivement utilisees par le code applicatif."],
            ['type' => 'table', 'headers' => ['Entite', 'Attributs importants', 'Role dans le domaine'], 'rows' => $mcdEntityRows],
            ['type' => 'table', 'headers' => ['Association et cardinalites', 'Justification dans le code'], 'rows' => $mcdRelationRows],
            ['type' => 'figure', 'svg' => $mcdSvg, 'caption' => "Figure 2 - MCD de synthese base sur le schema final et les relations Eloquent."],
            ['type' => 'subheading', 'text' => 'Representation Mermaid / ER'],
            ['type' => 'code', 'code' => $mcdMermaid, 'caption' => "Source : `docs/uml-assets/mcd.mmd`."],
            ['type' => 'subheading', 'text' => 'Explication courte'],
            ['type' => 'paragraph', 'text' => "Le coeur de donnees est organise autour de `Compteur`, relie a `Client`, `Secteur`, `Panne`, `Releve` et `Intervention`. `User` intervient comme acteur assignable, createur ou technicien. `Setting`, `ActivityLog` et `notifications` portent la dimension systeme et administrative."],
            ['type' => 'note', 'text' => "A confirmer : `App\\Models\\Notification` ne correspond pas a la table Laravel `notifications` actuellement utilisee par `NotificationController`, qui passe par `Illuminate\\Notifications\\DatabaseNotification`."],
        ],
    ],
    [
        'title' => '4. Diagramme de classes UML',
        'page_break' => true,
        'blocks' => [
            ['type' => 'paragraph', 'text' => "Le diagramme de classes met en avant les modeles metier, les classes de regles et quelques controllers structurants. Les dependances ont ete reconstruites a partir des injections, des appels directs et des relations Eloquent."],
            ['type' => 'table', 'headers' => ['Classe principale', 'Role', 'Attributs / methodes importants'], 'rows' => $classRows],
            ['type' => 'figure', 'svg' => $classSvg, 'caption' => "Figure 3 - Diagramme de classes de synthese. Le code PlantUML complet detaille un ensemble plus large de controllers et de dependances."],
            ['type' => 'subheading', 'text' => 'Code PlantUML pret a copier'],
            ['type' => 'code', 'code' => $classPlantUml, 'caption' => "Source : `docs/uml-assets/class-diagram.puml`."],
            ['type' => 'subheading', 'text' => 'Explication courte'],
            ['type' => 'paragraph', 'text' => "Le domaine applicatif est porte par les modeles Laravel. Les regles d'autorisation et de filtrage sont centralisees dans `InterventionPolicy`, `OperatorAccess` et `ReparationRequest`. Les controllers orchestrent les cas d'usage API sans dupliquer la logique de persistance."],
        ],
    ],
    [
        'title' => '5. Points de vigilance pour la soutenance',
        'blocks' => [
            ['type' => 'bullets', 'items' => [
                "Le schema SQL autorise plusieurs `reparations` pour une meme `panne`, mais la validation applicative en limite une seule active a la fois.",
                "Le role `developer` existe reellement dans le code, mais il est explicitement bloque en production dans `AuthController`, `EnsureUserHasRole` et `rbac.js`.",
                "Le projet contient des traces legacy ou paralleles, mais les diagrammes ci-dessus n'utilisent que les classes, routes et ecrans reels relies au comportement actif du systeme.",
                "Les notifications visibles par l'application s'appuient sur la table Laravel `notifications` et non sur le modele local `App\\Models\\Notification`, qui reste a confirmer.",
            ]],
            ['type' => 'paragraph', 'text' => "Le livrable final est pret pour une soutenance : il fournit une vue metier, une vue donnees, une vue classes et les sources reutilisables des diagrammes. Les fichiers auxiliaires ont ete generes dans `docs/uml-assets` pour faciliter la reprise future."],
        ],
    ],
];

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
  <title>Documentation UML - RADEETA Management System</title>
  <style>
    @page {
      margin: 44px 36px 60px 36px;
    }

    body {
      font-family: DejaVu Sans, sans-serif;
      color: #1f2937;
      font-size: 12px;
      line-height: 1.6;
    }

    .footer {
      position: fixed;
      bottom: -44px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }

    .footer .page:after {
      content: counter(page) " / " counter(pages);
    }

    .cover {
      background: linear-gradient(135deg, #0f172a, #1d4ed8);
      color: #ffffff;
      border-radius: 20px;
      padding: 30px 34px;
      margin-bottom: 20px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 1.6px;
      font-size: 10px;
      color: #bfdbfe;
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

    ul {
      margin: 8px 0 14px 20px;
      padding: 0;
    }

    li {
      margin: 4px 0;
    }

    table {
      border: 1px solid #d1d5db;
      font-size: 11px;
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
      font-size: 10px;
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

    .figure {
      margin: 14px 0 4px 0;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 10px;
      background: #ffffff;
    }

    .figure svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .figcaption {
      font-size: 11px;
      color: #475569;
      margin-bottom: 14px;
    }
  </style>
</head>
<body>
  <div class="footer">
    Documentation UML basee sur le code reel - RADEETA Management System - Page <span class="page"></span>
  </div>

  <div class="cover">
    <div class="eyebrow">Documentation UML pour soutenance</div>
    <h1>RADEETA Management System</h1>
    <p>Livrable UML complet base uniquement sur le code reel du projet : acteurs, donnees, classes et sources PlantUML / Mermaid reutilisables.</p>
  </div>

  <table class="meta-table">
    <tr>
      <td><strong>Date de generation</strong><br>{$generatedAt}</td>
      <td><strong>Sources analysees</strong><br><code>backend/</code> + <code>frontend/</code></td>
    </tr>
    <tr>
      <td><strong>Livrables</strong><br>PDF, HTML, SVG, PlantUML, Mermaid</td>
      <td><strong>Perimetre</strong><br>Routes, roles, models, migrations, controllers, services, policies, requests et ecrans relies</td>
    </tr>
  </table>

  <div class="note">
    Cette documentation n'invente aucune fonctionnalite. Les points ambigus ou incoherents entre frontend, backend ou schema sont explicitement marques <strong>a confirmer</strong>.
  </div>

  <h2>Sommaire</h2>
  {$tocHtml}

  {$htmlSections}
</body>
</html>
HTML;

$htmlPath = $outputDir.'/UML-CODE-REALE.html';
$pdfPath = $outputDir.'/UML-CODE-REALE.pdf';

write_text($htmlPath, $html);

$options = new Options();
$options->set('isRemoteEnabled', false);
$options->set('isHtml5ParserEnabled', true);
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'landscape');
$dompdf->render();
write_text($pdfPath, $dompdf->output());

echo "HTML: {$htmlPath}\n";
echo "PDF: {$pdfPath}\n";
echo "Assets: {$assetDir}\n";
