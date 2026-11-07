import {ReadSketch} from 'cad/sketch/sketchReader';
import {MFace} from 'cad/model/mface';
import {SketchingView} from 'cad/scene/views/faceView';
import Vector from 'math/vector';
import CSys from 'math/csys';
import * as THREE from 'three';

// Test-only exports of actual reader/model/view implementations. No substitute
// viewer, solver, storage or math implementation is installed.
window.readerFidelity = {ReadSketch, MFace, SketchingView, Vector, CSys, THREE};
