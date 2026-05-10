<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            color: #172033;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            margin: 24px;
        }

        .header {
            border-bottom: 2px solid #70b830;
            margin-bottom: 18px;
            padding-bottom: 12px;
        }

        .title {
            color: #1e293b;
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }

        .subtitle {
            color: #64748b;
            margin: 4px 0 0;
        }

        .summary {
            background: #eef8e8;
            border: 1px solid #cdebbb;
            border-radius: 6px;
            margin-bottom: 14px;
            padding: 10px 12px;
        }

        .summary span {
            display: inline-block;
            margin-right: 18px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th {
            background: #70b830;
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
        <h1 class="title">SRM-FM - {{ $title }}</h1>
        <p class="subtitle">Periode: {{ $periodLabel }}</p>
    </div>

    <div class="summary">
        @foreach ($summary as $label => $value)
            <span><strong>{{ $label }}:</strong> {{ $value }}</span>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($headings as $heading)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($headings as $heading)
                        <td>{{ $row[$heading] ?? '-' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headings) }}" class="muted">Aucune donnee trouvee pour cette periode.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Genere le {{ $generatedAt->format('d/m/Y H:i') }}
    </div>
</body>
</html>
