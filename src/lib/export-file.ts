import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, Share } from 'react-native';

export interface ExportFile {
  /** e.g. "Timesheet PDF", used in the prompt and the toast. */
  label: string;
  name: string;
  mimeType: string;
  /** iOS uniform type identifier for the share sheet. */
  uti: string;
  data: string | Uint8Array;
}

/** ": <reason>" for a toast, or nothing when the error has no useful message. */
export const errorDetail = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';
  return message ? `: ${message.slice(0, 80)}` : '';
};

/** Asks whether to save the file on the device or share it. Resolves null when dismissed. */
const askExportAction = (label: string) =>
  new Promise<'save' | 'share' | null>((resolve) => {
    Alert.alert(
      label,
      'How would you like to export it?',
      [
        { text: 'Save to Device', onPress: () => resolve('save') },
        { text: 'Share', onPress: () => resolve('share') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });

const isCancelled = (error: unknown) => error instanceof Error && /cancel/i.test(error.message);

/** Saves the file to a folder the user picks, or opens the share sheet. */
export async function deliverFile(
  { label, name, mimeType, uti, data }: ExportFile,
  showToast: (message: string) => void,
) {
  // The web has no alert dialog or share sheet for files, so it goes straight to sharing
  const action = Platform.OS === 'web' ? 'share' : await askExportAction(label);
  if (!action) return;

  if (action === 'save') {
    try {
      // Folder picker (Android storage access framework / iOS Files): pick e.g. Downloads
      const folder = await Directory.pickDirectoryAsync();
      folder.createFile(name, mimeType).write(data);
      showToast(`${label} saved`);
    } catch (error) {
      if (!isCancelled(error)) throw error;
    }
    return;
  }

  if (await Sharing.isAvailableAsync()) {
    // Written into the app's own cache folder, the only place the share sheet may read from
    const file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(data);
    await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: `Export ${label}` });
    showToast(`${label} exported`);
  } else if (typeof data === 'string') {
    // No file sharing on this platform: share the contents as text instead
    await Share.share({ title: label, message: data });
  } else {
    showToast('Sharing is not available on this device');
  }
}
