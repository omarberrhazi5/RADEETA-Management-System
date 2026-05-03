<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = $this->data ?? [];

        return [
            'id' => $this->id,
            'title' => $data['title'] ?? class_basename($this->type),
            'message' => $data['message'] ?? '',
            'type' => $data['type'] ?? $this->type,
            'meta' => $data['meta'] ?? [],
            'is_read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'timestamp' => $data['timestamp'] ?? $this->created_at?->toISOString(),
        ];
    }
}
