import os
import cv2
import json
import numpy as np
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = r"c:\Users\jasra\OneDrive\Desktop\Qoutely"
FLOW_SRC = r"C:\Users\jasra\OneDrive\Desktop\Qoutely personal\website flow"
WINGED_SRC = r"C:\Users\jasra\OneDrive\Desktop\Qoutely personal\winged character"

OUT_FLIGHT_DIR = os.path.join(BASE_DIR, "public", "sequence", "flight")
OUT_IDLE_DIR = os.path.join(BASE_DIR, "public", "sequence", "idle")
os.makedirs(OUT_FLIGHT_DIR, exist_ok=True)
os.makedirs(OUT_IDLE_DIR, exist_ok=True)

print("Starting sequence conversion to transparent WebP...")

# 1. FLIGHT SEQUENCE CONVERSION (215 frames)
flow_files = sorted([f for f in os.listdir(FLOW_SRC) if f.endswith(".png")])
print(f"Found {len(flow_files)} flight frames.")

trajectory = []

def process_flight_frame(args):
    idx, fname = args
    in_path = os.path.join(FLOW_SRC, fname)
    out_path = os.path.join(OUT_FLIGHT_DIR, f"frame_{idx+1:03d}.webp")
    
    orig = cv2.imread(in_path)
    h, w = orig.shape[:2]
    
    # Background color ~ [240, 247, 248] (BGR)
    bg = orig[0, 0, :3].astype(np.float32)
    diff = np.max(np.abs(orig[:, :, :3].astype(np.float32) - bg), axis=2)
    
    # Character mask
    char_raw = (diff > 18).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed = cv2.morphologyEx(char_raw, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    cx, cy, cw, ch = 0, 0, 0, 0
    char_mask = np.zeros((h, w), dtype=np.uint8)
    shadow_mask = np.zeros((h, w), dtype=np.uint8)
    
    if len(contours) > 0:
        c0 = contours[0]
        bx, by, bw, bh = cv2.boundingRect(c0)
        cx = bx + bw / 2.0
        cy = by + bh / 2.0
        cw = bw
        ch = bh
        cv2.drawContours(char_mask, [c0], -1, 255, -1)
        
        # Check for shadow contour
        if len(contours) > 1 and cv2.contourArea(contours[1]) > 500:
            c1 = contours[1]
            cv2.drawContours(shadow_mask, [c1], -1, 255, -1)
    
    # Anti-alias character edge
    char_alpha = cv2.GaussianBlur(char_mask, (3, 3), 0.5)
    
    # Translucent shadow alpha based on darkness
    shadow_alpha = (diff / 35.0 * 110.0).astype(np.uint8)
    shadow_alpha = np.where(shadow_mask > 0, shadow_alpha, 0)
    
    final_alpha = np.maximum(char_alpha, shadow_alpha)
    
    out_bgra = np.dstack((orig[:, :, :3], final_alpha))
    cv2.imwrite(out_path, out_bgra, [cv2.IMWRITE_WEBP_QUALITY, 90])
    
    return {
        "frame": idx + 1,
        "cx": round(cx, 1),
        "cy": round(cy, 1),
        "w": round(cw, 1),
        "h": round(ch, 1)
    }

# Process in parallel
with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(process_flight_frame, enumerate(flow_files)))

# Sort results by frame index
results = sorted(results, key=lambda x: x["frame"])

traj_path = os.path.join(BASE_DIR, "public", "sequence", "trajectory.json")
with open(traj_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"Flight frames converted & trajectory saved to {traj_path}.")

# 2. IDLE SEQUENCE CONVERSION (45 frames)
winged_files = sorted([f for f in os.listdir(WINGED_SRC) if f.endswith(".png")])
print(f"Found {len(winged_files)} idle winged frames.")

# Crop window determined from global bbox: X: [70, 1075], Y: [665, 1305]
CROP_X1, CROP_X2 = 70, 1075
CROP_Y1, CROP_Y2 = 665, 1305

def process_idle_frame(args):
    idx, fname = args
    in_path = os.path.join(WINGED_SRC, fname)
    out_path = os.path.join(OUT_IDLE_DIR, f"idle_{idx+1:03d}.webp")
    
    orig = cv2.imread(in_path)[:, :1075] # ignore right green artifact col
    h, w = orig.shape[:2]
    
    bg = np.array([247, 247, 247], dtype=np.float32)
    diff = np.max(np.abs(orig[:, :, :3].astype(np.float32) - bg), axis=2)
    
    char_raw = (diff > 18).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed = cv2.morphologyEx(char_raw, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    char_mask = np.zeros((h, w), dtype=np.uint8)
    if len(contours) > 0:
        cv2.drawContours(char_mask, [contours[0]], -1, 255, -1)
    
    char_alpha = cv2.GaussianBlur(char_mask, (3, 3), 0.5)
    out_bgra = np.dstack((orig[:, :, :3], char_alpha))
    
    # Crop to standard idle bounding box
    cropped = out_bgra[CROP_Y1:CROP_Y2, CROP_X1:CROP_X2]
    
    cv2.imwrite(out_path, cropped, [cv2.IMWRITE_WEBP_QUALITY, 90])

with ThreadPoolExecutor(max_workers=8) as executor:
    list(executor.map(process_idle_frame, enumerate(winged_files)))

print("Idle frames converted successfully!")
