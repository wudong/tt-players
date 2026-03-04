/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_PORT: string;
    /**
     * JSON array of competitions to list in the Leagues hub.
     * Format: [{"id":"uuid","name":"League Name","division":"Div 1"}]
     */
    readonly VITE_COMPETITION_IDS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
