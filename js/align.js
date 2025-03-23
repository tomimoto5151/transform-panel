const align = {
    elements: null,
    
    init() {
        this.elements = utils.getElements([
            "alignLeft", "alignCenterH", "alignRight", 
            "alignTop", "alignCenterV", "alignBottom",
            "flipH", "flipV"
        ]);
        
        this.setupAlignmentHandlers();
    },
    
    setupAlignmentHandlers() {
        const alignHandlers = {
            alignLeft: (layers) => {
                if (layers.length < 2) return;
                
                let leftMostLayer = null;
                let leftMostX = Infinity;
                
                for (const layer of layers) {
                    const left = layer.bounds.left;
                    
                    if (left < leftMostX) {
                        leftMostX = left;
                        leftMostLayer = layer;
                    }
                }
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    if (layer !== leftMostLayer) {
                        const moveX = leftMostX - layer.bounds.left;
                        
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(moveX, 0);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            alignRight: (layers) => {
                if (layers.length < 2) return;
                
                let rightMostLayer = null;
                let rightMostX = -Infinity;
                
                for (const layer of layers) {
                    const right = layer.bounds.left + layer.bounds.width;
                    
                    if (right > rightMostX) {
                        rightMostX = right;
                        rightMostLayer = layer;
                    }
                }
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    if (layer !== rightMostLayer) {
                        const layerRight = layer.bounds.left + layer.bounds.width;
                        const moveX = rightMostX - layerRight;
                        
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(moveX, 0);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            alignTop: (layers) => {
                if (layers.length < 2) return;
                
                let topMostLayer = null;
                let topMostY = Infinity;
                
                for (const layer of layers) {
                    const top = layer.bounds.top;
                    
                    if (top < topMostY) {
                        topMostY = top;
                        topMostLayer = layer;
                    }
                }
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    if (layer !== topMostLayer) {
                        const moveY = topMostY - layer.bounds.top;
                        
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(0, moveY);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            alignBottom: (layers) => {
                if (layers.length < 2) return;
                
                let bottomMostLayer = null;
                let bottomMostY = -Infinity;
                
                for (const layer of layers) {
                    const bottom = layer.bounds.top + layer.bounds.height;
                    
                    if (bottom > bottomMostY) {
                        bottomMostY = bottom;
                        bottomMostLayer = layer;
                    }
                }
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    if (layer !== bottomMostLayer) {
                        const layerBottom = layer.bounds.top + layer.bounds.height;
                        const moveY = bottomMostY - layerBottom;
                        
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(0, moveY);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            alignCenterH: (layers) => {
                if (layers.length < 2) return;
                
                let left = Infinity;
                let right = -Infinity;
                
                for (const layer of layers) {
                    left = Math.min(left, layer.bounds.left);
                    right = Math.max(right, layer.bounds.left + layer.bounds.width);
                }
                
                const center = left + (right - left) / 2;
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    const layerCenter = layer.bounds.left + layer.bounds.width / 2;
                    const moveX = center - layerCenter;
                    
                    if (Math.abs(moveX) > 0.5) {
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(moveX, 0);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            alignCenterV: (layers) => {
                if (layers.length < 2) return;
                
                let top = Infinity;
                let bottom = -Infinity;
                
                for (const layer of layers) {
                    top = Math.min(top, layer.bounds.top);
                    bottom = Math.max(bottom, layer.bounds.top + layer.bounds.height);
                }
                
                const center = top + (bottom - top) / 2;
                
                const originalSelection = [...layers];
                
                for (const layer of layers) {
                    const layerCenter = layer.bounds.top + layer.bounds.height / 2;
                    const moveY = center - layerCenter;
                    
                    if (Math.abs(moveY) > 0.5) {
                        app.activeDocument.activeLayers = [layer];
                        layer.translate(0, moveY);
                    }
                }
                
                app.activeDocument.activeLayers = originalSelection;
            },
            
            flipH: (layers) => {
                try {
                    require("photoshop").action.batchPlay([{
                        _obj: "flip",
                        _target: {
                            _ref: "layer",
                            _enum: "ordinal",
                            _value: "targetEnum"
                        },
                        axis: {
                            _enum: "orientation",
                            _value: "horizontal"
                        }
                    }], {
                        synchronousExecution: true
                    });
                } catch (error) {
                    console.error("Horizontal flip error:", error);
                }
            },
            
            flipV: (layers) => {
                try {
                    require("photoshop").action.batchPlay([{
                        _obj: "flip",
                        _target: {
                            _ref: "layer",
                            _enum: "ordinal",
                            _value: "targetEnum"
                        },
                        axis: {
                            _enum: "orientation",
                            _value: "vertical"
                        }
                    }], {
                        synchronousExecution: true
                    });
                } catch (error) {
                    console.error("Vertical flip error:", error);
                }
            }
        };
        
        for (const [alignType, handler] of Object.entries(alignHandlers)) {
            const button = this.elements[alignType];
            if (button) {
                button.addEventListener("click", () => {
                    const selectedLayers = app?.activeDocument?.activeLayers;
                    if (!selectedLayers || selectedLayers.length === 0) {
                        return;
                    }
                    
                    if (selectedLayers.length === 1 && alignType !== "flipH" && alignType !== "flipV") {
                        return;
                    }
                    
                    utils.executeAsModal(() => {
                        handler(selectedLayers);
                    }, `Align ${alignType}`);
                    
                    selection.updateSelectionInfo();
                });
            } else {
                console.error(`Button not found: ${alignType}`);
            }
        }
    }
};