<?php

namespace Database\Seeders;

use App\Models\Secteur;
use Illuminate\Database\Seeder;

class SecteurSeeder extends Seeder
{
    public function run(): void
    {
        collect([
            [1, 'Taza Haut', 'Province'],
            [2, 'Taza Haut', 'Ahrache'],
            [3, 'Taza Haut', 'EL Moustakbal'],
            [4, 'Taza Haut', 'AL Machwouare – Kabat Souk'],
            [5, 'Taza Haut', 'Dar EL Mouwatin – Derb Moulay Abdesalam'],
            [6, 'Taza Haut', 'Cancoudir'],
            [7, 'Taza Haut', 'Msila Cafe Najma'],
            [8, 'Taza Haut', 'Kouchha Parque de grand Taxi'],
            [9, 'Taza Bas', 'Swarj > Tawasou3 > Lwifaque'],
            [10, 'Taza Bas', 'Saada'],
            [11, 'Taza Bas', 'Blondy > Chouhada > AL Batouare > Mimouna'],
            [12, 'Taza Bas', 'Hamam ELKbakbi > Collège Imam Malik'],
            [13, 'Taza Bas', 'Wrida'],
            [14, 'Taza Bas', 'Lirak > Dar Talib'],
            [15, 'Taza Bas', 'A Coté Moulay Rachid a Moukata3a Ancien'],
            [16, 'Taza Bas', 'Douar El Makhzan > Douar EL Makhzane Mobil'],
            [17, 'Taza Bas', 'Gaada Centre'],
            [18, 'Taza Bas', 'Bit Ghlam > Rbayaz > Jnan Charfa'],
            [19, 'Taza Bas', 'Fo9 Iwakala > Sdar'],
            [20, 'Taza Bas', 'Jon kennedy > i9amat Al aman'],
            [21, 'Taza Bas', 'Maghrib Arabi > Qaso Madah rond point Wrida'],
            [22, 'Taza Bas', 'Chari3 al Hassan 2'],
            [23, 'Taza Bas', 'Bnaque Almaghrib > Ali Ben Barri'],
            [24, 'Taza Bas', 'Court de tennis > trabo public'],
            [25, 'Taza Bas', 'Sbitar Trik Iwa7da'],
            [26, 'Taza Bas', 'Hay AL Adarissa'],
            [27, 'Taza Bas', 'Trik EL Wa7da > AL Alaouine'],
            [28, 'Taza Bas', 'AL Bahra > Hay Salam'],
            [29, 'Taza Bas', 'Douar Ayade'],
            [30, 'Taza Bas', 'Kon Jirado'],
        ])->each(function (array $row): void {
            [$numeroSecteur, $location, $adresse] = $row;

            Secteur::updateOrCreate([
                'num_torne' => (string) $numeroSecteur,
                'nom_secteur' => $adresse,
            ], [
                'emplacement' => $location,
                'agence' => 'SRM-FM Taza',
            ]);
        });
    }
}
