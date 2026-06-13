import fs from 'fs';
import path from 'path';

import {
  COMMODITY_UPLOAD_URL_PREFIX,
  getCommodityUploadDirectory,
} from './commodity.storage';

/**
 * Builds the public URL path for a stored commodity image filename.
 */
export const buildCommodityImageUrl = (storedFilename: string): string =>
  `${COMMODITY_UPLOAD_URL_PREFIX}/${storedFilename}`;

/** Returns the stored filename from a commodity image URL, if present. */
export const getStoredFilenameFromImageUrl = (imageUrl: string): string | null => {
  if (!imageUrl.startsWith(`${COMMODITY_UPLOAD_URL_PREFIX}/`)) {
    return null;
  }

  return path.basename(imageUrl);
};

/** Deletes a stored commodity image file when the URL points at local storage. */
export const deleteCommodityImageFile = (imageUrl: string): void => {
  const storedFilename = getStoredFilenameFromImageUrl(imageUrl);

  if (!storedFilename) {
    return;
  }

  const filePath = path.join(getCommodityUploadDirectory(), storedFilename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
