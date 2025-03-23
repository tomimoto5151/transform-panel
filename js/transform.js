const transform = {
    state: {
        valueLocks: {
            position: false,
            rotation: false,
            scale: false,
            dimensions: false
        },
        aspectRatioLocked: false,
        currentAspectRatio: 1
    },
    
    elements: null,
    
    init: function() {
        this.elements = utils.getElements([
            "posX", "posY", "rotation", "scaleX", "scaleY", "scaleBoth",
            "dimX", "dimY", "aspectRatioLock", 
            "applyPosition", "applyRotation", "applyScale", "applyDimensions",
            "lockPosition", "lockRotation", "lockScale", "lockDimensions",
            "refreshPosition", "refreshRotation", "refreshScale", "refreshDimensions"
        ]);
        
        this.updateButtonStyles();
        
        this.setupPositionHandlers();
        this.setupRotationHandlers();
        this.setupScaleHandlers();
        this.setupDimensionHandlers();
        this.setupLockHandlers();
        this.setupAspectRatioLock();
        this.setupRefreshHandlers();
    },
    
    updateButtonStyles: function() {
        const applyButtons = [
            this.elements.applyPosition,
            this.elements.applyRotation,
            this.elements.applyScale,
            this.elements.applyDimensions
        ];
        
        applyButtons.forEach(button => {
            if (button) {
                button.textContent = "▶";
                button.classList.add("play-button");
            }
        });
    },
    
    setupRefreshHandlers: function() {
        const refreshPairs = [
            { button: "refreshPosition", fields: ["posX", "posY"] },
            { button: "refreshRotation", fields: ["rotation"] },
            { button: "refreshScale", fields: ["scaleX", "scaleY", "scaleBoth"] },
            { button: "refreshDimensions", fields: ["dimX", "dimY"] }
        ];
        
        refreshPairs.forEach(pair => {
            const refreshButton = this.elements[pair.button];
            if (refreshButton) {
                refreshButton.addEventListener("click", () => {
                    pair.fields.forEach(fieldId => {
                        const field = this.elements[fieldId];
                        if (field) {
                            field.value = "";
                            if (fieldId === "dimX" || fieldId === "dimY") {
                                field.disabled = false;
                            }
                        }
                    });
                });
            }
        });
    },
    
    toggleLockState: function(lockType) {
        this.state.valueLocks[lockType] = !this.state.valueLocks[lockType];
        
        const lockButton = this.elements[`lock${lockType.charAt(0).toUpperCase() + lockType.slice(1)}`];
        if (lockButton) {
            if (this.state.valueLocks[lockType]) {
                lockButton.style.backgroundColor = "#ff5f5f";
            } else {
                lockButton.style.backgroundColor = "#454545";
            }
        }
    },
    
    setupLockHandlers: function() {
        const lockTypes = ["Position", "Rotation", "Scale", "Dimensions"];
        
        lockTypes.forEach(type => {
            const lockButton = this.elements[`lock${type}`];
            if (lockButton) {
                const lockTypeKey = type.toLowerCase();
                
                lockButton.addEventListener("click", () => {
                    this.toggleLockState(lockTypeKey);
                });
            }
        });
    },
    
    setupAspectRatioLock: function() {
        if (this.elements.aspectRatioLock) {
            this.elements.aspectRatioLock.addEventListener("click", () => {
                this.toggleAspectRatioLock();
            });
            
            this.elements.dimX.addEventListener("input", () => {
                if (this.state.aspectRatioLocked && this.elements.dimX.value) {
                    const newX = parseFloat(this.elements.dimX.value);
                    if (!isNaN(newX)) {
                        const newY = newX / this.state.currentAspectRatio;
                        this.elements.dimY.value = "-";
                        this.elements.dimY.disabled = true;
                    }
                } else {
                    this.elements.dimY.disabled = false;
                }
            });
            
            this.elements.dimY.addEventListener("input", () => {
                if (this.state.aspectRatioLocked && this.elements.dimY.value) {
                    const newY = parseFloat(this.elements.dimY.value);
                    if (!isNaN(newY)) {
                        const newX = newY * this.state.currentAspectRatio;
                        this.elements.dimX.value = "-";
                        this.elements.dimX.disabled = true;
                    }
                } else {
                    this.elements.dimX.disabled = false;
                }
            });
            
            const updateAspectRatio = () => {
                const selectedLayers = app?.activeDocument?.activeLayers;
                if (selectedLayers && selectedLayers.length > 0) {
                    const bounds = utils.getBoundingBox(selectedLayers);
                    this.state.currentAspectRatio = bounds.width / bounds.height;
                } else {
                    this.state.currentAspectRatio = 1;
                }
            };
            
            updateAspectRatio();
            
            if (app.documents.length > 0) {
                const originalCallback = app.activeDocument.activeLayers.onActiveLayers;
                app.activeDocument.activeLayers.onActiveLayers = () => {
                    updateAspectRatio();
                    if (originalCallback) originalCallback();
                };
            }
        }
    },
    
    toggleAspectRatioLock: function() {
        this.state.aspectRatioLocked = !this.state.aspectRatioLocked;
        
        if (this.elements.aspectRatioLock) {
            if (this.state.aspectRatioLocked) {
                this.elements.aspectRatioLock.style.backgroundColor = "#5f9eff";
                
                if (this.elements.dimX.value) {
                    this.elements.dimY.value = "-";
                    this.elements.dimY.disabled = true;
                } else if (this.elements.dimY.value) {
                    this.elements.dimX.value = "-";
                    this.elements.dimX.disabled = true;
                }
            } else {
                this.elements.aspectRatioLock.style.backgroundColor = "#454545";
                
                this.elements.dimX.disabled = false;
                this.elements.dimY.disabled = false;
                
                if (this.elements.dimX.value === "-") this.elements.dimX.value = "";
                if (this.elements.dimY.value === "-") this.elements.dimY.value = "";
            }
        }
    },
    
    setupPositionHandlers: function() {
        this.elements.applyPosition.addEventListener("click", () => {
            const selectedLayers = app?.activeDocument?.activeLayers;
            if (!selectedLayers || selectedLayers.length === 0) return;
            
            const x = parseFloat(this.elements.posX.value) || 0;
            const y = parseFloat(this.elements.posY.value) || 0;
            
            utils.executeAsModal(() => {
                const originalSelection = [...selectedLayers];
                
                const layer = selectedLayers[0];
                layer.translate(x, y);
                
                app.activeDocument.activeLayers = originalSelection;
            }, "Move Selection");
            
            selection.updateSelectionInfo();
            
            if (!this.state.valueLocks.position) {
                this.elements.posX.value = "";
                this.elements.posY.value = "";
            }
        });
    },
    
    setupRotationHandlers: function() {
        this.elements.applyRotation.addEventListener("click", () => {
            const selectedLayers = app?.activeDocument?.activeLayers;
            if (!selectedLayers || selectedLayers.length === 0) return;
            
            const angle = parseFloat(this.elements.rotation.value) || 0;
            
            utils.executeAsModal(async () => {
                try {
                    const originalSelection = [...selectedLayers];
                    
                    const rotationAngle = -angle;
                    
                    const layer = selectedLayers[0];
                    await layer.rotate(rotationAngle);
                    
                    app.activeDocument.activeLayers = originalSelection;
                } catch (error) {
                    console.error("Rotation error:", error);
                }
            }, "Rotate Selection");
            
            selection.updateSelectionInfo();
            
            if (!this.state.valueLocks.rotation) {
                this.elements.rotation.value = "";
            }
        });
    },
    
    setupScaleHandlers: function() {
        this.elements.applyScale.addEventListener("click", () => {
            const selectedLayers = app?.activeDocument?.activeLayers;
            if (!selectedLayers || selectedLayers.length === 0) return;
            
            const hasScaleX = this.elements.scaleX.value.trim() !== '';
            const hasScaleY = this.elements.scaleY.value.trim() !== '';
            const hasScaleBoth = this.elements.scaleBoth.value.trim() !== '';
            
            if (!hasScaleX && !hasScaleY && !hasScaleBoth) {
                return;
            }
            
            let scaleX = hasScaleX ? parseFloat(this.elements.scaleX.value) : 1;
            let scaleY = hasScaleY ? parseFloat(this.elements.scaleY.value) : 1;
            
            if (hasScaleBoth) {
                const bothValue = parseFloat(this.elements.scaleBoth.value);
                if (!isNaN(bothValue)) {
                    scaleX = bothValue;
                    scaleY = bothValue;
                }
            }
            
            if (isNaN(scaleX)) scaleX = 1;
            if (isNaN(scaleY)) scaleY = 1;
            
            const adjustedScaleX = hasScaleX || hasScaleBoth ? scaleX : 1;
            const adjustedScaleY = hasScaleY || hasScaleBoth ? scaleY : 1;
            
            utils.executeAsModal(async () => {
                try {
                    const originalSelection = [...selectedLayers];
                    
                    await core.executeAsModal(async () => {
                        try {
                            await require("photoshop").action.batchPlay([{
                                _obj: "transform",
                                freeTransformCenterState: {
                                    _enum: "quadCenterState",
                                    _value: "QCSAverage"
                                },
                                interfaceIconFrameDimmed: {
                                    _enum: "interpolationType",
                                    _value: "bicubicAutomatic"
                                },
                                width: {
                                    _unit: "percentUnit",
                                    _value: adjustedScaleX * 100
                                },
                                height: {
                                    _unit: "percentUnit",
                                    _value: adjustedScaleY * 100
                                }
                            }], {
                                synchronousExecution: true
                            });
                        } catch (batchError) {
                            console.error("BatchPlay error:", batchError);
                        }
                    }, {
                        commandName: "Scale Layer"
                    });
                    
                    app.activeDocument.activeLayers = originalSelection;
                } catch (error) {
                    console.error("Transform error:", error);
                }
            }, "Scale Selection");
            
            if (!this.state.valueLocks.scale) {
                this.elements.scaleX.value = "";
                this.elements.scaleY.value = "";
                this.elements.scaleBoth.value = "";
            }
            
            selection.updateSelectionInfo();
        });
    },
    
    setupDimensionHandlers: function() {
        this.elements.applyDimensions.addEventListener("click", () => {
            const selectedLayers = app?.activeDocument?.activeLayers;
            if (!selectedLayers || selectedLayers.length === 0) return;
            
            const hasDimX = this.elements.dimX.value.trim() !== '' && this.elements.dimX.value !== '-';
            const hasDimY = this.elements.dimY.value.trim() !== '' && this.elements.dimY.value !== '-';
            
            if (!hasDimX && !hasDimY) {
                return;
            }
            
            let dimX = hasDimX ? parseFloat(this.elements.dimX.value) : null;
            let dimY = hasDimY ? parseFloat(this.elements.dimY.value) : null;
            
            if ((hasDimX && isNaN(dimX)) || (hasDimY && isNaN(dimY))) {
                return;
            }
            
            utils.executeAsModal(async () => {
                try {
                    const bounds = utils.getBoundingBox(selectedLayers);
                    const originalWidth = bounds.width;
                    const originalHeight = bounds.height;
                    
                    let scaleX = 1;
                    let scaleY = 1;
                    
                    if (this.state.aspectRatioLocked) {
                        if (hasDimX) {
                            scaleX = dimX / originalWidth;
                            scaleY = scaleX;
                        } else if (hasDimY) {
                            scaleY = dimY / originalHeight;
                            scaleX = scaleY;
                        }
                    } else {
                        scaleX = hasDimX && dimX !== null ? dimX / originalWidth : 1;
                        scaleY = hasDimY && dimY !== null ? dimY / originalHeight : 1;
                    }
                    
                    const originalSelection = [...selectedLayers];
                    
                    await core.executeAsModal(async () => {
                        try {
                            await require("photoshop").action.batchPlay([{
                                _obj: "transform",
                                freeTransformCenterState: {
                                    _enum: "quadCenterState",
                                    _value: "QCSAverage"
                                },
                                interfaceIconFrameDimmed: {
                                    _enum: "interpolationType",
                                    _value: "bicubicAutomatic"
                                },
                                width: {
                                    _unit: "percentUnit",
                                    _value: scaleX * 100
                                },
                                height: {
                                    _unit: "percentUnit",
                                    _value: scaleY * 100
                                }
                            }], {
                                synchronousExecution: true
                            });
                        } catch (error) {
                            console.error("BatchPlay error:", error);
                        }
                    }, {
                        commandName: "Resize Layer"
                    });
                    
                    app.activeDocument.activeLayers = originalSelection;
                } catch (error) {
                    console.error("Error resizing selection:", error);
                }
            }, "Resize Selection");
            
            if (!this.state.valueLocks.dimensions) {
                this.elements.dimX.value = "";
                this.elements.dimY.value = "";
                this.elements.dimX.disabled = false;
                this.elements.dimY.disabled = false;
            }
            
            selection.updateSelectionInfo();
        });
    }
};