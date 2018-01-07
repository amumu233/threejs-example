
var scene, camera, renderer;
var mouseX = 0, mouseY = 0;
var particles = [];

function init(){
    camera = new THREE.PerspectiveCamera(80,window.innerWidth/window.innerHeight,1,4000);
    camera.position.z = 1000;
    scene = new THREE.Scene();
    scene.add(camera);
    console.log(window.innerWidth,window.innerHeight);
    renderer = new THREE.CanvasRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('#container').appendChild(renderer.domElement);
    document.addEventListener('mousemove', onMousemove,false);
    window.addEventListener('resize', onResize);
}

function makeParticles(){
    var particle, material;
    for(var zpos = -1000; zpos < 1000; zpos += 20){
        material = new THREE.SpriteCanvasMaterial({
            color: 0xffffff * Math.random(),
            program: particleRender
        });
        particle = new THREE.Sprite(material);
        particle.position.x = Math.random() * 1000 - 500;
        particle.position.y = Math.random() * 1000 - 500;
        particle.position.z = zpos;
        particle.scale.x = particle.scale.y = 10;
        particles.push(particle);
        scene.add(particle);
    }
}

function onMousemove(e){
    mouseX = e.pageX;
    mouseY = e.pageY;
}
function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function particleRender(cxt){
    cxt.beginPath();
    for( var i = 0 ; i < 5 ; i ++){
        cxt.lineTo(Math.cos((18+72*i)/180*Math.PI) * 1,- Math.sin((18+72*i )/180*Math.PI) * 1);
        cxt.lineTo(Math.cos((54+72*i)/180*Math.PI) * .7,- Math.sin((54+72*i )/180*Math.PI) * .7);
    };
    cxt.closePath();
    cxt.fill();
}

init();
makeParticles();
function animate(){
    if(mouseY < 100) {
        mouseY = 100;
    }
    for(var i = 0 ; i< particles.length; i++){
        particles[i].position.z += mouseY * 0.05;
        if(particles[i].position.z > 1000){
            particles[i].position.z = -1000;
        }
    }
    render();
    requestAnimationFrame(animate);
}
function render(){
    renderer.render(scene, camera);
};
animate();