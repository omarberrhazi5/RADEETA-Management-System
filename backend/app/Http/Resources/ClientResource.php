<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_client' => $this->id,
            'police' => $this->police,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'cin' => $this->cin,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'type_abonnement' => $this->type_abonnement,
            'service_type' => $this->service_type,
            'id_secteur' => $this->id_secteur,
            'abonne' => $this->abonne,
            'statut' => $this->abonne ? 'actif' : 'inactif',
            'type_client' => $this->type_abonnement,
            'secteur' => new SecteurResource($this->whenLoaded('secteur')),
            'compteurs' => CompteurResource::collection($this->whenLoaded('compteurs')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
