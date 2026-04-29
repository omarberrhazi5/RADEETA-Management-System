<?php

namespace App\Exports;

use App\Models\Client;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class ClientsCompteursExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithTitle
{
    public function collection(): Collection
    {
        return Client::with('compteurs.secteur')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get()
            ->flatMap(function (Client $client): Collection {
                if ($client->compteurs->isEmpty()) {
                    return collect([(object) [
                        'client' => $client,
                        'compteur' => null,
                    ]]);
                }

                return $client->compteurs->map(fn ($compteur): object => (object) [
                    'client' => $client,
                    'compteur' => $compteur,
                ]);
            });
    }

    public function headings(): array
    {
        return [
            'Police',
            'Nom',
            'Prenom',
            'Telephone',
            'Adresse',
            'Abonne',
            'Cadran',
            'Calibre',
            'Marque',
            'Index releve',
            'Secteur',
            'Emplacement',
        ];
    }

    public function map($row): array
    {
        $client = $row->client;
        $compteur = $row->compteur;

        return [
            $client->police,
            $client->nom,
            $client->prenom,
            $client->telephone,
            $client->adresse,
            $client->abonne ? 'Oui' : 'Non',
            $compteur?->cadran,
            $compteur?->calibre,
            $compteur?->marque,
            $compteur?->index_releve,
            $compteur?->secteur?->nom_secteur,
            $compteur?->secteur?->emplacement,
        ];
    }

    public function title(): string
    {
        return 'Clients et compteurs';
    }
}
