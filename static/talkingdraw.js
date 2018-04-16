    var starttime;
    var ontalk = false;
    var gestures = [];
    var svgcanvas = SVG('svgtree').size('100%', '100%')
    var talkingdraw_init=function(){

      var canvas = document.getElementById("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context = canvas.getContext("2d")
      PEN = new Pen(context);
      canvas.addEventListener("pointerdown", ev_canvas, false);
      canvas.addEventListener("pointermove", ev_canvas, false);
      canvas.addEventListener("pointerup", ev_canvas, false);
      var socket = io.connect("http://" + document.domain + ":" + window.location.port);
      socket.on("connect", function(){
        socket.emit("connect_event", {data: "connected"});
        $("#start_speech").click(function(){
        ontalk = true;
        $("#start_speech").css("background-color", "yellowgreen");
        starttime = new Date();
        console.log("click start" + starttime);
        socket.emit("speech_event", {data: "start"});
      }); 
      });
      
      socket.on("interim_response", function(msg){
        $("#final_span").html("");
        $("#interim_span").html(msg.data);  
      });

      socket.on("final_response", function(msg){
        $("#interim_span").html(""); 
        $("#final_span").html(msg.data);    
      });

      socket.on("speech_state", function(msg){
        console.log(msg.data);
        ontalk=false;
        $("#start_speech").css("background-color", "rgba(242,242,242,0.98)");
      });

      socket.on("suggestion", function(msg){
        keys = msg.keys;
        ranks =  msg.ranks;
        $("#iconset_name").text(keys);
        $(".thumbs").empty();
        console.log(ranks)
        // currently only support one gesture one time
        for (k=0;k<ranks.length;++k) {
          for(i=0;i<rank.length;++i){
            image_src = "../static/iconset/"+rank[i];
            $(".thumbs").append("<div><img src="+image_src+"/>");
          };
          if(ranks[k]){
            x = gesture[k][0];
            y = gesture[k][1];
            w = ggesture[k][2];
            h = ggesture[k][3];
            imagepath = "../static/iconset/"+ranks[k][0];
            insert_image(x, y, w, h, imagepath)
          }          
        }       
      });
};

    function Pen(new_context) {
      var tool = this;
      var istalkingdraw = false;
      var context = new_context;
      this.started = false;
      var move_count = 0;
      var w = window.innerWidth;
      var h = window.innerHeight;
      context.lineWidth = 3;
      context.lineJoin = "round";
      context.lineCap = "round";
      var lastx = 0;
      var lasty = 0;
      // create an in-memory canvas
      var memCanvas = document.createElement("canvas");
      memCanvas.width = w;
      memCanvas.height = h;
      var memCtx = memCanvas.getContext("2d");
      this.points = [];
      this.time = [];

      this.pointerdown = function(ev){
        tool.points.push({
          x: ev._x,
          y: ev._y
        });
        tool.started = true;
        if (ontalk){
          tool.time = [];
          a = (new Date() - starttime)*0.001;
          tool.time.push(a);
        }
      };

      this.pointermove = function(ev) {
        if (tool.started) {
          context.clearRect(0, 0, w, h);
          context.drawImage(memCanvas, 0, 0); //copy image from memCanvas to context
          tool.points.push({
            x: ev._x,
            y: ev._y
        });
          drawPoints(context, tool.points); //draw on context interface
        }
      };

      this.pointerup = function(ev) {
        if(tool.started) {
          tool.started = false;
          if (istalkingdraw) {  //select talkingdraw
            if(ontalk){   //is speaking
            b = (new Date() - starttime)*0.001;
            tool.time.push(b);          
            $.post("/command", {"starttime": tool.time[0], "endtime": tool.time[1]}, function(data) {
            console.log(data);});
            context.clearRect(0,0,w,h);
            context.drawImage(memCanvas, 0, 0); //discard drawing on canvas, and copy the previous image to canvas
            pointcount = tool.points.length;
            gestures.append([ev._x, ev._y, 100,100]);
            tool.points = [];       
            }
          } else{   //select not takingdraw
            memCtx.clearRect(0,0,w,h);   
            memCtx.drawImage(canvas, 0, 0);  //copy image from canvas to memctx
            tool.points = [];
          }                
        }
      };

      //clear both canvases
      this.clear = function() {
        context.clearRect(0,0,w,h);
        memCtx.clearRect(0,0,w,h);
      };

      this.pencil = function() {
        istalkingdraw = false;
        $("#pencil").css("background-color", "yellowgreen");
        $("#talkingdraw").css("background-color", "rgba(242,242,242,0.98)");
        console.log("pencil");
      };

      this.talkingdraw = function(){
        istalkingdraw = true;
        $("#pencil").css("background-color", "rgba(242,242,242,0.98)");
        $("#talkingdraw").css("background-color", "yellowgreen");
        console.log("talkingdraw");
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
      ev._x = ev._x + $("#canvas").offset().left / 2;
      ev._y = ev._y + $("#canvas").offset().top / 2;
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

    function insert_image(x, y, w, h, imagepath){
      svgcanvas.svg();
    }

$(talkingdraw_init);
