package com.example.controlstock

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.controlstock.ui.theme.ControlStockTheme
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import java.util.concurrent.Executors

// 1. Modelo de datos para el producto (Ajustado a campos comunes, cámbialos si la API devuelve otros nombres)
data class Product(
    val id: Int? = null,
    val name: String? = null,
    val sku: String? = null,
    val price: Double? = null,
    val stock: Int? = null,
    val description: String? = null
)

// 2. Interfaz de la API (Retrofit) - Actualizada con tu nueva URL
interface ApiService {
    @GET("products/sku/{sku}")
    suspend fun getProduct(@Path("sku") sku: String): Product
}

// 3. Cliente Retrofit - Configurado con https://sgm.mabcontrol.ar/api/
object RetrofitClient {
    private const val BASE_URL = "https://sgm.mabcontrol.ar/api/"

    val instance: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ControlStockTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BarcodeScannerScreen()
                }
            }
        }
    }
}

@Composable
fun BarcodeScannerScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted -> hasCameraPermission = granted }
    )

    LaunchedEffect(Unit) {
        launcher.launch(Manifest.permission.CAMERA)
    }

    var scannedBarcode by remember { mutableStateOf("") }
    var productInfo by remember { mutableStateOf<Product?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }

    // Función para consultar la API
    fun fetchProduct(barcode: String) {
        if (barcode == scannedBarcode && (productInfo != null || errorMessage.isNotEmpty())) return 
        scannedBarcode = barcode
        
        scope.launch {
            isLoading = true
            errorMessage = ""
            try {
                productInfo = RetrofitClient.instance.getProduct(barcode)
                if (productInfo?.name == null) {
                    errorMessage = "Producto no encontrado en la base de datos"
                }
            } catch (e: Exception) {
                Log.e("API_ERROR", "Error buscando producto: ${e.message}", e)
                errorMessage = "Error de conexión o SKU no válido"
                productInfo = null
            } finally {
                isLoading = false
            }
        }
    }

    if (hasCameraPermission) {
        Column(modifier = Modifier.fillMaxSize()) {
            Box(modifier = Modifier.weight(1f)) {
                CameraPreview(onBarcodeScanned = { barcode ->
                    fetchProduct(barcode)
                })
            }

            // Panel de información del producto
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.secondaryContainer,
                tonalElevation = 8.dp
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "SKU Escaneado: $scannedBarcode", style = MaterialTheme.typography.labelMedium)
                    
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.padding(top = 8.dp))
                    } else if (errorMessage.isNotEmpty()) {
                        Text(text = errorMessage, color = Color.Red, modifier = Modifier.padding(top = 8.dp))
                    } else if (productInfo != null) {
                        Text(
                            text = productInfo!!.name ?: "Sin nombre", 
                            style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        productInfo!!.price?.let {
                            Text(text = "Precio: $${it}", style = MaterialTheme.typography.bodyLarge)
                        }
                        productInfo!!.stock?.let {
                            Text(text = "Stock: ${it}", style = MaterialTheme.typography.bodyLarge)
                        }
                        productInfo!!.description?.let {
                            Text(text = it, style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                        }
                    } else {
                        Text(text = "Apunta la cámara a un código de barras", modifier = Modifier.padding(top = 8.dp))
                    }
                }
            }
        }
    } else {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text = "Se requiere permiso de cámara")
        }
    }
}

@Composable
fun CameraPreview(onBarcodeScanned: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    val scanner = remember { BarcodeScanning.getClient() }

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            }

            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                imageAnalysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                    processImageProxy(scanner, imageProxy, onBarcodeScanned)
                }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    Log.e("CameraPreview", "Fallo al vincular cámara", e)
                }
            }, ContextCompat.getMainExecutor(ctx))

            previewView
        },
        modifier = Modifier.fillMaxSize()
    )
}

@OptIn(ExperimentalGetImage::class)
private fun processImageProxy(
    scanner: BarcodeScanner,
    imageProxy: ImageProxy,
    onBarcodeScanned: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    barcode.rawValue?.let { onBarcodeScanned(it) }
                }
            }
            .addOnCompleteListener { imageProxy.close() }
    } else {
        imageProxy.close()
    }
}
