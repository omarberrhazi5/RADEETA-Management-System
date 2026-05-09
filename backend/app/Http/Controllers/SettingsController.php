<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Setting;
use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $this->assertDirecteur(request());

        return response()->json($this->settings());
    }

    public function update(Request $request): JsonResponse
    {
        $this->assertDirecteur($request);

        $validated = $request->validate([
            'agency_name' => ['required', 'string', 'max:255'],
            'application_name' => ['required', 'string', 'max:255'],
            'default_language' => ['required', Rule::in(['fr', 'ar', 'en'])],
            'notification_preferences' => ['required', 'array'],
            'notification_preferences.email' => ['required', 'boolean'],
            'notification_preferences.in_app' => ['required', 'boolean'],
            'notification_preferences.daily_digest' => ['required', 'boolean'],
            'dashboard_preferences' => ['required', 'array'],
            'dashboard_preferences.show_maps' => ['required', 'boolean'],
            'dashboard_preferences.show_charts' => ['required', 'boolean'],
            'dashboard_preferences.compact_cards' => ['required', 'boolean'],
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        ActivityLog::record('Modification des paramètres', 'Paramètres', $request);

        return response()->json($this->settings());
    }

    private function settings(): array
    {
        return Setting::query()
            ->get()
            ->mapWithKeys(fn (Setting $setting): array => [$setting->key => $setting->value])
            ->all();
    }

    private function assertDirecteur(Request $request): void
    {
        $role = $request->user()?->role instanceof UserRole ? $request->user()->role->value : $request->user()?->role;

        abort_if($role !== UserRole::Directeur->value, 403);
    }
}
