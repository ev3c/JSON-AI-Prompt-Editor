class JSONEditor {
  constructor() {
    this.currentData = this.getDefaultData();
    this.currentFilename = '';
    this.init();
  }

  getDefaultData() {
    return {
      header: {
        title: "AI prompt assistant",
        currentUrlPlaceholder: "Página actual"
      },
      addButtonText: "Añadir",
      jsonPath: "C:/Users/[usuario]/AppData/Local/Google/Chrome/User Data/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/idioma/",
      sections: []
    };
  }

  init() {
    this.bindEvents();
    this.loadDefaultFile();
    // Inicializar el editor embebido
    this.initEmbeddedEditor();
    // Inicializar el campo Title con valor por defecto
    this.initializeButtonNameField();
  }

  async loadDefaultFile() {
    try {
      const fileUrl = chrome.runtime.getURL('jsonEditor/menu_data_ADD_ES.json');
      const response = await fetch(fileUrl);
      const jsonData = await response.json();
      
      this.currentData = jsonData;
      this.currentFilename = 'menu_data_ADD_ES.json';
      
      // Actualizar el campo Title con el header.title del archivo JSON
      this.updateTitleFieldFromJSON();
      
      this.updateFilenameDisplay();
      this.updateJsonPreview();
      this.enableSave();
      
      console.log('Archivo por defecto cargado exitosamente');
    } catch (error) {
      console.warn('No se pudo cargar el archivo por defecto:', error);
      // Si falla, usar datos por defecto
      this.updateJsonPreview();
    }
  }

  bindEvents() {
    // File operations
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => this.loadFile(e));
    document.getElementById('load-default-btn').addEventListener('click', () => this.loadDefaultFile());
    document.getElementById('save-btn').addEventListener('click', () => this.saveFile());
    
    // Button name field
    document.getElementById('add-button-text').addEventListener('input', (e) => this.updateAddButtonText(e.target.value));
    
    // Copy path button
    document.getElementById('copy-path-btn').addEventListener('click', () => {
      const path = this.currentData.jsonPath || 'C:/Users/[usuario]/AppData/Local/Google/Chrome/User Data/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/idioma/';
      navigator.clipboard.writeText(path).then(() => {
        alert('Ruta copiada al portapapeles:\n\n\n' + path);
      }, () => {
        alert('No se pudo copiar la ruta al portapapeles.');
      });
    });



    // Embedded editor controls
    document.getElementById('validate-json-btn').addEventListener('click', () => {
      this.validateEmbeddedJSON();
    });



    document.getElementById('copy-json-btn').addEventListener('click', () => {
      this.copyEmbeddedJSON();
    });



  }

  loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Intentar capturar la ruta del archivo (limitado por seguridad del navegador)
    this.currentFilePath = null;
    
    // Intentar diferentes métodos para obtener la ruta
    if (file.webkitRelativePath && file.webkitRelativePath !== file.name) {
      this.currentFilePath = file.webkitRelativePath;
    } else if (file.path) {
      this.currentFilePath = file.path;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.currentData = JSON.parse(e.target.result);
        this.currentFilename = file.name;
        
        // Extraer jsonPath y jsonName del archivo abierto
        let jsonPath = '';
        let jsonName = file.name;
        
        if (this.currentFilePath && (this.currentFilePath.includes('/') || this.currentFilePath.includes('\\'))) {
          // Separar la ruta del nombre del archivo
          const pathSeparator = this.currentFilePath.includes('/') ? '/' : '\\';
          const pathParts = this.currentFilePath.split(pathSeparator);
          jsonName = pathParts.pop(); // Último elemento es el nombre del archivo
          jsonPath = pathParts.join(pathSeparator) + pathSeparator; // Resto es la ruta
        }
        
        // Actualizar jsonPath y jsonName en los datos solo si tenemos información válida
        if (jsonPath) {
          this.currentData.jsonPath = jsonPath;
        }
        this.currentData.jsonName = jsonName;
        
        // Actualizar el campo Title con el header.title del archivo JSON
        this.updateTitleFieldFromJSON();
        
        this.updateFilenameDisplay();
        this.updateJsonPreview();
        this.enableSave();
        
      } catch (error) {
        alert('Error al cargar el archivo JSON: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  updateTitleFieldFromJSON() {
    // Extraer el título del header del JSON cargado
    if (this.currentData && this.currentData.header && this.currentData.header.title) {
      const titleFromJSON = this.currentData.header.title;
      const buttonNameInput = document.getElementById('add-button-text');
      
      if (buttonNameInput) {
        buttonNameInput.value = titleFromJSON;
        // También actualizar el addButtonText en los datos
        this.currentData.addButtonText = titleFromJSON;
      }
    }
  }

  spritFileName() {
    // Obtener el contenido del campo Title
    const buttonNameInput = document.getElementById('add-button-text');
    const fileButtonName = buttonNameInput ? buttonNameInput.value.trim() : '';
    
    // Definir las partes del nombre del archivo
    const fileName = "menu_data_";
    const fileLanguage = "ES"
    const fileExtension = ".json";
    
    // Construir el nombre completo del archivo
    const fullFileName = fileName + fileButtonName + '_' + fileLanguage + fileExtension;
    
    return {
      fileName: fileName,
      fileButtonName: fileButtonName,
      fileLanguage: fileLanguage,
      fileExtension: fileExtension,
      fullFileName: fullFileName
    };
  }

  saveFile() {
    const jsonString = JSON.stringify(this.currentData, null, 2);
    const fileNameParts = this.spritFileName();
    // Siempre usar el formato dinámico basado en el título
    const filename = fileNameParts.fullFileName;
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mostrar mensaje con la ruta sugerida
    alert('Guarda el archivo ' + filename + ' en:\n\nC:/Users/[usuario]/AppData/Local/Google/Chrome/User Data/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/idioma/ \n\n Con el siguiente formato de nombre: \n Nombre de archivo = menu_data_[buttonName]_XX.json \n Donde XX es el idioma del archivo');
  }

  updateFilenameDisplay() {
    const display = document.getElementById('filename-display');
    const fileNameParts = this.spritFileName();
    
    // Siempre mostrar el nombre dinámico formado por fileName + buttonName + idiomaAI
    if (this.currentFilename === 'menu_data_ADD_ES.json') {
      display.innerHTML = `📋 <strong>Archivo:</strong> ${fileNameParts.fullFileName}`;
      display.style.color = '#28a745';
      display.style.fontWeight = 'normal';
    } else if (this.currentFilename) {
      display.innerHTML = `📄 <strong>Archivo:</strong> ${fileNameParts.fullFileName}`;
      display.style.color = '#007bff';
      display.style.fontWeight = 'normal';
    } else {
      display.innerHTML = `📝 <strong>Archivo:</strong> ${fileNameParts.fullFileName}`;
      display.style.color = '#17a2b8';
      display.style.fontWeight = 'normal';
    }
  }

  enableSave() {
    document.getElementById('save-btn').disabled = false;
  }

  updateJsonPreview() {
    // Actualizar el editor embebido
    const embeddedEditor = document.getElementById('embedded-json-editor');
    if (embeddedEditor) {
      embeddedEditor.value = JSON.stringify(this.currentData, null, 2);
    }
  }

  updateAddButtonText(value) {
    this.currentData.addButtonText = value;
    
    // Si el campo no está vacío, actualizar el título del header
    if (value && value.trim() !== '') {
      this.currentData.header.title = value.trim();
    }
    
    // Actualizar la visualización del nombre del archivo dinámicamente
    this.updateFilenameDisplay();
    
    this.updateJsonPreview();
    this.enableSave();
  }

  initEmbeddedEditor() {
    // Cargar contenido inicial
    const jsonEditor = document.getElementById('embedded-json-editor');
    if (jsonEditor) {
      jsonEditor.value = JSON.stringify(this.currentData, null, 2);
    }
  }

  initializeButtonNameField() {
    const buttonNameInput = document.getElementById('add-button-text');
    if (buttonNameInput && buttonNameInput.value) {
      // Actualizar los datos con el valor por defecto del campo
      this.updateAddButtonText(buttonNameInput.value);
    }
  }

  validateEmbeddedJSON() {
    const jsonEditor = document.getElementById('embedded-json-editor');
    
    try {
      const content = jsonEditor.value.trim();
      
      if (!content) {
        alert('⚠️ Validación JSON\n\nEl editor está vacío. Por favor, ingresa contenido JSON para validar.');
        return false;
      }
      
      // Intentar parsear el JSON
      const parsed = JSON.parse(content);
      
      // Validaciones adicionales específicas para el formato esperado
      let validationInfo = '✅ JSON válido\n\n';
      validationInfo += 'La sintaxis del archivo es correcta.\n\n';
      
      // Información adicional sobre la estructura
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        validationInfo += `📊 Información del archivo:\n`;
        validationInfo += `• Propiedades principales: ${keys.length}\n`;
        
        if (parsed.sections && Array.isArray(parsed.sections)) {
          validationInfo += `• Secciones encontradas: ${parsed.sections.length}\n`;
        }
        
        if (parsed.addButtonText) {
          validationInfo += `• Texto del botón: "${parsed.addButtonText}"\n`;
        }
        
        if (parsed.header && parsed.header.title) {
          validationInfo += `• Título: "${parsed.header.title}"`;
        }
      }
      
      alert(validationInfo);
      return true;
      
    } catch (e) {
      // El JSON tiene errores de sintaxis
      let errorMessage = '❌ JSON inválido\n\n';
      errorMessage += 'Error de sintaxis encontrado:\n';
      errorMessage += `"${e.message}"\n\n`;
      
      // Intentar extraer información de posición del error
      const match = e.message.match(/position (\d+)/i);
      if (match) {
        const position = parseInt(match[1]);
        const lines = jsonEditor.value.substring(0, position).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;
        errorMessage += `📍 Ubicación aproximada: Línea ${lineNumber}, Columna ${columnNumber}\n\n`;
      }
      
      // Consejos para corregir errores comunes
      errorMessage += '💡 Consejos para corregir:\n';
      if (e.message.includes('Unexpected token')) {
        errorMessage += '• Revisa caracteres inesperados o mal colocados\n';
        errorMessage += '• Verifica que las comillas sean dobles (")\n';
      } else if (e.message.includes('Unexpected end')) {
        errorMessage += '• Falta cerrar llaves } o corchetes ]\n';
        errorMessage += '• Verifica que la estructura esté completa\n';
      } else {
        errorMessage += '• Usa comillas dobles (") para strings\n';
        errorMessage += '• Separa elementos con comas\n';
        errorMessage += '• Balancea llaves {} y corchetes []\n';
        errorMessage += '• No uses comas finales\n';
      }
      
      alert(errorMessage);
      return false;
    }
  }

  copyEmbeddedJSON() {
    const jsonEditor = document.getElementById('embedded-json-editor');
    const content = jsonEditor.value;
    
    navigator.clipboard.writeText(content).then(() => {
      alert('📋 Copiado al portapapeles');
    }).catch(() => {
      alert('No se pudo copiar al portapapeles.');
    });
  }
}

// Initialize the editor when the DOM is loaded
let jsonEditor;
document.addEventListener('DOMContentLoaded', function() {
 jsonEditor = new JSONEditor();
});