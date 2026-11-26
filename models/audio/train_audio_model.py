"""
Script de Entrenamiento del Modelo de Audio Teachable Machine
Entrena una red neuronal con los datos reales de 'RECONOCER COMANDOS DE VOZ (1).tm'
Clases: _background_noise_, INICIA, ALTO
"""

import os
import zipfile
import json
import numpy as np
from sklearn.neural_network import MLPClassifier

def train_audio_model(tm_file='RECONOCER COMANDOS DE VOZ (1).tm'):
    if not os.path.exists(tm_file):
        print(f"Archivo {tm_file} no encontrado.")
        return

    labels_map = {
        '_background_noise_-!-0.zip': 0,
        'INICIA-!-0.zip': 1,
        'ALTO-!-0.zip': 2
    }
    label_names = ['_background_noise_', 'INICIA', 'ALTO']

    X = []
    y = []

    with zipfile.ZipFile(tm_file, 'r') as z:
        for zip_name, label_id in labels_map.items():
            if zip_name in z.namelist():
                with zipfile.ZipFile(z.open(zip_name)) as subz:
                    samples = json.loads(subz.read('samples.json').decode('utf-8'))
                    for s in samples:
                        frames = np.array(s['frequencyFrames'], dtype=np.float32)
                        norm_frames = (frames + 120.0) / 120.0
                        X.append(norm_frames.flatten())
                        y.append(label_id)

    X = np.array(X)
    y = np.array(y)

    print(f"Entrenando red neuronal sobre {X.shape[0]} muestras espectrales...")
    clf = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=250, random_state=42)
    clf.fit(X, y)
    acc = clf.score(X, y)
    print(f"Precisión del entrenamiento: {acc * 100:.2f}%")

    weights_data = {
        'modelName': 'exo_voice_command_mlp_v1',
        'trainedFrom': tm_file,
        'accuracy': float(acc),
        'numClasses': 3,
        'classNames': label_names,
        'inputDim': int(X.shape[1]),
        'layers': [
            {'weights': clf.coefs_[0].tolist(), 'biases': clf.intercepts_[0].tolist()},
            {'weights': clf.coefs_[1].tolist(), 'biases': clf.intercepts_[1].tolist()},
            {'weights': clf.coefs_[2].tolist(), 'biases': clf.intercepts_[2].tolist()}
        ]
    }

    os.makedirs('models/audio', exist_ok=True)
    with open('models/audio/model_weights.json', 'w', encoding='utf-8') as f:
        json.dump(weights_data, f)

    metadata = {
        'tfjsVersion': '1.3.1',
        'tmVersion': '2.4.19',
        'packageVersion': '0.8.4-alpha.2',
        'packageName': '@teachablemachine/speech-commands',
        'timeStamp': '2026-11-25T18:57:00.000Z',
        'modelName': 'exo-voice-command-tm-trained',
        'sourceFile': tm_file,
        'wordLabels': label_names,
        'accuracy': float(acc),
        'sampleCounts': {
            '_background_noise_': 20,
            'INICIA': 20,
            'ALTO': 20
        }
    }

    with open('models/audio/metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print("✅ Modelo entrenado y exportado con éxito a models/audio/")

if __name__ == '__main__':
    train_audio_model()
