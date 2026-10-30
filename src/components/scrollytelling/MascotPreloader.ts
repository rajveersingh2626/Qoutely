import { TrajectoryPoint, ScrollytellingAssets } from './types';

export const TOTAL_FLIGHT_FRAMES = 215;

let cachedAssets: ScrollytellingAssets | null = null;

export class MascotPreloader {
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';

      const handleDone = () => {
        if ('decode' in img) {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };

      img.onload = handleDone;
      img.onerror = () => {
        // Retry once on failure
        const retryImg = new Image();
        retryImg.onload = () => resolve(retryImg);
        retryImg.onerror = () => resolve(img);
        retryImg.src = src;
      };

      img.src = src;

      // Handle already cached complete image
      if (img.complete && img.naturalWidth > 0) {
        handleDone();
      }
    });
  }

  public static async preloadAll(onProgress?: (progress: number) => void): Promise<ScrollytellingAssets> {
    if (cachedAssets) {
      if (onProgress) onProgress(100);
      return cachedAssets;
    }

    // 1. Fetch trajectory data
    const trajectoryRes = await fetch('/sequence/trajectory.json');
    if (!trajectoryRes.ok) throw new Error('Failed to load trajectory.json');
    const trajectory: TrajectoryPoint[] = await trajectoryRes.json();

    const totalFrames = TOTAL_FLIGHT_FRAMES;
    const flightFrames: HTMLImageElement[] = new Array(totalFrames);
    let loadedItems = 0;

    const reportProgress = () => {
      loadedItems++;
      if (onProgress) {
        const pct = Math.min(100, Math.round((loadedItems / totalFrames) * 100));
        onProgress(pct);
      }
    };

    // 2. Controlled concurrency worker pool (8 concurrent network requests)
    // Avoids HTTP/1.1 socket exhaustion and dev-server head-of-line blocking
    const CONCURRENCY = 8;
    const queue: number[] = Array.from({ length: totalFrames }, (_, i) => i + 1);

    const worker = async () => {
      while (queue.length > 0) {
        const frameNum = queue.shift();
        if (!frameNum) break;

        const pad = String(frameNum).padStart(3, '0');
        const src = `/sequence/flight/frame_${pad}.webp`;
        const img = await this.loadImage(src);
        flightFrames[frameNum - 1] = img;
        reportProgress();
      }
    };

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    cachedAssets = {
      trajectory,
      flightFrames,
    };

    return cachedAssets;
  }
}
