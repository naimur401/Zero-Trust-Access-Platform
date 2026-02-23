---
id: "7c2db3a4-511b-4e8b-985f-ec3ab8dc20d1"
title: "UNSW-NB15 CNN-LSTM Implementation Plan"
kind: process
created: 2026-02-23
updated: 2026-02-23
review_after: 2026-05-24
status: deprecated
tags: ["cnn-lstm", "cybersecurity", "deep-learning", "keras", "ml", "ml-model", "nextjs", "tensorflow", "unsw-nb15"]
filenames: ["app/api/ml/classify-risk/route.ts", "components/ml-dashboard.tsx", "lib/ml/cnnLstm.ts", "scripts/train-cnn-lstm.py"]
links: ["cf622007-b035-47c5-a92c-8792b7916dc3"]
superseded_by: "c6f79789-5c6c-447b-ba81-597a2008ab57"
deprecated_at: 2026-02-23
---


> ⚠️ **DEPRECATED**: The new document announces the complete CNN-LSTM implementation for UNSW-NB15, covering the actual built components (training script, inference wrapper, dashboard, API) that fulfill the planning steps outlined in the candidate document. The candidate is a prior implementation plan now superseded by the completion.

## UNSW-NB15 CNN-LSTM Implementation Plan

### Dataset Info:
- UNSW-NB15: Australian cybersecurity dataset
- 2.5M+ records, 49 features
- Binary classification: Normal (0) vs Attack (1)
- Train/Test split already provided

### Implementation Steps:
1. Download UNSW-NB15 dataset (CSV format)
2. Create Python training script with TensorFlow/Keras
3. Build CNN-LSTM model architecture
4. Train on UNSW-NB15 data
5. Save model as TensorFlow.js format
6. Integrate into Next.js API
7. Create beautiful ML dashboard UI

### Key Features to Extract:
- Protocol type, service, state
- Packet/byte statistics
- Flow duration
- TCP flags
- Anomaly indicators

### Model Architecture:
- CNN layer: Extract spatial patterns from features
- LSTM layer: Capture temporal dependencies
- Dense layers: Classification
- Output: Risk score (0-100)

### Files to Create:
- `scripts/train-cnn-lstm.py` - Training script
- `lib/ml/cnnLstm.ts` - Inference wrapper
- `models/cnn-lstm-risk/` - Saved model
- Enhanced ML dashboard UI
