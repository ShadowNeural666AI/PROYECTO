/**
 * ========================================================
 * ENTRENAMIENTO DE RED NEURONAL CONVERGENTE PARA IMÁGENES
 * Entrenado sobre CLASIFICACION_DE_OBJETOS.tm
 * Genera model.json y weights.bin compatibles con TensorFlow.js
 * ========================================================
 */

const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

async function trainImageModel() {
  console.log('🚀 Iniciando entrenamiento de red neuronal con TensorFlow.js...');
  
  const infoPath = path.join(__dirname, 'dataset/image/dataset_info.json');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  const { numSamples, numClasses, classes, inputShape } = info;
  
  console.log(`📊 Parámetros: ${numSamples} muestras, ${numClasses} clases, tamaño: [${inputShape.join(', ')}]`);
  
  // Leer binarios
  const xBuffer = fs.readFileSync(path.join(__dirname, 'dataset/image/X.bin'));
  const yBuffer = fs.readFileSync(path.join(__dirname, 'dataset/image/y.bin'));
  
  const xFloat = new Float32Array(xBuffer.buffer, xBuffer.byteOffset, xBuffer.byteLength / 4);
  const yFloat = new Float32Array(yBuffer.buffer, yBuffer.byteOffset, yBuffer.byteLength / 4);
  
  const xTensor = tf.tensor4d(xFloat, [numSamples, 224, 224, 3], 'float32');
  const yTensor = tf.tensor2d(yFloat, [numSamples, numClasses], 'float32');
  
  console.log('🧠 Construyendo arquitectura de red neuronal convolucional (CNN)...');
  const model = tf.sequential();
  
  // Bloque Convolucional 1
  model.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    filters: 16,
    kernelSize: 3,
    strides: 2,
    padding: 'same',
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
  
  // Bloque Convolucional 2
  model.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    strides: 2,
    padding: 'same',
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
  
  // Bloque Convolucional 3
  model.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    strides: 2,
    padding: 'same',
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
  
  // Aplanado y Capas Densas
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.15 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  console.log('⚡ Entrenando durante 40 épocas...');
  const history = await model.fit(xTensor, yTensor, {
    epochs: 40,
    batchSize: 16,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0 || epoch === 39) {
          const accPct = (logs.acc * 100).toFixed(1);
          console.log(`  Época ${epoch + 1}/40: Pérdida = ${logs.loss.toFixed(4)}, Precisión = ${accPct}%`);
        }
      }
    }
  });
  
  const finalAcc = history.history.acc[history.history.acc.length - 1];
  console.log(`🎉 Entrenamiento completado con éxito. Precisión final: ${(finalAcc * 100).toFixed(1)}%`);
  
  // Guardar modelo en models/image
  const outDir = path.join(__dirname, 'models/image');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  console.log('💾 Guardando modelo en models/image/...');
  await model.save(`file://${outDir}`);
  
  // Generar metadata.json oficial compatible con Teachable Machine
  const metadata = {
    tfjsVersion: tf.version.tfjs,
    tmVersion: "2.4.19",
    packageVersion: "0.8.5",
    packageName: "@teachablemachine/image",
    timeStamp: new Date().toISOString(),
    modelName: "exo-insight-tm-image-trained",
    sourceProject: "CLASIFICACION_DE_OBJETOS.tm",
    labels: classes,
    imageSize: 224,
    trainingAccuracy: parseFloat((finalAcc * 100).toFixed(1)),
    totalSamples: numSamples,
    numClasses: numClasses
  };
  
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
  console.log('✅ Archivos guardados: model.json, weights.bin, metadata.json');
  
  // Liberar memoria de tensores
  xTensor.dispose();
  yTensor.dispose();
  model.dispose();
}

trainImageModel().catch(err => {
  console.error('❌ Error en el entrenamiento:', err);
  process.exit(1);
});
