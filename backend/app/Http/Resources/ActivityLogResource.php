<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $displayName = $this->user
            ? trim(($this->user->prenom ?? '').' '.($this->user->nom ?? '')) ?: ($this->user->name ?? $this->user->identifiant ?? 'System')
            : 'System';

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $displayName,
            'user_name' => $displayName,
            'user_details' => new UserResource($this->whenLoaded('user')),
            'action' => $this->action,
            'module' => $this->module,
            'ip_address' => $this->ip_address,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->format('Y-m-d\TH:i:s'),
        ];
    }
}
