    var starttime;
    var ontalk = false;
    var gestures = [];
    var points = [];
    var DR = new RD.DollarOne();
    var talkingdraw_init=function(){
      var mycanvas = document.getElementById("mycanvas");
      mycanvas.width = window.innerWidth;
      mycanvas.height = window.innerHeight;
      paper.install(window);
      paper.setup(mycanvas);
      pen = pen();
      tdpen = tdpen();
      pen.activate();

      $('#pencil').click(function(){
        $("#pencil").css("background-color", "yellowgreen");
        $("#talkingdraw").css("background-color", "rgba(242,242,242,0.98)");
        pen.activate();
        console.log("pencil");
      });

      $('#talkingdraw').click(function(){
        $("#pencil").css("background-color", "rgba(242,242,242,0.98)");
        $("#talkingdraw").css("background-color", "yellowgreen");
        tdpen.activate();
        console.log("talkingdraw");
      });

      $('#clear').click(function clear(){
        console.log("clear");
        paper.project.clear();
      });

      $('#addgesture').click(function addgesture(){
        var name = $('#classselect').val();
        if(points.length){
          DR.addGesture(name,points);
          console.log("add gesture success",name);
        }
      });

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
        console.log("ranks",ranks);
        console.log("gestures", gestures);

        // remove blank result
        var removelist=[];
        for (i=0;i<ranks.length;++i) {
          if(!ranks[i].length){
            removelist.push(i);
          }
        }

        //add text for keywords that finding no icons
        removelist.forEach(function(i){
          var text = new PointText(gestures[i].position);
          text.fillColor = "black";
          text.content = keys[i];
          gestures[i].remove();
        });
        ranks.splice(removelist,removelist.length);
        gestures.splice(removelist,removelist.length);

        //add thumbs and images
        for (k=0;k<ranks.length;++k) {
          var rank = ranks[k];      
          console.log("rank is",rank);
          //add the thumbs of icons
          rank.forEach(function(name){
              image_src = "../static/iconset/"+name;
              $(".thumbs").append("<div><img src="+image_src+"/>");
            });

          url = "../static/iconset/"+rank[0];
          size = new Size(50, 50);
          paper.project.importSVG(url, onLoad = function(item){
            var gesture = gestures.shift();
            item.position = gesture.position;
            item.scale(0.2);
            gesture.remove();
          });                
        }  
      });
};

    function pen(){
      var tool = new Tool();
      var path;
      tool.onMouseDown =  function(event) {
        // Create a new path and give it a stroke color:
        path = new Path();
        path.strokeColor = '#00000';
        // Add a segment to the path where
        // you clicked:
        path.add(event.point);
      }

      tool.onMouseDrag =  function(event) {
        // Every drag event, add a segment
        // to the path at the position of the mouse:
        path.add(event.point);
        path.smooth();
      }

      tool.onMouseUp = function(event){
        path.add(event.point);
        path.smooth();

      }

      return tool;

    }

    function tdpen(){
      var tool = new Tool();
      var path;
      var time = [];
      tool.onMouseDown =  function(event) {
        // Create a new path and give it a stroke color:
        path = new Path();
        path.strokeColor = '#00000';
        path.add(event.point);
        points = [];
        a = (new Date() - starttime)*0.001;
        time = [];
        time.push(a);
      
      }

      tool.onMouseDrag =  function(event) {
        path.add(event.point);
        var x = event.point.x;
        var y = event.point.y;
        points.push([x,y]);
        path.smooth();
      }

      tool.onMouseUp = function(event){;
        path.add(event.point);
        if(path.length>0){
          gestures.push(path);
        }
        path.smooth();
        path.strokeColor = 'yellowgreen';
        b = (new Date() - starttime)*0.001;
        time.push(b);
        // console.log("gesture time",time);        
        $.post("/command", {"starttime": time[0], "endtime": time[1]});
        var result = DR.recognize(points);
        console.log("DR", result);
        // console.log("recognize",DollarRecognizer.Recognize(dPoint, true));
      }

      return tool;
    }



// $(talkingdraw_init);
$(document).ready(talkingdraw_init);
