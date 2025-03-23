const selection = {
    elements: null,
    
    init() {
        this.elements = {
            sizeX: utils.getElement("sizeX"),
            sizeY: utils.getElement("sizeY")
        };
        
        this.updateSelectionInfo();
    },
    
    updateSelectionInfo() {
        if (!selection.elements) return;
        
        try {
            const selectedLayers = app?.activeDocument?.activeLayers;
            
            if (selectedLayers && selectedLayers.length > 0) {
                const bounds = utils.getBoundingBox(selectedLayers);
                
                selection.elements.sizeX.textContent = Math.round(bounds.width) + "px";
                selection.elements.sizeY.textContent = Math.round(bounds.height) + "px";
            } else {
                selection.clearSelectionInfo();
            }
        } catch (e) {
            console.error("Error updating selection info:", e);
            selection.clearSelectionInfo();
        }
    },
    
    clearSelectionInfo() {
        if (!selection.elements) return;
        
        selection.elements.sizeX.textContent = "No selection";
        selection.elements.sizeY.textContent = "No selection";
    }
};