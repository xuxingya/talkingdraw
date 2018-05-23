    var starttime;
    var ontalk = false;
    var gestures = [];
    var curricons =[];
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
      paper.settings.hitTolerance = 3;
      pen = pen();
      tdpen = tdpen();
      pan = pan();
      eraser = eraser();
      tdpen.activate();
      loadGesture();       // load gesture Records

      $('.state').click(function(){
        $(".state").css("background-color", "rgba(242,242,242,0.98)");
        $(this).css("background-color", "yellowgreen");
      });

      $('#pencil').click(function(){
        pen.activate();
        console.log("pencil");
      });

      $('#talkingdraw').click(function(){
        tdpen.activate();
        console.log("talkingdraw");
      });

      $('#pan').click(function(){
        pan.activate();
        console.log("pan");
      });

      $('#clear').click(function clear(){
        console.log("clear");
        gestures = [];
        paper.project.clear();
      });

      $('#eraser').click(function (){
        // x = Math.random()*800;
        // y = Math.random()*400;
        // var shape = new Shape.Circle(new Point(x,y), 30);
        // shape.fillColor = new Color(1,0,0);
        eraser.activate();
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
        curricons = [];
        var show_keys = "";
        keys.forEach(function(key){
          show_keys+=key.join(" ")+',';
        });
        console.log("keys",msg.keys);
        // $("#iconset_name").text(show_keys);
        $(".thumbs").empty();

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
        keys.splice(removelist,removelist.length);

        //add thumbs and images
        for (k=0;k<ranks.length;++k) {
          var rank = ranks[k];  
          //add key name
          $(".thumbs").append("<p>"+keys[k]+"</p>");    
          //add the thumbs of icons
          rank.forEach(function(name){
              image_src = "../static/iconset/"+name;
              $(".thumbs").append("<div><img class = 'iconthumbs' data-id = "+k+" src= "+image_src+" />");
            });       

          // click the thumb nail
          $(".iconthumbs").click(function(ele){
                var id = ele.target.dataset.id;
                console.log("click id",ele.target.dataset.id);
                target_icon = curricons[id];
                console.log("target icon", target_icon)
                var loadoptions = {
                onLoad: function(item){
                  item.position = target_icon.position;
                  var tgsize = (target_icon.bounds.width + target_icon.bounds.height);
                  var ogsize = (item.bounds.width + item.bounds.height);
                  var scalefactor = tgsize/ogsize;
                  item.scale(scalefactor);
                  var newicon = item.rasterize(300);
                  curricons[id] = newicon;
                  target_icon.remove();
                  item.remove();
                },
                onError: function(item){
                }
              };
              var url = ele.target.src;
              paper.project.importSVG(url, loadoptions);
              });


          var  loadoptions = {
            onLoad: function(item){
              var gesture = gestures.shift();
              var tgsize = (gesture.bounds.width + gesture.bounds.height);
              var ogsize = (item.bounds.width + item.bounds.height);
              var scalefactor = tgsize/ogsize;
              item.position = gesture.position;
              item.scale(scalefactor);
              gesture.remove();
              var newicon = item.rasterize(300);
              curricons.push(newicon);
              item.remove();
            },
            onError: function(item){
              var gesture = gestures.shift();
              if(gesture){gesture.remove()};
            }
          };
          var url = "../static/iconset/"+rank[0];
          paper.project.importSVG(url, loadoptions);

          // load raster image
          // var newicon = new Raster(url);
          // newicon.onLoad = function(){
          //   var gesture = gestures.shift();
          //   console.log(gesture.bounds);
          //   this.position = gesture.position;
          //   this.width = gesture.bounds.width;
          //   this.height = gesture.bounds.height;
          //   console.log(this.width,this.height, this.resolution);
          //   gesture.remove();
          // };         
        }  
      });
    };

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
        // var k = paper.project.activeLayer.hitTest(event.point, options);
        // if(k){
        //   console.log(k,k["item"].parent);
        // }
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
            var hitoption = {
              class: this instanceof Raster,
            }
            var start = paper.project.activeLayer.hitTest(points[0],hitoption);
            var end = paper.project.activeLayer.hitTest(event.point,hitoption);
            if(start&&end){
              ProcessVector(start.item, end.item);
              path.remove();
            }else{
              path.remove();
            }
          }
        }

      }

      return tool;
    }

    function ProcessVector(start, end){
      var cpoint1 = start.position;
      var cpoint2 = end.position;
      var angle = cpoint2.subtract(cpoint1).angleInRadians;
      console.log("angle",angle);
      var r1 = start.bounds.width/2;
      var r2 = end.bounds.width/2;
      var x1 =  cpoint1.x + Math.cos(angle)*r1;
      var y1 = cpoint1.y + Math.sin(angle)*r1;
      var x2 = cpoint2.x - Math.cos(angle)*r2;
      var y2 = cpoint2.y - Math.sin(angle)*r2;
      console.log(x1,y1,x2,y2);
      var startpoint = new Point(x1,y1);
      var endpoint = new Point(x2,y2);
      var vectorItem = drawVector(startpoint, endpoint);
      start.data.link = vectorItem;
      end.data.link = vectorItem;
    }

    function drawVector(startpoint, endpoint){
      var vector = endpoint.subtract(startpoint);
      var arrowVector = vector.normalize(10);
      var vectorItem = new Group([
        new Path([startpoint, endpoint]),
        new Path([
          endpoint.add(arrowVector.rotate(135)),
          endpoint,
          endpoint.add(arrowVector.rotate(-135))
          ])
        ]);
      vectorItem.strokeWidth = 2;
      vectorItem.strokeColor = '#e4141b';
      vectorItem.dashArray = [6, 2];
      return vectorItem;
    }

    function pan(){
      var tool = new Tool();
      tool.onMouseDown =  function(event) {
        // hit test if there is a object
        var k = paper.project.activeLayer.hitTest(event.point);
        if(k){
          k.item.selected = true;
        }else{
          paper.project.selectedItems.forEach(function(ele){
            ele.selected = false;
          });
        }
      }

      tool.onMouseDrag =  function(event) {
          paper.project.selectedItems.forEach(function(ele){
          ele.position.x += event.delta.x;
          ele.position.y += event.delta.y;
        });
      }

      tool.onMouseUp = function(event){
      }

      return tool; 
    }

    function eraser(){
      var tool = new Tool();
      tool.onMouseDown =  function(event) {
        // hit test if there is a object
        var k = paper.project.activeLayer.hitTest(event.point);
        if(k){
          k.item.remove();
        }
      }

      tool.onMouseDrag =  function(event) {
        var k = paper.project.activeLayer.hitTest(event.point);
        if(k){
          k.item.remove();
        }
      }

      tool.onMouseUp = function(event){
      }

      return tool; 
    }



// $(talkingdraw_init);
$(document).ready(talkingdraw_init);
