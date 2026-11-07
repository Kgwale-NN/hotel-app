import { Router } from 'express';
import { isRoomPhotoFilename, roomPhotoDirectory } from '../services/room-photo.service';
const mediaRouter = Router();
mediaRouter.get('/:filename', (req, res) => {
  if (!isRoomPhotoFilename(req.params.filename)) { res.sendStatus(404); return; }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(req.params.filename, { root: roomPhotoDirectory, dotfiles: 'deny', maxAge: '1y', immutable: true }, error => {
    if (error && !res.headersSent) { res.removeHeader('Cache-Control'); res.status(404).json({ message: 'Photo not found.' }); }
  });
});
export default mediaRouter;
