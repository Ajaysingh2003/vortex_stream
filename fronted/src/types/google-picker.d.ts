// Browser globals provided by the scripts loaded in useGooglePicker.
interface GooglePickerView {
  setIncludeFolders(value: boolean): this;
  setSelectFolderEnabled(value: boolean): this;
  setEnableDrives(value: boolean): this;
  setMimeTypes(value: string): this;
}
interface GooglePickerBuilder {
  addView(view: GooglePickerView): this;
  setOAuthToken(value: string): this;
  setDeveloperKey(value: string): this;
  setTitle(value: string): this;
  setCallback(callback: (data: { action: string; docs: { id: string; name: string; mimeType: string; url: string; sizeBytes?: number | string }[] }) => void): this;
  build(): { setVisible(value: boolean): void };
}
interface Window {
  gapi: { load(name: string, callback: () => void): void };
  google: {
    accounts: { oauth2: { initTokenClient(config: {
      client_id: string;
      scope: string;
      callback: (response: { error?: string; access_token: string }) => void;
    }): { requestAccessToken(options: { prompt: string }): void } } };
    picker: {
      PickerBuilder: new () => GooglePickerBuilder;
      DocsView: new () => GooglePickerView;
      Action: { PICKED: string };
    };
  };
}
