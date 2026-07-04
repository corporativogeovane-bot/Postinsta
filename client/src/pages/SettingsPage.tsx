import { useEffect, useState } from "react";
import type { Settings } from "../types";
import { api } from "../api";

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  async function save(partial: Partial<Settings>) {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api.updateSettings(partial);
      setSettings(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div className="page">Carregando…</div>;

  return (
    <div className="page">
      <h1>Configurações</h1>

      <section className="settings-section">
        <h2>Formato da imagem</h2>
        <p className="settings-hint">Formato usado ao gerar a imagem para o Instagram.</p>
        <select
          value={settings.image_format}
          onChange={(e) => save({ image_format: e.target.value as Settings["image_format"] })}
        >
          <option value="square">Quadrado (1080x1080)</option>
          <option value="portrait">Retrato (1080x1350)</option>
        </select>
      </section>

      <section className="settings-section">
        <h2>IA gratuita (Pollinations)</h2>
        <p className="settings-hint">
          Gera automaticamente legenda + hashtags e uma imagem de fundo quando a notícia não tem
          foto. Não precisa de chave de API.
        </p>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.ai_enabled}
            onChange={(e) => save({ ai_enabled: e.target.checked })}
          />
          <span />
        </label>
      </section>

      <section className="settings-section">
        <h2>Google Drive</h2>
        <p className="settings-hint">
          Credenciais da service account:{" "}
          {settings.drive_credentials_present ? (
            <strong style={{ color: "#22c55e" }}>encontradas ✓</strong>
          ) : (
            <strong style={{ color: "#f87171" }}>
              não encontradas (veja o README para configurar)
            </strong>
          )}
        </p>
        <label>
          ID da pasta no Drive
          <input
            type="text"
            placeholder="1AbCdEfGhIjKlmNoPQRstuvWXyz"
            defaultValue={settings.drive_folder_id}
            onBlur={(e) => save({ drive_folder_id: e.target.value.trim() })}
          />
        </label>
        <label className="switch-row">
          <span>Salvar automaticamente cada post gerado no Drive</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.drive_auto_save}
              onChange={(e) => save({ drive_auto_save: e.target.checked })}
            />
            <span />
          </label>
        </label>
      </section>

      {saving && <p className="info-message">Salvando…</p>}
      {saved && !saving && <p className="info-message">Configurações salvas.</p>}
    </div>
  );
}
