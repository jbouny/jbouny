﻿/**
 * @author jbouny
 */

var DEMO =
{
	ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,
	ms_Controls : null,
  ms_PlaneGroup : null,
  ms_ProjectedGrid : null,
  ms_LODGrid : null,
  ms_GlobalTime : 0,

	Initialize : function () {

		this.ms_Renderer = new THREE.WebGLRenderer();
		this.ms_Renderer.context.getExtension( 'OES_texture_float' );
		this.ms_Renderer.context.getExtension( 'OES_texture_float_linear' );
		this.ms_Renderer.setClearColor( 0xbbbbbb );
    
    this.ms_Clock = new THREE.Clock();

		document.body.appendChild( this.ms_Renderer.domElement );

		this.ms_Scene = new THREE.Scene();

		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 10000000 );
		this.ms_Camera.position.set( 500, 1100, 2200 );
		this.ms_Camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		this.ms_Scene.add( this.ms_Camera );

		// Initialize Orbit control
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.target.set( 0, 0, 0 );
		this.ms_Controls.maxDistance = 1000000.0;
    
    // General parameters
    this.ms_Animate = true;
    this.ms_Update = true;
    this.ms_Wireframe = false;
    this.ms_MeshType = "LOD";
    
    // LOD parameters
    this.ms_LODGrid = new THREE.LODGridExample( 128, 7, 500 );
    
    // Basic grid parameters
    this.ms_BasicGridResolution = 256;
    this.ms_BasicGridSize = 10000;
    
    // Projected grid parameter
		this.ms_GeometryResolution = 128;

		this.InitGui();

		this.InitializeScene();
    
	},

	InitializeScene : function InitializeScene() {

		// Add light
		this.ms_MainDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		this.ms_MainDirectionalLight.position.set( -0.2, 0.5, 1 );
		this.ms_Scene.add( this.ms_MainDirectionalLight );
    
    // Add axis helper
    var axis = new THREE.AxisHelper(1000);
    this.ms_Scene.add( axis );

		// Initialize ProjectedGridExample
		this.ms_ProjectedGrid = new THREE.ProjectedGridExample( this.ms_Renderer, this.ms_Camera, this.ms_Scene, {
			GEOMETRY_RESOLUTION: this.ms_GeometryResolution
		} );
    
    // Add custom geometry
    this.ChangeMesh();
    
    this.ChangeWireframe();
    this.ChangeAnimateMaterial();
	},

	InitGui : function InitGui() {

		// Initialize UI
		var gui = new dat.GUI();
    
		gui.add( DEMO, 'ms_Wireframe' ).name( 'Wireframe' ).onChange( function() { DEMO.ChangeWireframe(); } );
		gui.add( DEMO, 'ms_Animate' ).name( 'Animate' ).onChange( function() { DEMO.ChangeAnimateMaterial(); } );
		gui.add( DEMO, 'ms_Update' ).name( 'Update animation' );
    gui.add( DEMO, 'ms_MeshType', [ 'Projected grid', 'LOD', 'Plane' ] ).name( 'Mesh' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderLOD = gui.addFolder('LOD');
    folderLOD.add( this.ms_LODGrid.lod, 'lodResolution', 8, 512 ).name( 'Resolution' ).listen().onChange( function() { DEMO.ChangeMesh(); } );
    folderLOD.add( this.ms_LODGrid.lod, 'lodLevels', 1, 15 ).name( 'LOD levels' ).listen().onChange( function() { DEMO.ChangeMesh(); } );
    folderLOD.add( this.ms_LODGrid.lod, 'lodScale', 1, 2000 ).name( 'Scale' ).onChange( function() { DEMO.ms_LODGrid.lod.setLODScale( DEMO.ms_LODGrid.lod.lodScale ); } );
    
    var folderProjected = gui.addFolder('Projected grid');
    folderProjected.add( DEMO, 'ms_GeometryResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderBasic = gui.addFolder('Basic grid');
    folderBasic.add( DEMO, 'ms_BasicGridResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    folderBasic.add( DEMO, 'ms_BasicGridSize', 1000, 100000 ).name( 'Size' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    this.ms_TrianglesLabel = gui.add( { tmp: function() {} }, 'tmp' );
		this.ms_TrianglesLabel.name( 'Nb triangles' );
	},
  
  ApplyOnGroupElements : function ApplyOnGroupElements( expression ) {
  
    if ( this.ms_PlaneGroup !== null ) {
      for ( var i in this.ms_PlaneGroup.children ) {
      
        expression( this.ms_PlaneGroup.children[i] );
        
      }
    }
  
  },
  
  ChangeWireframe : function ChangeWireframe() {
  
    var wireframe = this.ms_Wireframe;
    this.ApplyOnGroupElements( function( element ) {
      element.material.wireframe = wireframe;
    } );
  
  },
  
  ChangeAnimateMaterial : function ChangeAnimateMaterial() {
  
    var animate = this.ms_Animate;
    this.ApplyOnGroupElements( function( element ) {
      element.material.uniforms.u_animate.value = animate;
    } );
  
  },
  
  ChangeMesh : function ChangeMesh() {
  
    if ( this.ms_PlaneGroup !== null ) {
    
      this.ms_PlaneGroup.parent.remove( this.ms_PlaneGroup );
      this.ms_PlaneGroup = null;
      
    }
    
    function optionalParameter(value, defaultValue) {
      return value !== undefined ? value : defaultValue;
    };
    
    var nbTriangles = 0;
  
    switch( this.ms_MeshType ) {
      case 'LOD':
        this.LoadLOD();
        nbTriangles = Math.pow( this.ms_LODGrid.lod.lodResolution + 2, 2 ) * 2 * this.ms_LODGrid.lod.lodLevels;
        break;
        
      case 'Plane':
        this.LoadBasicGrid();
        nbTriangles = this.ms_BasicGridResolution * this.ms_BasicGridResolution * 2.0;
        break;
        
      default:
        this.LoadProjectedMesh();
        nbTriangles = this.ms_GeometryResolution * this.ms_GeometryResolution * 2.0;
        break;
    }
  
		this.ms_TrianglesLabel.name( Math.floor( nbTriangles ) + " triangles" );
  },
  
  LoadProjectedMesh : function LoadProjectedMesh() {
  
    var resolution = Math.round( this.ms_GeometryResolution );
    if ( resolution >= 1 && resolution !== this.ms_LastGeometryResolution ) {
    
      this.ms_LastGeometryResolution = resolution;
      var geometry = new THREE.PlaneBufferGeometry( 1, 1, resolution, resolution );
      this.ms_Camera.remove( this.ms_ProjectedGrid.oceanMesh );
      this.ms_ProjectedGrid.oceanMesh.geometry = geometry;
      
    }
    
    this.ms_PlaneGroup = new THREE.Object3D();
    this.ms_PlaneGroup.add( this.ms_ProjectedGrid.oceanMesh );
    this.ms_Camera.add( this.ms_PlaneGroup );
    
    this.ChangeWireframe();
    this.ChangeAnimateMaterial();
    
  },
  
  LoadLOD : function LoadLOD() {
    
    this.ms_LODGrid.material.wireframe = this.ms_Wireframe;
    this.ms_LODGrid.generate();
    
    this.ms_PlaneGroup = this.ms_LODGrid.lod;
    this.ms_Camera.add( this.ms_PlaneGroup );
    
    this.ChangeAnimateMaterial();
    
  },
  
  LoadBasicGrid : function LoadBasicGrid() {
  
    var geometry = this.ms_LODGrid.lod.generateLODGeometry( this.ms_BasicGridResolution );
    var shader = THREE.ShaderLib['example_main'];
    
    var material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
      vertexShader: shader.buildVertexShader( 'default' ),
      fragmentShader: shader.fragmentShader,
      side: THREE.DoubleSide,
      wireframe: this.ms_Wireframe
    });
    
    var mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set( this.ms_BasicGridSize, this.ms_BasicGridSize, this.ms_BasicGridSize );
    
    this.ms_PlaneGroup = new THREE.Object3D();
    this.ms_PlaneGroup.add( mesh );
    this.ms_Scene.add( this.ms_PlaneGroup );
    
    this.ChangeAnimateMaterial();
  
  },

	Display : function () {

		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );

	},

	Update : function () {
  
    this.ms_GlobalTime += this.ms_Clock.getDelta();

    if ( this.ms_Update ) {
      this.ApplyOnGroupElements( function( element ) {
      
        element.material.uniforms.u_time.value = DEMO.ms_GlobalTime;
        
      } );
    }
    
		this.ms_Controls.update();
		this.Display();

	},

	Resize : function ( inWidth, inHeight ) {

		this.ms_Camera.aspect = inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.Display();

	}
};
