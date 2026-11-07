import { RequestHandler } from 'express';
import multer from 'multer';

const singlePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, fieldSize: 1024, parts: 5 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return done(new Error('Unsupported photo type.'));
    done(null, true);
  },
}).single('photo');

export const receiveRoomPhoto: RequestHandler = (req, res, next) => {
  singlePhoto(req, res, error => {
    if (error) {
      res.status(error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
        .json({ message: 'Choose one JPG, PNG or WebP photo up to 5 MB.' });
      return;
    }
    next();
  });
};
