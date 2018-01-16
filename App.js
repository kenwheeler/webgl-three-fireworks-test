import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebGLView } from 'react-native-webgl';
import THREE from './three';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

var Firework = function(scene) {
  this.scene = scene;
  this.done = false;
  this.dest = [];
  this.colors = [];
  this.geometry = null;
  this.points = null;
  this.material = new THREE.PointsMaterial({
    size: 16,
    color: 0xffffff,
    opacity: 1,
    vertexColors: true,
    transparent: true,
    depthTest: false,
  });
  this.launch();
};

// prototype
Firework.prototype = {
  constructor: Firework,

  // reset
  reset: function() {
    this.scene.remove(this.points);
    this.dest = [];
    this.colors = [];
    this.geometry = null;
    this.points = null;
  },

  // launch
  launch: function() {
    var s = screen;
    var x = THREE.Math.randInt(-s.width, s.width);
    var y = THREE.Math.randInt(100, 800);
    var z = THREE.Math.randInt(-1000, -3000);

    var from = new THREE.Vector3(x, -800, z);
    var to = new THREE.Vector3(x, y, z);

    var color = new THREE.Color();
    color.setHSL(THREE.Math.randFloat(0.1, 0.9), 1, 0.9);
    this.colors.push(color);

    this.geometry = new THREE.Geometry();
    this.points = new THREE.Points(this.geometry, this.material);

    this.geometry.colors = this.colors;
    this.geometry.vertices.push(from);
    this.dest.push(to);
    this.colors.push(color);
    this.scene.add(this.points);
  },

  // explode
  explode: function(vector) {
    this.scene.remove(this.points);
    this.dest = [];
    this.colors = [];
    this.geometry = new THREE.Geometry();
    this.points = new THREE.Points(this.geometry, this.material);

    for (var i = 0; i < 80; i++) {
      var color = new THREE.Color();
      color.setHSL(THREE.Math.randFloat(0.1, 0.9), 1, 0.5);
      this.colors.push(color);

      var from = new THREE.Vector3(
        THREE.Math.randInt(vector.x - 10, vector.x + 10),
        THREE.Math.randInt(vector.y - 10, vector.y + 10),
        THREE.Math.randInt(vector.z - 10, vector.z + 10)
      );
      var to = new THREE.Vector3(
        THREE.Math.randInt(vector.x - 1000, vector.x + 1000),
        THREE.Math.randInt(vector.y - 1000, vector.y + 1000),
        THREE.Math.randInt(vector.z - 1000, vector.z + 1000)
      );
      this.geometry.vertices.push(from);
      this.dest.push(to);
    }
    this.geometry.colors = this.colors;
    this.scene.add(this.points);
  },

  // update
  update: function() {
    // only if objects exist
    if (this.points && this.geometry) {
      var total = this.geometry.vertices.length;

      // lerp particle positions
      for (var i = 0; i < total; i++) {
        this.geometry.vertices[i].x +=
          (this.dest[i].x - this.geometry.vertices[i].x) / 20;
        this.geometry.vertices[i].y +=
          (this.dest[i].y - this.geometry.vertices[i].y) / 20;
        this.geometry.vertices[i].z +=
          (this.dest[i].z - this.geometry.vertices[i].z) / 20;
        this.geometry.verticesNeedUpdate = true;
      }
      // watch first particle for explosion
      if (total === 1) {
        if (Math.ceil(this.geometry.vertices[0].y) > this.dest[0].y - 20) {
          this.explode(this.geometry.vertices[0]);
          return;
        }
      }
      // fade out exploded particles
      if (total > 1) {
        this.material.opacity -= 0.015;
        this.material.colorsNeedUpdate = true;
      }
      // remove, reset and stop animating
      if (this.material.opacity <= 0) {
        this.reset();
        this.done = true;
        return;
      }
    }
  },
};

const fireworks = [];
const screen = {};

export default class App extends Component<{}> {
  requestId: *;
  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);
  }
  onContextCreate = (gl: WebGLRenderingContext) => {
    const rngl = gl.getExtension('RN');

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    screen = { width, height };
    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
      },
      context: gl,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0.2);

    let camera, scene;
    let cube;

    function init() {
      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 20000);
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
      scene = new THREE.Scene();
    }
    const animate = () => {
      this.requestId = requestAnimationFrame(animate);

      // add fireworks
      if (THREE.Math.randInt(1, 20) === 10) {
        fireworks.push(new Firework(scene));
      }
      // update fireworks
      for (var i = 0; i < fireworks.length; i++) {
        if (fireworks[i].done) {
          // cleanup
          fireworks.splice(i, 1);
          continue;
        }
        fireworks[i].update();
      }

      renderer.render(scene, camera);
      gl.flush();
      rngl.endFrame();
    };

    init();
    animate();
  };
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <WebGLView
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onContextCreate={this.onContextCreate}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
