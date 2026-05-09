<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'module',
        'ip_address',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, string $module, ?Request $request = null, array $metadata = []): void
    {
        self::create([
            'user_id' => $request?->user()?->id,
            'action' => $action,
            'module' => $module,
            'ip_address' => $request?->ip(),
            'metadata' => $metadata ?: null,
        ]);
    }
}
