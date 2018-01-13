var Game = function(){
    this.config ={
        isMobile: false,
        background: 0x282828,
        ground: -1, // 地面y坐标
        fallingSpeed: 0.2, // 失败掉落速度
        cubeColor: 0xbebebe, // 方块颜色
        cubeWidth: 4,
        cubeHeight: 2,
        cubeDeep: 4,
        jumperColor: 0x232323,
        jumperWidth: 1,
        jumperHeight: 2,
        jumperDeep: 1
    };
    this.score = 0;
    this.size = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    this.scene = new THREE.Scene();
    this.cameraPos = {
        current: new THREE.Vector3(0,0,0),
        next: new THREE.Vector3()
    };
    this.camera =  new THREE.OrthographicCamera(this.size.width/-80,this.size.width/80,this.size.height/80,this.size.height/-80,0,5000);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.cubes = [];
    this.cubeStat = {
        nextDir: ''
    };
    this.jumperStat = {
        ready: false,
        xSpeed: 0,
        ySpeed: 0
    };
    this.falledStat = {
        location: -1,
        distance: 0
    }
    this.fallingStat = {
        speed: 0.2,
        end: false
    }
}

Game.prototype = {
    init: function(){
        this._checkUserAgent();
        this._setCamera();
        this._setRenderer();
        this._setLight();
        this._createCube();
        this._createCube();
        this._createJumper();
        this._createHelper();
        this._updateCamera();
        
        var _this = this;
        var mouseEvents = this.config.isMobile ? 
        {
            down: 'touchstart',
            up: 'touchend'
        }
        :
        {
            down: 'mousedown',
            up: 'mouseup'
        };
        var canvas = document.querySelector('canvas');
        canvas.addEventListener(mouseEvents.down, function(e){
            e.preventDefault();
            _this._handleMouseDown()
        });
        canvas.addEventListener(mouseEvents.up, function(r){
            r.preventDefault();
            _this._handleMouseUp();
        });
        window.addEventListener('resize',function(){
            _this._handleWindowResize();
        })
    },
    // restart
    restart: function(){
        this.score = 0
        this.cameraPos = {
          current: new THREE.Vector3(0, 0, 0),
          next: new THREE.Vector3()
        }
        this.fallingStat = {
          speed: 0.2,
          end: false
        }
        var length = this.cubes.length
        for(var i=0; i < length; i++){
          this.scene.remove(this.cubes.pop())
        }
        this.scene.remove(this.jumper)
        this.successCallback(this.score)
        this._createCube()
        this._createCube()
        this._createJumper()
        this._updateCamera()
    },
    // add success failure
    addSuccessFn: function(fn){
        this.successCallback = fn;
    },
    addFailedFn: function(fn){
        this.failedCallback = fn;
    },
    // three 辅助网格
    _createHelper: function(){
        var axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
        var gridHelper = new THREE.GridHelper(1000,1000);
        this.scene.add(gridHelper);
    },
    // 检测 isMobile
    _checkUserAgent: function(){
        var n = navigator.userAgent;
        if(n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i)){
            this.config.isMobile = true;
        }
    },
    // 设置 相机位置
    _setCamera: function(){
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(this.cameraPos.current);
    },
    // 设置渲染器 参数
    _setRenderer: function(){
        this.renderer.setSize(this.size.width, this.size.height);
        this.renderer.setClearColor(this.config.background);
        document.body.appendChild(this.renderer.domElement);
    },
    // 设置灯光
    _setLight: function(){
        var directionalLight = new THREE.DirectionalLight( 0xffffff, 1,1);
        directionalLight.position.set(3, 10, 5);
        this.scene.add(directionalLight);

        var light = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(light);
    },
    // 新增一个方块
    _createCube: function(){
        var material = new THREE.MeshLambertMaterial({
            color: this.config.cubeColor
        });
        var geometry = new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep);
        var mesh = new THREE.Mesh(geometry, material);
        if(this.cubes.length){
            var random = Math.random();
            this.cubeStat.nextDir = random > 0.5 ? 'left':'right';
            mesh.position.x = this.cubes[this.cubes.length-1].position.x;
            mesh.position.y = this.cubes[this.cubes.length-1].position.y;
            mesh.position.z = this.cubes[this.cubes.length-1].position.z;
            if(this.cubeStat.nextDir === 'left'){
                mesh.position.x = this.cubes[this.cubes.length-1].position.x - 4*Math.random() -6;
            } else {
                mesh.position.z = this.cubes[this.cubes.length-1].position.z - 4*Math.random() -6;
            }
        }
        this.cubes.push(mesh);
        if(this.cubes.length > 6) {
            this.scene.remove(this.cubes.shift());
        }
        this.scene.add(mesh);
        if(this.cubes.length > 1){
            this._updateCameraPos();
        }
    },
    // 更新 相机位置
    _updateCameraPos: function(){
        var last = this.cubes.length -1;
        var pointA = {
            x: this.cubes[last].position.x,
            z: this.cubes[last].position.z
        };
        var pointB = {
            x: this.cubes[last-1].position.x,
            z: this.cubes[last-1].position.z
        };
        var pointR = new THREE.Vector3();
        pointR.x = (pointA.x + pointB.x) / 2
        pointR.y = 0
        pointR.z = (pointA.z + pointB.z) / 2
    
        this.cameraPos.next = pointR
    },
    // 游戏者
    _createJumper: function(){
        var material = new THREE.MeshLambertMaterial({color: this.config.jumperColor})
        var geometry = new THREE.CubeGeometry(this.config.jumperWidth,this.config.jumperHeight,this.config.jumperDeep)
        geometry.translate(0,1,0)
        var mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 1
        this.jumper = mesh
        this.scene.add(this.jumper)
    },
    // 更新相机
    _updateCamera: function(){
        var _this = this;
        var c = {
            x: _this.cameraPos.current.x,
            y: _this.cameraPos.current.y,
            z: _this.cameraPos.current.z
        };
        var n = {
            x: _this.cameraPos.next.x,
            y: _this.cameraPos.next.y,
            z: _this.cameraPos.next.z
        }
        if(c.x > n.x || c.z > n.z){
            _this.cameraPos.current.x -= 0.1;
            _this.cameraPos.current.z -= 0.1;
            if (_this.cameraPos.current.x - _this.cameraPos.next.x < 0.05) {
                _this.cameraPos.current.x = _this.cameraPos.next.x
            }
            if (_this.cameraPos.current.z - _this.cameraPos.next.z < 0.05) {
                _this.cameraPos.current.z = _this.cameraPos.next.z
            }
            _this.camera.lookAt(new THREE.Vector3(c.x, 0, c.z))
            _this._render()
            requestAnimationFrame(function(){
                _this._updateCamera()
            })
        }
    },
    // 渲染
    _render: function(){
        this.renderer.render(this.scene, this.camera);
    },
    // 页面尺寸改变
    _handleWindowResize: function(){
        this._setSize();
        this.camera.aspect = this.size.width / this.size.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.size.width, this.size.height);
        this._render();
    },
    _setSize: function(){
        this.size.width = window.innerWidth;
        this.size.height = window.innerHeight;
    },
    // mousedown事件
    _handleMouseDown: function(){
        var _this = this;
        if(!_this.jumperStat.ready && _this.jumper.scale.y>0.02){
            _this.jumper.scale.y -= 0.01;
            _this.jumperStat.xSpeed += 0.004;
            _this.jumperStat.ySpeed += 0.008;
            _this._render(_this.scene, _this.camera);
            requestAnimationFrame(function(){
                _this._handleMouseDown();
            })
        }
    },
    // mouseup 
    _handleMouseUp: function(){
        var _this = this;
        _this.jumperStat.ready = true;
        if(_this.jumper.position.y >= 1) {
            if(_this.cubeStat.nextDir === 'left'){
                _this.jumper.position.x -= _this.jumperStat.xSpeed;
            } else {
                _this.jumper.position.z -= _this.jumperStat.xSpeed;
            }
            _this.jumper.position.y += _this.jumperStat.ySpeed;
            if(_this.jumper.scale.y < 1) {
                _this.jumper.scale.y += 0.02;
            }
            _this.jumperStat.ySpeed -= 0.01;
            _this._render(_this.scene, _this.camera);
            requestAnimationFrame(function(){
                _this._handleMouseUp()
            })
        } else {
            _this.jumperStat.ready = false;
            _this.jumperStat.xSpeed = 0;
            _this.jumperStat.ySpeed = 0;
            _this.jumper.position.y = 1;
            _this._checkInCube();
            if (_this.falledStat.location === 1) {
            // 掉落成功，进入下一步
                _this.score++
                _this._createCube()
                _this._updateCamera()
    
            if (_this.successCallback) {
                _this.successCallback(_this.score)
            }
    
            } else {
            // 掉落失败，进入失败动画
                _this._falling()
            }
        }
    },
    // 检测是否在目标cube内
    _checkInCube: function(){
        var _this = this;
        if(this.cubes.length > 1){
            var pointO = {
                x: this.jumper.position.x,
                z: this.jumper.position.z
            };
            var pointA = {
                x: this.cubes[this.cubes.length-1-1].position.x,
                z: this.cubes[this.cubes.length-1-1].position.z
            };
            var pointB = {
                x: this.cubes[this.cubes.length-1].position.x,
                z: this.cubes[this.cubes.length-1].position.z
            };
            var distanceC, distanceN;
            if(this.cubeStat.nextDir === 'left'){
                distanceC = Math.abs(pointO.x - pointA.x)
                distanceN = Math.abs(pointO.x - pointB.x)
            } else {
                distanceC = Math.abs(pointO.z - pointA.z)
                distanceN = Math.abs(pointO.z - pointB.z)
            };
            var should = this.config.cubeWidth /2 + this.config.jumperWidth / 2;
            var result = 0;
            if(distanceC < should){
                this.falledStat.distance = distanceC;
                result = distanceC < this.config.cubeWidth / 2 ? -1 : -10;
            } else if(distanceN < should ){
                this.falledStat.distance = distanceN;
                result = distanceN < this.config.cubeWidth / 2 ? 1 : 10;
            } else {
                result = 0;
            }
            console.table({
                'dir': this.cubeStat.nextDir,
                'distanceC': distanceC,
                'distanceN': distanceN,
                'should': should,
                "result": result
            });
           this.falledStat.location = result; 
        }
    },
    // 
    _falling: function(){
        var _this = this;
        if(this.falledStat.location === 0){
            this._fallingRotate('none');
        } else if(this.falledStat.location === -10){
            if(this.cubeStat.nextDir === 'left'){
                this._fallingRotate('leftTop'); 
            } else {
                this._fallingRotate('rightTop');
            }
        } else if(this.falledStat.location === 10 ){
            if(this.cubeStat.nextDir === 'left'){
                if(this.jumper.position.x < this.cubes[this.cubes.length-1].position.x){
                    this._fallingRotate('leftTop');
                } else {
                    this._fallingRotate('leftBottom')
                }
            } else {
                if(this.jumper.position.z < this.cubes[this.cubes.length-1].position.z){
                    this._fallingRotate('rightTop');
                } else {
                    this._fallingRotate('rightBottom')
                }
            }
        }
    },
    // 
    _fallingRotate: function(dir){
        var _this = this;
        var offset = this.falledStat.distance - this.config.cubeWidth / 2;
        var rotateAxis = 'z';
        var rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
        var rotateTo = this.jumper.rotation[rotateAxis] < Math.PI/2;
        var fallingTo = this.config.ground + this.config.cubeWidth/2+offset;
        switch(dir){
            case 'rightTop':
                rotateAxis = 'x';
                rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
                rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI/2;
                this.jumper.geometry.translate.z = offset;
                break;
            case 'rightBottom':
                rotateAxis = 'x';
                rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
                rotateTo = this.jumper.rotation[rotateAxis] < Math.PI/2;
                this.jumper.geometry.translate.z = -offset;
                break;
            case 'leftTop':
                rotateAxis = 'z';
                rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
                rotateTo = this.jumper.rotation[rotateAxis] < Math.PI/2;
                this.jumper.geometry.translate.x = offset;
                break;
            case 'leftBottom':
                rotateAxis = 'z';
                rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
                rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI/2;
                this.jumper.geometry.translate.x = -offset;
                break;
            case 'none':
                rotateTo = false;
                fallingTo = this.config.ground;
                break;
            default:
                throw new Error('arguments error');
        }
        if(!this.fallingStat.end){
            if(rotateTo){
                this.jumper.rotation[rotateAxis] = rotateAdd;
            } else if (this.jumper.position.y > fallingTo) {
                this.jumper.position.y -= this.config.fallingSpeed;
            } else {
                this.fallingStat.end = true;
            }
            this._render();
            requestAnimationFrame(function(){
                _this._falling();
            })
        } else {
            this.failedCallback && this.failedCallback();
        }
    }
}

