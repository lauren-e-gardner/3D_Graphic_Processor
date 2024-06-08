var Filters = Filters || {};

// Helper functions
function uniformMethod(v, neighbors, delta, modified) {
  let scaledDelta = v.position.clone();
  scaledDelta.multiplyScalar((-1)*neighbors.length);
  const original_he = v.halfedge;
  let he = original_he;
  do {
    scaledDelta.add(he.vertex.position);
    he = he.opposite.next;
  } while(he != original_he)
  scaledDelta.multiplyScalar(delta);
  modified.push(scaledDelta);
}

function curvFlowMethod(v, neighbors, delta, modified) {
  let scaledDelta = v.position.clone();
  let totalWeight = 0;
 for (let i = 0; i < neighbors.length; i++) {
      const a1 = v.position.clone().angleTo(neighbors[i].position.clone());
      const a2 = neighbors[i].position.clone().angleTo(v.position.clone());
      const weight = ((1/Math.tan(a2))+(1/Math.tan(a1)))/2
      totalWeight += weight;
    }
  scaledDelta.multiplyScalar((-1)*totalWeight);
  const original_he = v.halfedge;
  let he = original_he;
  do {
    const a1 = v.position.clone().angleTo(he.vertex.position.clone());
    const a2 = he.vertex.position.clone().angleTo(v.position.clone());
      const weight = ((1/Math.tan(a2))+(1/Math.tan(a1)))/2
    scaledDelta.add(he.vertex.position.clone().multiplyScalar(weight));
    he = he.opposite.next;
  } while(he != original_he)
  scaledDelta.multiplyScalar(delta/totalWeight);
  if(scaledDelta == NaN) {
    modified.push(0);
  }
  else {
    modified.push(scaledDelta);
  }

}
// ----------- Helper Function End ------------

