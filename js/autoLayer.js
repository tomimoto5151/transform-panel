const autoLayer = {
    state: {
        autoLayerMode: "Y",
        invertOrder: false
    },
    
    elements: null,
    
    init() {
        this.elements = utils.getElements([
            "tabLayerX", "tabLayerY", "applyAutoLayer", "invertLayerOrder"
        ]);
        
        this.setupAutoLayerTabs();
        this.setupAutoLayerHandlers();
        this.updateButtonStyles();
    },
    
    updateButtonStyles() {
        if (this.elements.applyAutoLayer) {
            this.elements.applyAutoLayer.textContent = "▶";
            this.elements.applyAutoLayer.classList.add("play-button");
        }
    },
    
    setupAutoLayerTabs() {
        const updateAutoLayerTabs = () => {
            this.elements.tabLayerX.classList.remove("active");
            this.elements.tabLayerY.classList.remove("active");
            
            if (this.state.autoLayerMode === "X") {
                this.elements.tabLayerX.classList.add("active");
            } else {
                this.elements.tabLayerY.classList.add("active");
            }
        };
        
        this.elements.tabLayerX.addEventListener("click", () => {
            this.state.autoLayerMode = "X";
            updateAutoLayerTabs();
        });
        
        this.elements.tabLayerY.addEventListener("click", () => {
            this.state.autoLayerMode = "Y";
            updateAutoLayerTabs();
        });
        
        this.elements.invertLayerOrder.addEventListener("click", () => {
            this.state.invertOrder = !this.state.invertOrder;
            
            if (this.state.invertOrder) {
                this.elements.invertLayerOrder.style.backgroundColor = "#5f9eff";
            } else {
                this.elements.invertLayerOrder.style.backgroundColor = "#454545";
            }
        });
        
        updateAutoLayerTabs();
    },
    
    isChildOfSelectedLayer(layer, selectedLayers) {
        if (!layer.parent) return false;
        
        for (const selectedLayer of selectedLayers) {
            if (layer.parent.id === selectedLayer.id) {
                return true;
            }
        }
        
        return false;
    },
    
    getIndependentLayers(layers) {
        const independentLayers = [];
        
        for (const layer of layers) {
            if (!this.isChildOfSelectedLayer(layer, layers)) {
                independentLayers.push(layer);
            }
        }
        
        return independentLayers;
    },
    
    setupAutoLayerHandlers() {
        this.elements.applyAutoLayer.addEventListener("click", () => {
            const selectedLayers = app?.activeDocument?.activeLayers;
            if (!selectedLayers || selectedLayers.length <= 1) {
                return;
            }
            
            const independentLayers = this.getIndependentLayers(selectedLayers);
            
            if (independentLayers.length <= 1) {
                return;
            }
            
            const layersByParent = {};
            
            independentLayers.forEach(layer => {
                const parentId = layer.parent?.id || "root";
                
                if (!layersByParent[parentId]) {
                    layersByParent[parentId] = [];
                }
                
                layersByParent[parentId].push(layer);
            });
            
            utils.executeAsModal(() => {
                for (const parentId in layersByParent) {
                    const layers = layersByParent[parentId];
                    
                    if (this.state.autoLayerMode === "X") {
                        layers.sort((a, b) => a.bounds.left - b.bounds.left);
                    } else {
                        layers.sort((a, b) => a.bounds.top - b.bounds.top);
                    }
                    
                    if (this.state.invertOrder) {
                        layers.reverse();
                    }
                    
                    for (let i = 0; i < layers.length; i++) {
                        const layer = layers[i];
                        const targetIndex = i;
                        
                        if (layer.parent) {
                            const siblings = [...layer.parent.layers];
                            const currentIndex = siblings.findIndex(sibling => sibling.id === layer.id);
                            
                            if (currentIndex !== targetIndex) {
                                try {
                                    if (currentIndex > targetIndex) {
                                        layer.moveAbove(siblings[targetIndex]);
                                    } else {
                                        layer.moveBelow(siblings[targetIndex]);
                                    }
                                } catch (error) {
                                    console.error(`Error moving layer "${layer.name}":`, error);
                                }
                            }
                        } else {
                            const doc = app.activeDocument;
                            const rootLayers = [...doc.layers];
                            const currentIndex = rootLayers.findIndex(root => root.id === layer.id);
                            
                            if (currentIndex !== targetIndex) {
                                try {
                                    if (currentIndex > targetIndex) {
                                        layer.moveAbove(rootLayers[targetIndex]);
                                    } else {
                                        layer.moveBelow(rootLayers[targetIndex]);
                                    }
                                } catch (error) {
                                    console.error(`Error moving root layer "${layer.name}":`, error);
                                }
                            }
                        }
                    }
                }
            }, "Auto Layer");
        });
    }
};