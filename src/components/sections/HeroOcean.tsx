import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

export function HeroOcean() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const isMobile = container.clientWidth < 768

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.6
    renderer.setClearColor(0x1a3a5c, 1) // Ocean blue fallback
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()

    // Camera - wider FOV and centered on mobile
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 70 : 55,
      container.clientWidth / container.clientHeight,
      1,
      20000
    )
    camera.position.set(0, 30, 100)

    // Sun
    const sun = new THREE.Vector3()

    // Water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000)
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        '/textures/waternormals.jpg',
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x006994,
      distortionScale: 3.0,
      fog: scene.fog !== undefined,
    })
    water.rotation.x = -Math.PI / 2
    scene.add(water)

    // Sky
    const sky = new Sky()
    sky.scale.setScalar(10000)
    scene.add(sky)

    const skyUniforms = sky.material.uniforms
    skyUniforms['turbidity'].value = 5
    skyUniforms['rayleigh'].value = 2
    skyUniforms['mieCoefficient'].value = 0.005
    skyUniforms['mieDirectionalG'].value = 0.8

    const parameters = {
      elevation: 6,
      azimuth: 180,
    }

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const sceneEnv = new THREE.Scene()
    let renderTarget: THREE.WebGLRenderTarget | undefined

    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation)
      const theta = THREE.MathUtils.degToRad(parameters.azimuth)

      sun.setFromSphericalCoords(1, phi, theta)

      sky.material.uniforms['sunPosition'].value.copy(sun)
      water.material.uniforms['sunDirection'].value.copy(sun).normalize()

      if (renderTarget !== undefined) renderTarget.dispose()

      sceneEnv.add(sky)
      renderTarget = pmremGenerator.fromScene(sceneEnv)
      scene.add(sky)

      scene.environment = renderTarget.texture
    }

    updateSun()

    // Camera looks at horizon (y=0) so sun is centered vertically
    camera.lookAt(0, 0, -100)

    // Animation with visibility optimization
    let animationId: number
    let isVisible = true

    function animate() {
      animationId = requestAnimationFrame(animate)
      if (!isVisible) return // Skip rendering when not visible
      water.material.uniforms['time'].value += 1.0 / 60.0
      renderer.render(scene, camera)
    }

    // Pause animation when tab is hidden
    function handleVisibilityChange() {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    animate()

    // Resize handler
    function onWindowResize() {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('resize', onWindowResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onWindowResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}
