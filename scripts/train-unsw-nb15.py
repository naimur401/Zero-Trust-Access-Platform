#!/usr/bin/env python3
"""
CNN-LSTM Model Training and Testing on UNSW-NB15 Dataset
Trains on training set and evaluates on testing set
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
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

SELECTED_FEATURES = [
    'proto', 'state', 'dur', 'sbytes', 'dbytes', 'sttl', 'dttl',
    'sload', 'dload', 'spkts', 'dpkts', 'swin', 'dwin', 'tcprtt', 'synack', 'ackdat'
]

def download_dataset():
    """Download UNSW-NB15 dataset"""
    print("=" * 70)
    print("📥 Downloading UNSW-NB15 Dataset")
    print("=" * 70)
    
    try:
        print("\n⏳ Downloading training set...")
        train_df = pd.read_csv(UNSW_TRAIN_URL)
        print(f"✅ Training set: {train_df.shape[0]} samples, {train_df.shape[1]} features")
        
        print("\n⏳ Downloading testing set...")
        test_df = pd.read_csv(UNSW_TEST_URL)
        print(f"✅ Testing set: {test_df.shape[0]} samples, {test_df.shape[1]} features")
        
        return train_df, test_df
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("💡 Download manually from: https://www.unsw.adfa.edu.au/")
        sys.exit(1)

def preprocess_data(train_df, test_df):
    """Preprocess UNSW-NB15 data"""
    print("\n" + "=" * 70)
    print("🔧 Preprocessing Data")
    print("=" * 70)
    
    available_features = [f for f in SELECTED_FEATURES if f in train_df.columns]
    print(f"\n✅ Using {len(available_features)} features:")
    print(f"   {available_features}")
    
    X_train = train_df[available_features].copy()
    X_test = test_df[available_features].copy()
    
    y_train = train_df['attack'].values if 'attack' in train_df.columns else train_df['label'].values
    y_test = test_df['attack'].values if 'attack' in test_df.columns else test_df['label'].values
    
    print(f"\n📊 Original shapes:")
    print(f"   X_train: {X_train.shape}")
    print(f"   X_test: {X_test.shape}")
    
    X_train = X_train.fillna(0)
    X_test = X_test.fillna(0)
    
    categorical_cols = X_train.select_dtypes(include=['object']).columns
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        X_train[col] = le.fit_transform(X_train[col].astype(str))
        X_test[col] = le.transform(X_test[col].astype(str))
        label_encoders[col] = le
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"\n📈 Label distribution:")
    print(f"   Training - Normal: {np.sum(y_train == 0)}, Attack: {np.sum(y_train == 1)}")
    print(f"   Testing - Normal: {np.sum(y_test == 0)}, Attack: {np.sum(y_test == 1)}")
    
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
    print("\n" + "=" * 70)
    print("🏗️  Building CNN-LSTM Model")
    print("=" * 70)
    
    model = Sequential([
        layers.Conv1D(64, kernel_size=3, activation='relu', input_shape=(seq_len, feature_dim)),
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
    
    print("\n📋 Model Architecture:")
    model.summary()
    return model

def train_model(model, X_train, y_train, X_test, y_test):
    """Train the model"""
    print("\n" + "=" * 70)
    print("🚀 Training Model")
    print("=" * 70)
    
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
    
    return history

def evaluate_model(model, X_test, y_test):
    """Evaluate model on test set"""
    print("\n" + "=" * 70)
    print("📈 Evaluating on Test Set (UNSW-NB15 Testing Dataset)")
    print("=" * 70)
    
    test_loss, test_acc, test_auc = model.evaluate(X_test, y_test, verbose=0)
    
    print(f"\n✅ Test Loss: {test_loss:.4f}")
    print(f"✅ Test Accuracy: {test_acc:.4f}")
    print(f"✅ Test AUC: {test_auc:.4f}")
    
    y_pred = model.predict(X_test, verbose=0)
    y_pred_binary = (y_pred > 0.5).astype(int).flatten()
    
    from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
    
    precision = precision_score(y_test, y_pred_binary)
    recall = recall_score(y_test, y_pred_binary)
    f1 = f1_score(y_test, y_pred_binary)
    cm = confusion_matrix(y_test, y_pred_binary)
    
    print(f"\n📊 Additional Metrics:")
    print(f"✅ Precision: {precision:.4f}")
    print(f"✅ Recall: {recall:.4f}")
    print(f"✅ F1-Score: {f1:.4f}")
    print(f"\n📋 Confusion Matrix:")
    print(f"   True Negatives: {cm[0,0]}")
    print(f"   False Positives: {cm[0,1]}")
    print(f"   False Negatives: {cm[1,0]}")
    print(f"   True Positives: {cm[1,1]}")
    
    return {
        'loss': test_loss,
        'accuracy': test_acc,
        'auc': test_auc,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

def save_model(model, output_dir):
    """Save model"""
    print(f"\n💾 Saving model to {output_dir}...")
    
    os.makedirs(output_dir, exist_ok=True)
    model.save(os.path.join(output_dir, 'model.h5'))
    print(f"✅ Model saved as H5")

def save_metadata(scaler, metrics, output_dir):
    """Save preprocessing metadata"""
    metadata = {
        'seq_len': SEQ_LEN,
        'feature_dim': FEATURE_DIM,
        'features': SELECTED_FEATURES,
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        'model_type': 'CNN-LSTM',
        'dataset': 'UNSW-NB15',
        'test_metrics': {
            'accuracy': float(metrics['accuracy']),
            'auc': float(metrics['auc']),
            'precision': float(metrics['precision']),
            'recall': float(metrics['recall']),
            'f1': float(metrics['f1']),
            'loss': float(metrics['loss'])
        },
        'status': 'Trained'
    }
    
    with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata saved")

def main():
    """Main training pipeline"""
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + "  🧠 CNN-LSTM Training on UNSW-NB15 Dataset".center(68) + "║")
    print("║" + "  Training Set + Testing Set Evaluation".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "=" * 68 + "╝")
    
    train_df, test_df = download_dataset()
    X_train, X_test, y_train, y_test, scaler = preprocess_data(train_df, test_df)
    X_train_seq, y_train_seq = create_sequences(X_train, y_train, SEQ_LEN)
    X_test_seq, y_test_seq = create_sequences(X_test, y_test, SEQ_LEN)
    
    model = build_cnn_lstm_model(SEQ_LEN, X_train_seq.shape[2])
    history = train_model(model, X_train_seq, y_train_seq, X_test_seq, y_test_seq)
    metrics = evaluate_model(model, X_test_seq, y_test_seq)
    
    save_model(model, MODEL_OUTPUT_DIR)
    save_metadata(scaler, metrics, MODEL_OUTPUT_DIR)
    
    print("\n" + "=" * 70)
    print("✅ Training and Testing Complete!")
    print(f"📁 Model saved to: {MODEL_OUTPUT_DIR}")
    print("=" * 70)

if __name__ == '__main__':
    main()
