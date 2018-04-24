    var starttime;
    var ontalk = false;
    var gestures = [];
    var points = [];
    var Records = {};
    var iconid = 0;
    var lineid = 0;
    var DR = new RD.DollarOne();
    var talkingdraw_init=function(){
      var mycanvas = document.getElementById("mycanvas");
      mycanvas.width = window.innerWidth;
      mycanvas.height = window.innerHeight;
      paper.install(window);
      paper.setup(mycanvas);
      pen = pen();
      tdpen = tdpen();
      tdpen.activate();
      loadGesture();       // load gesture Records

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
        gestures = [];
        paper.project.clear();
      });

      $('#addgesture').click(function(){ //temprary add gestures
        var name = $('#classselect').val();
        if(points.length){
          if(name==0){
            name = name + iconid;
            DR.addGesture(name,points);
            iconid++;
          }else {
            name = name + lineid;
            DR.addGesture(name,points);
            lineid++;
          }       
          console.log("add gesture success");
        }
      });

      $('#reloadrecord').click(function(){
        // Records = {};
        // window.localStorage.setItem("Records", "{}");
        iconid = 0;
        lineid = 0;
        loadGesture();
      });

      $('#saverecord').click(function(){
        if(!points.length){
          return;
        }
        var name = $('#classselect').val();
        if(name==0){
          for (var i = 0; i < 100; i++) {
            if(!Records[i]){
              Records[i] = points;
              break;
            }
          }
        }else {
          for (var j = 100; j < 200;j++)
          if(!Records[j]){
            Records[j] = points;
            break;
          }
        }
        var str = JSON.stringify(Records);
        window.localStorage.setItem("Records", str);
        DR.addGesture(name, points);
      });

      $('#showgesture').click(function(){
        console.log("pool",DR.gesturePool);
        console.log("Records", Records);
      });

      $('#removerecord').click(function(){
        Records = {};
        window.localStorage.setItem("Records", "{}");
        iconid = 0;
        lineid = 0;
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
          var  loadoptions = {
            onLoad: function(item){
              var gesture = gestures.shift();
              tgsize = (gesture.bounds.width + gesture.bounds.height);
              ogsize = (item.bounds.width + item.bounds.height);
              scalefactor = tgsize/ogsize;
              item.position = gesture.position;
              item.scale(scalefactor);
              gesture.remove();
            },
          };
          paper.project.importSVG(url, loadoptions);             
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

    var options = {
      match: function(item){
        item["item"].parent.isChild(paper.project.activeLayer);
      },
    };

    function tdpen(){
      var tool = new Tool();
      var path;
      var time = [];
      tool.onMouseDown =  function(event) {
        //test if it hit an icon
        var k = paper.project.activeLayer.hitTest(event.point, options);
        if(k){
          console.log(k,k["item"].parent);
        }
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

      tool.onMouseUp = function(event){
        path.add(event.point);
        path.smooth();
        if(path.length>0){
          var result = DR.recognize(points);
          console.log("DR", result);
          if(!result){
            return;
          }
          path.strokeColor = 'yellowgreen';
          if(result<100){ //icon gesture
            gestures.push(path);
            b = (new Date() - starttime)*0.001;
            time.push(b);      
            $.post("/command", {"starttime": time[0], "endtime": time[1]});
          }else {  //link gesture

          }
        }

      }

      return tool;
    }

    function loadGesture(){
      var r = window.localStorage.getItem("Records");
      if(r){
        Records = JSON.parse(r);
      }
      DR.removeGesture();
      for (var name in Records){
        DR.addGesture(name, Records[name]);
      }
      console.log("load gesture success");
    }

// $(talkingdraw_init);
$(document).ready(talkingdraw_init);
