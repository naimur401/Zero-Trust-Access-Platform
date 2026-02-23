#!/usr/bin/env python3
"""
Fast CNN-LSTM Training (Demo Version)
Uses synthetic data for quick training - perfect for testing
"""

import os
import json
import numpy as np
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Sequential
from tensorflow.keras.callbacks import EarlyStopping

# Configuration
MODEL_OUTPUT_DIR = "models/cnn-lstm-risk"
SEQ_LEN = 10
FEATURE_DIM = 16
BATCH_SIZE = 32
EPOCHS = 10  # Fast training
VALIDATION_SPLIT = 0.2

print("=" * 60)
print("🧠 CNN-LSTM Fast Training (Synthetic Data)")
print("=" * 60)

# Generate synthetic data (fast alternative to UNSW-NB15)
print("\n📊 Generating synthetic training data...")
np.random.seed(42)

# Create synthetic sequences
n_samples = 5000
X_train = np.random.randn(n_samples, FEATURE_DIM).astype('float32')
y_train = (np.random.rand(n_samples) > 0.7).astype('float32')  # 30% attack

X_test = np.random.randn(1000, FEATURE_DIM).astype('float32')
y_test = (np.random.rand(1000) > 0.7).astype('float32')

print(f"✅ Train set: {X_train.shape[0]} samples")
print(f"✅ Test set: {X_test.shape[0]} samples")

# Normalize
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Create sequences
print(f"\n📊 Creating sequences (length={SEQ_LEN})...")
def create_sequences(X, y, seq_len=SEQ_LEN):
    X_seq, y_seq = [], []
    for i in range(len(X) - seq_len):
        X_seq.append(X[i:i+seq_len])
        y_seq.append(y[i+seq_len])
    return np.array(X_seq), np.array(y_seq)

X_train_seq, y_train_seq = create_sequences(X_train, y_train, SEQ_LEN)
X_test_seq, y_test_seq = create_sequences(X_test, y_test, SEQ_LEN)

print(f"✅ Train sequences: {X_train_seq.shape}")
print(f"✅ Test sequences: {X_test_seq.shape}")

# Build model
print("\n🏗️  Building CNN-LSTM model...")
model = Sequential([
    layers.Conv1D(64, kernel_size=3, activation='relu', input_shape=(SEQ_LEN, FEATURE_DIM)),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    
    layers.Conv1D(128, kernel_size=3, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    
    layers.MaxPooling1D(pool_size=2),
    
    layers.LSTM(128, return_sequences=True),
    layers.Dropout(0.3),
    
    layers.LSTM(64, return_sequences=False),
    layers.Dropout(0.3),
    
    layers.Dense(64, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    
    layers.Dense(32, activation='relu'),
    layers.Dropout(0.2),
    
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy', keras.metrics.AUC()]
)

print(model.summary())

# Train
print("\n🚀 Training model...")
callbacks = [
    EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True),
]

history = model.fit(
    X_train_seq, y_train_seq,
    validation_split=VALIDATION_SPLIT,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks,
    verbose=1
)

# Evaluate
print("\n📈 Evaluating on test set...")
test_loss, test_acc, test_auc = model.evaluate(X_test_seq, y_test_seq, verbose=0)
print(f"✅ Test Loss: {test_loss:.4f}")
print(f"✅ Test Accuracy: {test_acc:.4f}")
print(f"✅ Test AUC: {test_auc:.4f}")

# Save model
print(f"\n💾 Saving model to {MODEL_OUTPUT_DIR}...")
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)

# Save as H5 (simpler format)
model.save(os.path.join(MODEL_OUTPUT_DIR, 'model.h5'))
print(f"✅ Model saved as H5")

# Save metadata
metadata = {
    'seq_len': SEQ_LEN,
    'feature_dim': FEATURE_DIM,
    'features': ['hour', 'off_hours', 'unknown_loc', 'new_device', 'bot_ua', 
                 'read', 'write', 'delete', 'ip_hash', 'device_hash', 'resource_hash',
                 'reserved1', 'reserved2', 'reserved3', 'reserved4', 'reserved5'],
    'scaler_mean': scaler.mean_.tolist(),
    'scaler_scale': scaler.scale_.tolist(),
    'model_type': 'CNN-LSTM',
    'dataset': 'Synthetic (Fast Demo)',
    'accuracy': float(test_acc),
    'auc': float(test_auc)
}

with open(os.path.join(MODEL_OUTPUT_DIR, 'metadata.json'), 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"✅ Metadata saved")

print("\n" + "=" * 60)
print("✅ Training complete!")
print(f"📁 Model saved to: {MODEL_OUTPUT_DIR}")
print("=" * 60)
print("\n🚀 Next steps:")
print("1. pnpm install @tensorflow/tfjs @tensorflow/tfjs-node")
print("2. pnpm dev")
print("3. Visit http://localhost:3000")
print("4. Click 'Analyze Risk' button")
