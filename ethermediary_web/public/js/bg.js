var interval = null;
var width, height;
var going = localStorage.getItem("ethermediary-bg") == "true";
if(going == null){
    going = true;
    localStorage.setItem("ethermediary-bg", true);
}

window.addEventListener("resize", resize);
window.addEventListener("load", init);

function Triangle(p1, p2, p3){
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.color = getRandomColor();

    this.toString = function(){
        return p1[0] + "," + p1[1] + " " + p2[0] + "," + p2[1] + " " + p3[0] + "," + p3[1];
    };

    this.makeDOM = function(){
        var element = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        element.setAttribute("points", this.toString());
        element.style = "fill:" + this.color + ";stroke:black;stroke-width:2";
        this.DOM = element;
    };

    this.updateDOM = function(){
        this.DOM.setAttribute("points", this.toString());
    };
}

function Mesh(){
    this.points = [];
    this.homePoints = [];
    this.directions = [];
    this.radiuses = [];
    this.velocity = [];
    this.triangles = [];
    this.colors = [];

    this.makeTriangles = function(){
        var tri = [];
        for(let i = 0; i < this.triangles.length; i += 3){
            tri.push(new Triangle(
                this.points[this.triangles[i]],
                this.points[this.triangles[i+1]],
                this.points[this.triangles[i+2]]
            ));
        }
        this.triangleObjs = tri;
    }

    this.bakePoints = function(){
        this.homePoints = this.points.map(p => [p[0], p[1]]);
    }

    this.randomizeDirections = function(){
        this.directions = [];
        this.velocity = [];
        for(let i = 0; i < this.points.length; i++){
            this.directions.push(Vector.random());
            this.velocity.push([0, 0]);
            this.radiuses.push(Math.random()*50);
        }
    }
}

function switchBg(){
    going = !going;
    localStorage.setItem("ethermediary-bg", going);
    if(going){
        window.updateInterval = setInterval(update, 1000/10);
    }else{
        clearInterval(window.updateInterval);
    }
    initialSwitch();
}

function resize(){
    if(interval){
        clearInterval(interval);
    }
    interval = setInterval(function(){
            clearInterval(interval);
            init();
        }, 500);
}

function populateMesh(){
    var mesh = new Mesh();
    for(let i = 0; i < 200; i++){
        mesh.points.push(getRandomPoint());
    }
    mesh.triangles = Delaunay.triangulate(mesh.points);
    mesh.makeTriangles();
    mesh.triangleObjs.forEach(t => t.makeDOM())
    mesh.randomizeDirections();
    mesh.bakePoints();

    return mesh;
}

function init()
{
    window.svgbg = document.getElementById("svgbg");
    while(svgbg.firstChild){
        svgbg.removeChild(svgbg.firstChild);
    }

    width = window.innerWidth;
    height = window.innerHeight;
    svgbg.setAttribute("width", width);
    svgbg.setAttribute("height", height);

    window.mesh = populateMesh();


    for(let i = 0; i < mesh.triangleObjs.length; i++){
        svgbg.appendChild(mesh.triangleObjs[i].DOM);
    }

    if(going){
        window.updateInterval = setInterval(update, 1000/10);
    }
}

function update(){
    for(var i = 0; i < mesh.points.length; i++){
        var point = mesh.points[i];
        var home = mesh.homePoints[i];
        var distance = Vector.distanceSquared(point, home);

        if(distance > mesh.radiuses[i]){
            var randomPoint = Vector.random();
            //randomPoint = mesh.homePoint[i] + randomPoint;
            randomPoint = Vector.add(randomPoint, mesh.homePoints[i]);
            //normalize(randomPoint - point);
            var vector = Vector.normalize(Vector.substract(randomPoint, point));
            mesh.directions[i] = vector;
        }

        var vect = mesh.directions[i];
        var vel = mesh.velocity[i];
        vel[0] += vect[0]*(1/30.0);
        vel[1] += vect[1]*(1/30.0);

        var velLength = Vector.length(vel);
        if(velLength > 10){
            velLength = Math.sqrt(velLength);
            Vector.multiply(vel, 1.0/velLength);
        }

        point[0] += vel[0];
        point[1] += vel[1];
    }

    mesh.triangleObjs.forEach(t => t.updateDOM());

    // if(going)
    //     requestAnimationFrame(update);
}

var Vector = (function(){
    return {
        normalize: function(v){
            let length = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
            v[0] /= length;
            v[1] /= length;
            return v;
        },

        distanceSquared: function(p1, p2){
            var diff = [p2[0] - p1[0], p2[1] - p1[1]];
            return diff[0]*diff[0] + diff[1]*diff[1];
        },

        length: function(v){
            return v[0]*v[0] + v[1]*v[1];
        },

        multiply: function(v, val){
            v[0] *= val;
            v[1] *= val;
        },

        add: function(v1, v2){
            v1[0] = v1[0] + v2[0];
            v1[1] = v1[1] + v2[1];
            return v1;
        },

        substract: function(v1, v2) {
            return [v1[0] - v2[0], v1[1] - v2[1]];
        },

        random: function(){
            return Vector.normalize([Math.random(), Math.random()]);
        }
    };
})();


function getRandomColor(){
    return lerpColor("#252c65", "#4ec3d2", Math.random());
}

function getRandomPoint(){
    let x = (Math.random()-0.1) * (width*1.2);
    let y = (Math.random()-0.1) * (height*1.2);
    return [x, y];
}

function lerpColor(a, b, amount) {
    var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}
