import { uploadToR2, processImage } from './apps/api/src/modules/media/media.service';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function testUpload() {
  try {
    // Generate a dummy image buffer (a small 1x1 transparent WebP is 14 bytes, but let's just make a buffer)
    const dummyImage = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64');
    
    console.log('Processing image...');
    const processed = await processImage(dummyImage);
    
    console.log('Uploading to R2...');
    const url = await uploadToR2(processed, 'test/dummy.webp');
    console.log('Success! URL:', url);
  } catch (error) {
    console.error('Upload Failed:', error);
  }
}

testUpload();
