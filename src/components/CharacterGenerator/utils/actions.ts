import { getDownloadURL } from 'firebase/storage';
import { CharacterDetails } from './character';
import { saveUploadMetadata, startFirebaseUpload } from './firebase';

export type ActionState = 'idle' | 'downloading' | 'uploading' | 'done' | 'failed';

export const downloadImage = async (
  url: string,
  character: CharacterDetails,
  onStateChange?: (state: ActionState) => void
): Promise<boolean> => {
  try {
    onStateChange?.('downloading');

    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.race}_${character.class}_${character.gender}.png`;
    link.click();

    // Simulate download completion
    await new Promise((resolve) => setTimeout(resolve, 500));

    onStateChange?.('done');
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    onStateChange?.('failed');
    return false;
  }
};

export const uploadImage = async (
  url: string,
  character: CharacterDetails,
  onStateChange?: (state: ActionState) => void
): Promise<boolean> => {
  try {
    onStateChange?.('uploading');

    const { uploadTask } = startFirebaseUpload(url, character);
    await uploadTask;

    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
    await saveUploadMetadata(downloadUrl, character);

    onStateChange?.('done');
    return true;
  } catch (error) {
    console.error('Upload failed:', error);
    onStateChange?.('failed');
    return false;
  }
};
