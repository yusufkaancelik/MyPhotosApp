import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { getStoragePath } from '../utils/storage.js';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Create video thumbnail
export async function createVideoThumbnail(videoPath, filename) {
  const storagePath = await getStoragePath();
  const thumbnailName = `thumb_${path.parse(filename).name}.jpg`;
  const thumbnailPath = path.join(storagePath, thumbnailName);
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01.000'], // Take screenshot at 1 second
        filename: thumbnailName,
        folder: storagePath,
        size: '300x300'
      })
      .on('end', () => resolve(thumbnailName))
      .on('error', (err) => {
        console.error('Error creating video thumbnail:', err);
        reject(err);
      });
  });
}

// Get video metadata
export async function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error getting video metadata:', err);
        return reject(err);
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name,
        codec: videoStream?.codec_name,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: eval(videoStream?.r_frame_rate), // Convert fraction to number
        hasAudio: !!audioStream,
        type: 'video'
      });
    });
  });
}