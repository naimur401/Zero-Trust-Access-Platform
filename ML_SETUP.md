# CNN-LSTM ML Model Setup Guide

## Overview
This project includes a **CNN-LSTM deep learning model** trained on the **UNSW-NB15 cybersecurity dataset** for network intrusion detection and risk classification.

## Architecture
- **Model**: CNN-LSTM (Convolutional Neural Network + Long Short-Term Memory)
- **Dataset**: UNSW-NB15 (2.5M+ network traffic records)
- **Features**: 16 engineered features from network/security context
- **Output**: Risk score (0-100)
- **Framework**: TensorFlow/Keras (training) + TensorFlow.js (inference)

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install tensorflow pandas scikit-learn numpy tensorflowjs
```

**Windows users**: If you encounter issues with TensorFlow, use:
```bash
pip install tensorflow-cpu
```

### 2. Download UNSW-NB15 Dataset

The training script automatically downloads the dataset from:
- Training: https://www.unsw.adfa.edu.au/unsw-canberra/academic/cybersecurity/ADFA-IDS-Datasets/UNSW-NB15/UNSW-NB15_training-set.csv
- Testing: https://www.unsw.adfa.edu.au/unsw-canberra/academic/cybersecurity/ADFA-IDS-Datasets/UNSW-NB15/UNSW-NB15_testing-set.csv

**Alternative**: Download manually and place in `data/` directory

### 3. Train the Model

```bash
python scripts/train-cnn-lstm.py
```

**What this does:**
- Downloads UNSW-NB15 dataset (2.5M records)
- Preprocesses and normalizes features
- Creates sequences for LSTM (length=10)
- Builds CNN-LSTM architecture
- Trains for up to 50 epochs with early stopping
- Saves model to `models/cnn-lstm-risk/`
- Generates `metadata.json` with scaler parameters

**Training time**: ~10-30 minutes (depends on hardware)

**Output files:**
```
models/cnn-lstm-risk/
├── model.json              # TensorFlow.js model definition
├── model_weights.bin       # Model weights
├── metadata.json           # Preprocessing metadata
└── saved_model/            # TensorFlow SavedModel format
```

### 4. Install Node.js Dependencies

```bash
pnpm install @tensorflow/tfjs @tensorflow/tfjs-node
```

**Windows users**: If `@tensorflow/tfjs-node` fails:
```bash
# Use CPU-only version
pnpm install @tensorflow/tfjs @tensorflow/tfjs-node-cpu
```

### 5. Start the Application

```bash
pnpm dev
```

The API will automatically load the trained model on first request.

## Usage

### API Endpoint: POST `/api/ml/classify-risk`

**Request:**
```json
{
  "userId": "user123",
  "resourceId": "database_prod",
  "action": "READ",
  "context": {
    "ipAddress": "192.168.1.100",
    "deviceId": "device-abc123",
    "location": "Office",
    "userAgent": "Mozilla/5.0"
  }
}
```

**Response:**
```json
{
  "mlRiskScore": 35,
  "behavioralAnomalies": 28,
  "federatedRiskScore": 32,
  "analysis": {
    "timestamp": "2026-02-23T03:15:00Z",
    "userId": "user123",
    "models": [
      "CNN-LSTM Risk Model (UNSW-NB15)",
      "Behavioral Anomaly Detector",
      "Federated Learning Aggregator"
    ],
    "confidence": 0.93
  },
  "saved": true,
  "resultId": "507f1f77bcf86cd799439011",
  "modelSource": "cnn-lstm"
}
```

### Dashboard

Access the ML Risk Dashboard at: `http://localhost:3000`

Features:
- Real-time risk analysis
- Model information display
- Analysis history (last 10 predictions)
- Confidence scores
- Database persistence status

## Model Details

