<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $facture->reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #172033; font-size: 10.5px; margin: 0; }
        .page { padding: 20px 24px; }
        .header { display: table; width: 100%; border-bottom: 3px solid #0056a4; padding-bottom: 10px; }
        .brand, .meta { display: table-cell; vertical-align: top; width: 50%; }
        .logo { display: inline-block; background: #0056a4; color: #fff; font-weight: bold; padding: 8px 10px; font-size: 18px; }
        h1 { margin: 7px 0 2px; font-size: 17px; color: #0056a4; }
        h2 { margin: 0; font-size: 15px; color: #111827; }
        h3 { margin: 14px 0 6px; font-size: 12px; color: #0056a4; text-transform: uppercase; }
        p { margin: 2px 0; }
        .meta { text-align: right; }
        .badge { display: inline-block; margin-top: 4px; padding: 4px 8px; background: #fef3c7; color: #92400e; font-weight: bold; }
        .grid { display: table; width: 100%; margin-top: 12px; }
        .box { display: table-cell; width: 50%; border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
        .box + .box { border-left: 0; }
        .muted { color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { background: #eaf3ff; color: #0056a4; border: 1px solid #b8d6f4; padding: 6px; text-align: left; }
        td { border: 1px solid #d7dee8; padding: 6px; }
        .right { text-align: right; }
        .center { text-align: center; }
        .section-row td { background: #f8fafc; color: #0f172a; font-weight: bold; }
        .summary { display: table; width: 100%; margin-top: 12px; }
        .summary-left, .summary-right { display: table-cell; vertical-align: top; }
        .summary-left { width: 52%; padding-right: 10px; }
        .summary-right { width: 48%; }
        .total-line td { font-size: 13px; font-weight: bold; background: #eff6ff; color: #0f172a; }
        .payment { border: 2px solid #0056a4; padding: 8px; margin-top: 10px; }
        .footer { position: fixed; bottom: 14px; left: 24px; right: 24px; border-top: 1px solid #d7dee8; padding-top: 6px; color: #64748b; font-size: 9px; }
    </style>
</head>
@php
    $sections = $facture->detail_snapshot['sections'] ?? [];
    $lines = $facture->line_items ?? [];
@endphp
<body>
<div class="page">
    <div class="header">
        <div class="brand">
            <div class="logo">SRM</div>
            <h1>SRM Taza/Region</h1>
            <p>{{ $facture->agence ?: 'Agence Taza' }}</p>
            <p class="muted">Distribution eau potable et assainissement liquide</p>
        </div>
        <div class="meta">
            <h2>Facture Eau et Assainissement</h2>
            <p><strong>N facture:</strong> {{ $facture->numero_facture_eau_assainissement ?: $facture->reference }}</p>
            <p><strong>Reference:</strong> {{ $facture->reference }}</p>
            <p><strong>Date facture:</strong> {{ $facture->facture_date?->format('d/m/Y') ?: $facture->generated_at?->format('d/m/Y') }}</p>
            <p><strong>Echeance:</strong> {{ $facture->due_date?->format('d/m/Y') }}</p>
            <p><span class="badge">{{ strtoupper($facture->statut) }}</span></p>
        </div>
    </div>

    <div class="grid">
        <div class="box">
            <h3>Client / Contrat</h3>
            <p><strong>{{ $facture->client_name ?: trim(($facture->client?->prenom ?? '').' '.($facture->client?->nom ?? '')) }}</strong></p>
            <p>N client: {{ $facture->numero_client ?: $facture->client?->police }}</p>
            <p>N contrat: {{ $facture->numero_contrat ?: $facture->client?->police }}</p>
            <p>Tournee: {{ $facture->tournee ?: $facture->compteur?->secteur?->num_torne }}</p>
            <p>Usage: {{ ucfirst($facture->usage_type ?: 'domestic') }}</p>
            <p>Adresse: {{ $facture->address ?: $facture->client?->adresse ?: '-' }}</p>
        </div>
        <div class="box">
            <h3>Periode et compteur</h3>
            <p>Periode: {{ $facture->periode_debut?->format('d/m/Y') }} - {{ $facture->periode_fin?->format('d/m/Y') }}</p>
            <p>Compteur: {{ $facture->compteur_number ?: $facture->compteur?->cadran }}</p>
            <p>Diametre: {{ $facture->diametre_compteur ?: '-' }}</p>
            <p>Coefficient: {{ number_format((float) $facture->coefficient, 2, ',', ' ') }}</p>
            <p>Agence: {{ $facture->agence ?: '-' }}</p>
        </div>
    </div>

    <h3>1. Details de votre consommation</h3>
    <table>
        <thead>
        <tr>
            <th>Ancienne date lecture</th>
            <th>Nouvelle date lecture</th>
            <th class="right">Ancien index</th>
            <th class="right">Nouvel index</th>
            <th class="right">Consommation m3</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>{{ $facture->ancienne_date_lecture?->format('d/m/Y') }}</td>
            <td>{{ $facture->nouvelle_date_lecture?->format('d/m/Y') }}</td>
            <td class="right">{{ number_format((float) $facture->ancien_index, 2, ',', ' ') }}</td>
            <td class="right">{{ number_format((float) $facture->nouvel_index, 2, ',', ' ') }}</td>
            <td class="right">{{ number_format((float) $facture->consommation_m3, 2, ',', ' ') }}</td>
        </tr>
        </tbody>
    </table>

    <h3>2. Details de votre facture</h3>
    <table>
        <thead>
        <tr>
            <th>Rubrique</th>
            <th class="right">Quantite</th>
            <th class="right">Prix unitaire HT</th>
            <th class="right">Montant HT</th>
            <th class="right">TVA</th>
            <th class="right">Total TTC</th>
        </tr>
        </thead>
        <tbody>
        @foreach ($lines as $line)
            <tr>
                <td>{{ $line['label'] ?? '-' }}</td>
                <td class="right">{{ number_format((float) ($line['quantity'] ?? 0), 2, ',', ' ') }}</td>
                <td class="right">{{ number_format((float) ($line['unit_price_ht'] ?? 0), 2, ',', ' ') }}</td>
                <td class="right">{{ number_format((float) ($line['montant_ht'] ?? 0), 2, ',', ' ') }}</td>
                <td class="right">{{ number_format((float) ($line['tva_amount'] ?? 0), 2, ',', ' ') }}</td>
                <td class="right">{{ number_format((float) ($line['total_ttc'] ?? 0), 2, ',', ' ') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-left">
            <h3>3. Eau et Assainissement</h3>
            <table>
                <tr><th>Section</th><th class="right">HT</th><th class="right">TVA</th><th class="right">TTC</th></tr>
                @foreach (['water' => 'Eau', 'sanitation' => 'Assainissement', 'taxes' => 'Taxes'] as $key => $label)
                    @php($section = $sections[$key] ?? [])
                    <tr>
                        <td>{{ $label }}</td>
                        <td class="right">{{ number_format((float) ($section['total_ht'] ?? 0), 2, ',', ' ') }}</td>
                        <td class="right">{{ number_format((float) ($section['total_tva'] ?? 0), 2, ',', ' ') }}</td>
                        <td class="right">{{ number_format((float) ($section['total_ttc'] ?? 0), 2, ',', ' ') }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
        <div class="summary-right">
            <h3>4. Total</h3>
            <table>
                <tr><td>Montant HT</td><td class="right">{{ number_format((float) $facture->montant_ht, 2, ',', ' ') }} MAD</td></tr>
                <tr><td>Taxes et frais fixes</td><td class="right">{{ number_format((float) $facture->taxes, 2, ',', ' ') }} MAD</td></tr>
                <tr><td>TVA</td><td class="right">{{ number_format((float) $facture->tva, 2, ',', ' ') }} MAD</td></tr>
                <tr class="total-line"><td>Total TTC</td><td class="right">{{ number_format((float) $facture->total_ttc, 2, ',', ' ') }} MAD</td></tr>
                <tr><td>Montant paye</td><td class="right">{{ number_format($paidAmount, 2, ',', ' ') }} MAD</td></tr>
                <tr><td>Reste a payer</td><td class="right">{{ number_format($remainingAmount, 2, ',', ' ') }} MAD</td></tr>
            </table>
        </div>
    </div>

    <div class="payment">
        <strong>Section paiement</strong>
        <p>Montant a payer en especes: {{ number_format((float) ($facture->montant_especes ?? $facture->total_ttc), 2, ',', ' ') }} MAD</p>
        <p>Montant a payer par autre mode de reglement: {{ number_format((float) ($facture->montant_autre_mode ?? $facture->total_ttc), 2, ',', ' ') }} MAD</p>
    </div>

    <div class="footer">
        Facture generee automatiquement par SRM Taza/Region. Document valable sans signature. Merci de regler avant la date d'echeance.
    </div>
</div>
</body>
</html>
