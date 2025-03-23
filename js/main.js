let app, core;

const utils = {
    getElement(id) {
        return document.getElementById(id);
    },
    
    getElements(ids) {
        const elements = {};
        ids.forEach(id => {
            elements[id] = this.getElement(id);
        });
        return elements;
    },
    
    getBoundingBox(layers) {
        if (layers.length === 0) return null;
        
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        
        layers.forEach(layer => {
            const bounds = layer.bounds;
            
            left = Math.min(left, bounds.left);
            top = Math.min(top, bounds.top);
            right = Math.max(right, bounds.right);
            bottom = Math.max(bottom, bounds.bottom);
        });
        
        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom,
            width: right - left,
            height: bottom - top,
            centerX: left + (right - left) / 2,
            centerY: top + (bottom - top) / 2
        };
    },
    
    executeAsModal(callback, commandName) {
        return core.executeAsModal(async () => {
            await callback();
        }, { commandName });
    },
    
    init() {
        try {
            const photoshop = require("photoshop");
            app = photoshop.app;
            core = photoshop.core;
            
            if (typeof selection !== 'undefined') selection.init();
            if (typeof transform !== 'undefined') transform.init();
            if (typeof align !== 'undefined') align.init();
            if (typeof autoLayer !== 'undefined') autoLayer.init();
            
            if (app.documents.length > 0) {
                app.activeDocument.activeLayers.onActiveLayers = selection.updateSelectionInfo;
            }
            
            setInterval(() => {
                if (app.documents.length === 0) {
                    selection.clearSelectionInfo();
                } else {
                    selection.updateSelectionInfo();
                }
            }, 1000);
            
        } catch (error) {
            console.error("Initialization error:", error);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => utils.init());