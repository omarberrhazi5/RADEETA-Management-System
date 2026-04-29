<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_plombier' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'identifiant' => $this->identifiant,
            'email' => $this->email,
            'role' => $this->role instanceof UserRole ? $this->role->value : $this->role,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
