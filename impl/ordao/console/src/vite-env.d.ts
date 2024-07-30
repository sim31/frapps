/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;

  readonly VITE_OLD_RESPECT_ADDR: string;
  readonly VITE_NEW_RESPECT_ADDR: string;
  readonly VITE_OREC_ADDR: string;
  readonly VITE_ORNODE_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
