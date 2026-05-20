<?php

namespace App\Enums;

enum PanneAnomalie: string
{
    case FuiteAvantCompteur = 'fuite_avant_compteur';
    case FuiteApresCompteur = 'fuite_apres_compteur';
    case PressionFaible = 'pression_faible';
    case CompteurBloque = 'compteur_bloque';
    case CompteurCasse = 'compteur_casse';
    case CompteurInverse = 'compteur_inverse';
    case CadranIllisible = 'cadran_illisible';
    case AbsenceCompteur = 'absence_compteur';
    case CoupureElectricite = 'coupure_electricite';
    case TensionInstable = 'tension_instable';
    case BranchementIllicite = 'branchement_illicite';
    case PlombRompu = 'plomb_rompu';
    case RobinetDefectueux = 'robinet_defectueux';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