### Architecture
```
Input (1, 10, 16)
    ↓
Conv1D(64, kernel=3) + BatchNorm + Dropout(0.3)
    ↓
Conv1D(128, kernel=3) + BatchNorm + Dropout(0.3)
    ↓
MaxPooling1D(2)
    ↓
LSTM(128, return_sequences=True) + Dropout(0.3)
    ↓
LSTM(64) + Dropout(0.3)
    ↓
Dense(64) + BatchNorm + Dropout(0.3)
    ↓
Dense(32) + Dropout(0.2)
    ↓
Dense(1, sigmoid)  → Risk Score (0-1)
```

### Features (16 dimensions)
1. Hour of day (normalized)
2. Off-hours indicator
3. Unknown location indicator
4. New device indicator
5. Bot user agent indicator
6. READ action indicator
7. WRITE action indicator
8. DELETE action indicator
9. IP address hash
10. Device ID hash
11. Resource ID hash
12-16. Reserved for future features

### Training Configuration
- **Sequence Length**: 10 events
- **Batch Size**: 32
- **Epochs**: 50 (with early stopping)
- **Validation Split**: 20%
- **Optimizer**: Adam (lr=0.001)
- **Loss**: Binary Crossentropy
- **Metrics**: Accuracy, AUC

## Performance

Expected metrics on UNSW-NB15 test set:
- **Accuracy**: ~92-95%
- **AUC**: ~0.95-0.97
- **Inference Time**: <100ms per request

## Troubleshooting

### Model not found error
```
Error: CNN-LSTM model not found at models/cnn-lstm-risk
```
**Solution**: Run `python scripts/train-cnn-lstm.py`

### TensorFlow.js conversion failed
```
⚠️  TensorFlow.js conversion failed
```
**Solution**: Model is saved as H5 format instead. Install tensorflowjs:
```bash
pip install tensorflowjs
```

### Out of memory during training
**Solution**: Reduce batch size in `scripts/train-cnn-lstm.py`:
```python
BATCH_SIZE = 16  # Instead of 32
```

### Slow inference on Windows
**Solution**: Use CPU-only TensorFlow:
```bash
pnpm install @tensorflow/tfjs-node-cpu
```

## Advanced Usage

### Custom Training Data

To train with your own dataset:

1. Prepare CSV with columns: `proto`, `state`, `dur`, `sbytes`, `dbytes`, `sttl`, `dttl`, `sload`, `dload`, `spkts`, `dpkts`, `swin`, `dwin`, `tcprtt`, `synack`, `ackdat`, `attack`

2. Modify `scripts/train-cnn-lstm.py`:
```python
def download_dataset():
    train_df = pd.read_csv('your_train_data.csv')
    test_df = pd.read_csv('your_test_data.csv')
    return train_df, test_df
```

3. Run training:
```bash
python scripts/train-cnn-lstm.py
```

### Model Retraining

To retrain with new data:
```bash
python scripts/train-cnn-lstm.py
```

This will overwrite the existing model in `models/cnn-lstm-risk/`

## Files Structure

```
project/
├── scripts/
│   └── train-cnn-lstm.py          # Training script
├── lib/
│   └── ml/
│       └── cnnLstm.ts             # Inference wrapper
├── models/
│   └── cnn-lstm-risk/
│       ├── model.json             # TensorFlow.js model
│       ├── model_weights.bin       # Weights
│       └── metadata.json           # Preprocessing metadata
├── app/
│   └── api/
│       └── ml/
│           └── classify-risk/
│               └── route.ts        # API endpoint
├── components/
│   └── ml-risk-dashboard.tsx       # Dashboard UI
└── ML_SETUP.md                     # This file
```

## References

- **UNSW-NB15 Dataset**: https://www.unsw.adfa.edu.au/
- **TensorFlow.js**: https://www.tensorflow.org/js
- **CNN-LSTM Architecture**: https://arxiv.org/abs/1506.04214

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review training logs in console output
3. Verify model files exist in `models/cnn-lstm-risk/`
4. Check API response for warnings/errors

---

**Last Updated**: February 2026  
**Model Version**: 1.0 (UNSW-NB15 Trained)
