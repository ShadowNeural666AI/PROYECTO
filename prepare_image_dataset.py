"""
Prepara los datos de imagen de CLASIFICACION_DE_OBJETOS.tm
Genera tensores normalizados para el entrenamiento en TensorFlow.js
"""
import os
import glob
from PIL import Image
import numpy as np
import json

def prepare_dataset():
    img_dir = 'dataset/image'
    manifest_path = os.path.join(img_dir, 'dataset_manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    classes = manifest['classes']
    class_to_idx = {c: i for i, c in enumerate(classes)}
    
    all_files = glob.glob(os.path.join(img_dir, '*.jpg'))
    print(f"Total imágenes encontradas: {len(all_files)}")
    
    X = []
    y = []
    
    for fpath in all_files:
        basename = os.path.basename(fpath)
        cls_name = basename.split('-!-')[0]
        if cls_name not in class_to_idx:
            continue
        
        img = Image.open(fpath).convert('RGB').resize((224, 224))
        arr = np.array(img, dtype=np.float32)
        # Normalización Teachable Machine: (pixel / 127.5) - 1.0 -> rango [-1, 1]
        norm_arr = (arr / 127.5) - 1.0
        X.append(norm_arr)
        y.append(class_to_idx[cls_name])
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)
    
    print(f"Dataset X shape: {X.shape}, dtype: {X.dtype}")
    print(f"Dataset y shape: {y.shape}, dtype: {y.dtype}")
    
    # One-hot encoding para labels
    num_classes = len(classes)
    y_one_hot = np.zeros((len(y), num_classes), dtype=np.float32)
    for i, val in enumerate(y):
        y_one_hot[i, val] = 1.0
    
    # Guardar en binario para lectura ultrarrápida en Node.js / tfjs
    X.tofile(os.path.join(img_dir, 'X.bin'))
    y_one_hot.tofile(os.path.join(img_dir, 'y.bin'))
    
    with open(os.path.join(img_dir, 'dataset_info.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'numSamples': len(X),
            'numClasses': num_classes,
            'classes': classes,
            'inputShape': [224, 224, 3]
        }, f, indent=2)
    
    print("✅ Tensores de dataset guardados con éxito en dataset/image/")

if __name__ == '__main__':
    prepare_dataset()
