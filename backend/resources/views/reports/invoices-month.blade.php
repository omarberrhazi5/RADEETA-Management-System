<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #172033; }
        h1 { margin: 0; color: #0056a4; font-size: 18px; }
        .meta { color: #64748b; margin: 4px 0 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #eaf3ff; color: #0056a4; border: 1px solid #b8d6f4; padding: 6px; text-align: left; }
        td { border: 1px solid #d7dee8; padding: 6px; }
        .right { text-align: right; }
    </style>
</head>
<body>
<h1>SRM Taza/Region - Factures du mois {{ $period->format('m/Y') }}</h1>
<div class="meta">Genere le {{ $generatedAt->format('d/m/Y H:i') }}</div>
<table>
    <thead>
    <tr>
        <th>Reference</th>
        <th>Client</th>
        <th>Secteur</th>
        <th>Status</th>
        <th class="right">HT</th>
        <th class="right">TVA</th>
        <th class="right">TTC</th>
        <th class="right">Paye</th>
    </tr>
    </thead>
    <tbody>
    @forelse ($factures as $facture)
        <tr>
            <td>{{ $facture->reference }}</td>
            <td>{{ trim(($facture->client?->prenom ?? '').' '.($facture->client?->nom ?? '')) }}</td>
            <td>{{ $facture->compteur?->secteur?->nom_secteur }}</td>
            <td>{{ $facture->statut }}</td>
            <td class="right">{{ number_format((float) $facture->montant_ht, 2, ',', ' ') }}</td>
            <td class="right">{{ number_format((float) $facture->tva, 2, ',', ' ') }}</td>
            <td class="right">{{ number_format((float) $facture->total_ttc, 2, ',', ' ') }}</td>
            <td class="right">{{ number_format((float) $facture->paiements->sum('montant'), 2, ',', ' ') }}</td>
        </tr>
    @empty
        <tr><td colspan="8">Aucune facture pour cette periode.</td></tr>
    @endforelse
    </tbody>
</table>
</body>
</html>
