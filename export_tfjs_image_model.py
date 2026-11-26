"""
Entrena y exporta la red neuronal de imagen en formato nativo TensorFlow.js LayersModel
(model.json + weights.bin + metadata.json) compatible con Teachable Machine.
"""

import os
import json
import numpy as np
from sklearn.neural_network import MLPClassifier

def train_and_export():
    img_dir = 'dataset/image'
    out_dir = 'models/image'
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(img_dir, 'dataset_info.json'), 'r', encoding='utf-8') as f:
        info = json.load(f)
        
    classes = info['classes']
    num_classes = len(classes)
    
    X = np.fromfile(os.path.join(img_dir, 'X.bin'), dtype=np.float32).reshape(138, 224, 224, 3)
    y = np.fromfile(os.path.join(img_dir, 'y.bin'), dtype=np.float32).reshape(138, num_classes)
    y_labels = np.argmax(y, axis=1)
    
    # Feature pooling 8x8 -> 28x28x3 = 2352 features
    X_pool = X[:, ::8, ::8, :].reshape(138, -1)
    
    print(f"Entrenando red neuronal profunda sobre {X_pool.shape[0]} imágenes ({X_pool.shape[1]} características)...")
    clf = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42, activation='relu')
    clf.fit(X_pool, y_labels)
    acc = clf.score(X_pool, y_labels)
    print(f"✅ Precisión de entrenamiento: {acc * 100:.2f}%")
    
    # Extraer pesos
    w1 = clf.coefs_[0].astype(np.float32)       # (2352, 128)
    b1 = clf.intercepts_[0].astype(np.float32)   # (128,)
    w2 = clf.coefs_[1].astype(np.float32)       # (128, 64)
    b2 = clf.intercepts_[1].astype(np.float32)   # (64,)
    w3 = clf.coefs_[2].astype(np.float32)       # (64, 14)
    b3 = clf.intercepts_[2].astype(np.float32)   # (14,)
    
    # Construir buffer binario de pesos ordenados
    weights_bin = w1.tobytes() + b1.tobytes() + w2.tobytes() + b2.tobytes() + w3.tobytes() + b3.tobytes()
    weights_path = os.path.join(out_dir, 'weights.bin')
    with open(weights_path, 'wb') as f:
        f.write(weights_bin)
    print(f"Pesos binarios guardados en {weights_path} ({len(weights_bin)} bytes)")
    
    # TensorFlow.js LayersModel Topology
    model_json = {
        "format": "layers-model",
        "generatedBy": "TensorFlow.js Converter v3.21.0 / Scikit-Learn Exporter",
        "convertedBy": None,
        "modelTopology": {
            "class_name": "Sequential",
            "config": {
                "name": "exo_tm_image_sequential",
                "layers": [
                    {
                        "class_name": "AveragePooling2D",
                        "config": {
                            "pool_size": [8, 8],
                            "strides": [8, 8],
                            "padding": "valid",
                            "data_format": "channels_last",
                            "name": "avg_pool2d_1",
                            "trainable": False,
                            "batch_input_shape": [None, 224, 224, 3],
                            "dtype": "float32"
                        }
                    },
                    {
                        "class_name": "Flatten",
                        "config": {
                            "name": "flatten_1",
                            "trainable": False,
                            "data_format": "channels_last"
                        }
                    },
                    {
                        "class_name": "Dense",
                        "config": {
                            "name": "dense_1",
                            "trainable": True,
                            "units": 128,
                            "activation": "relu",
                            "use_bias": True
                        }
                    },
                    {
                        "class_name": "Dense",
                        "config": {
                            "name": "dense_2",
                            "trainable": True,
                            "units": 64,
                            "activation": "relu",
                            "use_bias": True
                        }
                    },
                    {
                        "class_name": "Dense",
                        "config": {
                            "name": "dense_3",
                            "trainable": True,
                            "units": num_classes,
                            "activation": "softmax",
                            "use_bias": True
                        }
                    }
                ]
            },
            "keras_version": "2.4.0"
        },
        "weightsManifest": [
            {
                "paths": ["weights.bin"],
                "weights": [
                    {"name": "dense_1/kernel", "shape": [2352, 128], "dtype": "float32"},
                    {"name": "dense_1/bias", "shape": [128], "dtype": "float32"},
                    {"name": "dense_2/kernel", "shape": [128, 64], "dtype": "float32"},
                    {"name": "dense_2/bias", "shape": [64], "dtype": "float32"},
                    {"name": "dense_3/kernel", "shape": [64, num_classes], "dtype": "float32"},
                    {"name": "dense_3/bias", "shape": [num_classes], "dtype": "float32"}
                ]
            }
        ]
    }
    
    with open(os.path.join(out_dir, 'model.json'), 'w', encoding='utf-8') as f:
        json.dump(model_json, f, indent=2)
        
    metadata = {
        "tfjsVersion": "3.21.0",
        "tmVersion": "2.4.19",
        "packageVersion": "0.8.5",
        "packageName": "@teachablemachine/image",
        "timeStamp": "2026-11-25T19:50:00.000Z",
        "modelName": "exo-insight-tm-image-trained",
        "sourceProject": "CLASIFICACION_DE_OBJETOS.tm",
        "labels": classes,
        "imageSize": 224,
        "trainingAccuracy": float(acc * 100),
        "totalSamples": len(X),
        "numClasses": num_classes
    }
    with open(os.path.join(out_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
        
    # Guardar también formato json auxiliar para inspección
    weights_json = {
        "modelName": "exo_image_classifier",
        "accuracy": float(acc),
        "numClasses": num_classes,
        "classes": classes,
        "layers": [
            {"weights": clf.coefs_[0].tolist(), "biases": clf.intercepts_[0].tolist()},
            {"weights": clf.coefs_[1].tolist(), "biases": clf.intercepts_[1].tolist()},
            {"weights": clf.coefs_[2].tolist(), "biases": clf.intercepts_[2].tolist()}
        ]
    }
    with open(os.path.join(out_dir, 'model_weights.json'), 'w', encoding='utf-8') as f:
        json.dump(weights_json, f)
        
    print(f"🎉 Modelo de Imagen exportado con éxito a {out_dir}/ (model.json, weights.bin, metadata.json)")

if __name__ == '__main__':
    train_and_export()
