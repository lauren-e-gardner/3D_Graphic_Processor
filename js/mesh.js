// In this file you will implement traversal and analysis for your assignment.
// Make sure to familiarize yourself with the utility functions in meshUtils.js
// they might be useful for the second part of your assignment!

////////////////////////////////////////////////////////////////////////////////
// Traversal
////////////////////////////////////////////////////////////////////////////////

// Return all vertices on face f
Mesh.prototype.verticesOnFace = function(f) {
  const vertices = [];
  let he = f.halfedge;
  const first = he;
  while (true) {
    vertices.push(he.vertex);
    he = he.next;
    if (he === first) {
      break;
    }
  }
  return vertices;
};

// Return all halfedges on face f
Mesh.prototype.edgesOnFace = function(f) {
  const halfedges = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  let he = f.halfedge;
  const origHE = he;
  do {
    halfedges.push(he);
    he = he.next;
  } while (he != origHE);
  // ----------- STUDENT CODE END ------------
  return halfedges;
};

// Return all faces adjacent to input face, not
// including input face.
Mesh.prototype.facesOnFace = function(f) {
  const faces = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  let he = f.halfedge;
  const origHE = he;
  do {
    faces.push(he.opposite.face);
    he = he.next;
  } while (he != origHE);
  // ----------- STUDENT CODE END ------------

  return faces;
};

// Return one-ring neighbors of input vertex, not
// including the input vertex itself
Mesh.prototype.verticesOnVertex = function(v) {
  const vertices = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
    const firstHE = v.halfedge;
    he = firstHE;
    do {
      vertices.push(he.vertex);
      he = he.opposite.next;
    } while (he != firstHE)
  
  // ----------- STUDENT CODE END ------------

  return vertices;
};

// Return all halfedges that point away from v
Mesh.prototype.edgesOnVertex = function(v) {
  const halfedges = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  const firstHE = v.halfedge;
  he = firstHE;
  do {
    halfedges.push(he);
    he = he.opposite.next;
  } while (he != firstHE)
  // ----------- STUDENT CODE END ------------

  return halfedges;
};

// Return all faces that include v as a vertex.
Mesh.prototype.facesOnVertex = function(v) {
  const faces = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  const firstHE = v.halfedge;
  he = firstHE;
  do {
    if (he == undefined) {
      break;
    }
    faces.push(he.face);
    he = he.opposite.next;
  } while (he != firstHE)
  // ----------- STUDENT CODE END ------------

  return faces;
};

// Return the vertices that form the endpoints of a given edge
Mesh.prototype.verticesOnEdge = function(e) {
  const vertices = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 2 lines of code.
  vertices.push(e.vertex);
  vertices.push(e.opposite.vertex);
  // ----------- STUDENT CODE END ------------

  return vertices;
};

// Return the faces that include a given edge
Mesh.prototype.facesOnEdge = function(e) {
  const faces = [];
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 2 lines of code.
  faces.push(e.face);
  faces.push(e.opposite.face);
  // ----------- STUDENT CODE END ------------
  return faces;
};

// Return the edge pointing from v1 to v2
Mesh.prototype.edgeBetweenVertices = function(v1, v2) {
  let out_he = undefined;
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 11 lines of code.
  const firstHE = v1.halfedge;
  he = firstHE;
  do {
    if (he.vertex == v2) {
        out_he = he;
        break;
    }
    he = he.opposite.next;
  } while (he != firstHE)

  // ----------- STUDENT CODE END ------------
  return out_he;
};

////////////////////////////////////////////////////////////////////////////////
// Analysis
////////////////////////////////////////////////////////////////////////////////

// Return the surface area of a provided face f.
Mesh.prototype.calculateFaceArea = function(f) {
  let area = 0.0;
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 21 lines of code.
  const vertices = this.verticesOnFace(f);
  for (let i = 0; i < vertices.length - 2; i++) {
    area += new THREE.Triangle(vertices[i].position, vertices[i+1].position, vertices[i+2].position).getArea();
    // let cross = new THREE.Vector3();
    // let vert1 = vertices[i];
    // let vert2 = vertices[i+1];
    // cross = cross.crossVectors(vert1.position, vert2.position);
    // const angle = vert1.position.angleTo(vert2.position);
    // const areaVect = cross.multiplyScalar(Math.sin(angle)).multiplyScalar(0.5)
    // area += Math.sqrt(areaVect.x**2 + areaVect.y**2 + areaVect.z**2);
  }
  // ----------- STUDENT CODE END ------------
  f.area = area;
  //console.log("Id: ", f.id);
  //console.log(area);
  return area;
};

// Update the area attributes of all faces in the mesh
Mesh.prototype.calculateFacesArea = function() {
  for (let i = 0; i < this.faces.length; ++i) {
    this.calculateFaceArea(this.faces[i]);
  }
};

// Calculate the vertex normal at a given vertex,
// using the face normals of bordering faces, weighted by face area
Mesh.prototype.calculateVertexNormal = function(v) {
  const v_normal = new THREE.Vector3(0, 0, 0);
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 11 lines of code.
  fs = this.facesOnVertex(v);
  v_normal.set(0,0,0);
  for (let f of fs) {
    let norm = f.normal.clone();
    v_normal.add(norm.multiplyScalar(f.area));
  }
  //v_normal = v_normal.multiplyScalar(1/3);
  //v_normal.normalize();
  //console.log("Normal: ", v_normal);
  // ----------- STUDENT CODE END ------------
  v.normal = v_normal.normalize();
 //console.log(v_normal);
  return v_normal;
};

// update the vertex normals of every vertex in the mesh
Mesh.prototype.updateVertexNormals = function() {
  for (let i = 0; i < this.vertices.length; ++i) {
    this.calculateVertexNormal(this.vertices[i]);
  }
};

// compute the average length of edges touching v
Mesh.prototype.averageEdgeLength = function(v) {
  let avg = 0.0;

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  let vertices = this.verticesOnVertex(v);
  for(var i = 0 ; i < vertices.length; i++ ) {
    avg += vertices[i].position.distanceTo(v.position);
  }
  avg /= i;
  // ----------- STUDENT CODE END ------------

  return avg;
};

////////////////////////////////////////////////////////////////////////////////
// Topology
////////////////////////////////////////////////////////////////////////////////

// Given a face in the shape of an arbitrary polygon,
// split that face so it consists only of several triangular faces. 
Mesh.prototype.triangulateFace = function(f) {
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 8 lines of code.
  // ----------- STUDENT CODE END ------------
};
