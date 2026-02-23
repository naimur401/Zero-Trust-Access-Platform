#!/usr/bin/env python3
"""
CNN-LSTM Model Training on UNSW-NB15 Dataset
Trains a deep learning model for network intrusion detection
Saves model in TensorFlow.js format for Next.js integration
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Sequential
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import json
import warnings

warnings.filterwarnings('ignore')

# Configuration
UNSW_TRAIN_URL = "https://www.unsw.adfa.edu.au/unsw-canberra/academic/cybersecurity/ADFA-IDS-Datasets/UNSW-NB15/UNSW-NB15_training-set.csv"
UNSW_TEST_URL = "https://www.unsw.adfa.edu.au/unsw-canberra/academic/cybersecurity/ADFA-IDS-Datasets/UNSW-NB15/UNSW-NB15_testing-set.csv"

MODEL_OUTPUT_DIR = "models/cnn-lstm-risk"
SEQ_LEN = 10
FEATURE_DIM = 16
BATCH_SIZE = 32
EPOCHS = 50
VALIDATION_SPLIT = 0.2

# Feature columns to use (subset of UNSW-NB15)
SELECTED_FEATURES = [
    'proto', 'state', 'dur', 'sbytes', 'dbytes', 'sttl', 'dttl',
    'sload', 'dload', 'spkts', 'dpkts', 'swin', 'dwin', 'tcprtt', 'synack', 'ackdat'
]

def download_dataset():
    """Download UNSW-NB15 dataset"""
    print("📥 Downloading UNSW-NB15 dataset...")
    
    try:
        train_df = pd.read_csv(UNSW_TRAIN_URL)
        test_df = pd.read_csv(UNSW_TEST_URL)
        print(f"✅ Train set: {train_df.shape[0]} samples")
        print(f"✅ Test set: {test_df.shape[0]} samples")
        return train_df, test_df
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("💡 Alternative: Download manually from https://www.unsw.adfa.edu.au/")
        sys.exit(1)

def preprocess_data(train_df, test_df):
    """Preprocess UNSW-NB15 data"""
    print("\n🔧 Preprocessing data...")
    
    # Select features
    available_features = [f for f in SELECTED_FEATURES if f in train_df.columns]
    print(f"Using {len(available_features)} features: {available_features}")
    
    X_train = train_df[available_features].copy()
    X_test = test_df[available_features].copy()
    
    # Target: 'attack' column (0=normal, 1=attack)
    y_train = train_df['attack'].values if 'attack' in train_df.columns else train_df['label'].values
    y_test = test_df['attack'].values if 'attack' in test_df.columns else test_df['label'].values
    
    # Handle missing values
    X_train = X_train.fillna(0)
    X_test = X_test.fillna(0)
    
    # Encode categorical features
    categorical_cols = X_train.select_dtypes(include=['object']).columns
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        X_train[col] = le.fit_transform(X_train[col].astype(str))
        X_test[col] = le.transform(X_test[col].astype(str))
        label_encoders[col] = le
    
    # Normalize numerical features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"✅ X_train shape: {X_train_scaled.shape}")
    print(f"✅ y_train distribution: {np.bincount(y_train)}")
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler

def create_sequences(X, y, seq_len=SEQ_LEN):
    """Create sequences for LSTM"""
    print(f"\n📊 Creating sequences (length={seq_len})...")
    
    X_seq, y_seq = [], []
    
    for i in range(len(X) - seq_len):
        X_seq.append(X[i:i+seq_len])
        y_seq.append(y[i+seq_len])
    
    X_seq = np.array(X_seq)
    y_seq = np.array(y_seq)
    
    print(f"✅ Sequences shape: {X_seq.shape}")
    print(f"✅ Labels shape: {y_seq.shape}")
    
    return X_seq, y_seq

def build_cnn_lstm_model(seq_len, feature_dim):
    """Build CNN-LSTM model"""
    print("\n🏗️  Building CNN-LSTM model...")
    
    model = Sequential([
        # CNN layers for feature extraction
        layers.Conv1D(64, kernel_size=3, activation='relu', input_shape=(seq_len, feature_dim)),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Conv1D(128, kernel_size=3, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.MaxPooling1D(pool_size=2),
        
        # LSTM layers for temporal dependencies
        layers.LSTM(128, return_sequences=True),
        layers.Dropout(0.3),
        
        layers.LSTM(64, return_sequences=False),
        layers.Dropout(0.3),
        
        # Dense layers for classification
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        
        # Output layer (binary classification)
        layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC()]
    )
    
    print(model.summary())
    return model

def train_model(model, X_train, y_train, X_test, y_test):
    """Train the model"""
    print("\n🚀 Training model...")
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    ]
    
    history = model.fit(
        X_train, y_train,
        validation_split=VALIDATION_SPLIT,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate on test set
    print("\n📈 Evaluating on test set...")
    test_loss, test_acc, test_auc = model.evaluate(X_test, y_test, verbose=0)
    print(f"✅ Test Loss: {test_loss:.4f}")
    print(f"✅ Test Accuracy: {test_acc:.4f}")
    print(f"✅ Test AUC: {test_auc:.4f}")
    
    return history

def save_model_tfjs(model, output_dir):
    """Save model in TensorFlow.js format"""
    print(f"\n💾 Saving model to {output_dir}...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Save as TensorFlow SavedModel first
    saved_model_path = os.path.join(output_dir, 'saved_model')
    model.save(saved_model_path)
    
    # Convert to TensorFlow.js format
    import subprocess
    try:
        subprocess.run([
            'tensorflowjs_converter',
            '--input_format', 'tf_saved_model',
            saved_model_path,
            output_dir
        ], check=True)
        print(f"✅ Model saved to {output_dir}")
    except Exception as e:
        print(f"⚠️  TensorFlow.js conversion failed: {e}")
        print("💡 Install: pip install tensorflowjs")
        # Fallback: save as H5
        model.save(os.path.join(output_dir, 'model.h5'))
        print(f"✅ Saved as H5 format instead")

def save_metadata(scaler, output_dir):
    """Save preprocessing metadata"""
    metadata = {
        'seq_len': SEQ_LEN,
        'feature_dim': FEATURE_DIM,
        'features': SELECTED_FEATURES,
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        'model_type': 'CNN-LSTM',
        'dataset': 'UNSW-NB15'
    }
    
    with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata saved")

def main():
    """Main training pipeline"""
    print("=" * 60)
    print("🧠 CNN-LSTM Training on UNSW-NB15 Dataset")
    print("=" * 60)
    
    # Download dataset
    train_df, test_df = download_dataset()
    
    # Preprocess
    X_train, X_test, y_train, y_test, scaler = preprocess_data(train_df, test_df)
    
    # Create sequences
    X_train_seq, y_train_seq = create_sequences(X_train, y_train, SEQ_LEN)
    X_test_seq, y_test_seq = create_sequences(X_test, y_test, SEQ_LEN)
    
    # Build model
    model = build_cnn_lstm_model(SEQ_LEN, X_train_seq.shape[2])
    
    # Train
    history = train_model(model, X_train_seq, y_train_seq, X_test_seq, y_test_seq)
    
    # Save
    save_model_tfjs(model, MODEL_OUTPUT_DIR)
    save_metadata(scaler, MODEL_OUTPUT_DIR)
    
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print(f"📁 Model saved to: {MODEL_OUTPUT_DIR}")
    print("=" * 60)

if __name__ == '__main__':
    main()
