<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Pannes du Mois</title>
    <style>
        body {
            color: #172033;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            margin: 24px;
        }

        .header {
            border-bottom: 2px solid #1d4ed8;
            margin-bottom: 18px;
            padding-bottom: 12px;
        }

        .title {
            color: #1d4ed8;
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }

        .subtitle {
            color: #475569;
            margin: 4px 0 0;
        }

        .summary {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            margin-bottom: 14px;
            padding: 10px 12px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th {
            background: #1d4ed8;
            color: #ffffff;
            font-size: 10px;
            padding: 8px 6px;
            text-align: left;
        }

        td {
            border-bottom: 1px solid #e2e8f0;
            padding: 7px 6px;
            vertical-align: top;
        }

        tr:nth-child(even) td {
            background: #f8fafc;
        }

        .badge {
            border-radius: 999px;
            display: inline-block;
            font-size: 10px;
            font-weight: bold;
            padding: 3px 7px;
        }

        .badge-open {
            background: #fee2e2;
            color: #b91c1c;
        }

        .badge-resolved {
            background: #dcfce7;
            color: #15803d;
        }

        .muted {
            color: #64748b;
        }

        .footer {
            color: #64748b;
            font-size: 10px;
            margin-top: 16px;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">RADEETA - Gestion de Secteur</h1>
        <p class="subtitle">Rapport des Pannes du Mois - {{ $period->translatedFormat('F Y') }}</p>
    </div>

    <div class="summary">
        <strong>Total pannes:</strong> {{ $pannes->count() }}
        &nbsp; | &nbsp;
        <strong>Ouvertes:</strong> {{ $pannes->where('status.value', 'open')->count() }}
        &nbsp; | &nbsp;
        <strong>Resolues:</strong> {{ $pannes->where('status.value', 'resolved')->count() }}
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Compteur</th>
                <th>Client</th>
                <th>Secteur</th>
                <th>Anomalie</th>
                <th>Status</th>
                <th>Technicien assigne</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($pannes as $panne)
                @php
                    $status = $panne->status instanceof \App\Enums\PanneStatus ? $panne->status->value : $panne->status;
                    $anomalie = $panne->anomalie instanceof \App\Enums\PanneAnomalie ? $panne->anomalie->value : $panne->anomalie;
                    $reparation = $panne->reparations->sortByDesc('date_reparation')->first();
                    $technician = $reparation?->plombier;
                @endphp
                <tr>
                    <td>{{ $panne->id }}</td>
                    <td>{{ $panne->date_panne?->format('d/m/Y') }}</td>
                    <td>{{ $panne->compteur?->cadran ?? '-' }}</td>
                    <td>
                        {{ trim(($panne->compteur?->client?->nom ?? '').' '.($panne->compteur?->client?->prenom ?? '')) ?: '-' }}
                        <div class="muted">{{ $panne->compteur?->client?->police }}</div>
                    </td>
                    <td>{{ $panne->compteur?->secteur?->nom_secteur ?? '-' }}</td>
                    <td>{{ $anomalyLabels[$anomalie] ?? $anomalie }}</td>
                    <td>
                        <span class="badge {{ $status === 'resolved' ? 'badge-resolved' : 'badge-open' }}">
                            {{ $statusLabels[$status] ?? $status }}
                        </span>
                    </td>
                    <td>
                        @if ($technician)
                            {{ trim($technician->nom.' '.$technician->prenom) }}
                        @else
                            <span class="muted">Non assigne</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="muted">Aucune panne trouvee pour ce mois.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Genere le {{ $generatedAt->format('d/m/Y H:i') }}
    </div>
</body>
</html>
