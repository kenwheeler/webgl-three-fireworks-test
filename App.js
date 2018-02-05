import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebGLView, loadTexture } from 'react-native-webgl';
import THREE from './three';
import { captureRef } from 'react-native-view-shot';

export default class App extends React.Component {
  requestId: *;
  state = {
    captured: false,
    uri: null,
  };
  componentDidMount() {
    setTimeout(() => {
      captureRef(this.refs.viewShot, {
        format: 'png',
        result: 'data-uri',
      }).then(res => {
        console.log(res);
        this.setState({
          captured: true,
          uri: res,
        });
      });
    }, 500);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);
  }
  onContextCreate = async (gl: WebGLRenderingContext) => {
    const rngl = gl.getExtension('RN');

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
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
    renderer.setClearColor(0x000000, 0);

    let camera, scene;
    let cube;

    const init = async () => {
      try {
        camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
        camera.position.y = 150;
        camera.position.z = 500;
        scene = new THREE.Scene();

        let geometry = new THREE.BoxGeometry(200, 200, 200);
        // for (let i = 0; i < geometry.faces.length; i += 2) {
        //   let hex = Math.random() * 0xffffff;
        //   geometry.faces[i].color.setHex(hex);
        //   geometry.faces[i + 1].color.setHex(hex);
        // }

        // let material = new THREE.MeshBasicMaterial({
        //   vertexColors: THREE.FaceColors,
        //   overdraw: 0.5,
        // });

        const loadThreeJSTexture = (gl, src, texture, renderer) => {
          var properties = renderer.properties.get(texture);
          gl
            .getExtension('RN')
            .loadTexture({ yflip: true, image: src })
            .then(({ texture }) => {
              properties.__webglTexture = texture;
              properties.__webglInit = true;
              texture.needsUpdate = true;
            });
        };

        const loadTexture = (gl, src, renderer) => {
          const texture = new THREE.Texture();
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            depthTest: false,
          });
          loadThreeJSTexture(gl, src, texture, renderer);
          return material;
        };

        const material = loadTexture(gl, this.state.uri, renderer);

        cube = new THREE.Mesh(geometry, material);
        cube.position.y = 150;
        scene.add(cube);
        return true;
      } catch (e) {
        alert(e);
        return false;
      }
    };
    const animate = () => {
      this.requestId = requestAnimationFrame(animate);
      renderer.render(scene, camera);

      cube.rotation.y += 0.05;

      gl.flush();
      rngl.endFrame();
    };

    let inited = await init();
    if (inited) {
      animate();
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <View style={{ position: 'absolute', left: '-100%' }}>
          <View ref="viewShot">
            <View
              style={{
                backgroundColor: '#ff005075',
                borderColor: 'black',
                borderWidth: 1,
                height: 200,
                width: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 36, color: 'white' }}>TEXT</Text>
            </View>
          </View>
        </View>
        {this.state.captured === true && (
          <WebGLView
            style={styles.webglView}
            onContextCreate={this.onContextCreate}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webglView: {
    width: 300,
    height: 300,
  },
});