Filters.translation = function(mesh, x, y, z) {
  const t = new THREE.Vector3(x, y, z);
  const verts = mesh.getModifiableVertices();
  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; ++i) {
    verts[i].position.add(t);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.rotation = function(mesh, x, y, z) {
  const verts = mesh.getModifiableVertices();
  const rotation = new THREE.Euler(x, y, z, 'XYZ');
  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; i++) {
    verts[i].position.applyEuler(rotation);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.scale = function(mesh, s) {
  const verts = mesh.getModifiableVertices();
  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; i++) {
    verts[i].position.multiplyScalar(s);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.noise = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();
  for (let i = 0; i < verts.length; i++) {
    let random = Math.random()*2 -1;
    let averageEdge = mesh.averageEdgeLength(verts[i]);
    let normal = verts[i].normal;
    normal = normal.multiplyScalar(random*factor*averageEdge);
    verts[i].position = verts[i].position.add(normal);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.smooth = function(mesh, iter, delta, curvFlow, scaleDep, implicit) {
  const verts = mesh.getModifiableVertices();

  for (let i = 0; i < iter; i++) {

    // triangulate mesh if curvFlow smoothing
    if (curvFlow) {
      this.triangulate(mesh);
    }

    // used modified array to avoid altering original points
    let modified = [];
    for (let j = 0; j < verts.length; j++) {
      const neighbors = mesh.verticesOnVertex(verts[j]);
      if (scaleDep) {
        scaleDepMethod(verts[j], neighbors, delta, modified);
      }
      if(!curvFlow) {
        uniformMethod(verts[j], neighbors, delta, modified);
      }
      else {
        curvFlowMethod(verts[j], neighbors, delta, modified);
      }
    }
    for (let l = 0; l < verts.length; l++){
      verts[l].position.add(modified[l]);
    }
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.sharpen = function(mesh, iter, delta) {
  const verts = mesh.getModifiableVertices();
  for (let i = 0; i < iter; i++) {
    let modified = [];

    for (let j = 0; j < verts.length; j++) {
      const neighbors = mesh.verticesOnVertex(verts[j]);
      let scaledDelta = verts[j].position.clone();
      scaledDelta.multiplyScalar((-1)*neighbors.length);
      // loop and add all neighbors
      for (let k = 0; k < neighbors.length; k++) {
        scaledDelta.add(neighbors[k].position);
      }
      scaledDelta.multiplyScalar((-1)*delta);
      modified.push(scaledDelta);
    }
    for (let l = 0; l < verts.length; l++){
      verts[l].position.add(modified[l]);
    }
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.inflate = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();
  const n_vertices = verts.length;
  let changeVerts = [];
  for (let i = 0; i < n_vertices; i++) {
    const normal = verts[i].normal;
    const edgeLength = mesh.averageEdgeLength(verts[i])
    normal.multiplyScalar(factor * edgeLength);
    changeVerts.push(normal);
  }
  for (let i = 0; i < n_vertices; i++) {
    verts[i].position.add(changeVerts[i]);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.twist = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();
  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; i++) {
    const rotation = new THREE.Euler(0, verts[i].position.y*factor, 0, 'XYZ');
    verts[i].position.applyEuler(rotation);
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.wacky = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();
  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; i++) {
    const random = ((Math.random() *2) -1)/2;
    const rotation = new THREE.Euler(verts[i].position.x*factor, verts[i].position.x*factor*random,  verts[i].position.x*factor, 'XYZ');

    verts[i].position.applyEuler(rotation);
    const normal = verts[i].normal.clone();
    verts[i].position.add(normal);
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.triangulate = function(mesh) {
  const faces = mesh.getModifiableFaces();
  for (let f of faces) {
    while (mesh.verticesOnFace(f).length > 3) {
      f = mesh.splitFaceMakeEdge(f, f.halfedge.vertex, f.halfedge.next.next.vertex);
    }
    if (f.selected) {
      f.selected = true;
    }
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for splitEdgeMakeVert in mesh.js
Filters.splitEdge = function(mesh) {
  const verts = mesh.getSelectedVertices();

  if (verts.length === 2) {
    mesh.splitEdgeMakeVert(verts[0], verts[1], 0.5);
  } else {
    console.log("ERROR: to use split edge, select exactly 2 adjacent vertices");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for joinEdgeKillVert in mesh.js
Filters.joinEdges = function(mesh) {
  const verts = mesh.getSelectedVertices();

  if (verts.length === 3) {
    let v0 = verts[0],
      v1 = verts[1],
      v2 = verts[2];

    const he01 = mesh.edgeBetweenVertices(v0, v1);
    const he12 = mesh.edgeBetweenVertices(v1, v2);

    if (he01) {
      if (he12) {
        mesh.joinEdgeKillVert(verts[0], verts[1], verts[2]);
      } else {
        mesh.joinEdgeKillVert(verts[1], verts[0], verts[2]);
      }
    } else {
      if (he12) {
        mesh.joinEdgeKillVert(verts[0], verts[2], verts[1]);
      } else {
        console.log(
          "ERROR: to use join edge, select exactly 3 vertices such that one only has edges to the other two"
        );
      }
    }
  } else {
    console.log("ERROR: to use join edge, select exactly 3 vertices");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for splitFaceMakeEdge in mesh.js
Filters.splitFace = function(mesh) {
  const verts = mesh.getSelectedVertices();
  const faces = mesh.getModifiableFaces();

  if (verts.length === 2 && faces.length === 1) {
    mesh.splitFaceMakeEdge(faces[0], verts[0], verts[1]);
  } else {
    console.log("ERROR: to use split face, select exactly 1 face and 2 nonadjacent vertices on it");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for joinFaceKillEdge in mesh.js
Filters.joinFaces = function(mesh) {
  const verts = mesh.getSelectedVertices();
  const faces = mesh.getModifiableFaces();

  if (verts.length === 2 && faces.length === 2) {
    mesh.joinFaceKillEdge(faces[0], faces[1], verts[0], verts[1]);
  } else {
    console.log(
      "ERROR: to use split face, select exactly 2 adjacent faces the 2 vertices between them"
    );
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.extrude = function(mesh, factor) {
  const faces = mesh.getModifiableFaces();

  const faceNum = faces.length;
  for (let i = 0; i < faceNum; i++) {
    const face_norm = faces[i].normal.clone();
    let new_verts = [];
    let edges = mesh.edgesOnFace(faces[i]);
    // create new vertices
    for (let j = 0; j < edges.length; j++) {
      const v1 = edges[j].vertex;
      const v2 = edges[j].opposite.vertex;
      let newV = mesh.splitEdgeMakeVert(v1, v2, 0);
      new_verts.push(newV);
      mesh.splitFaceMakeEdge(edges[j].opposite.face, v1, v2, newV, true);
    }
    // scale normal by factor and apply that to the new vertices to move them out
    face_norm.multiplyScalar(factor);
    for (let j = 0; j < new_verts.length; j++) {
      new_verts[j].position.add(face_norm);
    }
    // create all new faces
    new_verts.push(new_verts[0]);
    for (let j = 1; j < new_verts.length; j++) {
      const v1 = new_verts[j-1];
      const v2 = new_verts[j];
      const v3 = new_verts[j+1];
      mesh.splitFaceMakeEdge(faces[i],v1, v2, v3);
    }
    for (let j = 0; j < edges.length; j++) {
      mesh.joinFaceKillEdgeSimple(edges[j]);
    }
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.truncate = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();
  const inverseFactor = 1- factor;
  // vertexEdges is a 2d list that holds the edges attached to each vertex
  let vertexEdges = [];
  // edgesVertPos is a 2d list that holds the associated vertex at the end of each edge connected to each vertex
  let edgeVertPos =[];
  // amount of original vertices
  let len = verts.length;
  
  for (let i = 0; i < len; i++) {
    //get the edges attached to each vertex and store in vertexEdges
    vertexEdges.push(mesh.edgesOnVertex(verts[i]))
    edgeVertPos.push([]);
    const vertsOnV = mesh.verticesOnVertex(verts[i]);
    // fill edgeVertPos with the position of each vertex around verts[i] 
    for (let j = 0; j < vertsOnV.length; j++) {
      edgeVertPos[i].push(vertsOnV[j].position.clone());
    }
  }

  for (let i = 0; i < len; i++) {
    for (let j = 1; j < vertexEdges[i].length; j++) {
      const newV = mesh.splitEdgeMakeVert(verts[i], vertexEdges[i][j].vertex, 0);
      newV.position.multiplyScalar(inverseFactor);
      edgeVertPos[i][j].multiplyScalar(factor);
      newV.position.add(edgeVertPos[i][j]);
    }
    //moving last vertex to new location
    verts[i].position.multiplyScalar(inverseFactor);
    edgeVertPos[i][0].multiplyScalar(factor);
    verts[i].position.add(edgeVertPos[i][0]);
    for (let j = 1; j < vertexEdges[i].length - 1; j++) {
      mesh.splitFaceMakeEdge(vertexEdges[i][j+1].face, vertexEdges[i][j].vertex, vertexEdges[i][j+1].vertex);
    }
    for (let j = 1; j < vertexEdges[i].length - 2; j++) {
      mesh.joinFaceKillEdgeSimple(vertexEdges[i][j+1]);
    }
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.splitLong = function(mesh, factor) {
let faces = mesh.getModifiableFaces();
  for (let f of faces) {
    let largestDistance = 0;
    let longestHE;
    let he = f.halfedge;
    let original_he = he;
    do {
      const dist = Math.abs(he.vertex.position.distanceTo(he.opposite.vertex.position));
      if (dist > largestDistance) {
        largestDistance = dist;
        longestHE = he;
      }
    }while (he != original_he);
    const newVert = mesh.splitEdgeMakeVert(longestHE.vertex, longestHE.opposite.vertex);
    mesh.splitFaceMakeEdge(f, longestHE.next.next.vertex, newVert, longestHE.next.next.vertex)
  }
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

Filters.triSubdiv = function(mesh, levels) {
  Filters.triangulate(mesh);

  for (let l = 0; l < levels; l++) {
    const faces = mesh.getModifiableFaces();
    let vertsLen = mesh.vertices.length;

    for (const f of faces) {
      let edges = mesh.edgesOnFace(f);

      // split edges and add new points
      let newPoints = [];
      for (let j = 0; j < edges.length; j++) {
        if (edges[j].vertex.id < vertsLen && edges[j].opposite.vertex.id < vertsLen) {
          mesh.splitEdgeMakeVert(edges[j].vertex, edges[j].opposite.vertex);
        }
      }

      let he = f.halfedge.next;
      let original_he = he;
      // gather new points
      if (f.halfedge.vertex.id < vertsLen) {
        do {
          newPoints.push(he.vertex)
          he = he.next.next;
        } while (original_he.id != he.id)
      }
      let newFace = [];
      newPoints.push(newPoints[0]);
      for (let j = 1; j < newPoints.length; j++ ) {
        newFace.push(mesh.splitFaceMakeEdge(f, newPoints[j-1], newPoints[j]));
      }

      if(faces != mesh.faces) {
        let fIDs = [];
        for(let f of newFace) {
          fIDs.push(f.id);
        }
        mesh.setSelectedFaces(fIDs);
      }
  }
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};


// ================= internal functions =======================

// internal function for selecting faces in the form of a loop
Filters.procFace = function(mesh, f) {
  const faceFlags = new Array(mesh.faces.length);
  for (let i = 0; i < mesh.faces.length; i++) {
    faceFlags[i] = 0;
  }
  let sum = f.area;
  const start_he = f.halfedge.opposite.next;
  let curr_he = start_he;
  do {
    if (faceFlags[curr_he.face.id] > 0) {
      break;
    }
    sum += curr_he.face.area;
    curr_he.face.selected = true;
    faceFlags[curr_he.face.id]++;
    const last_he = curr_he;
    curr_he = curr_he.opposite.next;
    if (curr_he.face == f) {
      curr_he = last_he.next.opposite.next;
    }
  } while (true);
};

Filters.parseSelected = function(sel) {
  if (sel === undefined || sel.replace === undefined) {
    return [];
  }
  if (typeof sel === "number") {
    return [sel];
  }
  // sel = sel.replace(/[\(\)]/g,'');
  sel = sel.split(",");
  const parsedSel = [];
  for (let i = 0; i < sel.length; i++) {
    const idx = parseInt(sel[i]);
    if (!isNaN(idx)) {
      parsedSel.push(idx);
    }
  }
  return parsedSel;
};

// internal filter for updating selection
Filters.selection = function(mesh, vertIdxs, faceIdxs) {
  mesh.setSelectedVertices(Filters.parseSelected(vertIdxs));
  mesh.setSelectedFaces(Filters.parseSelected(faceIdxs));
};

// internal filter for setting display settings
Filters.displaySettings = function(
  mesh,
  showLabels,
  showHalfedge,
  shading,
  showVN,
  showFN,
  showGrid,
  showVertDots,
  showAxes,
  showVC,
  meshColor
) {
  Main.displaySettings.showIdLabels = showLabels;
  Main.displaySettings.wireframe = showHalfedge;
  Main.displaySettings.shading = shading;
  Main.displaySettings.showVN = showVN;
  Main.displaySettings.showFN = showFN;
  Main.displaySettings.showGrid = showGrid;
  Main.displaySettings.showVertDots = showVertDots;

  Main.displaySettings.showAxes = showAxes;
  Main.displaySettings.showVC = showVC;
};
