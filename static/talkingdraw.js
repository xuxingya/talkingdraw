    var talkingdraw_init=function(){

      var canvas = document.getElementById('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      PEN = new Pen(canvas.getContext('2d'));
      canvas.addEventListener('mousedown', ev_canvas, false);
      canvas.addEventListener('mousemove', ev_canvas, false);
      canvas.addEventListener('mouseup', ev_canvas, false);
      var socket = io.connect('http://' + document.domain + ':' + window.location.port);
      socket.on('connect', function(){
        socket.emit('connect_event', {data: 'connected'});
        $('#start_speech').click(function(){
        console.log('click start');
        socket.emit('connect_event', {data: 'start'});
      }); 
      });
      
      socket.on('server_response', function(msg){
        console.log(msg.data);
        // $('#interim_span').html(msg.data);        
      });

};

    function Pen(new_context) {
      var tool = this;
      var context = new_context;
      this.started = false;
      var move_count = 0;
      var w = window.innerWidth;
      var h = window.innerHeight;
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      var lastx = 0;
      var lasty = 0;
      // create an in-memory canvas
      var memCanvas = document.createElement('canvas');
      memCanvas.width = w;
      memCanvas.height = h;
      var memCtx = memCanvas.getContext('2d');
      this.points = [];

      this.mousedown = function(ev){
        tool.points.push({
          x: ev._x,
          y: ev._y
        });
        tool.started = true;
      };

      this.mousemove = function(ev) {
        if (tool.started) {
          context.clearRect(0, 0, w, h);
          context.drawImage(memCanvas, 0, 0);
          tool.points.push({
            x: ev._x,
            y: ev._y
        });
          drawPoints(context, tool.points);
        }
      };

      this.mouseup = function(ev) {
        if(tool.started) {
          tool.started = false;
          memCtx.clearRect(0,0,w,h);
          memCtx.drawImage(canvas, 0, 0);
          tool.points = [];
        }
      };

      //clear both canvases
      this.clear = function() {
        context.clearRect(0,0,w,h);
        memCtx.clearRect(0,0,w,h);
      };
    }

    function ev_canvas(ev) {
      if(false){
        ev._x = ev.touches[0].clientX;
        ev._y = ev.touches[0].clientY;
              }
      else if (ev.layerX || ev.layerX == 0) { // Firefox
        ev._x = ev.layerX;
        ev._y = ev.layerY;
      }
      else if (ev.offset || ev.offset == 0) { //Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
      }
      ev._x = ev._x + $('#canvas').offset().left / 2;
      ev._y = ev._y + $('#canvas').offset().top / 2;
      //call handler
      var func = PEN[ev.type];
      if(func) {
        func(ev);
      }

    }

    function drawPoints(ctx, points) {
      if (points.length < 6) return;
      if (points.length < 6) {
        var b = points[0];
        ctx.beginPath(), ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0), ctx.closePath(), ctx.fill();
        return
      }
      ctx.beginPath(), ctx.moveTo(points[0].x, points[0].y);
      for (i = 1; i < points.length - 2; i++){
        var c = (points[i].x + points[i + 1].x) / 2,
            d = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, c, d)
      }
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
      ctx.stroke();
    }

    function insert_image(){
      var img = new Image();
      img.onload = function(){
        ctx.drawImage(img,0,0,100,100);
      }
      console.log('insert_image');
      img.src = "../static/images/painting.svg";
    }

$(talkingdraw_init);
