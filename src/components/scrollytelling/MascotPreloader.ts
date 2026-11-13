import { TrajectoryPoint, ScrollytellingAssets } from './types';

export const TOTAL_FLIGHT_FRAMES = 215;

let cachedAssets: ScrollytellingAssets | null = null;
let isStreamingRemaining = false;

export class MascotPreloader {
  public static loadImage(src: string): Promise<HTMLImageElement> {
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
        // Retry once on network failure
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

  /**
   * Tier 1: Critical Bootstrap (Hero ready in < 300ms)
   * Loads trajectory.json and Frame 1 (35 KB total payload).
   * Resolves immediately to allow the hero section to paint instantly.
   * Kicks off background streaming for remaining flight frames without blocking UI.
   */
  public static async preloadCritical(
    onProgress?: (progress: number) => void,
    onBackgroundProgress?: (loaded: number, total: number) => void
  ): Promise<ScrollytellingAssets> {
    if (cachedAssets) {
      if (onProgress) onProgress(100);
      return cachedAssets;
    }

    // 1. Fetch trajectory data and Frame 1 concurrently
    const [trajectoryRes, frame1] = await Promise.all([
      fetch('/sequence/trajectory.json'),
      this.loadImage('/sequence/flight/frame_001.webp'),
    ]);

    if (!trajectoryRes.ok) throw new Error('Failed to load trajectory.json');
    const trajectory: TrajectoryPoint[] = await trajectoryRes.json();

    const flightFrames: HTMLImageElement[] = new Array(TOTAL_FLIGHT_FRAMES);
    flightFrames[0] = frame1;

    cachedAssets = {
      trajectory,
      flightFrames,
    };

    if (onProgress) {
      onProgress(100);
    }

    // 2. Stream remaining frames asynchronously in background
    if (!isStreamingRemaining) {
      isStreamingRemaining = true;
      this.streamRemainingFrames(flightFrames, onBackgroundProgress);
    }

    return cachedAssets;
  }

  /**
   * Tier 2: Stream remaining frames in background idle window.
   * Priority 1: 3 Resting Anchor frames (Frames 70, 149, 215)
   * Priority 2: Intermediate animation frames in concurrency batches
   */
  private static async streamRemainingFrames(
    flightFrames: HTMLImageElement[],
    onProgress?: (loaded: number, total: number) => void
  ) {
    // 1. Load resting anchor frames first so early scroll locks cleanly onto anchors
    const restingFrameNums = [70, 149, 215];
    await Promise.all(
      restingFrameNums.map(async (frameNum) => {
        const pad = String(frameNum).padStart(3, '0');
        const img = await this.loadImage(`/sequence/flight/frame_${pad}.webp`);
        flightFrames[frameNum - 1] = img;
      })
    );

    // 2. Queue all remaining frames
    const remainingQueue: number[] = [];
    for (let i = 2; i <= TOTAL_FLIGHT_FRAMES; i++) {
      if (!restingFrameNums.includes(i)) {
        remainingQueue.push(i);
      }
    }

    let loadedCount = 1 + restingFrameNums.length;
    const CONCURRENCY = 6;

    const worker = async () => {
      while (remainingQueue.length > 0) {
        const frameNum = remainingQueue.shift();
        if (!frameNum) break;

        const pad = String(frameNum).padStart(3, '0');
        const src = `/sequence/flight/frame_${pad}.webp`;
        try {
          const img = await this.loadImage(src);
          flightFrames[frameNum - 1] = img;
        } catch {
          // ignore individual frame fetch error
        }
        loadedCount++;
        if (onProgress) {
          onProgress(loadedCount, TOTAL_FLIGHT_FRAMES);
        }
      }
    };

    const startWorkers = () => {
      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      Promise.all(workers).catch(() => {});
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        startWorkers();
      });
    } else {
      setTimeout(startWorkers, 100);
    }
  }

  /**
   * Backward-compatible entry point
   */
  public static async preloadAll(onProgress?: (progress: number) => void): Promise<ScrollytellingAssets> {
    return this.preloadCritical(onProgress);
  }
}
