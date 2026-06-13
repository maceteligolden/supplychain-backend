import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import multer from 'multer';
import { NextFunction, Request, Response } from 'express';

import { ENV, HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

/** URL prefix for persisted commodity images. */
export const COMMODITY_UPLOAD_URL_PREFIX = '/uploads/commodities';

/** Absolute directory where commodity image files are stored. */
export const getCommodityUploadDirectory = (): string =>
  path.join(ENV.UPLOAD_DIR, 'commodities');

/** Ensures the commodity upload directory exists on disk. */
export const ensureCommodityUploadDirectory = (): void => {
  fs.mkdirSync(getCommodityUploadDirectory(), { recursive: true });
};

const commodityImageStorage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    ensureCommodityUploadDirectory();
    callback(null, getCommodityUploadDirectory());
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const commodityImageUpload = multer({
  storage: commodityImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(new Error('Only image files are allowed'));
  },
});

/** Parses an optional single commodity image from multipart form data. */
export const parseCommodityImageUpload = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const contentType = request.headers['content-type'] ?? '';

  if (!contentType.includes('multipart/form-data')) {
    next();
    return;
  }

  commodityImageUpload.single('image')(request, response, (error) => {
    if (error instanceof multer.MulterError || error instanceof Error) {
      ResponseUtil.error(response, error.message, HTTP_STATUS.BAD_REQUEST);
      return;
    }

    next();
  });
};
