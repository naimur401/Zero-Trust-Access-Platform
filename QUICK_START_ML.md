# Quick Start: CNN-LSTM ML Model

## 🚀 5-Minute Setup

### Step 1: Install Python Dependencies
```bash
pip install tensorflow pandas scikit-learn numpy tensorflowjs
```

### Step 2: Train the Model
```bash
python scripts/train-cnn-lstm.py
```
⏱️ Takes 10-30 minutes depending on your hardware

### Step 3: Install Node Dependencies
```bash
pnpm install @tensorflow/tfjs @tensorflow/tfjs-node
```

### Step 4: Start the App
```bash
pnpm dev
```

### Step 5: Open Dashboard
Go to: `http://localhost:3000`

Click **"Analyze Risk"** to test the CNN-LSTM model! 🎉

---

## 📊 What You Get

✅ **CNN-LSTM Model** - Deep learning trained on UNSW-NB15 (2.5M records)  
✅ **Beautiful Dashboard** - Real-time risk analysis UI  
✅ **API Endpoint** - `/api/ml/classify-risk` for integration  
✅ **Model Info** - Dataset, features, confidence scores  
✅ **History Tracking** - Last 10 predictions  

---

## 🔧 Troubleshooting

**TensorFlow installation fails?**
```bash
pip install tensorflow-cpu
```

**Model not found?**
```bash
python scripts/train-cnn-lstm.py
```

**Node dependency issues?**
```bash
pnpm install @tensorflow/tfjs @tensorflow/tfjs-node-cpu
```

---

## 📚 Full Documentation

See `ML_SETUP.md` for detailed setup, architecture, and advanced usage.

---

**Ready?** Run `python scripts/train-cnn-lstm.py` now! 🚀
